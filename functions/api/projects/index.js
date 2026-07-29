const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const TABLE = "projects";

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLE} (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  responsable TEXT DEFAULT 'Sin asignar',
  area_tema TEXT DEFAULT '',
  resumen TEXT DEFAULT '',
  estado_preparacion TEXT NOT NULL DEFAULT 'Pendiente',
  fecha_objetivo_presentacion TEXT DEFAULT '',
  fecha_presentacion TEXT DEFAULT '',
  estado_tramite TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL,
  action_plan TEXT DEFAULT '[]',
  tipo_autoria TEXT NOT NULL DEFAULT 'propio',
  autor_principal TEXT DEFAULT '',
  comisiones TEXT NOT NULL DEFAULT '[]'
)`;

const CREATE_DOCS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('main','material','expediente')),
  original_name TEXT NOT NULL,
  stored_key TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

async function ensureTable(db) {
  await db.prepare(CREATE_TABLE_SQL).run();
  await db.prepare(CREATE_DOCS_TABLE_SQL).run();
  // Ensure action_plan column exists (for existing tables)
  try {
    await db.prepare(`SELECT action_plan FROM ${TABLE} LIMIT 1`).all();
  } catch (e) {
    await db.prepare(`ALTER TABLE ${TABLE} ADD COLUMN action_plan TEXT DEFAULT '[]'`).run();
  }
  // Ensure authorship columns exist
  try {
    await db.prepare(`SELECT tipo_autoria FROM ${TABLE} LIMIT 1`).all();
  } catch (e) {
    await db.prepare(`ALTER TABLE ${TABLE} ADD COLUMN tipo_autoria TEXT NOT NULL DEFAULT 'propio'`).run();
    await db.prepare(`ALTER TABLE ${TABLE} ADD COLUMN autor_principal TEXT DEFAULT ''`).run();
  }
  try {
    await db.prepare(`SELECT comisiones FROM ${TABLE} LIMIT 1`).all();
  } catch (e) {
    await db.prepare(`ALTER TABLE ${TABLE} ADD COLUMN comisiones TEXT NOT NULL DEFAULT '[]'`).run();
  }
}

function normalizeCommissions(value) {
  let input = value;
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch (_) {
      input = input ? [input] : [];
    }
  }
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((item) => String(item || "").trim()).filter(Boolean))];
}

function parseProject(row) {
  let actionPlan = [];
  try {
    actionPlan = JSON.parse(row.action_plan || "[]");
  } catch (_) {}
  return {
    ...row,
    action_plan: actionPlan,
    comisiones: normalizeCommissions(row.comisiones),
  };
}

export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    await ensureTable(db);

    const { results } = await db
      .prepare(
        `SELECT p.id, p.tipo, p.titulo, p.responsable, p.area_tema, p.resumen,
                p.estado_preparacion, p.fecha_objetivo_presentacion,
                p.fecha_presentacion, p.estado_tramite, p.created_at, p.updated_at,
                p.action_plan, p.tipo_autoria, p.autor_principal, p.comisiones,
                (SELECT COUNT(*) FROM project_documents WHERE project_id = p.id AND kind = 'main') AS has_main_doc,
                (SELECT COUNT(*) FROM project_documents WHERE project_id = p.id AND kind = 'material') AS materials_count,
                (SELECT COUNT(*) FROM project_documents WHERE project_id = p.id AND kind = 'expediente') AS has_expediente
         FROM ${TABLE} p
         WHERE p.deleted_at IS NULL
         ORDER BY p.updated_at DESC`
      )
      .all();

    const parsed = (results || []).map(parseProject);

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

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    await ensureTable(db);

    const body = await context.request.json();

    // Validación mínima
    const required = ["id", "tipo", "titulo", "estado_preparacion", "created_at", "updated_at"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ ok: false, error: `Campos requeridos faltantes: ${missing.join(", ")}`, missing }),
        { status: 400, headers: HEADERS }
      );
    }

    // Serialize action_plan to JSON string
    let actionPlanStr = "[]";
    if (body.action_plan) {
      actionPlanStr =
        typeof body.action_plan === "string"
          ? body.action_plan
          : JSON.stringify(body.action_plan);
    }
    const commissions = normalizeCommissions(body.comisiones);
    if (body.estado_preparacion === "Presentado" && commissions.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Los proyectos presentados deben tener al menos una comisión asignada." }),
        { status: 400, headers: HEADERS }
      );
    }

    const project = {
      id: body.id,
      tipo: body.tipo,
      titulo: body.titulo,
      responsable: body.responsable || "Sin asignar",
      area_tema: body.area_tema || "",
      resumen: body.resumen || "",
      estado_preparacion: body.estado_preparacion,
      fecha_objetivo_presentacion: body.fecha_objetivo_presentacion || "",
      fecha_presentacion: body.fecha_presentacion || "",
      estado_tramite: body.estado_tramite || "",
      created_at: body.created_at,
      updated_at: body.updated_at,
      action_plan: actionPlanStr,
      tipo_autoria: body.tipo_autoria || "propio",
      autor_principal: body.autor_principal || "",
      comisiones: JSON.stringify(commissions),
    };

    // UPSERT: INSERT OR REPLACE
    await db
      .prepare(
        `INSERT INTO ${TABLE}
           (id, tipo, titulo, responsable, area_tema, resumen,
            estado_preparacion, fecha_objetivo_presentacion,
            fecha_presentacion, estado_tramite, created_at, updated_at, deleted_at,
            action_plan, tipo_autoria, autor_principal, comisiones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           tipo = excluded.tipo,
           titulo = excluded.titulo,
           responsable = excluded.responsable,
           area_tema = excluded.area_tema,
           resumen = excluded.resumen,
           estado_preparacion = excluded.estado_preparacion,
           fecha_objetivo_presentacion = excluded.fecha_objetivo_presentacion,
           fecha_presentacion = excluded.fecha_presentacion,
           estado_tramite = excluded.estado_tramite,
           updated_at = excluded.updated_at,
           deleted_at = NULL,
           action_plan = excluded.action_plan,
           tipo_autoria = excluded.tipo_autoria,
           autor_principal = excluded.autor_principal,
           comisiones = excluded.comisiones`
      )
      .bind(
        project.id,
        project.tipo,
        project.titulo,
        project.responsable,
        project.area_tema,
        project.resumen,
        project.estado_preparacion,
        project.fecha_objetivo_presentacion,
        project.fecha_presentacion,
        project.estado_tramite,
        project.created_at,
        project.updated_at,
        project.action_plan,
        project.tipo_autoria,
        project.autor_principal,
        project.comisiones
      )
      .run();

    // Return project with parsed action_plan
    let parsedAP = [];
    try {
      parsedAP = JSON.parse(project.action_plan);
    } catch (_) {}

    return new Response(
      JSON.stringify({
        ok: true,
        project: {
          ...project,
          action_plan: parsedAP,
          comisiones: normalizeCommissions(project.comisiones),
        },
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
