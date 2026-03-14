const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const TABLE = "agenda_events";

/**
 * GET /api/agenda/:id — Get single agenda event
 */
export async function onRequestGet(context) {
  const db = context.env.DB;
  const id = context.params.id;
  try {
    const row = await db
      .prepare(`SELECT * FROM ${TABLE} WHERE id = ? AND deleted_at IS NULL`)
      .bind(id)
      .first();

    if (!row) {
      return new Response(
        JSON.stringify({ ok: false, error: "Evento no encontrado" }),
        { status: 404, headers: HEADERS }
      );
    }

    let rr = null;
    try { if (row.recurrence_rule) rr = JSON.parse(row.recurrence_rule); } catch (_) {}

    return new Response(
      JSON.stringify({ ...row, recurrence_rule: rr }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}

/**
 * PUT /api/agenda/:id — Update an agenda event
 */
export async function onRequestPut(context) {
  const db = context.env.DB;
  const id = context.params.id;
  try {
    const body = await context.request.json();

    // Check exists
    const existing = await db
      .prepare(`SELECT id FROM ${TABLE} WHERE id = ? AND deleted_at IS NULL`)
      .bind(id)
      .first();

    if (!existing) {
      return new Response(
        JSON.stringify({ ok: false, error: "Evento no encontrado" }),
        { status: 404, headers: HEADERS }
      );
    }

    // Serialize recurrence_rule
    let recurrenceStr = null;
    if (body.recurrence_rule !== undefined) {
      if (body.recurrence_rule === null) {
        recurrenceStr = null;
      } else {
        recurrenceStr =
          typeof body.recurrence_rule === "string"
            ? body.recurrence_rule
            : JSON.stringify(body.recurrence_rule);
      }
    }

    const now = new Date().toISOString();

    // Build dynamic SET clause from provided fields
    const allowedFields = [
      "title", "description", "event_date", "start_time", "end_time",
      "all_day", "category", "status", "priority", "responsible",
      "location_mode", "location_text", "related_project_id",
      "notes", "completed_at", "archived_at",
    ];

    let sets = ["updated_at = ?"];
    let binds = [now];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        sets.push(`${field} = ?`);
        if (field === "all_day") {
          binds.push(body[field] ? 1 : 0);
        } else {
          binds.push(body[field]);
        }
      }
    }

    // Handle recurrence_rule separately (already serialized)
    if (body.recurrence_rule !== undefined) {
      sets.push(`recurrence_rule = ?`);
      binds.push(recurrenceStr);
    }

    binds.push(id); // WHERE id = ?

    await db
      .prepare(`UPDATE ${TABLE} SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...binds)
      .run();

    // Fetch updated row
    const updated = await db
      .prepare(`SELECT * FROM ${TABLE} WHERE id = ?`)
      .bind(id)
      .first();

    let rr = null;
    try { if (updated.recurrence_rule) rr = JSON.parse(updated.recurrence_rule); } catch (_) {}

    return new Response(
      JSON.stringify({ ok: true, event: { ...updated, recurrence_rule: rr } }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}

/**
 * DELETE /api/agenda/:id — Soft-delete an agenda event
 */
export async function onRequestDelete(context) {
  const db = context.env.DB;
  const id = context.params.id;
  try {
    const now = new Date().toISOString();

    const result = await db
      .prepare(`UPDATE ${TABLE} SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
      .bind(now, now, id)
      .run();

    if (result.meta.changes === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Evento no encontrado" }),
        { status: 404, headers: HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, deleted: id }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
