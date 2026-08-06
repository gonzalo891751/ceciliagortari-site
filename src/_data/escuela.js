/**
 * ESCUELA DE EMPRENDEDORES — Fuente única de datos
 * =================================================
 * Este archivo es el ÚNICO lugar donde se cargan los cursos.
 * Alimenta simultáneamente:
 *   1. La agenda de cursos (/escuela)
 *   2. La tarjeta de "Próximo curso"
 *   3. El selector "Curso de interés" del formulario
 *   4. Los mensajes precompletados de WhatsApp
 *
 * PARA ACTUALIZAR LA GRILLA sólo hay que editar el array `courses`
 * y la constante `LAST_UPDATED`. No hay que tocar el HTML.
 *
 * Campos de cada curso:
 *   id              slug único
 *   name            nombre exacto tal como figura en el material oficial
 *   type            'curso' | 'masterclass'
 *   category        'oficios' | 'arte' | 'cuidado' | 'emprender'
 *   startDate       'YYYY-MM-DD' (fecha de inicio)
 *   days            días de cursada, en texto ('viernes', 'jueves y viernes')
 *   time            'HH:MM' (24 h)
 *   location        lugar de dictado
 *   instructor      docente — sólo si está publicado oficialmente
 *   phone           teléfono de inscripción publicado para ESE curso
 *   isFree          true sólo si está confirmado como gratuito
 *   statusOverride  fuerza un estado manual y desactiva el cálculo automático.
 *                   Valores: 'inscripciones-abiertas' | 'consultar' |
 *                            'cupos-completos' | 'finalizado'
 *   enrollmentNote  aclaración sobre la inscripción
 *   description     bajada — sólo si proviene de una fuente oficial
 *   instagramUrl    publicación oficial de referencia
 *   source          trazabilidad del dato (para auditoría)
 *   active          si es false no se muestra en ningún lado
 */

const TZ = 'America/Argentina/Buenos_Aires';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Última revisión manual de la grilla contra las fuentes oficiales.
const LAST_UPDATED = '2026-08-06';

const POST_SEGUNDO_SEMESTRE = 'https://www.instagram.com/p/DbT26sYEWo7/';
const POST_NUEVOS_CURSOS = 'https://www.instagram.com/p/DbmYWXpEeyZ/';

/**
 * Datos de contacto oficiales.
 * El teléfono general está publicado en la biografía de @goyaemprendedores
 * ("Para info al 3777-737188") y en los afiches de ambas publicaciones.
 */
const contact = {
  instagram: 'goyaemprendedores',
  instagramUrl: 'https://www.instagram.com/goyaemprendedores/',
  // Formato local tal como se publica
  phoneDisplay: '3777-737188',
  // Formato internacional para wa.me (Argentina 54 + 9 para móviles + área 3777)
  whatsapp: '5493777737188',
  address: 'Ángel Soto y Tucumán',
  city: 'Goya',
  province: 'Corrientes',
};

/**
 * Indicadores de impacto histórico de la Escuela.
 * Se muestran con el prefijo "+" tal como los comunica la Escuela.
 */
const stats = [
  { value: 3000, label: 'Egresados', suffix: '+' },
  { value: 25, label: 'Cursos', suffix: '+' },
  { value: 30, label: 'Masterclasses', suffix: '+' },
  { value: 20, label: 'Charlas', suffix: '+' },
];

const CATEGORIES = {
  oficios: { label: 'Oficios y producción', accent: 'blue' },
  arte: { label: 'Arte y creatividad', accent: 'magenta' },
  cuidado: { label: 'Cuidado y servicios', accent: 'turquoise' },
  emprender: { label: 'Herramientas para emprender', accent: 'orange' },
};

/**
 * GRILLA SEGUNDO SEMESTRE 2026
 * Todos los cursos se dictan en Ángel Soto y Tucumán (Goya, Corrientes)
 * y son libres y gratuitos, según el material oficial de la Escuela.
 *
 * No se cargan docentes ni cupos porque no están publicados oficialmente.
 */
