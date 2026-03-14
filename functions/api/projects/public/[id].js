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
                fecha_presentacion, estado_tramite, created_at,
                tipo_autoria, autor_principal
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

    // Fetch public document: expediente has priority over main doc
    // Expediente = final signed/stamped PDF; main = original project document
    const expedienteDoc = await db
      .prepare(
        `SELECT id, kind, original_name, mime_type, size_bytes, created_at
         FROM project_documents
         WHERE project_id = ? AND kind = 'expediente'
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .bind(projectId)
      .first();

    const mainDoc = expedienteDoc ? null : await db
      .prepare(
        `SELECT id, kind, original_name, mime_type, size_bytes, created_at
         FROM project_documents
         WHERE project_id = ? AND kind = 'main'
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .bind(projectId)
      .first();

    return new Response(
      JSON.stringify({
        ...project,
        document: expedienteDoc || mainDoc || null,
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
