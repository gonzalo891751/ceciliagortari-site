const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// GET /api/archivos/folders/tree — get all folders as flat list for picker
export async function onRequestGet(context) {
  const db = context.env.DB;

  try {
    const { results } = await db
      .prepare(
        `SELECT id, name, parent_id, sort_order
         FROM archive_folders
         WHERE deleted_at IS NULL
         ORDER BY sort_order ASC, name ASC`
      )
      .all();

    // Build tree with paths for display
    const folders = results || [];
    const byId = {};
    folders.forEach((f) => (byId[f.id] = f));

    function getPath(folderId) {
      const parts = [];
      let current = folderId;
      let depth = 0;
      while (current && depth < 10) {
        const f = byId[current];
        if (!f) break;
        parts.unshift(f.name);
        current = f.parent_id;
        depth++;
      }
      return parts.join(" / ");
    }

    const tree = folders.map((f) => ({
      id: f.id,
      name: f.name,
      parent_id: f.parent_id,
      path: getPath(f.id),
    }));

    return new Response(
      JSON.stringify({ ok: true, folders: tree }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
