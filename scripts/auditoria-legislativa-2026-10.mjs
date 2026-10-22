import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import {
  parseFirmantes, participacionDesdeFirmantes, impulsoDesdeAutoria, separarComisiones, tipoCorto,
  normaDesdeTexto, fechaIso, enlaceOficial, normalizarNumero,
} from '../lib/legislativo.mjs';

// Auditoría D1 ↔ fuentes oficiales y generación del backfill de los nuevos campos parlamentarios.
// No escribe en D1: produce SQL revisable (migrations/0011 y 0012) y un informe en docs/.
// Uso: node scripts/auditoria-legislativa-2026-10.mjs [--snapshot <txt>] [--out <dir>]
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const prev = 'docs/legislative-update-2026-09-16';
const snapshotPath = option('--snapshot', 'docs/legislative-update-2026-10-22/d1-snapshot-2026-10-22.txt');
const outDir = option('--out', 'docs/legislative-update-2026-10-22');
const VERIFICADO = '2026-09-16'; // corte documental de las fichas y PDF oficiales relevados.

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const sha = (text) => createHash('sha256').update(text).digest('hex');
const fiches = await readJson(`${prev}/historical-fiches.json`);
const plan = await readJson(`${prev}/plan.json`);
const inventory = await readJson(`${prev}/inventory.json`);
const snapshotText = await readFile(snapshotPath, 'utf8');

const d1 = new Map();
for (const line of snapshotText.split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const [id, fecha, estado, autoria, main, exp, comisiones] = line.split('|');
  d1.set(id, { id, fecha, estado, autoria, main: Number(main), exp: Number(exp), comisiones: comisiones.split(';').filter(Boolean) });
}
assert.equal(d1.size, 203, 'La instantánea debe tener 203 registros públicos');

const field = (fiche, label) => (fiche.rows.find((r) => r[0] === label) || [])[1] || '';
const official = new Map();
for (const f of fiches) {
  official.set(f.id, {
    origen: 'ficha', numero: normalizarNumero(field(f, 'Expediente H.C.D.:')) || f.id.slice(4),
    tipo: field(f, 'Tipo de Proyecto:'), asunto: field(f, 'Asunto:'), firmantes: field(f, 'Autor/es:'),
    comision: field(f, 'Comisión:'), aprobacion: fechaIso(field(f, 'Aprobación:')),
    norma: field(f, 'Declaración:') ? { tipo: 'Declaración', numero: field(f, 'Declaración:') }
      : field(f, 'Resolución:') ? { tipo: 'Resolución', numero: field(f, 'Resolución:') } : null,
    enlace: f.url, pdfs: f.pdf_urls, fuente: 'Ficha oficial de la Cámara de Diputados',
  });
}
for (const r of plan.records) {
  official.set(`EXP-${r.expediente}`, {
    origen: 'plan', numero: r.expediente, tipo: tipoCorto(r.project.tipo), asunto: r.official_title,
    firmantes: r.official_authors, comision: r.project.comisiones.join(' - '),
    aprobacion: r.project.estado_tramite === 'Aprobado' ? r.project.fecha_presentacion : '',
    norma: normaDesdeTexto(r.project.resumen), enlace: r.official_page, pdfs: [r.official_pdf],
    fuente: `Informe oficial de sesión (${r.report}) y ficha oficial de la Cámara de Diputados`,
  });
}
const inv = new Map(inventory.map((i) => [`EXP-${i.expediente}`, i]));

const clave = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const singular = (k) => k.replace(/s$/, '');
function comparaComisiones(d1Comisiones, oficial) {
  const { comisiones, sobre_tablas } = separarComisiones(d1Comisiones);
  const oficialSobreTablas = /sobre\s*tablas/i.test(oficial);
  let resto = clave(oficial);
  const faltan = [];
  for (const c of comisiones) {
    const k = clave(c);
    if (resto.includes(k)) resto = resto.replace(k, '');
    else if (resto.includes(singular(k))) resto = resto.replace(singular(k), '');
    else faltan.push(c);
  }
  resto = resto.replace(/sobretablas/, '').replace(/^(y|e)+|(y|e)+$/g, '');
  const sobran = resto.replace(/y|e/g, '').length > 6 ? oficial : '';
  return { coincide: !faltan.length && !sobran && sobre_tablas === oficialSobreTablas, faltan, sobran, sobre_tablas };
}

