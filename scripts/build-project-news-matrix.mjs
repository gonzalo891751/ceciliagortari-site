import fs from "node:fs/promises";
import path from "node:path";

const API_URL = "https://www.ceciliagortari.com.ar/api/projects";
const ROOT = process.cwd();
const matrixPath = path.join(ROOT, "docs", "actualizacion-proyectos-2026", "matriz-conciliacion.json");
const pressPath = path.join(ROOT, "src", "content", "prensa.json");
const imageSourcesPath = path.join(ROOT, "docs", "FUENTES_IMAGENES_NOTICIAS_PROYECTOS_2026.csv");
const outputJson = path.join(ROOT, "docs", "MATRIZ_NOTICIAS_PROYECTOS_AUTORIA_2026.json");
const outputCsv = path.join(ROOT, "docs", "MATRIZ_NOTICIAS_PROYECTOS_AUTORIA_2026.csv");

const existingByExpediente = {
  "19669": "2026-03-11-asistencia-trabajadores-al-goya",
  "19670": "2026-03-11-alivio-corrientes",
  "19675": "2026-03-11-cinco-proyectos-corrientes",
  "19715": "2026-03-14-proyectos-ley-deudores-ioscor",
  "19753": "2026-03-22-reclamo-docente-haberes-dialogo",
  "19788": "2026-04-07-proteccion-salarial-y-apid",
  "19841": "2026-04-13-reforma-integral-ioscor-proyecto-diputados",
};

