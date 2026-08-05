import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
function argument(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const baseUrl = (argument("--base-url", "https://ceciliagortari.com.ar") || "").replace(/\/+$/, "");
const expectedPath = argument("--expected");
const outputPath = argument("--output", "docs/actualizacion-proyectos-2026-08-05/verificacion-produccion.json");
if (!expectedPath) {
  throw new Error("Uso: node scripts/auditar-sesion-2026-08-05.mjs --expected <apply-result.json> [--base-url URL] [--output archivo]");
}

const expected = JSON.parse(await readFile(expectedPath, "utf8"));
const targetIds = expected.records.map((record) => record.id);
const newsIds = [
  "2026-08-05-informes-obras-publicas",
  "2026-08-05-regalias-yacyreta",
  "2026-08-05-simbolo-accesibilidad-universal",
  "2026-08-05-reforma-reglamento-comisiones",
];

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fetchBytes(url) {
  const response = await fetch(url, { redirect: "follow", cache: "no-store" });
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    url,
    final_url: response.url,
    status: response.status,
    ok: response.ok,
    content_type: response.headers.get("content-type") || "",
    bytes,
    sha256: hash(bytes),
    header: bytes.subarray(0, 5).toString("ascii"),
  };
}

async function fetchJson(url) {
  const result = await fetchBytes(url);
  if (!result.ok) throw new Error(`${result.status} ${url}`);
  return { result, data: JSON.parse(result.bytes.toString("utf8")) };
}

function countBy(items, field) {
  return Object.fromEntries(
    [...new Set(items.map((item) => item[field]))]
      .sort()
      .map((value) => [value, items.filter((item) => item[field] === value).length]),
  );
}

const errors = [];
const { result: projectsResponse, data: projects } = await fetchJson(`${baseUrl}/api/projects`);
const targets = projects.filter((project) => targetIds.includes(project.id));
const duplicateIds = projects
  .map((project) => project.id)
  .filter((id, index, all) => all.indexOf(id) !== index);
if (duplicateIds.length) errors.push(`IDs duplicados: ${duplicateIds.join(", ")}`);
if (targets.length !== 10) errors.push(`Se esperaban 10 objetivos y hay ${targets.length}`);

const fieldNames = [
  "tipo",
  "titulo",
  "responsable",
  "area_tema",
  "resumen",
  "estado_preparacion",
  "fecha_presentacion",
  "estado_tramite",
  "tipo_autoria",
  "autor_principal",
];
for (const record of expected.records) {
  const project = targets.find((item) => item.id === record.id);
  if (!project) {
    errors.push(`${record.id}: ausente`);
    continue;
  }
  for (const field of fieldNames) {
    if (String(project[field] ?? "") !== String(record.project[field] ?? "")) {
      errors.push(`${record.id}: ${field} difiere`);
    }
  }
  if (JSON.stringify(project.comisiones) !== JSON.stringify(record.project.comisiones)) {
    errors.push(`${record.id}: comisiones difieren`);
  }
  if (!project.titulo?.trim() || !project.resumen?.trim() || !project.fecha_presentacion?.trim()) {
    errors.push(`${record.id}: faltan campos públicos obligatorios`);
  }
  const searchMatches = projects.filter(
    (item) => item.id.toLowerCase().includes(record.id.slice(4).toLowerCase()),
  );
  if (searchMatches.length !== 1 || searchMatches[0].id !== record.id) {
    errors.push(`${record.id}: búsqueda por número no es única`);
  }
}