const hallazgos = [];
const add = (id, tipo, detalle, accion) => hallazgos.push({ id, tipo, detalle, accion });
const registros = [];
const sqlStr = (v) => v == null || v === '' ? "''" : `'${String(v).replace(/'/g, "''")}'`;
const updates = [];
const respaldo = {};

for (const [id, r] of d1) {
  const o = official.get(id);
  const i = inv.get(id);
  const registro = { id, fecha: r.fecha, estado_d1: r.estado, autoria_d1: r.autoria };
  if (!o) {
    add(id, 'sin_expediente', 'Sin ficha ni expediente oficial localizado; la iniciativa consta en documentación interna.', 'Mantener publicado como antecedente; no inventar número.');
    registros.push({ ...registro, impulso: impulsoDesdeAutoria(r.autoria), participacion: '' });
    updates.push(`UPDATE projects SET impulso = CASE WHEN impulso IS NULL OR impulso IN ('', 'pendiente') THEN ${sqlStr(impulsoDesdeAutoria(r.autoria))} ELSE impulso END, impulso_nota = CASE WHEN impulso_nota IS NULL OR impulso_nota = '' THEN ${sqlStr(`Migrado desde tipo_autoria='${r.autoria}'. Sin expediente oficial localizado.`)} ELSE impulso_nota END WHERE id = ${sqlStr(id)} AND deleted_at IS NULL;`);
    continue;
  }
  const participacion = participacionDesdeFirmantes(o.firmantes);
  const impulso = impulsoDesdeAutoria(r.autoria);
  const firmantes = parseFirmantes(o.firmantes);
  const aprobadoOficial = Boolean(o.aprobacion || o.norma);
  Object.assign(registro, {
    numero: o.numero, tipo_oficial: o.tipo, firmantes: o.firmantes, participacion, impulso,
    aprobado_oficial: aprobadoOficial, norma: o.norma, enlace_oficial: o.enlace || enlaceOficial(o.numero),
  });

  if (aprobadoOficial && r.estado !== 'Aprobado') add(id, 'estado_desactualizado', `La fuente oficial registra aprobación (${o.aprobacion || 's/f'}) y D1 figura "${r.estado}".`, "Actualizar estado_tramite a 'Aprobado'.");
  if (!aprobadoOficial && r.estado === 'Aprobado') add(id, 'aprobacion_sin_respaldo', 'D1 figura "Aprobado" y la fuente relevada no registra fecha ni número de sanción.', 'Verificar en la ficha oficial antes de publicar el número de norma.');
  if (r.estado === 'Aprobado' && !o.norma) add(id, 'norma_sin_numero', 'Aprobado sin número de Declaración/Resolución en las fuentes relevadas.', 'Completar norma_numero al consultar la ficha oficial.');
  if (o.tipo && tipoCorto(o.tipo) !== tipoCorto(i ? i.type : o.tipo)) add(id, 'tipo_distinto', `Tipo oficial "${o.tipo}" ≠ tipo cargado "${i && i.type}".`, 'Revisar tipo.');
  if (o.norma && o.tipo && tipoCorto(o.norma.tipo) !== tipoCorto(o.tipo)) add(id, 'norma_tipo_distinto', `Proyecto de ${o.tipo} sancionado como ${o.norma.tipo} ${o.norma.numero} según la ficha oficial.`, 'Confirmar con la Cámara; se registra lo que consta en la ficha.');
  const cmp = comparaComisiones(r.comisiones, o.comision);
  if (!cmp.coincide) add(id, 'comisiones_diferentes', `D1: ${r.comisiones.join(' · ')} | Oficial: ${o.comision}`, 'Revisar giro a comisiones.');
  if (cmp.sobre_tablas) registro.sobre_tablas = true;
  if (firmantes.generico) add(id, 'firmantes_genericos', 'La ficha oficial consigna "Varios Señores Diputados" sin detallar firmantes.', 'Completar firmantes desde el PDF del expediente.');
  if (participacion === 'acompanamos' && r.autoria === 'propio') add(id, 'autoria_a_revisar', 'Clasificado como impulso propio y firmado junto a otros bloques.', 'Confirmar el impulso.');
  if (participacion === 'bloque' && r.autoria === 'acompanado') registro.impulso_pendiente = true;
  if (r.exp === 0) add(id, 'pdf_faltante', 'Sin PDF oficial del expediente en R2.', 'Cargar el PDF oficial.');
  if (r.exp > 1) add(id, 'pdf_duplicado', `${r.exp} registros de expediente con el mismo archivo.`, 'Eliminar el registro duplicado (migrations/0012).');
  const sancion = o.norma ? (o.pdfs || []).filter((u) => /\/(Dec|Res)[-_]?\d+/i.test(u)) : [];
  if (sancion.length) add(id, 'pdf_sancion_no_cargado', `PDF de la norma sancionada disponible en la Cámara: ${sancion.join(' ')}`, 'Descargar y adjuntar como documento adicional.');
  registros.push(registro);

  const nota = impulso === 'pendiente'
    ? `Migrado desde tipo_autoria='${r.autoria}': firma conjunta acreditada sin evidencia documental del impulso individual.`
    : `Migrado desde tipo_autoria='${r.autoria}' (clasificación interna documentada en actualizaciones previas).`;
  const sets = [
    ['numero_expediente', o.numero], ['titulo_oficial', o.asunto], ['firmantes', o.firmantes],
    ['participacion', participacion], ['enlace_oficial', o.enlace || enlaceOficial(o.numero)],
    ['fuente', o.fuente], ['verificado_at', VERIFICADO], ['impulso_nota', nota],
  ];
  if (o.norma) sets.push(['norma_tipo', tipoCorto(o.norma.tipo)], ['norma_numero', o.norma.numero]);
  if (o.aprobacion) sets.push(['fecha_aprobacion', o.aprobacion]);
  respaldo[id] = Object.fromEntries(sets.filter(([k, v]) => v && k !== 'impulso_nota'));
  const sql = sets.filter(([, v]) => v).map(([k, v]) => `${k} = CASE WHEN ${k} IS NULL OR ${k} = '' THEN ${sqlStr(v)} ELSE ${k} END`);
  sql.push(`impulso = CASE WHEN impulso IS NULL OR impulso IN ('', 'pendiente') THEN ${sqlStr(impulso)} ELSE impulso END`);
  updates.push(`UPDATE projects SET ${sql.join(', ')} WHERE id = ${sqlStr(id)} AND deleted_at IS NULL;`);
}

