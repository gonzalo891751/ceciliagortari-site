const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, s-maxage=120",
};

export async function onRequestGet(context) {
  const db = context.env.DB;

  try {
    const { results } = await db
      .prepare(
        `SELECT p.id, p.tipo, p.titulo, p.area_tema, p.resumen,
                p.fecha_presentacion, p.estado_tramite, p.created_at,
                p.tipo_autoria, p.autor_principal,
                (SELECT COUNT(*) FROM project_documents WHERE project_id = p.id AND kind = 'main') AS has_main_doc,
                (SELECT COUNT(*) FROM project_documents WHERE project_id = p.id AND kind = 'expediente') AS has_expediente
         FROM projects p
         WHERE p.estado_preparacion = 'Presentado'
           AND p.deleted_at IS NULL
         ORDER BY p.fecha_presentacion DESC`
      )
      .all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: HEADERS,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Error interno." }),
      { status: 500, headers: { ...HEADERS, "Cache-Control": "no-store" } }
    );
  }
}
