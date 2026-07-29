import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);

function argument(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const apply = args.includes("--apply");
const resume = args.includes("--resume");
const baseUrl = (argument("--base-url", "https://ceciliagortari.com.ar") || "").replace(/\/+$/, "");
const planPath = argument("--plan");
const backupDir = argument("--backup-dir");
const checkpointPath = argument("--checkpoint");
const batchSize = Number(argument("--batch-size", "10"));

if (!planPath || !backupDir || !checkpointPath) {
  throw new Error(
    "Uso: node actualizacion_proyectos_2026.mjs " +
      "--plan <import-plan.json> --backup-dir <respaldo> " +
      "--checkpoint <estado.json> [--batch-size 10] [--apply] [--resume]",
  );
}
if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 25) {
  throw new Error("--batch-size debe estar entre 1 y 25.");
}

const plan = JSON.parse(await readFile(planPath, "utf8"));
const backupSummary = JSON.parse(
  await readFile(path.join(backupDir, "backup-summary.json"), "utf8"),
);
const backupProjects = JSON.parse(
  await readFile(path.join(backupDir, "projects.json"), "utf8"),
);
const backupDocumentGroups = JSON.parse(
  await readFile(path.join(backupDir, "documents-metadata.json"), "utf8"),
);

if (
  backupSummary.projects !== backupProjects.length ||
  backupSummary.documents_failed !== 0 ||
  backupSummary.documents_empty !== 0 ||
  backupSummary.documents_downloaded !== backupSummary.documents_listed
) {
  throw new Error("El respaldo no supera las condiciones de integridad requeridas.");
}
if (plan.summary.total !== 143 || plan.summary.unique_expedientes !== 143) {
  throw new Error("El plan no contiene 143 expedientes únicos.");
}

let checkpoint;
if (resume) {
  checkpoint = JSON.parse(await readFile(checkpointPath, "utf8"));
  if (
    checkpoint.apply !== apply ||
    checkpoint.base_url !== baseUrl ||
    checkpoint.source_backup !== backupDir ||
    checkpoint.planned !== plan.records.length
  ) {
    throw new Error(
      "El punto de control no coincide con el modo, la URL, el respaldo o el plan.",
    );
  }
  checkpoint.resumed_at = [
    ...(checkpoint.resumed_at || []),
    new Date().toISOString(),
  ];
  checkpoint.errors ||= {};
  checkpoint.completed ||= {};
  checkpoint.batch_verifications ||= [];
} else {
  checkpoint = {
    started_at: new Date().toISOString(),
    apply,
    base_url: baseUrl,
    batch_size: batchSize,
    source_backup: backupDir,
    planned: plan.records.length,
    completed: {},
    errors: {},
    batch_verifications: [],
  };
}

