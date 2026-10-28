import { loadPublicProject } from "../../../../../lib/proyectos-publicos.mjs";
import { enlaceOficial, pdfExpedienteDesdeFicha } from "../../../../../lib/legislativo.mjs";

// "Descargar expediente": lleva al PDF oficial del expediente. Si el sitio ya tiene cargada la copia
// oficial, usa esa; si no, el PDF que la Cámara enlaza en la ficha del expediente. Si la ficha no
// responde o no enlaza el PDF, lleva a la ficha oficial. Solo para proyectos públicos con expediente.
const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const FICHA_TTL = 6 * 60 * 60;

function redirigir(url, maxAge) {
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": `public, max-age=${maxAge}` } });
}

export async function onRequestGet(context) {
  let project;
  try {
    project = await loadPublicProject(context.env.DB, context.params.id);
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Error interno." }), { status: 500, headers: JSON_HEADERS });
  }
  if (!project || !project.numero_expediente) {
    return new Response(JSON.stringify({ ok: false, error: "Expediente no encontrado." }), { status: 404, headers: JSON_HEADERS });
  }

  if (project.documento && project.documento.kind === "expediente") return redirigir(project.documento.url, 300);

  const ficha = enlaceOficial(project.numero_expediente);
  try {
    const res = await fetch(ficha, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ceciliagortari.com.ar)", Accept: "text/html" },
      cf: { cacheTtl: FICHA_TTL, cacheEverything: true },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const pdf = pdfExpedienteDesdeFicha(await res.text(), project.numero_expediente);
      if (pdf) return redirigir(pdf, FICHA_TTL);
    }
  } catch (err) {
    // La ficha oficial sigue siendo el respaldo.
  }
  return redirigir(project.enlace_oficial || ficha, 300);
}