const courses = [
  {
    id: 'porcelana-fria',
    name: 'Porcelana Fría',
    type: 'curso',
    category: 'arte',
    startDate: '2026-08-04',
    days: 'martes',
    time: '16:00',
    isFree: true,
    source: 'Grilla oficial del segundo semestre — Escuela de Emprendedores',
    instagramUrl: contact.instagramUrl,
  },
  {
    id: 'crochet',
    name: 'Crochet',
    type: 'curso',
    category: 'oficios',
    startDate: '2026-08-04',
    days: 'martes',
    time: '17:00',
    isFree: true,
    source: 'Grilla oficial del segundo semestre — Escuela de Emprendedores',
    instagramUrl: contact.instagramUrl,
  },
  {
    id: 'barberia',
    name: 'Barbería',
    type: 'curso',
    category: 'oficios',
    startDate: '2026-08-05',
    days: 'miércoles',
    time: '09:00',
    phone: '3777-694894',
    isFree: true,
    description: 'Aprendé técnicas de barbería profesional y empezá tu camino.',
    instagramUrl: POST_SEGUNDO_SEMESTRE,
    source: 'Afiche oficial del curso — publicación del 27/07/2026',
  },
  {
    id: 'marroquineria',
    name: 'Marroquinería',
    type: 'curso',
    category: 'oficios',
    startDate: '2026-08-07',
    days: 'viernes',
    time: '16:30',
    phone: '3777-737188',
    isFree: true,
    description: 'Aprendé técnicas de marroquinería y creá productos únicos con tus propias manos.',
    instagramUrl: POST_SEGUNDO_SEMESTRE,
    source: 'Afiche oficial del curso — publicación del 27/07/2026',
  },
  {
    id: 'arte-terapia',
    name: 'Arte Terapia',
    type: 'curso',
    category: 'arte',
    startDate: '2026-08-10',
    days: 'lunes',
    time: '16:00',
    phone: '3777-283128',
    isFree: true,
    description: 'Descubrí el poder del arte para expresar, transformar y sanar.',
    instagramUrl: POST_NUEVOS_CURSOS,
    source: 'Afiche oficial del curso — publicación del 03/08/2026',
  },
  {
    id: 'cuidado-basico-adulto',
    name: 'Cuidado Básico para Adulto',
    type: 'curso',
    category: 'cuidado',
    startDate: '2026-08-12',
    days: 'miércoles',
    time: '18:00',
    phone: '3777-282976',
    isFree: true,
    description: 'Aprendé técnicas de cuidado básico para adulto y mejorá su bienestar cada día.',
    instagramUrl: POST_NUEVOS_CURSOS,
    source: 'Afiche oficial del curso — publicaciones del 27/07/2026 y 03/08/2026',
  },
  {
    id: 'arte-mix',
    name: 'Arte Mix',
    type: 'curso',
    category: 'arte',
    startDate: '2026-08-13',
    // El afiche oficial indica "jueves y viernes 9:30hs": es un único curso
    // con dos encuentros semanales, no dos cursos distintos.
    days: 'jueves y viernes',
    time: '09:30',
    phone: '3777-243246',
    isFree: true,
    description: 'Descubrí el poder del arte mix para crear, expresar y transformar.',
    instagramUrl: POST_NUEVOS_CURSOS,
    source: 'Afiche oficial del curso — publicación del 03/08/2026',
  },
  {
    id: 'masterclass-munecos',
    name: 'Masterclass de Muñecos',
    type: 'masterclass',
    category: 'arte',
    startDate: '2026-08-21',
    days: 'viernes',
    time: '15:00',
    isFree: true,
    source: 'Grilla oficial del segundo semestre — Escuela de Emprendedores',
    instagramUrl: contact.instagramUrl,
  },
  {
    id: 'masterclass-tienda-nube',
    name: 'Masterclass de Tienda Nube',
    type: 'masterclass',
    category: 'emprender',
    startDate: '2026-08-25',
    days: 'martes',
    time: '15:00',
    isFree: true,
    source: 'Grilla oficial del segundo semestre — Escuela de Emprendedores',
    instagramUrl: contact.instagramUrl,
  },
  {
    id: 'panificados-y-pastas',
    name: 'Panificados y Pastas',
    type: 'curso',
    category: 'oficios',
    startDate: '2026-09-01',
    days: 'martes',
    // La grilla oficial del semestre indica 9:00 h y el afiche del curso
    // indica 8:30 h. Se publica el horario de la grilla, confirmado por
    // la Escuela el 06/08/2026.
    time: '09:00',
    isFree: true,
    statusOverride: 'inscripciones-abiertas',
    enrollmentNote: 'Se inscribe a partir de la segunda semana de agosto.',
    description: 'Masa madre, panes artesanales, pastas frescas, rellenos y técnicas.',
    instagramUrl: POST_SEGUNDO_SEMESTRE,
    source: 'Afiche oficial del curso — publicación del 27/07/2026',
  },
  {
    id: 'reposteria',
    name: 'Repostería',
    type: 'curso',
    category: 'oficios',
    startDate: '2026-09-07',
    days: 'lunes',
    time: '09:00',
    isFree: true,
    statusOverride: 'inscripciones-abiertas',
    enrollmentNote: 'Se inscribe a partir de la segunda semana de agosto.',
    description: 'Recetas básicas, decoración creativa, manejo de mangas, tortas, postres, cremas y rellenos.',
    instagramUrl: POST_SEGUNDO_SEMESTRE,
    source: 'Afiche oficial del curso — publicación del 27/07/2026',
  },
];

// ---------------------------------------------------------------------------
// Derivaciones
// ---------------------------------------------------------------------------

/** Fecha de hoy en Argentina como 'YYYY-MM-DD', independiente del huso del build. */
function todayInArgentina() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const STATUS_LABELS = {
  proximo: 'Próximamente',
  hoy: 'Comienza hoy',
  'en-curso': 'Ya comenzó',
  'inscripciones-abiertas': 'Inscripciones abiertas',
  consultar: 'Consultar disponibilidad',
  'cupos-completos': 'Cupos completos',
  finalizado: 'Finalizado',
};

