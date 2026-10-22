// Reglas compartidas de la actividad legislativa (API pública, panel y scripts).
// Distinguen dos conceptos que no deben confundirse:
//   - firmantes / participación: autoría parlamentaria formal, según el expediente oficial.
//   - impulso: origen político de la iniciativa, según la clasificación interna del equipo.

export const HCD_BASE = 'https://hcdcorrientes.gov.ar';

export const BLOQUE = [
  { clave: 'gortari', apellido: 'Gortari', nombre: 'Cecilia Gortari', impulso: 'cecilia' },
  { clave: 'fernandezrecalde', apellido: 'Fernández Recalde', nombre: 'Emiliano Fernández Recalde', impulso: 'emiliano' },
  { clave: 'canteros', apellido: 'Canteros', nombre: 'Gustavo Canteros', impulso: 'gustavo' },
];

// Variantes ortográficas observadas en fichas oficiales de la Cámara.
const ALIAS = { fernadezrecalde: 'fernandezrecalde', fernandezrecalda: 'fernandezrecalde' };

export const IMPULSOS = {
  cecilia: 'Impulsado por Cecilia Gortari',
  emiliano: 'Impulsado por Emiliano Fernández Recalde',
  gustavo: 'Impulsado por Gustavo Canteros',
  conjunto: 'Elaboración conjunta',
  otros: 'Iniciativa de otros diputados',
  pendiente: 'Pendiente de clasificación interna',
};

export const PARTICIPACIONES = {
  bloque: 'Firmado solo por integrantes del bloque',
  acompanamos: 'Firmado junto a diputados de otros bloques',
};

export const ESTADOS_TRAMITE = [
  'En comisiones', 'Con despacho de comisión', 'Media sanción', 'Aprobado', 'Sancionado', 'Archivado', 'Retirado',
];

const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const clave = (s) => sinAcentos(s).toLowerCase().replace(/[^a-z]/g, '');

const CONECTORES = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

