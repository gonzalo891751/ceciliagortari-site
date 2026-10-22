import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  parseFirmantes, participacionDesdeFirmantes, tipoCorto, fechaIso, normalizarNumero, enlaceOficial,
  separarComisiones, HCD_BASE,
} from '../lib/legislativo.mjs';

// Sincroniza expedientes con las fichas oficiales de la Cámara a partir de un informe de sesión
// o de una lista de números. Solo lee: genera candidatos, un plan de altas para
// scripts/update-legislative-projects.mjs y SQL de actualización para revisar antes de aplicar.
//
// Uso:
//   node scripts/sincronizar-expedientes-hcd.mjs --informe Informe-14-10-26.pdf [--expedientes 20450,20451]
//        [--site https://ceciliagortari.com.ar] [--fichas fichas.json] [--out docs/actualizacion-AAAA-MM-DD]
//
// --informe     PDF oficial del informe (requiere pdftotext); se detectan expedientes del bloque.
// --expedientes Números a verificar aunque no figuren en el informe (aprobaciones, cambios de giro).
// --fichas      JSON con fichas ya descargadas [{id, url, rows, pdf_urls}] (modo sin conexión).
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const site = option('--site', 'https://ceciliagortari.com.ar');
const outDir = option('--out', `docs/actualizacion-${new Date().toISOString().slice(0, 10)}`);
const SURNAMES = /Gortari|Fern[aá]n?dez\s+Recalde|Canteros/i;

function numerosDesdeInforme(pdfPath) {
  const text = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  // Cada ítem del informe comienza con el número de expediente ("Expediente 20.413" o "20413").
  const blocks = text.split(/(?=\b(?:Expte\.?|Expediente)\s*(?:N[°º.]\s*)?\d{2}\.?\d{3}\b)/i);
  const found = new Map();
  for (const block of blocks) {
    const m = /\b(?:Expte\.?|Expediente)\s*(?:N[°º.]\s*)?(\d{2})\.?(\d{3})\b/i.exec(block);
    if (m && SURNAMES.test(block.slice(0, 1500))) found.set(m[1] + m[2], block.slice(0, 400).replace(/\s+/g, ' ').trim());
  }
  return found;
}

const ENTIDADES = { nbsp: ' ', amp: '&', quot: '"', lt: '<', gt: '>', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó',
  uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü',
  ordm: 'º', ordf: 'ª', deg: '°', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—' };

function textoPlano(html) {
  return html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTIDADES[name] ?? m)
    .replace(/\s+/g, ' ').trim();
}

