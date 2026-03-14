const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const TABLE = "agenda_events";

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLE} (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  event_date      TEXT,
  start_time      TEXT,
  end_time        TEXT,
  all_day         INTEGER DEFAULT 0,
  category        TEXT DEFAULT 'Pendiente por coordinar',
  status          TEXT DEFAULT 'Pendiente',
  priority        TEXT DEFAULT 'Media',
  responsible     TEXT,
  location_mode   TEXT,
  location_text   TEXT,
  related_project_id TEXT,
  recurrence_rule TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  completed_at    TEXT,
  archived_at     TEXT,
  deleted_at      TEXT
)`;

async function ensureTable(db) {
  await db.prepare(CREATE_TABLE_SQL).run();
}

/**
 * GET /api/agenda
 *
 * Query params:
 *   from         — start date YYYY-MM-DD (inclusive)
 *   to           — end date YYYY-MM-DD (inclusive)
 *   include_pending — "true" to also return items with no date
 *   category     — filter by category
 *   status       — filter by status
 *   responsible  — filter by responsible
 *   related_project_id — filter by project
 *   pending_only — "true" to return only items without a date
 */
export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    await ensureTable(db);

    const url = new URL(context.request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const includePending = url.searchParams.get("include_pending") === "true";
    const pendingOnly = url.searchParams.get("pending_only") === "true";
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");
    const responsible = url.searchParams.get("responsible");
    const relatedProjectId = url.searchParams.get("related_project_id");

    let conditions = [`deleted_at IS NULL`];
    let binds = [];

    if (pendingOnly) {
      conditions.push(`event_date IS NULL`);
    } else if (from && to) {
      if (includePending) {
        conditions.push(`(event_date BETWEEN ? AND ? OR event_date IS NULL)`);
      } else {
        conditions.push(`event_date BETWEEN ? AND ?`);
      }
      binds.push(from, to);
    }

    if (category) {
      conditions.push(`category = ?`);
      binds.push(category);
    }
    if (status) {
      conditions.push(`status = ?`);
      binds.push(status);
    }
    if (responsible) {
      conditions.push(`responsible = ?`);
      binds.push(responsible);
    }
    if (relatedProjectId) {
      conditions.push(`related_project_id = ?`);
      binds.push(relatedProjectId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT * FROM ${TABLE}
      ${where}
      ORDER BY
        CASE WHEN event_date IS NULL THEN 1 ELSE 0 END,
        event_date ASC,
        start_time ASC,
        priority = 'Alta' DESC,
        priority = 'Media' DESC,
        updated_at DESC
    `;

    const stmt = db.prepare(sql);
    const { results } = binds.length > 0 ? await stmt.bind(...binds).all() : await stmt.all();

    // Parse recurrence_rule from JSON string
    const parsed = (results || []).map((r) => {
      let rr = null;
      try {
        if (r.recurrence_rule) rr = JSON.parse(r.recurrence_rule);
      } catch (_) {}
      return { ...r, recurrence_rule: rr };
    });

    return new Response(JSON.stringify(parsed), {
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

/**
 * POST /api/agenda — Create or upsert an agenda event
 */
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    await ensureTable(db);

    const body = await context.request.json();

    // Validation
    if (!body.id || !body.title) {
      return new Response(
        JSON.stringify({ ok: false, error: "Campos requeridos: id, title" }),
        { status: 400, headers: HEADERS }
      );
    }

    // Serialize recurrence_rule
    let recurrenceStr = null;
    if (body.recurrence_rule) {
      recurrenceStr =
        typeof body.recurrence_rule === "string"
          ? body.recurrence_rule
          : JSON.stringify(body.recurrence_rule);
    }

    const now = new Date().toISOString();
    const event = {
      id: body.id,
      title: body.title,
      description: body.description || "",
      event_date: body.event_date || null,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      all_day: body.all_day ? 1 : 0,
      category: body.category || "Pendiente por coordinar",
      status: body.status || "Pendiente",
      priority: body.priority || "Media",
      responsible: body.responsible || null,
      location_mode: body.location_mode || null,
      location_text: body.location_text || null,
      related_project_id: body.related_project_id || null,
      recurrence_rule: recurrenceStr,
      notes: body.notes || null,
      created_at: body.created_at || now,
      updated_at: body.updated_at || now,
      completed_at: body.completed_at || null,
      archived_at: body.archived_at || null,
    };

    await db
      .prepare(
        `INSERT INTO ${TABLE}
           (id, title, description, event_date, start_time, end_time, all_day,
            category, status, priority, responsible, location_mode, location_text,
            related_project_id, recurrence_rule, notes,
            created_at, updated_at, completed_at, archived_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           event_date = excluded.event_date,
           start_time = excluded.start_time,
           end_time = excluded.end_time,
           all_day = excluded.all_day,
           category = excluded.category,
           status = excluded.status,
           priority = excluded.priority,
           responsible = excluded.responsible,
           location_mode = excluded.location_mode,
           location_text = excluded.location_text,
           related_project_id = excluded.related_project_id,
           recurrence_rule = excluded.recurrence_rule,
           notes = excluded.notes,
           updated_at = excluded.updated_at,
           completed_at = excluded.completed_at,
           archived_at = excluded.archived_at,
           deleted_at = NULL`
      )
      .bind(
        event.id, event.title, event.description,
        event.event_date, event.start_time, event.end_time, event.all_day,
        event.category, event.status, event.priority,
        event.responsible, event.location_mode, event.location_text,
        event.related_project_id, event.recurrence_rule, event.notes,
        event.created_at, event.updated_at, event.completed_at, event.archived_at
      )
      .run();

    // Parse recurrence for response
    let parsedRR = null;
    try { if (event.recurrence_rule) parsedRR = JSON.parse(event.recurrence_rule); } catch (_) {}

    return new Response(
      JSON.stringify({ ok: true, event: { ...event, recurrence_rule: parsedRR } }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
