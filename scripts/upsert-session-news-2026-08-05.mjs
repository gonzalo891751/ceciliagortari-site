import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const pressPath = path.join(process.cwd(), "src", "content", "prensa.json");

const NEWS = [
  {
    fecha: "2026-08-05T12:00:00.000-03:00",
    id: "2026-08-05-informes-obras-publicas",
    titulo: "Piden información detallada sobre el estado y financiamiento de obras públicas",
    subtitulo:
      "La iniciativa busca conocer avances, convenios, plazos, fuentes de financiamiento y eventuales demoras de obras anunciadas por el Gobierno provincial.",
    etiqueta: "Noticia",
    imagen: "/assets/uploads/project-news/2026-08-05-20211-obras-publicas.webp",
    cuerpo:
      "Cecilia Gortari, junto a Emiliano Fernández Recalde y Gustavo Canteros, presentó un proyecto de resolución para que el Poder Ejecutivo informe de manera detallada el estado y el financiamiento de distintas obras públicas anunciadas para Corrientes. La iniciativa ingresó como expediente **20211** y fue remitida a la Comisión de Energía, Transporte, Obras y Servicios Públicos.\n\nEl pedido busca reunir información oficial y verificable sobre cada obra: situación administrativa, convenios celebrados, fuentes de financiamiento, montos comprometidos, plazos previstos y grado de avance físico y presupuestario. También solicita precisar si existen demoras, reprogramaciones o dificultades que puedan afectar su ejecución.\n\nConocer el estado real de las obras anunciadas permite distinguir entre la comunicación inicial, la obtención efectiva del financiamiento, la contratación y la ejecución. Esa información es necesaria para que la Legislatura ejerza su función de control y para que la ciudadanía pueda seguir el cumplimiento de los compromisos públicos.\n\nEl proyecto no formula una conclusión anticipada sobre las obras ni afirma que estén paralizadas. Propone que los organismos competentes presenten datos consolidados y respaldados que permitan evaluar cada caso con precisión.\n\nEl expediente fue presentado el 5 de agosto de 2026 y se encuentra **en comisiones**. [Consultá la ficha pública del proyecto](/proyectos/?id=EXP-20211) y [descargá el expediente oficial](/api/projects/public/EXP-20211/documents/1c83a3a5-f256-4d69-a93e-d96609e2a637/download).",
    documento:
      "/api/projects/public/EXP-20211/documents/1c83a3a5-f256-4d69-a93e-d96609e2a637/download",
  },
  {
    fecha: "2026-08-05T12:01:00.000-03:00",
    id: "2026-08-05-regalias-yacyreta",
    titulo: "Proponen que las regalías de Yacyretá se traduzcan en desarrollo para Corrientes",
    subtitulo:
      "El proyecto plantea un régimen transparente para orientar parte de esos recursos a inversiones sociales, energéticas, productivas y de infraestructura.",
    etiqueta: "Noticia",
    imagen: "/assets/uploads/project-news/2026-08-05-20212-regalias-yacyreta.webp",
    cuerpo:
      "Cecilia Gortari, Emiliano Fernández Recalde y Gustavo Canteros presentaron un proyecto de ley para crear un régimen provincial de aprovechamiento social, energético y productivo de la porción correntina de las regalías hidroeléctricas de Yacyretá. La propuesta fue registrada como expediente **20212**.\n\nLa iniciativa busca que una parte de esos recursos se asigne de manera planificada a políticas e inversiones capaces de producir beneficios concretos para la población. Entre sus ejes aparecen el desarrollo de infraestructura, el fortalecimiento energético, la promoción de actividades productivas y la atención de necesidades sociales.\n\nEl proyecto también incorpora criterios de transparencia, planificación, control e información pública. El objetivo es que el destino de los fondos pueda conocerse y verificarse, con prioridades definidas y seguimiento de su ejecución.\n\nLas regalías constituyen un recurso de la Provincia vinculado al aprovechamiento hidroeléctrico. La propuesta sostiene que su utilización debe contribuir a ampliar oportunidades, mejorar servicios y generar capacidad productiva en Corrientes, sin presentar esos resultados como ya alcanzados.\n\nEl expediente fue presentado el 5 de agosto de 2026 y fue girado a la Comisión de Energía, Transporte, Obras y Servicios Públicos. Todavía debe ser analizado por la Legislatura: **no fue aprobado ni está vigente**. [Consultá la ficha pública del proyecto](/proyectos/?id=EXP-20212) y [descargá el expediente oficial](/api/projects/public/EXP-20212/documents/24847369-5991-4c0b-965f-a969e19db800/download).",
    documento:
      "/api/projects/public/EXP-20212/documents/24847369-5991-4c0b-965f-a969e19db800/download",
  },
  {
    fecha: "2026-08-05T12:02:00.000-03:00",
    id: "2026-08-05-simbolo-accesibilidad-universal",
    titulo: "Impulsan un enfoque integral para el nuevo símbolo de accesibilidad universal",
    subtitulo:
      "La propuesta amplía la mirada más allá de las barreras físicas e incluye accesibilidad sensorial, cognitiva, comunicacional y digital.",
    etiqueta: "Noticia",
    imagen: "/assets/uploads/project-news/2026-08-05-20214-accesibilidad-universal.webp",
    cuerpo:
      "Cecilia Gortari, junto a Emiliano Fernández Recalde y Gustavo Canteros, presentó un proyecto de ley para adoptar progresivamente en Corrientes el Símbolo Internacional de Accesibilidad Universal. La iniciativa ingresó como expediente **20214**.\n\nEl nuevo enfoque no limita la accesibilidad a una rampa o a la eliminación de obstáculos físicos. Comprende también las barreras sensoriales, cognitivas, comunicacionales y digitales que pueden dificultar el acceso a entornos, servicios, información y tecnologías.\n\nLa propuesta apunta a que organismos provinciales, espacios de atención y servicios públicos incorporen gradualmente una identificación más amplia de la accesibilidad. El símbolo funcionaría como un distintivo general y complementario, sin reemplazar los pictogramas específicos que resulten obligatorios para informar apoyos o condiciones particulares.\n\nEsta concepción integral reconoce que las personas pueden enfrentar barreras diferentes y que un entorno accesible requiere diseño, información y comunicación comprensibles. La implementación debería acompañarse con criterios claros y uso responsable para evitar que el distintivo se convierta en una declaración sin adecuaciones reales.\n\nEl expediente fue presentado el 5 de agosto de 2026 y se encuentra en la Comisión de Protección de Personas con Discapacidad. Se trata de una propuesta en tratamiento: **todavía no fue aprobada**. [Consultá la ficha pública del proyecto](/proyectos/?id=EXP-20214) y [descargá el expediente oficial](/api/projects/public/EXP-20214/documents/97f10165-7616-47de-9136-6db296927161/download).",
    documento:
      "/api/projects/public/EXP-20214/documents/97f10165-7616-47de-9136-6db296927161/download",
  },
  {
    fecha: "2026-08-05T12:03:00.000-03:00",
    id: "2026-08-05-reforma-reglamento-comisiones",
    titulo: "Proponen mecanismos para evitar que los proyectos queden paralizados en comisión",
    subtitulo:
      "La reforma busca ordenar giros y plazos, exigir respuestas expresas y evitar que el silencio provoque la pérdida de estado parlamentario.",
    etiqueta: "Noticia",
    imagen: "/assets/uploads/project-news/2026-08-05-20215-reforma-reglamento.webp",
    cuerpo:
      "Cecilia Gortari, Emiliano Fernández Recalde y Gustavo Canteros presentaron un proyecto de resolución para modificar el Reglamento de la Cámara de Diputados y mejorar el tratamiento de los expedientes en las comisiones. La propuesta ingresó como expediente **20215**.\n\nEl problema que aborda es sencillo de explicar: un proyecto puede ser enviado a comisión y permanecer allí durante meses o años sin una decisión. Si no recibe despacho ni vuelve al recinto, puede terminar perdiendo estado parlamentario por el paso del tiempo.\n\nLa reforma propone ordenar el giro de los asuntos, establecer plazos razonables y asegurar una respuesta institucional expresa. Esa respuesta puede ser aprobar, modificar o rechazar una iniciativa. El objetivo no es obligar a que los proyectos sean aprobados, sino evitar que el silencio o la falta de tratamiento funcionen como una decisión encubierta.\n\nTambién prevé mecanismos para que el pleno de la Cámara pueda considerar un expediente cuando la comisión no se expida dentro del plazo reglamentario. De ese modo se busca fortalecer la rendición de cuentas, la trazabilidad del trabajo parlamentario y el derecho de todos los bloques a obtener una respuesta.\n\nEl expediente fue presentado el 5 de agosto de 2026 y fue remitido a la Comisión de Peticiones, Reglamento y Poderes. **Aún no fue aprobado**. [Consultá la ficha pública del proyecto](/proyectos/?id=EXP-20215) y [descargá el expediente oficial](/api/projects/public/EXP-20215/documents/043953ea-eb2e-45b0-af35-5f72e20ffe2e/download).",
    documento:
      "/api/projects/public/EXP-20215/documents/043953ea-eb2e-45b0-af35-5f72e20ffe2e/download",
  },
];

const data = JSON.parse(await readFile(pressPath, "utf8"));
if (!Array.isArray(data.items)) throw new Error("src/content/prensa.json no contiene items[]");

for (const item of NEWS) {
  const existingIndex = data.items.findIndex((candidate) => candidate.id === item.id);
  if (existingIndex >= 0) data.items[existingIndex] = item;
  else data.items.push(item);
}

const ids = data.items.map((item) => item.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) throw new Error(`IDs de Novedades duplicados: ${duplicates.join(", ")}`);

await writeFile(pressPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      path: pressPath,
      total: data.items.length,
      upserted: NEWS.map((item) => item.id),
    },
    null,
    2,
  ),
);
