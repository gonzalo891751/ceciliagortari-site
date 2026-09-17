import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// D1 and R2 remain the source of truth. This tool uses the existing Pages API.
// Dry-run is the default; --apply explicitly publishes a previously audited plan.
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const planPath = option('--plan', 'docs/legislative-update-2026-09-16/plan.json');
const backupDir = option('--backup-dir');
const officialDir = option('--official-dir');
const outputPath = option('--output');
assert(backupDir && officialDir && outputPath,
  'Required: --backup-dir <verified backup> --official-dir <PDFs> --output <result.json>');
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const plan = await readJson(planPath);
const backup = await readJson(path.join(backupDir, 'projects.json'));
const documents = await readJson(path.join(backupDir, 'documents-manifest.json'));
const summary = await readJson(path.join(backupDir, 'summary.json'));
const base = plan.base_url;
assert.equal(base, 'https://ceciliagortari.com.ar', 'Unexpected destination');
const apply = args.includes('--apply');
const auditOnly = args.includes('--audit');
assert(!(apply && auditOnly), 'Choose --apply or --audit');
const result = { started_at: new Date().toISOString(), mode: auditOnly ? 'audit' : apply ? 'apply' : 'dry-run',
  plan_sha256: hash(await readFile(planPath)), records: [], errors: [] };

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options, headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json',
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers }, signal: AbortSignal.timeout(60000),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(response.ok, `${response.status} ${url}: ${bytes.toString('utf8', 0, 200)}`);
  return { bytes, response };
}
async function json(url, options) { return JSON.parse((await request(url, options)).bytes.toString('utf8')); }
const save = () => writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
const writableFields = ['id', 'tipo', 'titulo', 'responsable', 'area_tema', 'resumen', 'estado_preparacion',
  'fecha_objetivo_presentacion', 'fecha_presentacion', 'estado_tramite', 'tipo_autoria', 'autor_principal', 'comisiones', 'action_plan'];
const projectValues = p => Object.fromEntries(writableFields.map(k => [k, p[k]]));

async function validate() {
  assert.equal(summary.projects, backup.length);
  assert.equal(summary.documents, documents.length);
  assert.equal(summary.empty, 0);
  assert(summary.success);
  for (const doc of documents) {
    const bytes = await readFile(path.join(backupDir, doc.local_path));
    assert.equal(bytes.length, doc.bytes, `Backup size: ${doc.id}`);
    assert.equal(hash(bytes), doc.sha256, `Backup hash: ${doc.id}`);
  }
  const ids = new Set();
  for (const record of plan.records) {
    const p = record.project;
    assert.match(record.expediente, /^\d{5}$/);
    assert.equal(p.id, `EXP-${record.expediente}`);
    assert(!ids.has(p.id), `Duplicate expediente: ${p.id}`);
    assert(!backup.some(old => old.id === p.id), `Plan must contain only new records: ${p.id}`);
    ids.add(p.id);
    assert(['Proyecto de Ley', 'Proyecto de Resolución', 'Proyecto de Declaración'].includes(p.tipo));
    assert(['coautoria', 'acompanado'].includes(p.tipo_autoria), 'No unsupported exclusive authorship');
    assert(p.tipo_autoria !== 'coautoria' || record.authorship_evidence.length);
    assert(p.titulo.trim() && p.resumen.trim() && p.area_tema.trim());
    assert.match(p.fecha_presentacion, /^2026-\d{2}-\d{2}$/);
    assert(p.fecha_presentacion <= plan.cutoff);
    assert.equal(new Date(p.fecha_presentacion).toISOString().slice(0, 10), p.fecha_presentacion);
    assert(p.comisiones.length && new Set(p.comisiones).size === p.comisiones.length);
    assert.equal(record.official_page, `https://hcdcorrientes.gov.ar/expedientes/${record.expediente}/`);
    assert.equal(new URL(record.official_pdf).hostname, 'hcdcorrientes.gov.ar');
    const bytes = await readFile(path.join(officialDir, record.pdf_filename));
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.equal(bytes.length, record.pdf_bytes);
    assert.equal(hash(bytes), record.pdf_sha256);
  }
  result.backup = summary;
  result.validated_records = ids.size;
}

function preservePrevious(live) {
  for (const before of backup) {
    const after = live.find(p => p.id === before.id);
    assert(after, `Previous project missing: ${before.id}`);
    assert.deepEqual(after, before, `Concurrent change: ${before.id}; refresh backup before continuing`);
  }
  assert.equal(new Set(live.map(p => p.id)).size, live.length, 'Duplicate IDs');
}