async function saveCheckpoint() {
  checkpoint.updated_at = new Date().toISOString();
  await writeFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 1000) };
  }
  if (!response.ok) {
    const error = new Error(`${response.status} ${url}: ${JSON.stringify(data)}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function uploadFile(url, filePath, originalName, mimeType) {
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType }), originalName);
  return fetchJson(url, { method: "POST", body: form });
}

async function uploadMaterials(url, documents) {
  const form = new FormData();
  for (const document of documents) {
    const localPath = path.join(backupDir, document.local_path);
    const bytes = await readFile(localPath);
    form.append(
      "files",
      new Blob([bytes], {
        type: document.content_type || document.declared_mime_type || "application/octet-stream",
      }),
      document.original_name,
    );
  }
  return fetchJson(url, { method: "POST", body: form });
}

function comparableDocument(document) {
  return `${document.kind}|${document.original_name}|${Number(document.size_bytes || 0)}`;
}

async function processRecord(record) {
  const targetId = record.target_id;
  const projectUrl = `${baseUrl}/api/projects`;
  const targetDocsUrl = `${baseUrl}/api/projects/${encodeURIComponent(targetId)}/documents`;
  const now = new Date().toISOString();
  const project = { ...record.project, updated_at: now };

  if (!apply) {
    const officialBytes = await readFile(record.official_pdf);
    if (!officialBytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new Error(`PDF oficial inválido para ${targetId}`);
    }
    for (const document of record.legacy_documents || []) {
      const localPath = path.join(backupDir, document.local_path);
      await readFile(localPath);
    }
    return {
      target_id: targetId,
      dry_run: true,
      official_pdf_bytes: officialBytes.length,
      legacy_documents_checked: (record.legacy_documents || []).length,
    };
  }

  await fetchJson(projectUrl, {
    method: "POST",
    body: JSON.stringify(project),
  });

  let targetDocs = await fetchJson(targetDocsUrl);
  const legacyMain = (record.legacy_documents || []).find(
    (document) => document.kind === "main",
  );
  if (legacyMain && !targetDocs.main) {
    await uploadFile(
      `${targetDocsUrl}/main`,
      path.join(backupDir, legacyMain.local_path),
      legacyMain.original_name,
      legacyMain.content_type ||
        legacyMain.declared_mime_type ||
        "application/octet-stream",
    );
    targetDocs = await fetchJson(targetDocsUrl);
  }

  const legacyMaterials = (record.legacy_documents || []).filter(
    (document) =>
      document.kind === "material" &&
      !/^exp(?:te|ediente)[\s_.-]/i.test(document.original_name),
  );
  const targetMaterialKeys = new Set(
    (targetDocs.materials || []).map(comparableDocument),
  );
  const missingMaterials = legacyMaterials.filter(
    (document) =>
      !targetMaterialKeys.has(
        `material|${document.original_name}|${Number(document.bytes || document.declared_size_bytes || 0)}`,
      ),
  );
  if (missingMaterials.length > 0) {
    const materialResult = await uploadMaterials(
      `${targetDocsUrl}/materials`,
      missingMaterials,
    );
    if (materialResult.errors?.length) {
      throw new Error(
        `Fallaron materiales de ${targetId}: ${materialResult.errors.join("; ")}`,
      );
    }
    targetDocs = await fetchJson(targetDocsUrl);
  }

  const officialBytes = await readFile(record.official_pdf);
  const officialName = path.basename(record.official_pdf);
  const existingExpediente = targetDocs.expediente;
  if (
    !existingExpediente ||
    existingExpediente.original_name !== officialName ||
    Number(existingExpediente.size_bytes || 0) !== officialBytes.length
  ) {
    await uploadFile(
      `${targetDocsUrl}/expediente`,
      record.official_pdf,
      officialName,
      "application/pdf",
    );
    targetDocs = await fetchJson(targetDocsUrl);
  }

  if (
    !targetDocs.expediente ||
    targetDocs.expediente.original_name !== officialName ||
    Number(targetDocs.expediente.size_bytes || 0) !== officialBytes.length
  ) {
    throw new Error(`No se pudo verificar el expediente oficial de ${targetId}.`);
  }
  if (legacyMain && !targetDocs.main) {
    throw new Error(`No se pudo verificar el documento principal de ${targetId}.`);
  }

  if (record.legacy_id) {
    const active = await fetchJson(`${baseUrl}/api/projects`);
    if (active.some((item) => item.id === record.legacy_id)) {
      try {
        await fetchJson(
          `${baseUrl}/api/projects/${encodeURIComponent(record.legacy_id)}`,
          { method: "DELETE" },
        );
      } catch (error) {
        // Una reanudación concurrente puede haberlo retirado entre el GET y el
        // DELETE. En ese caso, el estado final buscado ya se alcanzó.
        if (error?.status !== 404) throw error;
      }
    }
  }

  return {
    target_id: targetId,
    legacy_id: record.legacy_id,
    main_migrated: Boolean(legacyMain),
    materials_migrated: missingMaterials.length,
    expediente: {
      id: targetDocs.expediente.id,
      original_name: targetDocs.expediente.original_name,
      size_bytes: targetDocs.expediente.size_bytes,
      sha256_local: createHash("sha256").update(officialBytes).digest("hex"),
    },
  };
}

async function verifyProductionStillMatchesBackup() {
  const liveProjects = await fetchJson(`${baseUrl}/api/projects`);
  const projectFields = [
    "id",
    "titulo",
    "updated_at",
    "has_main_doc",
    "materials_count",
    "has_expediente",
  ];
  const canonical = (project) =>
    projectFields.map((field) => `${field}=${String(project[field] ?? "")}`).join("|");
  const liveMap = new Map(liveProjects.map((project) => [project.id, canonical(project)]));
  const backupMap = new Map(
    backupProjects.map((project) => [project.id, canonical(project)]),
  );
  if (
    liveMap.size !== backupMap.size ||
    [...backupMap].some(([id, value]) => liveMap.get(id) !== value)
  ) {
    throw new Error(
      "Producción cambió desde el respaldo. Se requiere generar un respaldo nuevo antes de aplicar.",
    );
  }

  for (const group of backupDocumentGroups) {
    const live = await fetchJson(group.metadata_url);
    const flatten = (documents) =>
      [
        ...(documents.main ? [documents.main] : []),
        ...(documents.expediente ? [documents.expediente] : []),
        ...(documents.materials || []),
      ]
        .map(comparableDocument)
        .sort();
    if (JSON.stringify(flatten(live)) !== JSON.stringify(flatten(group))) {
      throw new Error(
        `Los documentos de ${group.project_id} cambiaron desde el respaldo.`,
      );
    }
  }
}

if (apply && !resume) {
  await verifyProductionStillMatchesBackup();
}

await saveCheckpoint();

for (let offset = 0; offset < plan.records.length; offset += batchSize) {
  const batch = plan.records.slice(offset, offset + batchSize);
  for (const record of batch) {
    if (
      resume &&
      checkpoint.completed[record.target_id] &&
      !checkpoint.errors[record.target_id]
    ) {
      continue;
    }
    try {
      checkpoint.completed[record.target_id] = await processRecord(record);
      delete checkpoint.errors[record.target_id];
    } catch (error) {
      checkpoint.errors[record.target_id] =
        error instanceof Error ? error.message : String(error);
    }
    await saveCheckpoint();
  }

  if (apply) {
    const active = await fetchJson(`${baseUrl}/api/projects`);
    const targetIds = new Set(plan.records.map((record) => record.target_id));
    const presentTargets = active.filter((project) => targetIds.has(project.id));
    const duplicateIds = active
      .map((project) => project.id)
      .filter((id, index, all) => all.indexOf(id) !== index);
    checkpoint.batch_verifications.push({
      through_record: Math.min(offset + batch.length, plan.records.length),
      active_projects: active.length,
      target_records_present: presentTargets.length,
      duplicate_ids: duplicateIds,
      errors_so_far: Object.keys(checkpoint.errors).length,
      verified_at: new Date().toISOString(),
    });
  } else {
    checkpoint.batch_verifications.push({
      through_record: Math.min(offset + batch.length, plan.records.length),
      local_records_checked: Object.keys(checkpoint.completed).length,
      errors_so_far: Object.keys(checkpoint.errors).length,
      verified_at: new Date().toISOString(),
    });
  }
  await saveCheckpoint();
}

// El único registro público no conciliado se conserva, pero deja de mostrarse
// como presentado hasta que exista una fuente oficial que permita clasificarlo.
if (apply) {
  for (const unmatched of plan.preserve_unmatched_project_ids || []) {
    const original = backupProjects.find((project) => project.id === unmatched.id_actual);
    if (!original) continue;
    await fetchJson(`${baseUrl}/api/projects`, {
      method: "POST",
      body: JSON.stringify({
        ...original,
        estado_preparacion: "Pendiente",
        fecha_presentacion: "",
        estado_tramite: "",
        updated_at: new Date().toISOString(),
      }),
    });
    checkpoint.completed[`preserved:${original.id}`] = {
      action: "moved_to_pending_without_deletion",
    };
  }
}

checkpoint.finished_at = new Date().toISOString();
checkpoint.success = Object.keys(checkpoint.errors).length === 0;
await saveCheckpoint();
console.log(
  JSON.stringify(
    {
      apply,
      planned: plan.records.length,
      completed: Object.keys(checkpoint.completed).length,
      errors: checkpoint.errors,
      success: checkpoint.success,
      checkpoint: checkpointPath,
    },
    null,
    2,
  ),
);

if (!checkpoint.success) {
  process.exitCode = 1;
}
