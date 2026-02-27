const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTS = [
  ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt",
  ".png", ".jpg", ".jpeg", ".webp", ".gif",
  ".txt", ".csv", ".rtf",
];

function generateId() {
  return crypto.randomUUID();
}

function sanitizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 200);
}

function getExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.substring(dot).toLowerCase() : "";
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const projectId = context.params.id;

  try {
    const formData = await context.request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se enviaron archivos." }),
        { status: 400, headers: HEADERS }
      );
    }

    const uploaded = [];
    const errors = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Validate size
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: excede 50MB`);
        continue;
      }

      // Validate extension
      const ext = getExtension(file.name);
      if (!ALLOWED_EXTS.includes(ext)) {
        errors.push(`${file.name}: tipo no permitido (${ext})`);
        continue;
      }

      const now = new Date().toISOString();
      const uuid = generateId();
      const safeName = sanitizeName(file.name);
      const storedKey = `projects/${projectId}/materials/${uuid}_${safeName}`;

      await bucket.put(storedKey, file.stream(), {
        httpMetadata: { contentType: file.type },
        customMetadata: { originalName: file.name },
      });

      await db
        .prepare(
          `INSERT INTO project_documents (id, project_id, kind, original_name, stored_key, mime_type, size_bytes, created_at, updated_at)
           VALUES (?, ?, 'material', ?, ?, ?, ?, ?, ?)`
        )
        .bind(uuid, projectId, file.name, storedKey, file.type, file.size, now, now)
        .run();

      uploaded.push({
        id: uuid,
        kind: "material",
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        created_at: now,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, uploaded, errors }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
