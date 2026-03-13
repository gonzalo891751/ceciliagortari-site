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

// POST /api/archivos/files/:id/copy — copy file to another folder
export async function onRequestPost(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const id = context.params.id;

  try {
    const body = await context.request.json();
    const targetFolderId = body.folder_id === "__root__" ? null : (body.folder_id || null);

    // Get source file
    const source = await db
      .prepare("SELECT * FROM archive_files WHERE id = ? AND deleted_at IS NULL")
      .bind(id)
      .first();

    if (!source) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo origen no encontrado." }),
        { status: 404, headers: HEADERS }
      );
    }

    // Validate target folder
    if (targetFolderId) {
      const targetFolder = await db
        .prepare("SELECT id FROM archive_folders WHERE id = ? AND deleted_at IS NULL")
        .bind(targetFolderId)
        .first();
      if (!targetFolder) {
        return new Response(
          JSON.stringify({ ok: false, error: "Carpeta destino no encontrada." }),
          { status: 404, headers: HEADERS }
        );
      }
    }

    // Resolve name conflict in target folder
    let finalName = source.original_name;
    let checkQuery, checkBinds;
    if (targetFolderId) {
      checkQuery = "SELECT id FROM archive_files WHERE original_name = ? AND folder_id = ? AND deleted_at IS NULL";
      checkBinds = [finalName, targetFolderId];
    } else {
      checkQuery = "SELECT id FROM archive_files WHERE original_name = ? AND folder_id IS NULL AND deleted_at IS NULL";
      checkBinds = [finalName];
    }

    const existing = await db.prepare(checkQuery).bind(...checkBinds).first();
    if (existing) {
      // Add "(copia)" suffix before extension
      const dot = finalName.lastIndexOf(".");
      if (dot > 0) {
        finalName = finalName.substring(0, dot) + " (copia)" + finalName.substring(dot);
      } else {
        finalName = finalName + " (copia)";
      }
    }

    // Duplicate the R2 object
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const sanitized = sanitizeFileName(finalName);
    const newR2Key = `archivos/${targetFolderId || "root"}/${newId}_${sanitized}`;

    // Read source from R2 and write copy
    const sourceObject = await bucket.get(source.r2_key);
    if (!sourceObject) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado en almacenamiento." }),
        { status: 404, headers: HEADERS }
      );
    }

    const arrayBuffer = await sourceObject.arrayBuffer();
    await bucket.put(newR2Key, arrayBuffer, {
      httpMetadata: {
        contentType: source.mime_type || "application/octet-stream",
      },
      customMetadata: {
        originalName: finalName,
        copiedFrom: source.id,
        uploadedAt: now,
      },
    });

    // Create new D1 record
    await db
      .prepare(
        `INSERT INTO archive_files (id, folder_id, original_name, r2_key, mime_type, extension, size_bytes, is_pinned, uploaded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
      )
      .bind(
        newId,
        targetFolderId,
        finalName,
        newR2Key,
        source.mime_type,
        source.extension,
        source.size_bytes,
        source.uploaded_by || "",
        now,
        now
      )
      .run();

    const saved = await db
      .prepare("SELECT * FROM archive_files WHERE id = ?")
      .bind(newId)
      .first();

    return new Response(
      JSON.stringify({ ok: true, file: saved }),
      { status: 201, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
