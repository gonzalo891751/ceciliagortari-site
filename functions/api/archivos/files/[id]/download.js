const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// GET /api/archivos/files/:id/download — download file from R2
export async function onRequestGet(context) {
  const db = context.env.DB;
  const bucket = context.env.PROJECTS_BUCKET;
  const id = context.params.id;

  try {
    const file = await db
      .prepare(
        "SELECT id, original_name, r2_key, mime_type FROM archive_files WHERE id = ? AND deleted_at IS NULL"
      )
      .bind(id)
      .first();

    if (!file) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado." }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    const object = await bucket.get(file.r2_key);
    if (!object) {
      return new Response(
        JSON.stringify({ ok: false, error: "Archivo no encontrado en almacenamiento." }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    const url = new URL(context.request.url);
    const mode = url.searchParams.get("mode") || "download";

    const disposition = mode === "inline"
      ? `inline; filename="${encodeURIComponent(file.original_name)}"`
      : `attachment; filename="${encodeURIComponent(file.original_name)}"`;

    return new Response(object.body, {
      headers: {
        "Content-Type": file.mime_type || "application/octet-stream",
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