const duplicados = [
  ['EXP-20011', '045392e4-b9ba-449e-a1a2-2d995f0efe92'], ['EXP-20014', 'a74fbd46-5d84-487d-bc47-7b9bd7a30f5b'],
  ['EXP-20043', '4f2ce0fc-64c2-4a84-9cd2-39f694e47f88'], ['EXP-20056', 'abeca914-02a5-4f27-b2c9-7feddd729b80'],
  ['EXP-20067', '4a4272e9-5069-41c8-8243-0cf7c1d65cbc'], ['EXP-20084', '5794444f-67d4-44f1-ad5b-42e966ac8499'],
  ['EXP-20100', '48bd829d-4ebe-498a-be4f-253df675d6d9'], ['EXP-20116', '5852b45f-3c1a-4c12-8413-e195a063fa3a'],
  ['EXP-20117', '22e1ab7d-eef7-451e-85c5-f3889673c8a4'], ['EXP-20118', '0768538b-acb7-48f9-b0f0-6a77d6876304'],
  ['EXP-20119', '6a63010a-0abc-448a-bdbd-0a839d962f94'], ['EXP-20134', 'a92c548f-1111-4447-8ab1-5e7632f17df2'],
  ['EXP-20145', 'b713c926-7922-4a90-8931-0f42ee0c4ba8'], ['EXP-20176', '50f4e766-5486-485d-a2ae-ee64d7ad5b7d'],
  ['EXP-20192', '62bf6554-eef3-49e5-8c9c-7bb65a6c74fc'],
];
assert.equal(duplicados.length, [...d1.values()].filter((r) => r.exp > 1).length, 'Duplicados no coinciden con la instantánea');

