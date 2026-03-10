const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// GET /api/gacetillas/:id — detail
export async function onRequestGet(context) {
  const db = context.env.DB;
  const id = context.params.id;

  try {
    const gacetilla = await db
      .prepare(
        `SELECT id, titulo, resumen, fecha_gacetilla, tema,
                archivo_nombre, archivo_key, archivo_mime, archivo_size,
                created_at, updated_at
         FROM gacetillas WHERE id = ? AND deleted_at IS NULL`
      )
      .bind(id)
      .first();

    if (!gacetilla) {
      return new Response(
        JSON.stringify({ ok: false, error: "Gacetilla no encontrada." }),
        { status: 404, headers: HEADERS }
      );
    }

    // Get linked projects
    const { results: links } = await db
      .prepare(
        `SELECT gp.project_id, p.titulo as project_titulo
         FROM gacetilla_proyectos gp
         LEFT JOIN projects p ON p.id = gp.project_id AND p.deleted_at IS NULL
         WHERE gp.gacetilla_id = ?`
      )
      .bind(id)
      .all();

    gacetilla.proyectos = (links || []).map((l) => ({
      id: l.project_id,
      titulo: l.project_titulo || "(Proyecto eliminado)",
    }));

    return new Response(
      JSON.stringify({ ok: true, gacetilla }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}

// DELETE /api/gacetillas/:id — soft delete + cleanup R2
export async function onRequestDelete(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const id = context.params.id;

  try {
    const gacetilla = await db
      .prepare("SELECT id, archivo_key FROM gacetillas WHERE id = ? AND deleted_at IS NULL")
      .bind(id)
      .first();

    if (!gacetilla) {
      return new Response(
        JSON.stringify({ ok: false, error: "Gacetilla no encontrada." }),
        { status: 404, headers: HEADERS }
      );
    }

    // Delete file from R2 if exists
    if (gacetilla.archivo_key) {
      try {
        await bucket.delete(gacetilla.archivo_key);
      } catch (_) {
        // Non-fatal: file may already be gone
      }
    }

    // Soft delete
    const now = new Date().toISOString();
    await db
      .prepare("UPDATE gacetillas SET deleted_at = ?, updated_at = ? WHERE id = ?")
      .bind(now, now, id)
      .run();

    // Remove project links
    await db
      .prepare("DELETE FROM gacetilla_proyectos WHERE gacetilla_id = ?")
      .bind(id)
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
