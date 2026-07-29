import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const baseUrl = "https://ceciliagortari.com.ar";
const planPath = process.argv[2] || "work/import-plan.json";
const outputPath = process.argv[3] || "work/evidencia-produccion.json";
const plan = JSON.parse(await readFile(planPath, "utf8"));

async function fetchChecked(url, asJson = true) {
  const response = await fetch(url, { redirect: "follow" });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) {
    throw new Error(`${response.status} ${url}: ${bytes.toString("utf8", 0, 500)}`);
  }
  return asJson ? JSON.parse(bytes.toString("utf8")) : { response, bytes };
}

const live = await fetchChecked(`${baseUrl}/api/projects`);
const liveById = new Map(live.map((project) => [project.id, project]));
const targetIds = new Set(plan.records.map((record) => record.target_id));
const targets = live.filter((project) => targetIds.has(project.id));
const errors = [];
const fields = [
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

for (const record of plan.records) {
  const project = liveById.get(record.target_id);
  if (!project) {
    errors.push(`${record.target_id}: ausente`);
    continue;
  }
  for (const field of fields) {
    if (String(project[field] ?? "") !== String(record.project[field] ?? "")) {
      errors.push(
        `${record.target_id}: ${field} difiere (${JSON.stringify(project[field])} != ${JSON.stringify(record.project[field])})`,
      );
    }
  }
}

async function auditDocument(record) {
  const docsUrl = `${baseUrl}/api/projects/${encodeURIComponent(record.target_id)}/documents`;
  const docs = await fetchChecked(docsUrl);
  if (!docs.expediente) {
    return { id: record.target_id, errors: ["expediente ausente"] };
  }
  const publicDownloadUrl =
    `${baseUrl}/api/projects/public/${encodeURIComponent(record.target_id)}` +
    `/documents/${encodeURIComponent(docs.expediente.id)}/download`;
  const { response, bytes } = await fetchChecked(
    publicDownloadUrl,
    false,
  );
  const localBytes = await readFile(record.official_pdf);
  const remoteHash = createHash("sha256").update(bytes).digest("hex");
  const localHash = createHash("sha256").update(localBytes).digest("hex");
  const localErrors = [];
  if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    localErrors.push("cabecera PDF inválida");
  }
  if (remoteHash !== localHash) {
    localErrors.push("SHA-256 remoto distinto del oficial descargado");
  }
  if (Number(docs.expediente.size_bytes) !== bytes.length) {
    localErrors.push("tamaño declarado distinto del descargado");
  }
  return {
    id: record.target_id,
    url: publicDownloadUrl,
    status: response.status,
    content_type: response.headers.get("content-type") || "",
    bytes: bytes.length,
    sha256: remoteHash,
    main_present: Boolean(docs.main),
    materials: (docs.materials || []).length,
    errors: localErrors,
  };
}

const documentAudits = [];
for (let offset = 0; offset < plan.records.length; offset += 8) {
  const results = await Promise.all(
    plan.records.slice(offset, offset + 8).map(auditDocument),
  );
  documentAudits.push(...results);
}
for (const item of documentAudits) {
  for (const error of item.errors) errors.push(`${item.id}: ${error}`);
}

const idCounts = new Map();
for (const project of live) {
  idCounts.set(project.id, (idCounts.get(project.id) || 0) + 1);
}
const duplicateIds = [...idCounts].filter(([, count]) => count > 1);
const unmatched = liveById.get("P-0067");
if (
  !unmatched ||
  !["Pendiente", "En trabajo"].includes(unmatched.estado_preparacion) ||
  unmatched.fecha_presentacion
) {
  errors.push("P-0067 no quedó preservado como no presentado y sin fecha");
}

const evidence = {
  audited_at: new Date().toISOString(),
  base_url: baseUrl,
  source_plan: planPath,
  summary: {
    active_projects: live.length,
    planned_targets: plan.records.length,
    targets_present: targets.length,
    targets_presented: targets.filter(
      (project) => project.estado_preparacion === "Presentado",
    ).length,
    targets_with_expediente: targets.filter((project) => project.has_expediente).length,
    target_types: Object.fromEntries(
      [...new Set(targets.map((project) => project.tipo))].sort().map((type) => [
        type,
        targets.filter((project) => project.tipo === type).length,
      ]),
    ),
    target_authorship: Object.fromEntries(
      [...new Set(targets.map((project) => project.tipo_autoria))].sort().map((type) => [
        type,
        targets.filter((project) => project.tipo_autoria === type).length,
      ]),
    ),
    empty_titles: targets.filter((project) => !project.titulo?.trim()).length,
    empty_summaries: targets.filter((project) => !project.resumen?.trim()).length,
    empty_dates: targets.filter((project) => !project.fecha_presentacion?.trim()).length,
    duplicate_ids: duplicateIds,
    downloaded_expedientes_verified: documentAudits.length,
    unmatched_preserved_pending: Boolean(unmatched),
    errors: errors.length,
  },
  unmatched_preserved: unmatched,
  errors,
  documents: documentAudits,
};

await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify(evidence.summary, null, 2));
if (errors.length) process.exitCode = 1;