async function publish(record) {
  const p = record.project;
  const live = await json(`${base}/api/projects`);
  preservePrevious(live);
  const existing = live.find(x => x.id === p.id);
  if (existing) {
    const normalized = { ...projectValues(existing), estado_preparacion: 'Presentado' };
    assert.deepEqual(normalized, p, `Existing target differs from plan: ${p.id}`);
  }
  const timestamp = new Date().toISOString();
  const payload = { ...p, created_at: existing?.created_at || timestamp, updated_at: timestamp };
  if (!existing) {
    // Publish only after the official document has been uploaded and checked.
    await json(`${base}/api/projects`, { method: 'POST', body: JSON.stringify({ ...payload, estado_preparacion: 'Pendiente' }) });
  }
  const docUrl = `${base}/api/projects/${p.id}/documents`;
  let metadata = await json(docUrl);
  let uploaded = false;
  if (!metadata.expediente) {
    const bytes = await readFile(path.join(officialDir, record.pdf_filename));
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: 'application/pdf' }), `EXPTE-${record.expediente}.pdf`);
    await json(`${docUrl}/expediente`, { method: 'POST', body: form });
    metadata = await json(docUrl);
    uploaded = true;
  }
  assert(metadata.expediente, `Missing uploaded document: ${p.id}`);
  const checked = await request(`${docUrl}/${metadata.expediente.id}/download`);
  assert.equal(hash(checked.bytes), record.pdf_sha256, `Remote document mismatch: ${p.id}`);
  if (existing?.estado_preparacion !== 'Presentado') {
    await json(`${base}/api/projects`, { method: 'POST', body: JSON.stringify(payload) });
  }
  return { id: p.id, action: existing ? 'unchanged-or-resumed' : 'created', uploaded,
    document_id: metadata.expediente.id, sha256: record.pdf_sha256 };
}

async function audit() {
  const live = await json(`${base}/api/projects`);
  preservePrevious(live);
  assert.equal(live.length, backup.length + plan.records.length, 'Unexpected active project count');
  const publicProjects = await json(`${base}/api/projects/public?audit=${Date.now()}`);
  const expectedPublic = backup.filter(p => p.estado_preparacion === 'Presentado').length + plan.records.length;
  assert.equal(publicProjects.length, expectedPublic);
  const publicIds = new Set(publicProjects.map(p => p.id));
  assert.equal(publicIds.size, publicProjects.length);
  for (let i = 1; i < publicProjects.length; i++) {
    assert(publicProjects[i - 1].fecha_presentacion >= publicProjects[i].fecha_presentacion, 'Chronology is not descending');
  }
  for (const record of plan.records) {
    const p = live.find(x => x.id === record.project.id);
    assert(p, `Missing new project: ${record.project.id}`);
    assert.deepEqual(projectValues(p), record.project);
    assert(publicIds.has(p.id), `Not public: ${p.id}`);
    const detail = await json(`${base}/api/projects/public/${p.id}?audit=${Date.now()}`);
    const metadata = await json(`${base}/api/projects/${p.id}/documents`);
    assert(metadata.expediente, `Missing expediente: ${p.id}`);
    assert.equal(detail.id, p.id, 'Incorrect public detail');
    assert.equal(detail.document?.id, metadata.expediente.id, 'Official PDF is not prioritized');
    const root = `${base}/api/projects/public/${p.id}/documents/${metadata.expediente.id}`;
    for (const route of ['download', 'preview']) {
      const { bytes, response } = await request(`${root}/${route}`);
      assert.match(response.headers.get('content-type') || '', /application\/pdf/);
      assert.equal(hash(bytes), record.pdf_sha256, `${route} differs: ${p.id}`);
    }
    result.records.push({ id: p.id, detail: 200, download: 200, preview: 200, sha256: record.pdf_sha256 });
    await save();
  }
  // Check every previous public document against the pre-update backup too.
  let previousDocuments = 0;
  for (const p of backup.filter(p => p.estado_preparacion === 'Presentado')) {
    const doc = documents.find(d => d.project_id === p.id && d.kind === 'expediente') ||
      documents.find(d => d.project_id === p.id && d.kind === 'main');
    assert(doc, `Previous public project has no document: ${p.id}`);
    const { bytes } = await request(`${base}/api/projects/public/${p.id}/documents/${doc.id}/download`);
    assert.equal(hash(bytes), doc.sha256, `Historical document changed: ${p.id}`);
    previousDocuments++;
  }
  result.audit = { active_projects: live.length, public_projects: publicProjects.length,
    new_projects: plan.records.length, previous_projects_preserved: backup.length,
    previous_public_documents_verified: previousDocuments, duplicate_ids: 0, chronology: 'descending' };
}

try {
  await validate();
  preservePrevious(await json(`${base}/api/projects`));
  if (auditOnly) await audit();
  else if (apply) {
    for (const record of plan.records) {
      result.records.push(await publish(record));
      await save();
      console.log(`${result.records.length}/${plan.records.length} ${record.project.id}`);
    }
  }
  result.success = true;
} catch (error) {
  result.success = false;
  result.errors.push(error.message);
  process.exitCode = 1;
}
result.finished_at = new Date().toISOString();
await save();
console.log(JSON.stringify({ ...result, records: result.records.length }, null, 2));
