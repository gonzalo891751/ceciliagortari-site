// Lectura de proyectos públicos desde D1. Funciona con el esquema anterior y posterior a
// migrations/0010: las columnas nuevas se detectan y, si faltan, se derivan de los datos existentes.
import {
  parseFirmantes, participacionDesdeFirmantes, impulsoDesdeAutoria, normalizarImpulso, normalizarParticipacion,
  grupoPublico, numeroDesdeId, normalizarNumero, enlaceOficial, separarComisiones, tipoCorto, grupoEstado,
  normaDesdeTexto,
} from './legislativo.mjs';
import DATOS_OFICIALES from './datos-oficiales.mjs';

const COLUMN_TTL_MS = 60_000;
const columnCache = new Map();

export async function getColumns(db, table) {
  const cached = columnCache.get(table);
  if (cached && Date.now() - cached.at < COLUMN_TTL_MS) return cached.columns;
  const { results } = await db.prepare(`PRAGMA table_info(${table})`).all();
  const columns = new Set((results || []).map((c) => c.name));
  columnCache.set(table, { at: Date.now(), columns });
  return columns;
}

const BASE_FIELDS = ['id', 'tipo', 'titulo', 'area_tema', 'resumen', 'fecha_presentacion', 'estado_tramite',
  'created_at', 'updated_at', 'tipo_autoria', 'autor_principal', 'comisiones'];
export const PARLIAMENTARY_FIELDS = ['numero_expediente', 'titulo_oficial', 'firmantes', 'participacion', 'impulso',
  'norma_tipo', 'norma_numero', 'fecha_aprobacion', 'enlace_oficial', 'fuente', 'verificado_at'];

const PUBLIC_WHERE = "p.estado_preparacion = 'Presentado' AND p.deleted_at IS NULL";

function selectList(columns) {
  return BASE_FIELDS.concat(PARLIAMENTARY_FIELDS).filter((f) => columns.has(f)).map((f) => `p.${f}`).join(', ');
}

const downloadUrl = (projectId, docId) =>
  `/api/projects/public/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(docId)}/download`;

function extension(name) {
  const m = /\.([a-z0-9]{2,5})$/i.exec(String(name || ''));
  return m ? m[1].toUpperCase() : '';
}

function publicDoc(projectId, doc, label) {
  return {
    id: doc.id,
    kind: doc.kind,
    nombre: doc.original_name,
    mime: doc.mime_type || '',
    formato: doc.mime_type === 'application/pdf' ? 'PDF' : extension(doc.original_name) || 'Archivo',
    bytes: doc.size_bytes || 0,
    etiqueta: label,
    url: downloadUrl(projectId, doc.id),
  };
}

/**
 * Documento principal: el marcado como principal; si no, el PDF oficial del expediente más antiguo;
 * el documento "main" solo se usa cuando no hay expediente (comportamiento previo del sitio).
 * Los adicionales son PDF oficiales no duplicados (por ejemplo, la norma sancionada).
 */
