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
  deleted_at TEXT DEFAULT NULL
)`;

async function ensureTable(db) {
  await db.prepare(CREATE_TABLE_SQL).run();
}

export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    await ensureTable(db);

    const { results } = await db
      .prepare(
        `SELECT id, tipo, titulo, responsable, area_tema, resumen,
                estado_preparacion, fecha_objetivo_presentacion,
                fecha_presentacion, estado_tramite, created_at, updated_at
         FROM ${TABLE}
         WHERE deleted_at IS NULL
         ORDER BY updated_at DESC`
      )
      .all();

    return new Response(JSON.stringify(results || []), {
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
    for (const field of required) {
      if (!body[field]) {
        return new Response(
          JSON.stringify({ ok: false, error: `Campo requerido: ${field}` }),
          { status: 400, headers: HEADERS }
        );
      }
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
    };

    // UPSERT: INSERT OR REPLACE
    await db
      .prepare(
        `INSERT INTO ${TABLE}
           (id, tipo, titulo, responsable, area_tema, resumen,
            estado_preparacion, fecha_objetivo_presentacion,
            fecha_presentacion, estado_tramite, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
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
           deleted_at = NULL`
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
        project.updated_at
      )
      .run();

    return new Response(
      JSON.stringify({ ok: true, project }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
