const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "xlsx", "xls", "pptx", "ppt",
  "png", "jpg", "jpeg", "webp", "gif",
  "txt", "csv", "rtf", "odt", "ods",
];

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

// POST /api/archivos/files — upload file
export async function onRequestPost(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;

  try {
    const formData = await context.request.formData();
    const file = formData.get("file");
    const folderId = formData.get("folder_id") || null;

    if (!file || !file.name) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se recibió ningún archivo." }),
        { status: 400, headers: HEADERS }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ ok: false, error: `El archivo excede el límite de 50MB. Tamaño: ${(file.size / 1024 / 1024).toFixed(1)}MB` }),
        { status: 400, headers: HEADERS }
      );
    }

    // Validate extension
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return new Response(
        JSON.stringify({ ok: false, error: `Tipo de archivo no permitido: .${ext}. Permitidos: ${ALLOWED_EXTENSIONS.join(", ")}` }),
        { status: 400, headers: HEADERS }
      );
    }

    // Validate folder exists if specified
    if (folderId) {
      const folder = await db
        .prepare("SELECT id FROM archive_folders WHERE id = ? AND deleted_at IS NULL")
        .bind(folderId)
        .first();
      if (!folder) {
        return new Response(
          JSON.stringify({ ok: false, error: "Carpeta de destino no encontrada." }),
          { status: 404, headers: HEADERS }
        );
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const sanitized = sanitizeFileName(file.name);
    const r2Key = `archivos/${folderId || "root"}/${id}_${sanitized}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: now,
      },
    });

    // Save metadata to D1
    await db
      .prepare(
        `INSERT INTO archive_files (id, folder_id, original_name, r2_key, mime_type, extension, size_bytes, is_pinned, uploaded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, '', ?, ?)`
      )
      .bind(id, folderId || null, file.name, r2Key, file.type || "application/octet-stream", ext, file.size, now, now)
      .run();

    const saved = await db
      .prepare("SELECT * FROM archive_files WHERE id = ?")
      .bind(id)
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