/**
 * Calcula el estado a partir de la fecha de inicio.
 * Nunca marca "finalizado" automáticamente: no conocemos la duración de los
 * cursos, así que una fecha de inicio pasada sólo significa "ya comenzó" y la
 * persona todavía puede consultar si hay lugar.
 */
function computeStatus(course, today) {
  if (course.statusOverride) return course.statusOverride;
  if (course.startDate > today) return 'proximo';
  if (course.startDate === today) return 'hoy';
  return 'en-curso';
}

function buildWhatsappMessage(course, dateLabel) {
  const tipo = course.type === 'masterclass' ? 'la masterclass' : 'el curso';
  return (
    `Hola, vi en la página de la Escuela de Emprendedores ${tipo} de ${course.name} ` +
    `del ${dateLabel} a las ${course.time} hs. ` +
    `Quisiera consultar si todavía hay lugar y cómo puedo inscribirme.`
  );
}

/** Normaliza un teléfono publicado (ej. "3777-694894") al formato de wa.me. */
function toWhatsappNumber(phone) {
  if (!phone) return contact.whatsapp;
  const digits = String(phone).replace(/\D/g, '');
  // Los teléfonos publicados son de Goya (área 3777) sin código de país.
  return digits.length === 10 ? `549${digits}` : contact.whatsapp;
}

const today = todayInArgentina();

const decorated = courses
  .filter((c) => c.active !== false)
  .map((course) => {
    const [y, m, d] = course.startDate.split('-').map(Number);
    // Mediodía UTC evita corrimientos de día por huso horario.
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    const weekday = WEEKDAYS[date.getUTCDay()];
    const dateLabel = `${weekday} ${d} de ${MONTHS[m - 1]}`;
    const status = computeStatus(course, today);
    const message = buildWhatsappMessage(course, dateLabel);
    const waNumber = toWhatsappNumber(course.phone);

    return {
      ...course,
      day: String(d).padStart(2, '0'),
      monthShort: MONTHS_SHORT[m - 1],
      monthName: MONTHS[m - 1],
      monthKey: `${y}-${String(m).padStart(2, '0')}`,
      monthLabel: `${MONTHS[m - 1].charAt(0).toUpperCase()}${MONTHS[m - 1].slice(1)} ${y}`,
      weekday,
      dateLabel,
      dateLabelLong: `${dateLabel} de ${y}`,
      location: course.location || `${contact.address}, ${contact.city}`,
      categoryLabel: CATEGORIES[course.category].label,
      accent: CATEGORIES[course.category].accent,
      typeLabel: course.type === 'masterclass' ? 'Masterclass' : 'Curso',
      status,
      statusLabel: STATUS_LABELS[status],
      phoneDisplay: course.phone || contact.phoneDisplay,
      whatsappMessage: message,
      whatsappUrl: `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,
    };
  })
  .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : a.time.localeCompare(b.time)));

/** Agrupa cronológicamente por mes para renderizar la agenda. */
function groupByMonth(list) {
  const groups = [];
  for (const course of list) {
    let group = groups.find((g) => g.key === course.monthKey);
    if (!group) {
      group = { key: course.monthKey, label: course.monthLabel, courses: [] };
      groups.push(group);
    }
    group.courses.push(course);
  }
  return groups;
}

const byMonth = groupByMonth(decorated);

/**
 * Próxima actividad: la primera cuya fecha todavía no pasó.
 * Los cursos ya iniciados no se eliminan: se muestran en un bloque aparte
 * porque suelen tener varias clases y todavía se puede consultar por un lugar.
 */
const upcoming = decorated.filter((c) => c.startDate >= today);
const started = decorated.filter((c) => c.startDate < today);
const upcomingByMonth = groupByMonth(upcoming);
const next = upcoming[0] || null;

module.exports = {
  lastUpdated: LAST_UPDATED,
  today,
  /**
   * Clave pública de Cloudflare Turnstile. Se lee del entorno del build.
   * Si no está definida, el widget no se renderiza y el servidor no exige token
   * (la protección queda en el honeypot, el rate limit y la validación server-side).
   * Para activarlo: definir TURNSTILE_SITE_KEY en el build de Cloudflare Pages
   * y TURNSTILE_SECRET_KEY como secreto de la Pages Function.
   */
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
  contact,
  stats,
  categories: CATEGORIES,
  statusLabels: STATUS_LABELS,
  courses: decorated,
  byMonth,
  upcomingByMonth,
  upcoming,
  started,
  next,
  /** Payload mínimo que se embebe en la página para recalcular estados en el cliente. */
  clientData: decorated.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    typeLabel: c.typeLabel,
    startDate: c.startDate,
    dateLabel: c.dateLabel,
    time: c.time,
    days: c.days,
    statusOverride: c.statusOverride || null,
    whatsappUrl: c.whatsappUrl,
    instagramUrl: c.instagramUrl,
    accent: c.accent,
  })),
};
