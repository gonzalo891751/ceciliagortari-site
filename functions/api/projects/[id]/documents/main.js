const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MAIN_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_MAIN_EXTS = [".pdf", ".docx"];

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
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se envió ningún archivo." }),
        { status: 400, headers: HEADERS }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ ok: false, error: "El archivo excede 50MB." }),
        { status: 400, headers: HEADERS }
      );
    }

    // Validate type
    const ext = getExtension(file.name);
    if (!ALLOWED_MAIN_EXTS.includes(ext) && !ALLOWED_MAIN_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Solo se permiten archivos PDF o DOCX." }),
        { status: 400, headers: HEADERS }
      );
    }

    // Delete existing main if any
    const existing = await db
      .prepare(
        "SELECT id, stored_key FROM project_documents WHERE project_id = ? AND kind = 'main'"
      )
      .bind(projectId)
      .first();

    if (existing) {
      await bucket.delete(existing.stored_key);
      await db
        .prepare("DELETE FROM project_documents WHERE id = ?")
        .bind(existing.id)
        .run();
    }

    // Upload to R2
    const now = new Date().toISOString();
    const timestamp = Date.now();
    const safeName = sanitizeName(file.name);
    const storedKey = `projects/${projectId}/main/${timestamp}_${safeName}`;

    await bucket.put(storedKey, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: file.name },
    });

    // Insert in D1
    const docId = generateId();
    await db
      .prepare(
        `INSERT INTO project_documents (id, project_id, kind, original_name, stored_key, mime_type, size_bytes, created_at, updated_at)
         VALUES (?, ?, 'main', ?, ?, ?, ?, ?, ?)`
      )
      .bind(docId, projectId, file.name, storedKey, file.type, file.size, now, now)
      .run();

    return new Response(
      JSON.stringify({
        ok: true,
        document: {
          id: docId,
          kind: "main",
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          created_at: now,
        },
      }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}

export async function onRequestDelete(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const projectId = context.params.id;

  try {
    const existing = await db
      .prepare(
        "SELECT id, stored_key FROM project_documents WHERE project_id = ? AND kind = 'main'"
      )
      .bind(projectId)
      .first();

    if (!existing) {
      return new Response(
        JSON.stringify({ ok: false, error: "No hay documento principal." }),
        { status: 404, headers: HEADERS }
      );
    }

    await bucket.delete(existing.stored_key);
    await db
      .prepare("DELETE FROM project_documents WHERE id = ?")
      .bind(existing.id)
      .run();

    return new Response(
      JSON.stringify({ ok: true, deleted: existing.id }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
