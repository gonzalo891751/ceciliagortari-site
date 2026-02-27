const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

export async function onRequestDelete(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const docId = context.params.docId;

  try {
    const doc = await db
      .prepare(
        "SELECT id, stored_key FROM project_documents WHERE id = ? AND kind = 'material'"
      )
      .bind(docId)
      .first();

    if (!doc) {
      return new Response(
        JSON.stringify({ ok: false, error: "Material no encontrado." }),
        { status: 404, headers: HEADERS }
      );
    }

    await bucket.delete(doc.stored_key);
    await db
      .prepare("DELETE FROM project_documents WHERE id = ?")
      .bind(doc.id)
      .run();

    return new Response(
      JSON.stringify({ ok: true, deleted: doc.id }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