const resumen = {
  generado: new Date().toISOString(), fuente_d1: snapshotPath, sha256_instantanea: sha(snapshotText),
  corte_fuentes_oficiales: VERIFICADO,
  totales: {
    publicos: d1.size, con_numero_oficial: registros.filter((r) => r.numero).length,
    firmados_solo_por_el_bloque: registros.filter((r) => r.participacion === 'bloque').length,
    firmados_con_otros_bloques: registros.filter((r) => r.participacion === 'acompanamos').length,
    impulso_cecilia: registros.filter((r) => r.impulso === 'cecilia').length,
    impulso_conjunto: registros.filter((r) => r.impulso === 'conjunto').length,
    impulso_pendiente: registros.filter((r) => r.impulso === 'pendiente').length,
    aprobados_d1: registros.filter((r) => r.estado_d1 === 'Aprobado').length,
    con_numero_de_norma: registros.filter((r) => r.norma).length,
    tratados_sobre_tablas: registros.filter((r) => r.sobre_tablas).length,
  },
  hallazgos_por_tipo: hallazgos.reduce((acc, h) => ({ ...acc, [h.tipo]: (acc[h.tipo] || 0) + 1 }), {}),
};

await mkdir(outDir, { recursive: true });
await writeFile(`${outDir}/auditoria.json`, JSON.stringify({ resumen, hallazgos, registros }, null, 2) + '\n');
const csv = [['id', 'numero', 'fecha', 'estado_d1', 'aprobado_oficial', 'norma', 'participacion', 'impulso', 'firmantes', 'enlace_oficial'].join(',')]
  .concat(registros.map((r) => [r.id, r.numero || '', r.fecha, r.estado_d1, r.aprobado_oficial ? 'si' : 'no',
    r.norma ? `${r.norma.tipo} ${r.norma.numero}` : '', r.participacion || '', r.impulso, r.firmantes || '', r.enlace_oficial || '']
    .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')));
await writeFile(`${outDir}/auditoria-expedientes.csv`, csv.join('\n') + '\n');

const header = (title) => `-- ${title}\n-- Generado por scripts/auditoria-legislativa-2026-10.mjs a partir de fuentes oficiales relevadas\n-- (corte ${VERIFICADO}) e instantánea D1 ${snapshotPath} (sha256 ${sha(snapshotText).slice(0, 16)}…).\n-- Solo completa campos vacíos: nunca sobrescribe datos cargados por el equipo. Idempotente.\n-- Requiere migrations/0010_campos_parlamentarios.sql aplicada antes.\n`;
await writeFile('migrations/0011_backfill_campos_parlamentarios.sql',
  `${header('0011 · Backfill de número de expediente, firmantes, participación, impulso, norma y fuente')}\n${updates.join('\n')}\n\n` +
  `-- Evita futuros expedientes duplicados entre registros activos.\nCREATE UNIQUE INDEX IF NOT EXISTS idx_projects_numero_expediente_unico\n  ON projects(numero_expediente) WHERE numero_expediente <> '' AND deleted_at IS NULL;\n`);
await writeFile('migrations/0012_limpieza_documentos_duplicados.sql',
  `${header('0012 · Elimina 15 registros duplicados de PDF de expediente (mismo nombre y tamaño, cargados con < 1 s de diferencia)')}` +
  `-- Conserva el registro más antiguo de cada par. Los objetos R2 huérfanos se listan en\n-- docs/legislative-update-2026-10-22/r2-objetos-duplicados.txt y se eliminan aparte, tras verificar su hash.\n\n` +
  duplicados.map(([pid, doc]) => `DELETE FROM project_documents WHERE id = '${doc}' AND project_id = '${pid}' AND kind = 'expediente'\n  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = '${pid}' AND k.kind = 'expediente' AND k.id <> '${doc}');`).join('\n') + '\n');
await writeFile('lib/datos-oficiales.mjs',
  `// Datos parlamentarios oficiales relevados (corte ${VERIFICADO}), generados por scripts/auditoria-legislativa-2026-10.mjs.\n` +
  '// La API los usa solo para completar campos vacíos mientras la base no tenga aplicada migrations/0011;\n' +
  '// los valores cargados en D1 siempre tienen prioridad.\n' +
  `export default {\n${Object.entries(respaldo).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n};\n`);
console.log(JSON.stringify(resumen, null, 2));
