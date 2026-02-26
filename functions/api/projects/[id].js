const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

export async function onRequestDelete(context) {
  const db = context.env.DB;
  const projectId = context.params.id;

  try {
    const nowISO = new Date().toISOString();

    // Check if exists and is not already deleted
    const existing = await db
      .prepare("SELECT id FROM projects WHERE id = ? AND deleted_at IS NULL")
      .bind(projectId)
      .first();

    if (!existing) {
      return new Response(
        JSON.stringify({ ok: false, error: "Proyecto no encontrado" }),
        { status: 404, headers: HEADERS }
      );
    }

    await db
      .prepare("UPDATE projects SET deleted_at = ? WHERE id = ?")
      .bind(nowISO, projectId)
      .run();

    return new Response(
      JSON.stringify({ ok: true, id: projectId, deleted_at: nowISO }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
