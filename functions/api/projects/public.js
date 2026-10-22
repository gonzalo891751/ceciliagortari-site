import { loadPublicProjects } from "../../../lib/proyectos-publicos.mjs";

const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60, s-maxage=120",
};

export async function onRequestGet(context) {
  try {
    const projects = await loadPublicProjects(context.env.DB);
    return new Response(JSON.stringify(projects), { status: 200, headers: HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Error interno." }),
      { status: 500, headers: { ...HEADERS, "Cache-Control": "no-store" } }
    );
  }
}
