import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import DATOS_OFICIALES from '../lib/datos-oficiales.mjs';
import { participacionDesdeFirmantes, enlaceOficial } from '../lib/legislativo.mjs';

// Concilia la auditoría preliminar (expedientes hallados en informes de sesión) con D1.
// Solo lee: produce el reporte de conciliación y la migración 0013 con las altas,
// que inserta sin sobrescribir (ON CONFLICT DO NOTHING). Requiere 0010 aplicada.
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const dir = 'docs/legislative-update-2026-10-22';
const auditPath = option('--auditoria', `${dir}/auditoria-preliminar-49.json`);
const snapshotPath = option('--snapshot', `${dir}/d1-snapshot-2026-10-22.txt`);
const now = option('--fecha', new Date().toISOString());

const audit = JSON.parse(await readFile(auditPath, 'utf8'));
const d1 = new Map((await readFile(snapshotPath, 'utf8')).split('\n').filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('|')).map(([id, fecha, estado, autoria, , , comisiones]) =>
    [id, { fecha, estado, autoria, comisiones: comisiones.split(';').filter(Boolean) }]));

const TIPO = { Ley: 'Proyecto de Ley', 'Resolución': 'Proyecto de Resolución', 'Declaración': 'Proyecto de Declaración' };
const fechaCorta = (iso) => iso.split('-').reverse().join('/');
const sql = (v) => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const igualesSinOrden = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

const reporte = { generado: now, auditoria: auditPath, instantanea_d1: snapshotPath,
  existentes_coinciden: [], existentes_con_diferencias: [], altas: [], pendientes_de_verificacion: [] };
const inserts = [];

for (const e of audit.expedientes) {
  assert.match(e.numero, /^\d{5}$/);
  assert(TIPO[e.tipo], `Tipo desconocido: ${e.tipo}`);
  const id = `EXP-${e.numero}`;
  const firmantes = `Dips. ${e.firmantes}.`;
  const comisiones = e.sobre_tablas ? ['Sobre Tablas'] : e.comisiones;
  const estado = e.norma ? 'Aprobado' : 'En comisiones';
  const actual = d1.get(id);
  if (actual) {
    const oficial = DATOS_OFICIALES[id] || {};
    const diferencias = [];
    if (actual.estado !== estado) diferencias.push(`estado: D1 "${actual.estado}" / informe "${estado}"`);
    if (!igualesSinOrden(actual.comisiones, comisiones)) diferencias.push(`comisiones: D1 "${actual.comisiones.join(' · ')}" / informe "${comisiones.join(' · ')}"`);
    if (e.norma && oficial.norma_numero !== e.norma) diferencias.push(`norma: D1 "${oficial.norma_numero || '—'}" / informe "${e.norma}"`);
    if (actual.fecha !== e.sesion) diferencias.push(`fecha: D1 ${actual.fecha} / informe ${e.sesion}`);
    if (oficial.firmantes && participacionDesdeFirmantes(oficial.firmantes) !== participacionDesdeFirmantes(firmantes)) diferencias.push('firmantes');
    (diferencias.length ? reporte.existentes_con_diferencias : reporte.existentes_coinciden)
      .push(diferencias.length ? { id, diferencias } : id);
    continue;
  }

  const notas = [];
  if (e.adjuntos) notas.push(`Tramita junto a ${e.adjuntos.length > 1 ? 'los expedientes' : 'el expediente'} ${e.adjuntos.join(' y ')}.`);
  if (e.mismo_tema) notas.push(`Mismo tema que el expediente ${e.mismo_tema.join(' y ')}.`);
  const informe = audit.informes[e.sesion];
  const fuente = `Informe oficial de la sesión del ${fechaCorta(e.sesion)} (${informe}).${notas.length ? ' ' + notas.join(' ') : ''}`;
  const participacion = participacionDesdeFirmantes(firmantes);
  const fila = {
    id, tipo: TIPO[e.tipo], titulo: e.asunto, resumen: '', area_tema: '', responsable: 'Sin asignar',
    estado_preparacion: 'Presentado', fecha_objetivo_presentacion: '', fecha_presentacion: e.sesion,
    estado_tramite: estado, created_at: now, updated_at: now, action_plan: '[]', tipo_autoria: 'acompanado',
    autor_principal: '', comisiones: JSON.stringify(comisiones), numero_expediente: e.numero, titulo_oficial: '',
    firmantes, participacion, impulso: 'pendiente',
    impulso_nota: 'Alta desde informe oficial de sesión (auditoría preliminar 22/10/2026); impulso sin clasificar.',
    norma_tipo: e.norma ? e.tipo : '', norma_numero: e.norma || '', fecha_aprobacion: e.norma ? e.sesion : '',
    enlace_oficial: enlaceOficial(e.numero), fuente, verificado_at: '',
  };
  const columnas = Object.keys(fila);
  inserts.push(`-- ${id} · ${e.tipo} · ${e.asunto}\nINSERT INTO projects (${columnas.join(', ')})\n  VALUES (${columnas.map((c) => sql(fila[c])).join(', ')})\n  ON CONFLICT(id) DO NOTHING;`);
  reporte.altas.push({ id, sesion: e.sesion, tipo: e.tipo, estado, norma: e.norma, comisiones, participacion });
  reporte.pendientes_de_verificacion.push({ id, falta: ['título oficial (Asunto) de la ficha', 'PDF oficial del expediente', 'clasificación del impulso'] });
}

reporte.resumen = {
  total_auditoria: audit.expedientes.length,
  ya_cargados_y_coincidentes: reporte.existentes_coinciden.length,
  ya_cargados_con_diferencias: reporte.existentes_con_diferencias.length,
  altas: reporte.altas.length,
  altas_aprobadas: reporte.altas.filter((a) => a.estado === 'Aprobado').length,
  altas_en_comision: reporte.altas.filter((a) => a.estado === 'En comisiones').length,
  altas_con_otros_bloques: reporte.altas.filter((a) => a.participacion === 'acompanamos').map((a) => a.id),
};
await writeFile(`${dir}/conciliacion-auditoria-preliminar.json`, JSON.stringify(reporte, null, 2) + '\n');
await writeFile('migrations/0013_altas_sesiones_2026-09-23_y_2026-10-14.sql',
  `-- 0013 · Altas de ${reporte.altas.length} expedientes de las sesiones del 23/09 y 14/10/2026\n` +
  `-- Generado por scripts/conciliar-auditoria-preliminar.mjs desde ${auditPath}.\n` +
  '-- Fuente: informes oficiales de sesión. Quedan pendientes el título oficial, el PDF (se carga desde el panel)\n' +
  '-- y la clasificación del impulso. Requiere migrations/0010 aplicada. No sobrescribe registros existentes.\n' +
  '-- Sin PDF, el sitio muestra el acceso a la ficha oficial de la Cámara en lugar del botón de descarga.\n\n' +
  inserts.join('\n\n') + '\n');
console.log(JSON.stringify(reporte.resumen, null, 2));
if (reporte.existentes_con_diferencias.length) console.log(JSON.stringify(reporte.existentes_con_diferencias, null, 2));