const proposals = {
  "19669": {
    title: "Impulsan una asistencia transitoria para trabajadores despedidos de Alal",
    subtitle: "Cecilia Gortari y legisladores del bloque propusieron un apoyo económico temporal para las personas cesanteadas de la firma textil en Goya y sus familias.",
    imageQuery: "textile factory worker Argentina industrial",
  },
  "19670": {
    title: "Alivio Corrientes: proponen una salida ordenada para deudas familiares",
    subtitle: "La iniciativa impulsada por Cecilia Gortari y el bloque plantea un programa provincial para reestructurar obligaciones y acompañar a hogares sobreendeudados.",
    imageQuery: "family finances documents calculator",
  },
  "19675": {
    title: "Piden mejorar las condiciones edilicias de las escuelas rurales de Goya",
    subtitle: "El proyecto solicita al Poder Ejecutivo un relevamiento y respuestas para establecimientos rurales del departamento de Goya, con foco en la seguridad y el aprendizaje.",
    imageQuery: "rural school classroom Argentina",
  },
  "19680": {
    title: "Solicitan señalización e iluminación para reforzar la seguridad en la Ruta 27",
    subtitle: "La propuesta pide intervenir puntos críticos de la Ruta Provincial 27 para mejorar la visibilidad y reducir riesgos para quienes circulan por ese corredor.",
    imageQuery: "rural road night road signs",
  },
  "19714": {
    title: "Proponen ampliar la cobertura del IOSCOR para prestaciones de identidad de género",
    subtitle: "El proyecto busca incorporar prestaciones vinculadas con la identidad de género a la obra social provincial y garantizar una atención integral a sus afiliados.",
    imageQuery: "inclusive healthcare consultation",
  },
  "19715": {
    title: "Buscan restringir el acceso a casinos a deudores alimentarios morosos",
    subtitle: "La iniciativa propone impedir el ingreso a salas de juego a quienes figuren en el registro de deudores alimentarios, reforzando el cumplimiento de sus obligaciones.",
    imageQuery: "casino chips responsible gambling",
  },
  "19720": {
    title: "Promueven el monitoreo de las políticas de salud sexual y reproductiva",
    subtitle: "El proyecto impulsa el seguimiento de programas, prestaciones e insumos para sostener el acceso a la salud sexual y reproductiva en toda la provincia.",
    imageQuery: "public health consultation women",
  },
  "19753": {
    title: "Piden reabrir el diálogo con docentes y revisar los descuentos salariales",
    subtitle: "La resolución solicita una instancia urgente de diálogo con las organizaciones docentes y la revisión de descuentos aplicados durante el conflicto educativo.",
    imageQuery: "teacher classroom empty desks",
  },
  "19786": {
    title: "Solicitan informes sobre los Aportes del Tesoro Nacional recibidos por Corrientes",
    subtitle: "El pedido busca conocer los montos, fechas, criterios y destinos de los fondos nacionales transferidos a la Provincia bajo el régimen de Aportes del Tesoro Nacional.",
    imageQuery: "public budget documents government",
  },
  "19787": {
    title: "Piden información sobre la situación financiera del Banco de Corrientes",
    subtitle: "La iniciativa requiere datos institucionales y financieros para fortalecer el control legislativo sobre el banco público y resguardar su función provincial.",
    imageQuery: "bank building finance documents",
  },
  "19788": {
    title: "Impulsan proteger los salarios frente a débitos bancarios automáticos",
    subtitle: "El proyecto propone límites y mecanismos de resguardo para evitar que débitos automáticos y descuentos comprometan la disponibilidad del ingreso salarial.",
    imageQuery: "salary bank card personal finances",
  },
  "19789": {
    title: "Proponen crear una asignación provincial de incentivo docente",
    subtitle: "La iniciativa plantea un complemento salarial provincial para sostener el ingreso de las y los docentes y reconocer su tarea en el sistema educativo correntino.",
    imageQuery: "teacher writing classroom Argentina",
  },
  "19793": {
    title: "Buscan reconocer antecedentes meritorios en la valoración docente",
    subtitle: "La propuesta incorpora tareas pedagógicas, científicas, culturales y comunitarias al régimen de valoración, incluido el acompañamiento de cooperativas escolares.",
    imageQuery: "teachers professional development workshop",
  },
  "19831": {
    title: "Solicitan dar continuidad al programa de lotes con servicios en Goya",
    subtitle: "El proyecto pide medidas para sostener una política de acceso al suelo urbano con infraestructura básica, destinada a familias de la ciudad de Goya.",
    imageQuery: "urban housing lots infrastructure",
  },
  "19832": {
    title: "Proponen más transparencia en los carteles de obra pública",
    subtitle: "La iniciativa establece información mínima y accesible en la cartelería de obras provinciales para que la ciudadanía conozca plazos, responsables y presupuesto.",
    imageQuery: "public works construction sign",
  },
  "19833": {
    title: "Impulsan un estudio integral para mejorar la seguridad de la Ruta 27",
    subtitle: "El proyecto promueve una evaluación técnica del corredor provincial para identificar riesgos y orientar futuras intervenciones de seguridad vial.",
    imageQuery: "road safety inspection highway",
  },
  "19834": {
    title: "Proponen reconocer el aporte comunitario del Proyecto Cultural Mendoza",
    subtitle: "La declaración busca destacar una experiencia cultural con impacto educativo y comunitario, y acompañar su difusión dentro de la provincia de Corrientes.",
    imageQuery: "community cultural workshop Argentina",
  },
  "19835": {
    title: "Proponen homenajear al veterano de Malvinas Roque Zabala",
    subtitle: "La iniciativa impulsa un reconocimiento legislativo a su trayectoria y servicio, preservando la memoria de los veteranos correntinos de la Guerra de Malvinas.",
    imageQuery: "Malvinas memorial Argentina flag",
  },
  "19840": {
    title: "Piden informes sobre fondos destinados a infraestructura escolar",
    subtitle: "La resolución solicita precisiones sobre la asignación y ejecución de recursos previstos para reparaciones y mejoras en establecimientos educativos provinciales.",
    imageQuery: "school building repair construction",
  },
  "19841": {
    title: "Cecilia Gortari impulsa una reforma integral del IOSCOR",
    subtitle: "El proyecto propone modernizar la obra social provincial, fortalecer su transparencia y ampliar herramientas de protección para afiliados y prestadores.",
    imageQuery: "health administration medical documents",
  },
  "P-0067": {
    title: "Proponen declarar de interés una actividad por el Día de la Tierra",
    subtitle: "El registro del sistema identifica una iniciativa ambiental presentada el 22 de abril; su expediente y sus firmantes permanecen pendientes de verificación documental.",
    imageQuery: "Earth Day nature conservation",
  },
  "19881": {
    title: "Reclaman las transferencias nacionales adeudadas a bomberos voluntarios",
    subtitle: "La resolución solicita regularizar los fondos destinados a asociaciones de bomberos voluntarios, fundamentales para la respuesta ante emergencias en la provincia.",
    imageQuery: "volunteer firefighters fire station",
  },
  "19882": {
    title: "Proponen un homenaje póstumo al médico Ernesto Walter Grosse",
    subtitle: "La declaración busca reconocer su trayectoria profesional y su aporte a la comunidad, preservando la memoria de una figura vinculada con la salud correntina.",
    imageQuery: "doctor memorial stethoscope",
  },
  "19883": {
    title: "Solicitan protocolos escolares ante amenazas y hechos de violencia",
    subtitle: "El proyecto pide pautas claras de prevención, actuación y coordinación institucional para proteger a las comunidades educativas frente a situaciones de riesgo.",
    imageQuery: "school safety empty hallway",
  },
  "19884": {
    title: "Piden medidas de seguridad vial para el puente Paso López",
    subtitle: "La resolución solicita intervenciones que reduzcan riesgos en el puente y mejoren las condiciones de circulación para vecinos, transportistas y productores.",
    imageQuery: "rural bridge road safety",
  },
  "19931": {
    title: "Proponen un programa provincial de deporte inclusivo y adaptado",
    subtitle: "La iniciativa crea herramientas para ampliar la participación deportiva de personas con discapacidad y acompañar a instituciones, atletas y familias.",
    imageQuery: "adaptive sports wheelchair athlete",
  },
  "19966": {
    title: "Solicitan alivio eléctrico para productores hortícolas y tabacaleros",
    subtitle: "El proyecto pide medidas tarifarias y de asistencia ante el peso de la energía en actividades productivas que sostienen empleo y economías regionales.",
    imageQuery: "horticulture greenhouse irrigation farming",
  },
  "19967": {
    title: "Impulsan accesibilidad universal en el Palacio Legislativo",
    subtitle: "Cecilia Gortari y Emiliano Fernández propusieron adecuaciones físicas, comunicacionales y tecnológicas para garantizar un acceso autónomo e inclusivo.",
    imageQuery: "wheelchair ramp public building accessibility",
  },
  "19972": {
    title: "Proponen un sistema provincial de cobertura sanitaria rural",
    subtitle: "La iniciativa de Cecilia Gortari y Emiliano Fernández busca acercar atención, prevención y seguimiento sanitario a poblaciones rurales de Corrientes.",
    imageQuery: "rural healthcare mobile clinic",
  },
  "19981": {
    title: "Impulsan la adhesión legislativa a la Marcha Federal Universitaria",
    subtitle: "La declaración propone acompañar la movilización en defensa de la universidad pública y reconocer su papel en la formación y el desarrollo provincial.",
    imageQuery: "public university students Argentina",
  },
  "20017": {
    title: "Piden ampliar la conectividad digital en zonas rurales y periurbanas",
    subtitle: "La resolución solicita un plan para reducir brechas de acceso a internet que afectan la educación, la producción y los servicios en distintos puntos de Corrientes.",
    imageQuery: "rural internet antenna connectivity",
  },
  "20045": {
    title: "Presentaron un régimen integral para fortalecer los caminos rurales",
    subtitle: "El proyecto ordena la gestión, conservación y mejora de la red vial rural, con participación de consorcios camineros y criterios de planificación provincial.",
    imageQuery: "rural dirt road agricultural landscape",
  },
  "20046": {
    title: "Impulsan empleo, capacitación y emprendimientos para jóvenes correntinos",
    subtitle: "La propuesta crea herramientas de formación, inserción laboral y apoyo al emprendimiento para ampliar oportunidades de jóvenes en toda la provincia.",
    imageQuery: "young adults vocational training workshop",
  },
  "20051": {
    title: "Impulsan una emergencia alimentaria para proteger los comedores escolares",
    subtitle: "La iniciativa busca fortalecer la asistencia alimentaria y sostener el funcionamiento de comedores escolares para niñas, niños y adolescentes de la provincia.",
    imageQuery: "healthy school meal cafeteria",
  },
  "20074": {
    title: "Proponen crear la figura del Abogado del Niño en Corrientes",
    subtitle: "El proyecto establece asistencia jurídica especializada para que niñas, niños y adolescentes puedan ejercer sus derechos en procesos que los involucren.",
    imageQuery: "child rights justice gavel illustration",
  },
  "20075": {
    title: "Buscan garantizar mayor transparencia en las ofertas educativas",
    subtitle: "La iniciativa exige información clara sobre reconocimiento oficial, validez de títulos y condiciones de cursado para proteger a estudiantes y familias.",
    imageQuery: "students reviewing course information",
  },
};

