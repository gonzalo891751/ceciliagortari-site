const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const ENSURE_SQL = `
CREATE TABLE IF NOT EXISTS gacetillas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  resumen TEXT DEFAULT '',
  fecha_gacetilla TEXT NOT NULL,
  tema TEXT DEFAULT '',
  archivo_nombre TEXT,
  archivo_key TEXT,
  archivo_mime TEXT,
  archivo_size INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL
)`;

const ENSURE_JOIN_SQL = `
CREATE TABLE IF NOT EXISTS gacetilla_proyectos (
  id TEXT PRIMARY KEY,
  gacetilla_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  UNIQUE(gacetilla_id, project_id)
)`;

async function ensureTables(db) {
  await db.prepare(ENSURE_SQL).run();
  await db.prepare(ENSURE_JOIN_SQL).run();
}

// GET /api/gacetillas?search=&page=1&limit=10
export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    await ensureTables(db);

    const url = new URL(context.request.url);
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit")) || 10));
    const offset = (page - 1) * limit;

    let whereClauses = ["g.deleted_at IS NULL"];
    let binds = [];

    if (search) {
      whereClauses.push(
        "(LOWER(g.titulo) LIKE ? OR LOWER(g.tema) LIKE ? OR LOWER(g.resumen) LIKE ?)"
      );
      const like = `%${search}%`;
      binds.push(like, like, like);
    }

    const where = whereClauses.join(" AND ");

    // Count total
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM gacetillas g WHERE ${where}`)
      .bind(...binds)
      .first();
    const total = countResult.total;

    // Fetch page
    const { results } = await db
      .prepare(
        `SELECT g.id, g.titulo, g.resumen, g.fecha_gacetilla, g.tema,
                g.archivo_nombre, g.archivo_key, g.archivo_mime, g.archivo_size,
                g.created_at, g.updated_at
         FROM gacetillas g
         WHERE ${where}
         ORDER BY g.fecha_gacetilla DESC, g.updated_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...binds, limit, offset)
      .all();

    // Fetch linked projects for all gacetillas in this page
    const gacetillaIds = (results || []).map((g) => g.id);
    let projectLinks = {};

    if (gacetillaIds.length > 0) {
      const placeholders = gacetillaIds.map(() => "?").join(",");
      const { results: links } = await db
        .prepare(
          `SELECT gp.gacetilla_id, gp.project_id, p.titulo as project_titulo
           FROM gacetilla_proyectos gp
           LEFT JOIN projects p ON p.id = gp.project_id AND p.deleted_at IS NULL
           WHERE gp.gacetilla_id IN (${placeholders})`
        )
        .bind(...gacetillaIds)
        .all();

      (links || []).forEach((link) => {
        if (!projectLinks[link.gacetilla_id]) projectLinks[link.gacetilla_id] = [];
        projectLinks[link.gacetilla_id].push({
          id: link.project_id,
          titulo: link.project_titulo || "(Proyecto eliminado)",
        });
      });
    }

    const data = (results || []).map((g) => ({
      ...g,
      proyectos: projectLinks[g.id] || [],
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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

// POST /api/gacetillas — create or update
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    await ensureTables(db);

    const body = await context.request.json();

    const required = ["id", "titulo", "fecha_gacetilla", "created_at", "updated_at"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ ok: false, error: `Campos requeridos faltantes: ${missing.join(", ")}` }),
        { status: 400, headers: HEADERS }
      );
    }

    const gacetilla = {
      id: body.id,
      titulo: body.titulo,
      resumen: body.resumen || "",
      fecha_gacetilla: body.fecha_gacetilla,
      tema: body.tema || "",
      created_at: body.created_at,
      updated_at: body.updated_at,
    };

    // UPSERT gacetilla (do not touch archivo fields here — those are managed by upload endpoint)
    // Check if exists to preserve archivo fields
    const existing = await db
      .prepare("SELECT id, archivo_nombre, archivo_key, archivo_mime, archivo_size FROM gacetillas WHERE id = ?")
      .bind(gacetilla.id)
      .first();

    if (existing) {
      await db
        .prepare(
          `UPDATE gacetillas SET titulo=?, resumen=?, fecha_gacetilla=?, tema=?, updated_at=?, deleted_at=NULL
           WHERE id=?`
        )
        .bind(
          gacetilla.titulo,
          gacetilla.resumen,
          gacetilla.fecha_gacetilla,
          gacetilla.tema,
          gacetilla.updated_at,
          gacetilla.id
        )
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO gacetillas (id, titulo, resumen, fecha_gacetilla, tema, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          gacetilla.id,
          gacetilla.titulo,
          gacetilla.resumen,
          gacetilla.fecha_gacetilla,
          gacetilla.tema,
          gacetilla.created_at,
          gacetilla.updated_at
        )
        .run();
    }

    // Update linked projects
    const proyectoIds = body.proyecto_ids || [];

    // Remove old links
    await db
      .prepare("DELETE FROM gacetilla_proyectos WHERE gacetilla_id = ?")
      .bind(gacetilla.id)
      .run();

    // Insert new links
    for (const pid of proyectoIds) {
      const linkId = crypto.randomUUID();
      await db
        .prepare(
          "INSERT OR IGNORE INTO gacetilla_proyectos (id, gacetilla_id, project_id) VALUES (?, ?, ?)"
        )
        .bind(linkId, gacetilla.id, pid)
        .run();
    }

    // Return full object
    const saved = await db
      .prepare("SELECT * FROM gacetillas WHERE id = ?")
      .bind(gacetilla.id)
      .first();

    return new Response(
      JSON.stringify({ ok: true, gacetilla: saved }),
      { status: 200, headers: HEADERS }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