/** Extrae filas etiqueta/valor de la ficha HTML (misma estructura que historical-fiches.json). */
function parseFicha(html, numero) {
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((tr) =>
    [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => textoPlano(c[1])).filter(Boolean))
    .filter((r) => r.length);
  const pdfs = [...new Set([...html.matchAll(/href="([^"]+\.pdf)"/gi)].map((m) => new URL(m[1], HCD_BASE).href))];
  return { id: `EXP-${numero}`, url: enlaceOficial(numero), rows, pdf_urls: pdfs };
}

function datosFicha(ficha) {
  const field = (label) => (ficha.rows.find((r) => r[0] === label) || [])[1] || '';
  const comisionTexto = field('Comisión:').replace(/\.$/, '');
  return {
    numero: normalizarNumero(field('Expediente H.C.D.:')) || ficha.id.slice(4),
    tipo: field('Tipo de Proyecto:'),
    asunto: field('Asunto:'),
    firmantes: field('Autor/es:'),
    comision_oficial: comisionTexto,
    presentacion: fechaIso(field('Presentado en Sesión H.C.D.:') || field('Ingreso H.C.D.:')),
    aprobacion: fechaIso(field('Aprobación:')),
    norma: field('Declaración:') ? { tipo: 'Declaración', numero: field('Declaración:') }
      : field('Resolución:') ? { tipo: 'Resolución', numero: field('Resolución:') }
        : field('Ley:') ? { tipo: 'Ley', numero: field('Ley:') } : null,
    enlace: ficha.url,
    pdfs: ficha.pdf_urls,
  };
}

async function obtenerFicha(numero) {
  const response = await fetch(enlaceOficial(numero), { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(45000) });
  assert(response.ok, `Ficha ${numero}: HTTP ${response.status}`);
  return parseFicha(await response.text(), numero);
}

const sql = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`;

const numeros = new Map();
if (option('--informe')) for (const [n, ctx] of numerosDesdeInforme(option('--informe'))) numeros.set(n, ctx);
for (const n of (option('--expedientes', '') || '').split(',').map(normalizarNumero).filter(Boolean)) {
  if (!numeros.has(n)) numeros.set(n, 'indicado manualmente');
}
assert(numeros.size, 'No hay expedientes para verificar (usá --informe y/o --expedientes).');

const fichasLocales = option('--fichas') ? JSON.parse(await readFile(option('--fichas'), 'utf8')) : [];
const publicos = await (await fetch(`${site}/api/projects/public?sync=${Date.now()}`, { signal: AbortSignal.timeout(45000) })).json();
const porId = new Map(publicos.map((p) => [p.id, p]));

const resultado = { generado: new Date().toISOString(), sitio: site, informe: option('--informe') || null, altas: [], cambios: [], sin_cambios: [], errores: [] };
const updates = [];
for (const [numero, contexto] of numeros) {
  try {
    const ficha = fichasLocales.find((f) => f.id === `EXP-${numero}`) || await obtenerFicha(numero);
    const o = datosFicha(ficha);
    assert(o.asunto, `Ficha ${numero} sin asunto: revisar formato de la página oficial`);
    const actual = porId.get(`EXP-${numero}`);
    if (!actual) {
      resultado.altas.push({
        expediente: numero, contexto_informe: contexto,
        project: {
          id: `EXP-${numero}`, tipo: `Proyecto de ${tipoCorto(o.tipo)}`, titulo: 'REVISAR: título público breve',
          responsable: 'Sin asignar', area_tema: 'REVISAR', resumen: o.asunto, estado_preparacion: 'Presentado',
          fecha_objetivo_presentacion: '', fecha_presentacion: o.presentacion, estado_tramite: o.aprobacion ? 'Aprobado' : 'En comisiones',
          action_plan: [], tipo_autoria: 'acompanado', autor_principal: '',
          comisiones: o.comision_oficial ? [o.comision_oficial] : [],
        },
        official_title: o.asunto, official_authors: o.firmantes, official_page: o.enlace,
        official_pdf: o.pdfs.find((u) => /Expte/i.test(u)) || o.pdfs[0] || '',
        participacion: participacionDesdeFirmantes(o.firmantes), impulso: 'pendiente',
        firmantes_bloque: parseFirmantes(o.firmantes).lista.filter((f) => f.bloque).map((f) => f.nombre),
        authorship_evidence: [], authorship_decision: 'Pendiente de clasificación interna del impulso.',
        nota: 'Separar comisiones y completar título y área antes de usar este registro como plan.',
      });
      continue;
    }
    const cambios = {};
    if (o.aprobacion && actual.estado_grupo !== 'aprobado') cambios.estado_tramite = 'Aprobado';
    if (o.aprobacion && (!actual.norma || !actual.norma.fecha)) cambios.fecha_aprobacion = o.aprobacion;
    if (o.norma && (!actual.norma || actual.norma.numero !== o.norma.numero)) Object.assign(cambios, { norma_tipo: o.norma.tipo, norma_numero: o.norma.numero });
    if (o.firmantes && actual.firmantes !== o.firmantes) cambios.firmantes = o.firmantes;
    const { comisiones } = separarComisiones(actual.comisiones);
    const clave = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const faltantes = comisiones.filter((c) => !clave(o.comision_oficial).includes(clave(c).replace(/s$/, '')));
    if (faltantes.length || (!comisiones.length && o.comision_oficial && !/sobre\s*tablas/i.test(o.comision_oficial))) {
      cambios._revisar_comisiones = `Sitio: ${comisiones.join(' · ') || '(sin comisión)'} | Oficial: ${o.comision_oficial}`;
    }
    const aplicables = Object.entries(cambios).filter(([k]) => !k.startsWith('_'));
    if (!Object.keys(cambios).length) { resultado.sin_cambios.push(numero); continue; }
    resultado.cambios.push({ expediente: numero, id: actual.id, cambios });
    if (aplicables.length) {
      const sets = aplicables.map(([k, v]) => `${k} = ${sql(v)}`)
        .concat([`verificado_at = ${sql(new Date().toISOString().slice(0, 10))}`, `updated_at = ${sql(new Date().toISOString())}`]);
      updates.push(`-- ${actual.id}: ${actual.titulo}\nUPDATE projects SET ${sets.join(', ')} WHERE id = ${sql(actual.id)} AND deleted_at IS NULL;`);
    }
  } catch (err) {
    resultado.errores.push({ expediente: numero, error: err.message });
  }
}

await mkdir(outDir, { recursive: true });
await writeFile(`${outDir}/sincronizacion.json`, JSON.stringify(resultado, null, 2) + '\n');
await writeFile(`${outDir}/plan-altas.json`, JSON.stringify({ cutoff: new Date().toISOString().slice(0, 10), base_url: site, records: resultado.altas }, null, 2) + '\n');
await writeFile(`${outDir}/actualizaciones.sql`,
  '-- Revisar cada sentencia contra la ficha oficial antes de aplicar.\n' +
  `-- npx wrangler d1 execute gestionproyectos --remote --file=${outDir}/actualizaciones.sql\n\n` + updates.join('\n\n') + '\n');
console.log(JSON.stringify({ altas: resultado.altas.length, cambios: resultado.cambios.length, sin_cambios: resultado.sin_cambios.length, errores: resultado.errores }, null, 2));