function expedienteFrom(project) {
  const match = project.id.match(/(\d{5})/);
  return match ? match[1] : "";
}

function escapeCsv(value) {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell);
  return cells;
}

const response = await fetch(API_URL, { headers: { "user-agent": "Codex editorial audit/1.0" } });
if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);

const live = await response.json();
const reconciled = JSON.parse(await fs.readFile(matrixPath, "utf8")).records;
const press = JSON.parse(await fs.readFile(pressPath, "utf8")).items;
const imageSourceLines = (await fs.readFile(imageSourcesPath, "utf8")).trim().split(/\r?\n/);
const imageSourceHeaders = parseCsvLine(imageSourceLines.shift());
const imageSources = new Map(
  imageSourceLines.map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(imageSourceHeaders.map((header, index) => [header, values[index] || ""]));
    return [row.expediente, row];
  }),
);
const byExpediente = new Map(reconciled.map((row) => [String(row.numero_expediente), row]));
const byNewsId = new Map(press.map((item) => [item.id, item]));

const ownPresented = live
  .filter((project) => project.tipo_autoria === "propio" && project.estado_preparacion === "Presentado")
  .sort((a, b) => a.fecha_presentacion.localeCompare(b.fecha_presentacion) || a.id.localeCompare(b.id));

const rows = ownPresented.map((project) => {
  const expediente = expedienteFrom(project);
  const official = byExpediente.get(expediente) || {};
  const proposal = proposals[expediente || project.id] || {};
  const existingId = existingByExpediente[expediente] || "";
  const existing = byNewsId.get(existingId);
  const article = press.find(
    (item) =>
      item.cuerpo?.includes(`**${expediente}**`) &&
      item.cuerpo?.includes(`https://hcdcorrientes.gov.ar/expedientes/${expediente}/`),
  );
  const imageSource = imageSources.get(expediente);
  const verifiedAuthors = official.url_pdf_oficial
    ? "Cecilia Gortari; Emiliano Fernández; Gustavo Canteros"
    : "";

  return {
    identificador_interno: project.id,
    expediente,
    fecha_presentacion: project.fecha_presentacion,
    tipo: project.tipo,
    titulo_proyecto: project.titulo,
    titulo_oficial: official.titulo_oficial || "",
    resumen: project.resumen,
    area_tematica: project.area_tema,
    autoria_sistema: project.tipo_autoria,
    firmantes_verificados: verifiedAuthors,
    noticia_ya_existente: Boolean(existing),
    id_noticia_existente: existingId,
    id_noticia_publicada: article?.id || "",
    titulo_periodistico_propuesto: proposal.title || "",
    bajada_propuesta: proposal.subtitle || "",
    imagen_propuesta: article?.imagen || proposal.imageQuery || "",
    fuente_imagen: imageSource
      ? `${imageSource.sitio_origen} | ${imageSource.autor_fotografo} | ${imageSource.licencia}`
      : "",
    url_proyecto: official.url_fuente_oficial || "",
    url_expediente: official.url_pdf_oficial || "",
    estado_generacion: article ? "contenido_e_imagen_completos" : "pendiente_verificacion_documental",
    estado_publicacion: article ? "cargado_en_fuente" : "no_publicado",
    observaciones:
      article && existing
        ? "Publicación existente actualizada y conservada con su ID."
        : article
          ? "Publicación nueva cargada en la fuente del sitio."
          : official.url_pdf_oficial
            ? ""
            : "Sin expediente ni fuente oficial verificable; no publicar hasta completar el dato.",
  };
});

if (rows.length !== 36) {
  throw new Error(`Se esperaban 36 proyectos propios presentados según el corte auditado; API devolvió ${rows.length}.`);
}

const columns = Object.keys(rows[0]);
const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(","))].join("\n") + "\n";

await fs.writeFile(
  outputJson,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      source: API_URL,
      criteria: "tipo_autoria=propio AND estado_preparacion=Presentado",
      counts: {
        detected: rows.length,
        existing_related: rows.filter((row) => row.noticia_ya_existente).length,
        new_candidates: rows.filter((row) => !row.noticia_ya_existente && row.url_expediente).length,
        pending: rows.filter((row) => !row.url_expediente).length,
      },
      items: rows,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);
await fs.writeFile(outputCsv, csv, "utf8");

console.log(
  JSON.stringify(
    {
      outputJson,
      outputCsv,
      detected: rows.length,
      existing: rows.filter((row) => row.noticia_ya_existente).length,
      pending: rows.filter((row) => !row.url_expediente).length,
    },
    null,
    2,
  ),
);
