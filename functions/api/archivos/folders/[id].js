const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// PATCH /api/archivos/folders/:id — rename folder
export async function onRequestPatch(context) {
  const db = context.env.DB;
  const id = context.params.id;
  try {
    const body = await context.request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: "El nombre es requerido." }),
        { status: 400, headers: HEADERS }
      );
    }

    const folder = await db
      .prepare("SELECT * FROM archive_folders WHERE id = ? AND deleted_at IS NULL")
      .bind(id)
      .first();

    if (!folder) {
      return new Response(
        JSON.stringify({ ok: false, error: "Carpeta no encontrada." }),
        { status: 404, headers: HEADERS }
      );
    }

    const sanitizedName = name.trim().substring(0, 200);

    // Check for duplicate name in same parent
    let dupQuery, dupBinds;
    if (folder.parent_id) {
      dupQuery = "SELECT id FROM archive_folders WHERE name = ? AND parent_id = ? AND id != ? AND deleted_at IS NULL";
      dupBinds = [sanitizedName, folder.parent_id, id];
    } else {
      dupQuery = "SELECT id FROM archive_folders WHERE name = ? AND parent_id IS NULL AND id != ? AND deleted_at IS NULL";
      dupBinds = [sanitizedName, id];
    }
    const dup = await db.prepare(dupQuery).bind(...dupBinds).first();
    if (dup) {
      return new Response(
        JSON.stringify({ ok: false, error: "Ya existe una carpeta con ese nombre en esta ubicación." }),
        { status: 409, headers: HEADERS }
      );
    }

    const now = new Date().toISOString();
    await db
      .prepare("UPDATE archive_folders SET name = ?, updated_at = ? WHERE id = ?")
      .bind(sanitizedName, now, id)
      .run();

    const updated = await db
      .prepare("SELECT * FROM archive_folders WHERE id = ?")
      .bind(id)
      .first();

    return new Response(
      JSON.stringify({ ok: true, folder: updated }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}

// DELETE /api/archivos/folders/:id — soft delete (only if empty)
export async function onRequestDelete(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const id = context.params.id;

  try {
    const folder = await db
      .prepare("SELECT * FROM archive_folders WHERE id = ? AND deleted_at IS NULL")
      .bind(id)
      .first();

    if (!folder) {
      return new Response(
        JSON.stringify({ ok: false, error: "Carpeta no encontrada." }),
        { status: 404, headers: HEADERS }
      );
    }

    // Check for subfolders
    const subfolder = await db
      .prepare("SELECT id FROM archive_folders WHERE parent_id = ? AND deleted_at IS NULL LIMIT 1")
      .bind(id)
      .first();

    if (subfolder) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se puede eliminar una carpeta que contiene subcarpetas. Eliminá primero su contenido." }),
        { status: 409, headers: HEADERS }
      );
    }

    // Check for files
    const file = await db
      .prepare("SELECT id FROM archive_files WHERE folder_id = ? AND deleted_at IS NULL LIMIT 1")
      .bind(id)
      .first();

    if (file) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se puede eliminar una carpeta que contiene archivos. Eliminá primero su contenido." }),
        { status: 409, headers: HEADERS }
      );
    }

    // Soft delete
    const now = new Date().toISOString();
    await db
      .prepare("UPDATE archive_folders SET deleted_at = ?, updated_at = ? WHERE id = ?")
      .bind(now, now, id)
      .run();

    return new Response(
      JSON.stringify({ ok: true, deleted_at: now }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
