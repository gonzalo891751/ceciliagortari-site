const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, s-maxage=120",
};

export async function onRequestGet(context) {
  const db = context.env.DB;
  const projectId = context.params.id;

  try {
    // Fetch project — only if it's public (Presentado + not deleted)
    const project = await db
      .prepare(
        `SELECT id, tipo, titulo, area_tema, resumen,
                fecha_presentacion, estado_tramite, created_at
         FROM projects
         WHERE id = ?
           AND estado_preparacion = 'Presentado'
           AND deleted_at IS NULL`
      )
      .bind(projectId)
      .first();

    if (!project) {
      return new Response(
        JSON.stringify({ ok: false, error: "Proyecto no encontrado." }),
        { status: 404, headers: { ...HEADERS, "Cache-Control": "no-store" } }
      );
    }

    // Fetch documents for this project
    const { results } = await db
      .prepare(
        `SELECT id, kind, original_name, mime_type, size_bytes, created_at
         FROM project_documents
         WHERE project_id = ?
         ORDER BY kind ASC, created_at DESC`
      )
      .bind(projectId)
      .all();

    const rows = results || [];
    const mainDoc = rows.find((r) => r.kind === "main") || null;
    const materials = rows.filter((r) => r.kind === "material");

    return new Response(
      JSON.stringify({
        ...project,
        documents: { main: mainDoc, materials },
      }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Error interno." }),
      { status: 500, headers: { ...HEADERS, "Cache-Control": "no-store" } }
    );
  }
}