function capitalizar(nombre) {
  return nombre.split(/\s+/).filter(Boolean).map((parte, i) => {
    const lower = parte.toLowerCase();
    if (i > 0 && CONECTORES.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

/** Interpreta la cadena oficial de autores ("Dips. Canteros, Fernández Recalde y Gortari."). */
export function parseFirmantes(raw) {
  const texto = String(raw || '').trim();
  if (!texto) return { lista: [], generico: false };
  if (/varios/i.test(texto)) return { lista: [], generico: true };
  const limpio = texto.replace(/^\s*(dips?|diputad[oa]s?)\.?\s*/i, '').replace(/\.\s*$/, '');
  const partes = limpio.split(/\s*,\s*|\s+-\s+|\s+y\s+/).map((p) => p.trim()).filter(Boolean);
  const lista = [];
  for (const parte of partes) {
    const k = ALIAS[clave(parte)] || clave(parte);
    const miembro = BLOQUE.find((m) => m.clave === k);
    const item = miembro
      ? { apellido: miembro.apellido, nombre: miembro.nombre, bloque: true, impulso: miembro.impulso }
      : { apellido: capitalizar(parte), nombre: capitalizar(parte), bloque: false };
    if (!lista.some((x) => x.apellido === item.apellido)) lista.push(item);
  }
  return { lista, generico: false };
}

/** 'bloque' si todos los firmantes integran el bloque; 'acompanamos' si hay otros; '' si se desconoce. */
export function participacionDesdeFirmantes(raw) {
  const { lista, generico } = parseFirmantes(raw);
  if (generico) return 'acompanamos';
  if (!lista.length) return '';
  return lista.every((x) => x.bloque) ? 'bloque' : 'acompanamos';
}

/** Traduce la clasificación histórica (tipo_autoria) al nuevo campo de impulso. */
export function impulsoDesdeAutoria(tipoAutoria) {
  if (tipoAutoria === 'propio') return 'cecilia';
  if (tipoAutoria === 'coautoria') return 'conjunto';
  return 'pendiente';
}

/** Mantiene tipo_autoria coherente para pantallas y scripts anteriores. */
export function autoriaDesdeImpulso(impulso, actual) {
  if (impulso === 'cecilia') return 'propio';
  if (impulso === 'conjunto') return 'coautoria';
  if (impulso === 'emiliano' || impulso === 'gustavo' || impulso === 'otros') return 'acompanado';
  return actual || 'acompanado';
}

export function normalizarImpulso(valor) {
  return Object.prototype.hasOwnProperty.call(IMPULSOS, valor) ? valor : 'pendiente';
}

export function normalizarParticipacion(valor) {
  return valor === 'bloque' || valor === 'acompanamos' ? valor : '';
}

/**
 * Grupo público, sin solapamientos entre "bloque" y "acompañamos":
 * lo impulsado por un integrante del bloque es del bloque aunque lo firmen otros;
 * el resto se clasifica por la composición oficial de firmantes.
 */
export function grupoPublico(participacion, impulso) {
  if (impulso === 'cecilia' || impulso === 'emiliano' || impulso === 'gustavo') return 'bloque';
  if (participacion === 'bloque' || participacion === 'acompanamos') return participacion;
  if (impulso === 'conjunto') return 'bloque';
  if (impulso === 'otros') return 'acompanamos';
  return '';
}

export function numeroDesdeId(id) {
  const m = /^EXP-(\d{4,6})$/.exec(String(id || ''));
  return m ? m[1] : '';
}

export function normalizarNumero(valor) {
  const m = /(\d{4,6})/.exec(String(valor || ''));
  return m ? m[1] : '';
}

export function enlaceOficial(numero) {
  return numero ? `${HCD_BASE}/expedientes/${numero}/` : '';
}

export function esSobreTablas(comision) {
  return clave(comision) === 'sobretablas';
}

export function normalizarComisiones(value) {
  let input = value;
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch (_) { input = input ? [input] : []; }
  }
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((item) => String(item || '').trim().replace(/\.$/, '')).filter(Boolean))];
}

/** Separa el tratamiento sobre tablas (no es una comisión) de los giros a comisión. */
export function separarComisiones(value) {
  const todas = normalizarComisiones(value);
  return {
    comisiones: todas.filter((c) => !esSobreTablas(c)),
    sobre_tablas: todas.some(esSobreTablas),
  };
}

export function tipoCorto(tipo) {
  const t = sinAcentos(tipo).toLowerCase();
  if (t.includes('ley')) return 'Ley';
  if (t.includes('resolucion')) return 'Resolución';
  if (t.includes('declaracion')) return 'Declaración';
  if (t.includes('informe')) return 'Pedido de informe';
  return String(tipo || '').replace(/^Proyecto de\s+/i, '') || 'Proyecto';
}

/** 'comision' (sin tratamiento), 'tramite' (con avances), 'aprobado' o 'archivado'. */
export function grupoEstado(estado) {
  const e = sinAcentos(estado).toLowerCase().trim();
  if (/no aprobad|rechazad|archivad|retirad|caduc/.test(e)) return 'archivado';
  if (/aprobad|sancionad/.test(e) && !/media/.test(e)) return 'aprobado';
  if (!e || /^en comision/.test(e)) return 'comision';
  return 'tramite';
}

/** Extrae "Declaración 352/26" de un texto libre (resúmenes generados en actualizaciones previas). */
export function normaDesdeTexto(texto) {
  const m = /Aprobad[oa] como (Ley|Resoluci[oó]n|Declaraci[oó]n)\s+(?:N[°º.]?\s*)?(\d+\/\d{2,4})/i.exec(String(texto || ''));
  if (!m) return null;
  return { tipo: tipoCorto(m[1]), numero: m[2] };
}

/** Convierte "17/06/2026", "17-06.2026" o "27-05-2026" en ISO; devuelve '' si no es interpretable. */
export function fechaIso(valor) {
  const m = /(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/.exec(String(valor || ''));
  if (!m) return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || '')) ? String(valor) : '';
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
