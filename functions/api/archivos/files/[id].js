const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// GET /api/archivos/files/:id — get file details
export async function onRequestGet(context) {
  const db = context.env.DB;
  const id = context.params.id;

  try {
    const file = await db
      .prepare(
        `SELECT af.*, af2.name as folder_name
         FROM archive_files af
         LEFT JOIN archive_folders af2 ON af2.id = af.folder_id
         WHERE af.id = ? AND af.deleted_at IS NULL`
      )
      .bind(id)
      .first();

    if (!file) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado." }),
        { status: 404, headers: HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, file }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}

// PATCH /api/archivos/files/:id — rename, pin/unpin
export async function onRequestPatch(context) {
  const db = context.env.DB;
  const id = context.params.id;

  try {
    const body = await context.request.json();
    const file = await db
      .prepare("SELECT * FROM archive_files WHERE id = ? AND deleted_at IS NULL")
      .bind(id)
      .first();

    if (!file) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado." }),
        { status: 404, headers: HEADERS }
      );
    }

    const now = new Date().toISOString();
    const updates = [];
    const binds = [];

    if (typeof body.name === "string" && body.name.trim()) {
      const newName = body.name.trim().substring(0, 200);
      updates.push("original_name = ?");
      binds.push(newName);

      // Update extension
      const dot = newName.lastIndexOf(".");
      const ext = dot > -1 ? newName.substring(dot + 1).toLowerCase() : file.extension;
      updates.push("extension = ?");
      binds.push(ext);
    }

    if (typeof body.is_pinned === "number" || typeof body.is_pinned === "boolean") {
      updates.push("is_pinned = ?");
      binds.push(body.is_pinned ? 1 : 0);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se proporcionaron cambios." }),
        { status: 400, headers: HEADERS }
      );
    }

    updates.push("updated_at = ?");
    binds.push(now);
    binds.push(id);

    await db
      .prepare(`UPDATE archive_files SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...binds)
      .run();

    const updated = await db
      .prepare("SELECT * FROM archive_files WHERE id = ?")
      .bind(id)
      .first();

    return new Response(
      JSON.stringify({ ok: true, file: updated }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}

// DELETE /api/archivos/files/:id — soft delete + remove from R2
export async function onRequestDelete(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const id = context.params.id;

  try {
    const file = await db
      .prepare("SELECT * FROM archive_files WHERE id = ? AND deleted_at IS NULL")
      .bind(id)
      .first();

    if (!file) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado." }),
        { status: 404, headers: HEADERS }
      );
    }

    // Delete from R2
    if (file.r2_key) {
      try {
        await bucket.delete(file.r2_key);
      } catch (_) {
        // Non-fatal
      }
    }

    // Soft delete
    const now = new Date().toISOString();
    await db
      .prepare("UPDATE archive_files SET deleted_at = ?, updated_at = ? WHERE id = ?")
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