export function pickDocuments(projectId, docs) {
  const seen = new Set();
  const unique = [];
  for (const d of [...docs].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) {
    const key = `${d.kind}|${d.original_name}|${d.size_bytes}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(d);
  }
  const expedientes = unique.filter((d) => d.kind === 'expediente');
  const mains = unique.filter((d) => d.kind === 'main');
  const primary = unique.find((d) => Number(d.is_primary) === 1 && d.kind !== 'material')
    || expedientes.find((d) => d.mime_type === 'application/pdf')
    || expedientes[0]
    || mains.find((d) => d.mime_type === 'application/pdf')
    || mains[0]
    || null;
  if (!primary) return { documento: null, adicionales: [] };
  const adicionales = expedientes
    .filter((d) => d.id !== primary.id)
    .map((d) => publicDoc(projectId, d, d.public_label || 'Documento oficial adicional'));
  const label = primary.public_label || (primary.kind === 'expediente' ? 'Expediente oficial' : 'Texto del proyecto');
  return { documento: publicDoc(projectId, primary, label), adicionales };
}

/** Completa con los datos oficiales relevados solo los campos que la base todavía no tiene. */
function withOfficialData(row) {
  const oficial = DATOS_OFICIALES[row.id];
  if (!oficial) return row;
  const merged = { ...row };
  for (const [field, value] of Object.entries(oficial)) {
    if (merged[field] == null || merged[field] === '') merged[field] = value;
  }
  return merged;
}

export function normalizeProject(sourceRow, docs = []) {
  const row = withOfficialData(sourceRow);
  const numero = normalizarNumero(row.numero_expediente) || numeroDesdeId(row.id);
  const firmantes = row.firmantes || '';
  const participacion = normalizarParticipacion(row.participacion) || participacionDesdeFirmantes(firmantes);
  const impulso = row.impulso && row.impulso !== 'pendiente'
    ? normalizarImpulso(row.impulso)
    : impulsoDesdeAutoria(row.tipo_autoria);
  const { comisiones, sobre_tablas } = separarComisiones(row.comisiones);
  const normaTexto = row.norma_numero ? null : normaDesdeTexto(row.resumen);
  const norma = row.norma_numero
    ? { tipo: row.norma_tipo || tipoCorto(row.tipo), numero: row.norma_numero, fecha: row.fecha_aprobacion || '' }
    : normaTexto ? { ...normaTexto, fecha: row.fecha_aprobacion || '' } : null;
  const { documento, adicionales } = pickDocuments(row.id, docs);
  return {
    id: row.id,
    tipo: row.tipo,
    tipo_corto: tipoCorto(row.tipo),
    titulo: row.titulo,
    titulo_oficial: row.titulo_oficial || '',
    resumen: row.resumen || '',
    area_tema: row.area_tema || '',
    fecha_presentacion: row.fecha_presentacion || '',
    estado_tramite: row.estado_tramite || 'En comisiones',
    estado_grupo: grupoEstado(row.estado_tramite || 'En comisiones'),
    comisiones,
    sobre_tablas,
    numero_expediente: numero,
    enlace_oficial: row.enlace_oficial || enlaceOficial(numero),
    firmantes,
    firmantes_lista: parseFirmantes(firmantes).lista.map(({ nombre, bloque }) => ({ nombre, bloque })),
    participacion,
    impulso,
    grupo: grupoPublico(participacion, impulso),
    norma,
    fuente: row.fuente || (numero ? 'Cámara de Diputados de la Provincia de Corrientes' : ''),
    verificado_at: row.verificado_at || '',
    tipo_autoria: row.tipo_autoria || '',
    autor_principal: row.autor_principal || '',
    documento,
    documentos_adicionales: adicionales,
    has_expediente: docs.some((d) => d.kind === 'expediente') ? 1 : 0,
    has_main_doc: docs.some((d) => d.kind === 'main') ? 1 : 0,
  };
}

async function loadDocuments(db, projectId) {
  const docColumns = await getColumns(db, 'project_documents');
  const extra = ['is_primary', 'public_label'].filter((c) => docColumns.has(c)).map((c) => `, d.${c}`).join('');
  const sql = `SELECT d.id, d.project_id, d.kind, d.original_name, d.mime_type, d.size_bytes, d.created_at${extra}
    FROM project_documents d JOIN projects p ON p.id = d.project_id
    WHERE ${PUBLIC_WHERE} AND d.kind IN ('main', 'expediente')${projectId ? ' AND d.project_id = ?' : ''}`;
  const stmt = db.prepare(sql);
  const { results } = await (projectId ? stmt.bind(projectId) : stmt).all();
  const byProject = new Map();
  for (const doc of results || []) {
    if (!byProject.has(doc.project_id)) byProject.set(doc.project_id, []);
    byProject.get(doc.project_id).push(doc);
  }
  return byProject;
}

export async function loadPublicProjects(db) {
  const columns = await getColumns(db, 'projects');
  const [{ results }, docs] = await Promise.all([
    db.prepare(`SELECT ${selectList(columns)} FROM projects p WHERE ${PUBLIC_WHERE}
      ORDER BY p.fecha_presentacion DESC, p.id DESC`).all(),
    loadDocuments(db),
  ]);
  return (results || []).map((row) => normalizeProject(row, docs.get(row.id) || []));
}

export async function loadPublicProject(db, projectId) {
  const columns = await getColumns(db, 'projects');
  const row = await db.prepare(`SELECT ${selectList(columns)} FROM projects p WHERE p.id = ? AND ${PUBLIC_WHERE}`)
    .bind(projectId).first();
  if (!row) return null;
  const docs = await loadDocuments(db, projectId);
  return normalizeProject(row, docs.get(projectId) || []);
}
