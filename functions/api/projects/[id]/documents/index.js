const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

export async function onRequestGet(context) {
  const db = context.env.DB;
  const projectId = context.params.id;

  try {
    const { results } = await db
      .prepare(
        `SELECT id, kind, original_name, mime_type, size_bytes, created_at, updated_at
         FROM project_documents
         WHERE project_id = ?
         ORDER BY created_at DESC`
      )
      .bind(projectId)
      .all();

    const rows = results || [];
    const mainDoc = rows.find((r) => r.kind === "main") || null;
    const materials = rows.filter((r) => r.kind === "material");

    return new Response(JSON.stringify({ main: mainDoc, materials }), {
      status: 200,
      headers: HEADERS,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
