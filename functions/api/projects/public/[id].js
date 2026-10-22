import { loadPublicProject } from "../../../../lib/proyectos-publicos.mjs";

const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, s-maxage=120",
};

export async function onRequestGet(context) {
  try {
    // Only public projects (Presentado + not deleted) are returned.
    const project = await loadPublicProject(context.env.DB, context.params.id);
    if (!project) {
      return new Response(
        JSON.stringify({ ok: false, error: "Proyecto no encontrado." }),
        { status: 404, headers: { ...HEADERS, "Cache-Control": "no-store" } }
      );
    }

    // `document` keeps the shape used by earlier versions of the public pages.
    const doc = project.documento;
    const document = doc
      ? { id: doc.id, kind: doc.kind, original_name: doc.nombre, mime_type: doc.mime, size_bytes: doc.bytes }
      : null;
    return new Response(JSON.stringify({ ...project, document }), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Error interno." }),
      { status: 500, headers: { ...HEADERS, "Cache-Control": "no-store" } }
    );
  }
}
