const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// GET /api/archivos?folder_id=&search=&pinned=1&recent=1
export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    const url = new URL(context.request.url);
    const folderId = url.searchParams.get("folder_id") || null;
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const pinnedOnly = url.searchParams.get("pinned") === "1";
    const recentOnly = url.searchParams.get("recent") === "1";

    // Search mode
    if (search) {
      const like = `%${search}%`;
      const [foldersRes, filesRes] = await Promise.all([
        db.prepare(
          `SELECT id, name, parent_id, sort_order, created_at
           FROM archive_folders
           WHERE deleted_at IS NULL AND LOWER(name) LIKE ?
           ORDER BY name ASC LIMIT 50`
        ).bind(like).all(),
        db.prepare(
          `SELECT id, folder_id, original_name, mime_type, extension,
                  size_bytes, is_pinned, created_at
           FROM archive_files
           WHERE deleted_at IS NULL AND LOWER(original_name) LIKE ?
           ORDER BY updated_at DESC LIMIT 50`
        ).bind(like).all(),
      ]);

      return new Response(
        JSON.stringify({
          ok: true,
          folders: foldersRes.results || [],
          files: filesRes.results || [],
          search: true,
        }),
        { status: 200, headers: HEADERS }
      );
    }

    // Pinned only (standalone)
    if (pinnedOnly) {
      const { results } = await db.prepare(
        `SELECT id, folder_id, original_name, mime_type, extension,
                size_bytes, is_pinned, created_at
         FROM archive_files
         WHERE deleted_at IS NULL AND is_pinned = 1
         ORDER BY updated_at DESC LIMIT 20`
      ).all();

      return new Response(
        JSON.stringify({ ok: true, files: results || [], folders: [] }),
        { status: 200, headers: HEADERS }
      );
    }

    // Recent only (standalone)
    if (recentOnly) {
      const { results } = await db.prepare(
        `SELECT id, folder_id, original_name, mime_type, extension,
                size_bytes, is_pinned, created_at
         FROM archive_files
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 10`
      ).all();

      return new Response(
        JSON.stringify({ ok: true, files: results || [], folders: [] }),
        { status: 200, headers: HEADERS }
      );
    }

    // --- Main folder listing ---
    const isRoot = !folderId;

    // Build all queries in parallel
    const queries = [];

    // 1. Folders in this level
    if (folderId) {
      queries.push(
        db.prepare(
          `SELECT f.id, f.name, f.parent_id, f.sort_order, f.created_at,
                  (SELECT COUNT(*) FROM archive_files af WHERE af.folder_id = f.id AND af.deleted_at IS NULL) as file_count
           FROM archive_folders f
           WHERE f.parent_id = ? AND f.deleted_at IS NULL
           ORDER BY f.sort_order ASC, f.name ASC`
        ).bind(folderId).all()
      );
    } else {
      queries.push(
        db.prepare(
          `SELECT f.id, f.name, f.parent_id, f.sort_order, f.created_at,
                  (SELECT COUNT(*) FROM archive_files af WHERE af.folder_id = f.id AND af.deleted_at IS NULL) as file_count
           FROM archive_folders f
           WHERE f.parent_id IS NULL AND f.deleted_at IS NULL
           ORDER BY f.sort_order ASC, f.name ASC`
        ).all()
      );
    }

    // 2. Files in this level
    if (folderId) {
      queries.push(
        db.prepare(
          `SELECT id, folder_id, original_name, mime_type, extension,
                  size_bytes, is_pinned, created_at
           FROM archive_files
           WHERE folder_id = ? AND deleted_at IS NULL
           ORDER BY updated_at DESC`
        ).bind(folderId).all()
      );
    } else {
      queries.push(
        db.prepare(
          `SELECT id, folder_id, original_name, mime_type, extension,
                  size_bytes, is_pinned, created_at
           FROM archive_files
           WHERE folder_id IS NULL AND deleted_at IS NULL
           ORDER BY updated_at DESC`
        ).all()
      );
    }

    // 3. Breadcrumb (only if inside a folder) — single query gets all ancestors
    if (folderId) {
      queries.push(
        db.prepare(
          `SELECT id, name, parent_id FROM archive_folders WHERE deleted_at IS NULL`
        ).all()
      );
    }

    // 4 & 5. If root, also get pinned + recent in parallel
    if (isRoot) {
      queries.push(
        db.prepare(
          `SELECT id, folder_id, original_name, mime_type, extension,
                  size_bytes, is_pinned, created_at
           FROM archive_files
           WHERE deleted_at IS NULL AND is_pinned = 1
           ORDER BY updated_at DESC LIMIT 20`
        ).all()
      );
      queries.push(
        db.prepare(
          `SELECT id, folder_id, original_name, mime_type, extension,
                  size_bytes, is_pinned, created_at
           FROM archive_files
           WHERE deleted_at IS NULL
           ORDER BY created_at DESC LIMIT 10`
        ).all()
      );
    }

    // Execute all in parallel
    const results = await Promise.all(queries);

    const folders = results[0].results || [];
    const files = results[1].results || [];

    // Build breadcrumb from all folders data (in-memory walk)
    let breadcrumb = [];
    if (folderId) {
      const allFolders = results[2].results || [];
      const byId = {};
      allFolders.forEach(f => (byId[f.id] = f));
      let currentId = folderId;
      let depth = 0;
      while (currentId && depth < 10) {
        const f = byId[currentId];
        if (!f) break;
        breadcrumb.unshift({ id: f.id, name: f.name });
        currentId = f.parent_id;
        depth++;
      }
    }

    const response = { ok: true, folders, files, breadcrumb };

    // Include pinned + recent for root
    if (isRoot) {
      response.pinned = results[2]?.results || [];
      response.recent = results[3]?.results || [];
    }

    return new Response(JSON.stringify(response), {
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
