const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTS = [".pdf", ".doc", ".docx"];
const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function sanitizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 200);
}

function getExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.substring(dot).toLowerCase() : "";
}

function slugify(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 100);
}

// POST /api/gacetillas/:id/archivo — upload/replace file
export async function onRequestPost(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const gacetillaId = context.params.id;

  try {
    // Check gacetilla exists
    const gacetilla = await db
      .prepare("SELECT id, archivo_key FROM gacetillas WHERE id = ? AND deleted_at IS NULL")
      .bind(gacetillaId)
      .first();

    if (!gacetilla) {
      return new Response(
        JSON.stringify({ ok: false, error: "Gacetilla no encontrada." }),
        { status: 404, headers: HEADERS }
      );
    }

    const formData = await context.request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ ok: false, error: "No se envió ningún archivo." }),
        { status: 400, headers: HEADERS }
      );
    }

    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ ok: false, error: "El archivo excede 50MB." }),
        { status: 400, headers: HEADERS }
      );
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIMES.includes(file.type)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Solo se permiten archivos PDF, DOC o DOCX." }),
        { status: 400, headers: HEADERS }
      );
    }

    // Delete previous file from R2 if exists
    if (gacetilla.archivo_key) {
      try {
        await bucket.delete(gacetilla.archivo_key);
      } catch (_) {}
    }

    // Upload to R2
    const now = new Date().toISOString();
    const timestamp = Date.now();
    const safeName = sanitizeName(file.name);
    const storedKey = `gacetillas/${gacetillaId}/${timestamp}_${safeName}`;

    await bucket.put(storedKey, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: file.name },
    });

    // Update gacetilla in D1
    await db
      .prepare(
        `UPDATE gacetillas SET archivo_nombre=?, archivo_key=?, archivo_mime=?, archivo_size=?, updated_at=?
         WHERE id=?`
      )
      .bind(file.name, storedKey, file.type, file.size, now, gacetillaId)
      .run();

    return new Response(
      JSON.stringify({
        ok: true,
        archivo: {
          nombre: file.name,
          mime: file.type,
          size: file.size,
          updated_at: now,
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

// GET /api/gacetillas/:id/archivo — download file
export async function onRequestGet(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const gacetillaId = context.params.id;

  try {
    const url = new URL(context.request.url);
    const mode = url.searchParams.get("mode") || "download"; // "download" or "inline"

    const gacetilla = await db
      .prepare(
        "SELECT id, titulo, archivo_nombre, archivo_key, archivo_mime FROM gacetillas WHERE id = ? AND deleted_at IS NULL"
      )
      .bind(gacetillaId)
      .first();

    if (!gacetilla || !gacetilla.archivo_key) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado." }),
        { status: 404, headers: HEADERS }
      );
    }

    const object = await bucket.get(gacetilla.archivo_key);
    if (!object) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado en storage." }),
        { status: 404, headers: HEADERS }
      );
    }

    const ext = getExtension(gacetilla.archivo_nombre);
    const slugTitle = slugify(gacetilla.titulo);
    const filename = `Gacetilla_${slugTitle}${ext}`;
    const disposition = mode === "inline" ? "inline" : "attachment";

    return new Response(object.body, {
      headers: {
        "Content-Type": gacetilla.archivo_mime || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: HEADERS }
    );
  }
}
