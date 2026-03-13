const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const ENSURE_FOLDERS_SQL = `
CREATE TABLE IF NOT EXISTS archive_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL
)`;

const ENSURE_FILES_SQL = `
CREATE TABLE IF NOT EXISTS archive_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT DEFAULT NULL,
  original_name TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT,
  extension TEXT,
  size_bytes INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  uploaded_by TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL
)`;

async function ensureTables(db) {
  await db.prepare(ENSURE_FOLDERS_SQL).run();
  await db.prepare(ENSURE_FILES_SQL).run();
}

// GET /api/archivos?folder_id=&search=
export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    await ensureTables(db);

    const url = new URL(context.request.url);
    const folderId = url.searchParams.get("folder_id") || null;
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const pinnedOnly = url.searchParams.get("pinned") === "1";
    const recentOnly = url.searchParams.get("recent") === "1";

    // If searching, search across all folders
    if (search) {
      const like = `%${search}%`;
      const { results: folders } = await db
        .prepare(
          `SELECT id, name, parent_id, sort_order, created_at, updated_at
           FROM archive_folders
           WHERE deleted_at IS NULL AND LOWER(name) LIKE ?
           ORDER BY name ASC
           LIMIT 50`
        )
        .bind(like)
        .all();

      const { results: files } = await db
        .prepare(
          `SELECT id, folder_id, original_name, r2_key, mime_type, extension,
                  size_bytes, is_pinned, uploaded_by, created_at, updated_at
           FROM archive_files
           WHERE deleted_at IS NULL AND LOWER(original_name) LIKE ?
           ORDER BY updated_at DESC
           LIMIT 50`
        )
        .bind(like)
        .all();

      return new Response(
        JSON.stringify({ ok: true, folders: folders || [], files: files || [], search: true }),
        { status: 200, headers: HEADERS }
      );
    }

    // If pinned only
    if (pinnedOnly) {
      const { results: files } = await db
        .prepare(
          `SELECT id, folder_id, original_name, r2_key, mime_type, extension,
                  size_bytes, is_pinned, uploaded_by, created_at, updated_at
           FROM archive_files
           WHERE deleted_at IS NULL AND is_pinned = 1
           ORDER BY updated_at DESC
           LIMIT 20`
        )
        .all();

      return new Response(
        JSON.stringify({ ok: true, files: files || [], folders: [] }),
        { status: 200, headers: HEADERS }
      );
    }

    // If recent only
    if (recentOnly) {
      const { results: files } = await db
        .prepare(
          `SELECT id, folder_id, original_name, r2_key, mime_type, extension,
                  size_bytes, is_pinned, uploaded_by, created_at, updated_at
           FROM archive_files
           WHERE deleted_at IS NULL
           ORDER BY created_at DESC
           LIMIT 10`
        )
        .all();

      return new Response(
        JSON.stringify({ ok: true, files: files || [], folders: [] }),
        { status: 200, headers: HEADERS }
      );
    }

    // List contents of a folder (or root)
    let folderWhere, fileWhere;
    let folderBinds, fileBinds;

    if (folderId) {
      folderWhere = "parent_id = ? AND deleted_at IS NULL";
      fileWhere = "folder_id = ? AND deleted_at IS NULL";
      folderBinds = [folderId];
      fileBinds = [folderId];
    } else {
      folderWhere = "parent_id IS NULL AND deleted_at IS NULL";
      fileWhere = "folder_id IS NULL AND deleted_at IS NULL";
      folderBinds = [];
      fileBinds = [];
    }

    const { results: folders } = await db
      .prepare(
        `SELECT f.id, f.name, f.parent_id, f.sort_order, f.created_at, f.updated_at,
                (SELECT COUNT(*) FROM archive_files af WHERE af.folder_id = f.id AND af.deleted_at IS NULL) as file_count
         FROM archive_folders f
         WHERE ${folderWhere}
         ORDER BY f.sort_order ASC, f.name ASC`
      )
      .bind(...folderBinds)
      .all();

    const { results: files } = await db
      .prepare(
        `SELECT id, folder_id, original_name, r2_key, mime_type, extension,
                size_bytes, is_pinned, uploaded_by, created_at, updated_at
         FROM archive_files
         WHERE ${fileWhere}
         ORDER BY updated_at DESC`
      )
      .bind(...fileBinds)
      .all();

    // If viewing a specific folder, get breadcrumb path
    let breadcrumb = [];
    if (folderId) {
      let currentId = folderId;
      let depth = 0;
      while (currentId && depth < 10) {
        const folder = await db
          .prepare("SELECT id, name, parent_id FROM archive_folders WHERE id = ? AND deleted_at IS NULL")
          .bind(currentId)
          .first();
        if (!folder) break;
        breadcrumb.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parent_id;
        depth++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        folders: folders || [],
        files: files || [],
        breadcrumb,
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