const documentAudits = [];
for (const record of expected.records) {
  const downloadUrl = record.document.download_url.replace(/^https:\/\/ceciliagortari\.com\.ar/i, baseUrl);
  const previewUrl = record.document.preview_url.replace(/^https:\/\/ceciliagortari\.com\.ar/i, baseUrl);
  const download = await fetchBytes(downloadUrl);
  const preview = await fetchBytes(previewUrl);
  const localErrors = [];
  if (!download.ok) localErrors.push(`descarga HTTP ${download.status}`);
  if (!preview.ok) localErrors.push(`vista previa HTTP ${preview.status}`);
  if (!/^application\/pdf/i.test(download.content_type)) localErrors.push("descarga sin Content-Type PDF");
  if (!/^application\/pdf/i.test(preview.content_type)) localErrors.push("vista previa sin Content-Type PDF");
  if (download.header !== "%PDF-") localErrors.push("descarga sin cabecera PDF");
  if (preview.header !== "%PDF-") localErrors.push("vista previa sin cabecera PDF");
  if (download.sha256 !== record.document.sha256) localErrors.push("SHA-256 distinto del oficial");
  for (const error of localErrors) errors.push(`${record.id}: ${error}`);
  documentAudits.push({
    id: record.id,
    download_url: downloadUrl,
    preview_url: previewUrl,
    status: download.status,
    preview_status: preview.status,
    content_type: download.content_type,
    bytes: download.bytes.length,
    sha256: download.sha256,
    errors: localErrors,
  });
}

const { result: pressResponse, data: pressData } = await fetchJson(`${baseUrl}/content/prensa.json`);
const news = pressData.items.filter((item) => newsIds.includes(item.id));
if (news.length !== 4) errors.push(`Se esperaban 4 novedades y hay ${news.length}`);
const newsAudits = [];
for (const item of news) {
  const expectedProject = {
    "2026-08-05-informes-obras-publicas": "EXP-20211",
    "2026-08-05-regalias-yacyreta": "EXP-20212",
    "2026-08-05-simbolo-accesibilidad-universal": "EXP-20214",
    "2026-08-05-reforma-reglamento-comisiones": "EXP-20215",
  }[item.id];
  const localErrors = [];
  if (!item.cuerpo.includes(`/proyectos/?id=${expectedProject}`)) localErrors.push("sin enlace a ficha pública");
  if (!item.cuerpo.includes(`/api/projects/public/${expectedProject}/`)) localErrors.push("sin enlace al expediente");
  if (!item.documento.includes(`/api/projects/public/${expectedProject}/`)) localErrors.push("documento no corresponde");
  const image = await fetchBytes(new URL(item.imagen, `${baseUrl}/`).href);
  if (!image.ok || !/^image\//i.test(image.content_type) || image.bytes.length === 0) {
    localErrors.push("imagen pública inválida");
  }
  const detailUrl = `${baseUrl}/novedades/detalle/?id=${encodeURIComponent(item.id)}`;
  const detail = await fetchBytes(detailUrl);
  if (!detail.ok || !/^text\/html/i.test(detail.content_type)) localErrors.push("detalle público inválido");
  for (const error of localErrors) errors.push(`${item.id}: ${error}`);
  newsAudits.push({
    id: item.id,
    title: item.titulo,
    detail_url: detailUrl,
    project_url: `${baseUrl}/proyectos/?id=${expectedProject}`,
    document_url: new URL(item.documento, `${baseUrl}/`).href,
    image_url: image.url,
    image_status: image.status,
    image_content_type: image.content_type,
    image_bytes: image.bytes.length,
    errors: localErrors,
  });
}

const report = {
  audited_at: new Date().toISOString(),
  base_url: baseUrl,
  summary: {
    projects_api_status: projectsResponse.status,
    active_projects: projects.length,
    target_projects: targets.length,
    types: countBy(targets, "tipo"),
    authorship: countBy(targets, "tipo_autoria"),
    statuses: countBy(targets, "estado_tramite"),
    duplicate_ids: duplicateIds,
    pdf_downloads_verified: documentAudits.filter((item) => item.errors.length === 0).length,
    press_json_status: pressResponse.status,
    news_verified: newsAudits.filter((item) => item.errors.length === 0).length,
    errors: errors.length,
  },
  errors,
  documents: documentAudits,
  news: newsAudits,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.summary, null, 2));
if (errors.length) process.exitCode = 1;
