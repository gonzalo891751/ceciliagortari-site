const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// POST /api/archivos/folders — create folder
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { name, parent_id } = body;

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ ok: false, error: "El nombre de la carpeta es requerido." }),
        { status: 400, headers: HEADERS }
      );
    }

    const sanitizedName = name.trim().substring(0, 200);

    // Validate parent exists if provided
    if (parent_id) {
      const parent = await db
        .prepare("SELECT id FROM archive_folders WHERE id = ? AND deleted_at IS NULL")
        .bind(parent_id)
        .first();
      if (!parent) {
        return new Response(
          JSON.stringify({ ok: false, error: "Carpeta padre no encontrada." }),
          { status: 404, headers: HEADERS }
        );
      }
    }

    // Check for duplicate name in same parent
    let dupQuery, dupBinds;
    if (parent_id) {
      dupQuery = "SELECT id FROM archive_folders WHERE name = ? AND parent_id = ? AND deleted_at IS NULL";
      dupBinds = [sanitizedName, parent_id];
    } else {
      dupQuery = "SELECT id FROM archive_folders WHERE name = ? AND parent_id IS NULL AND deleted_at IS NULL";
      dupBinds = [sanitizedName];
    }
    const dup = await db.prepare(dupQuery).bind(...dupBinds).first();
    if (dup) {
      return new Response(
        JSON.stringify({ ok: false, error: "Ya existe una carpeta con ese nombre en esta ubicación." }),
        { status: 409, headers: HEADERS }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO archive_folders (id, name, parent_id, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?)`
      )
      .bind(id, sanitizedName, parent_id || null, now, now)
      .run();

    const folder = await db
      .prepare("SELECT * FROM archive_folders WHERE id = ?")
      .bind(id)
      .first();

    return new Response(
      JSON.stringify({ ok: true, folder }),
      { status: 201, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
