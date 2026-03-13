const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function sanitizeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 200);
}

function getExtension(filename) {
  const dot = filename.lastIndexOf(".");
  return dot > -1 ? filename.substring(dot + 1).toLowerCase() : "";
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

// POST /api/archivos/files/:id/replace — replace file content with new upload
export async function onRequestPost(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const id = context.params.id;

  try {
    // Get existing file
    const existing = await db
      .prepare("SELECT * FROM archive_files WHERE id = ? AND deleted_at IS NULL")
      .bind(id)
      .first();

    if (!existing) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado." }),
        { status: 404, headers: HEADERS }
      );
    }

    const formData = await context.request.formData();
    const file = formData.get("file");

    if (!file || !file.name) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se recibió ningún archivo." }),
        { status: 400, headers: HEADERS }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ ok: false, error: `El archivo excede el límite de 50MB.` }),
        { status: 400, headers: HEADERS }
      );
    }

    const now = new Date().toISOString();
    const ext = getExtension(file.name);
    const sanitized = sanitizeFileName(file.name);
    const newR2Key = `archivos/${existing.folder_id || "root"}/${id}_${sanitized}`;

    // Delete old R2 object
    if (existing.r2_key) {
      try {
        await bucket.delete(existing.r2_key);
      } catch (_) {
        // Non-fatal
      }
    }

    // Upload new file to R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(newR2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
      customMetadata: {
        originalName: file.name,
        replacedAt: now,
      },
    });

    // Update D1 record — keep same id, folder_id, is_pinned, created_at
    await db
      .prepare(
        `UPDATE archive_files
         SET original_name = ?, r2_key = ?, mime_type = ?, extension = ?, size_bytes = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(file.name, newR2Key, file.type || "application/octet-stream", ext, file.size, now, id)
      .run();

    const updated = await db
      .prepare("SELECT * FROM archive_files WHERE id = ?")
      .bind(id)
      .first();

    return new Response(
      JSON.stringify({ ok: true, file: updated }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
