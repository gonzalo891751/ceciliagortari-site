import { getColumns, PARLIAMENTARY_FIELDS } from "../../../lib/proyectos-publicos.mjs";
import {
  normalizarImpulso, normalizarParticipacion, normalizarNumero, participacionDesdeFirmantes,
  autoriaDesdeImpulso, enlaceOficial, tipoCorto,
} from "../../../lib/legislativo.mjs";

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

const EDITABLE_PARLIAMENTARY_FIELDS = [...PARLIAMENTARY_FIELDS, "impulso_nota"];

/** Normalizes the parliamentary fields sent by the panel; keeps tipo_autoria consistent with impulso. */
function parliamentaryValues(body) {
  const numero = normalizarNumero(body.numero_expediente);
  const firmantes = String(body.firmantes || "").trim();
  const impulso = normalizarImpulso(body.impulso || "pendiente");
  const values = {
    numero_expediente: numero,
    titulo_oficial: String(body.titulo_oficial || "").trim(),
    firmantes,
    participacion: normalizarParticipacion(body.participacion) || participacionDesdeFirmantes(firmantes),
    impulso,
    impulso_nota: String(body.impulso_nota || "").trim(),
    norma_tipo: body.norma_numero ? tipoCorto(body.norma_tipo || body.tipo) : "",
    norma_numero: String(body.norma_numero || "").trim(),
    fecha_aprobacion: /^\d{4}-\d{2}-\d{2}$/.test(body.fecha_aprobacion || "") ? body.fecha_aprobacion : "",
    enlace_oficial: /^https:\/\/(www\.)?hcdcorrientes\.gov\.ar\//.test(body.enlace_oficial || "")
      ? body.enlace_oficial
      : enlaceOficial(numero),
    fuente: String(body.fuente || "").trim(),
    verificado_at: /^\d{4}-\d{2}-\d{2}$/.test(body.verificado_at || "") ? body.verificado_at : "",
  };
  return values;
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
    const columns = await getColumns(db, TABLE);
    const extraFields = EDITABLE_PARLIAMENTARY_FIELDS.filter((f) => columns.has(f)).map((f) => `p.${f}, `).join("");

    const { results } = await db
      .prepare(
        `SELECT p.id, p.tipo, p.titulo, p.responsable, p.area_tema, p.resumen,
                p.estado_preparacion, p.fecha_objetivo_presentacion,
                p.fecha_presentacion, p.estado_tramite, p.created_at, p.updated_at,
                ${extraFields}p.action_plan, p.tipo_autoria, p.autor_principal, p.comisiones,
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

    const columns = await getColumns(db, TABLE);
    const hasParliamentary = body.impulso !== undefined || body.numero_expediente !== undefined;
    const parliamentary = hasParliamentary ? parliamentaryValues(body) : {};

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
      tipo_autoria: hasParliamentary
        ? autoriaDesdeImpulso(parliamentary.impulso, body.tipo_autoria)
        : body.tipo_autoria || "propio",
      autor_principal: body.autor_principal || "",
      comisiones: JSON.stringify(commissions),
    };
    // New parliamentary columns are written only once migration 0010 exists.
    for (const field of EDITABLE_PARLIAMENTARY_FIELDS) {
      if (hasParliamentary && columns.has(field)) project[field] = parliamentary[field];
    }

    const fields = Object.keys(project);
    const updatable = fields.filter((f) => f !== "id" && f !== "created_at");
    await db
      .prepare(
        `INSERT INTO ${TABLE} (${fields.join(", ")}, deleted_at)
         VALUES (${fields.map(() => "?").join(", ")}, NULL)
         ON CONFLICT(id) DO UPDATE SET
           ${updatable.map((f) => `${f} = excluded.${f}`).join(",\n           ")},
           deleted_at = NULL`
      )
      .bind(...fields.map((f) => project[f]))
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
