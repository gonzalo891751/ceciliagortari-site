function slugify(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 100);
}

function getExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.substring(dot).toLowerCase() : "";
}

export async function onRequestGet(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const projectId = context.params.id;
  const docId = context.params.docId;

  try {
    const doc = await db
      .prepare(
        "SELECT id, project_id, kind, original_name, stored_key, mime_type FROM project_documents WHERE id = ? AND project_id = ?"
      )
      .bind(docId, projectId)
      .first();

    if (!doc) {
      return new Response(
        JSON.stringify({ ok: false, error: "Documento no encontrado." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const project = await db
      .prepare("SELECT id, titulo FROM projects WHERE id = ?")
      .bind(projectId)
      .first();

    const ext = getExtension(doc.original_name);
    const slugTitle = slugify(project ? project.titulo : "proyecto");
    const kindSuffix = doc.kind === "expediente" ? "Expediente" : (doc.kind === "main" ? "Proyecto" : "Material");
    const filename = `${projectId}_${slugTitle}_${kindSuffix}${ext}`;

    const object = await bucket.get(doc.stored_key);
    if (!object) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado en storage." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": doc.mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
