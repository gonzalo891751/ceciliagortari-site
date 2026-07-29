import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const pressPath = path.join(ROOT, "src", "content", "prensa.json");
const matrixJsonPath = path.join(ROOT, "docs", "MATRIZ_NOTICIAS_PROYECTOS_AUTORIA_2026.json");
const matrixCsvPath = path.join(ROOT, "docs", "MATRIZ_NOTICIAS_PROYECTOS_AUTORIA_2026.csv");
const sourcesPath = path.join(ROOT, "docs", "FUENTES_IMAGENES_NOTICIAS_PROYECTOS_2026.csv");
const listPath = path.join(ROOT, "docs", "LISTA_ARTICULOS_NOTICIAS_PROYECTOS_2026.csv");
const auditPath = path.join(ROOT, "docs", "INFORME_AUDITORIA_NOTICIAS_PROYECTOS_2026.json");
const pendingPath = path.join(ROOT, "docs", "INFORME_PENDIENTES_NOTICIAS_PROYECTOS_2026.md");
const publicationStatus = process.env.PUBLICATION_STATUS || "cargado_en_fuente";

function escapeCsv(value) {
  const text = String(value ?? "");
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

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function stringifyCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))].join("\n") + "\n";
}

function wordCount(markdown) {
  return markdown
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[*_#>`]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

const press = JSON.parse(await fs.readFile(pressPath, "utf8")).items;
const matrix = JSON.parse(await fs.readFile(matrixJsonPath, "utf8"));
const sourceRows = parseCsv(await fs.readFile(sourcesPath, "utf8"));
const sourceByExpediente = new Map(sourceRows.map((row) => [row.expediente, row]));
const errors = [];
const warnings = [];
const listRows = [];

if (new Set(press.map((item) => item.id)).size !== press.length) {
  errors.push("Hay IDs duplicados en src/content/prensa.json.");
}

const publishable = matrix.items.filter((row) => row.url_expediente);
const pending = matrix.items.filter((row) => !row.url_expediente);

for (const row of publishable) {
  const matches = press.filter(
    (item) =>
      item.cuerpo?.includes(`**${row.expediente}**`) &&
      item.cuerpo?.includes(`https://hcdcorrientes.gov.ar/expedientes/${row.expediente}/`),
  );
  if (matches.length !== 1) {
    errors.push(`Expediente ${row.expediente}: se esperó una noticia y se encontraron ${matches.length}.`);
    continue;
  }

  const article = matches[0];
  const words = wordCount(article.cuerpo);
  const source = sourceByExpediente.get(row.expediente);
  const expectedDate = row.fecha_presentacion;
  const imageRelativePath = article.imagen.replace(/^\//, "").replace(/^assets\//, "src/assets/");
  const imagePath = path.join(ROOT, imageRelativePath);

  if (!article.fecha.startsWith(expectedDate)) {
    errors.push(`Expediente ${row.expediente}: fecha ${article.fecha} no coincide con ${expectedDate}.`);
  }
  if (article.titulo.length < 55 || article.titulo.length > 90) {
    errors.push(`Expediente ${row.expediente}: título de ${article.titulo.length} caracteres.`);
  }
  if (article.subtitulo.length < 140 || article.subtitulo.length > 260) {
    errors.push(`Expediente ${row.expediente}: bajada de ${article.subtitulo.length} caracteres.`);
  }
  if (words < 250 || words > 450) {
    errors.push(`Expediente ${row.expediente}: cuerpo de ${words} palabras.`);
  }
  if (!article.cuerpo.includes("[Conocé los proyectos legislativos](/proyectos/)")) {
    errors.push(`Expediente ${row.expediente}: falta enlace interno a Proyectos.`);
  }
  if (!source) {
    errors.push(`Expediente ${row.expediente}: falta fila de fuente de imagen.`);
  }
  try {
    const image = await fs.stat(imagePath);
    if (!image.isFile() || image.size === 0) errors.push(`Expediente ${row.expediente}: imagen vacía.`);
  } catch {
    errors.push(`Expediente ${row.expediente}: no existe ${article.imagen}.`);
  }
  if (/(^|[.!?]\s+)(se aprobó|fue sancionad[oa]|entró en vigencia|ya está vigente|se implementó)\b/iu.test(article.cuerpo)) {
    errors.push(`Expediente ${row.expediente}: posible afirmación de resultado no permitido.`);
  }

  row.id_noticia_publicada = article.id;
  row.titulo_periodistico_propuesto = article.titulo;
  row.bajada_propuesta = article.subtitulo;
  row.imagen_propuesta = article.imagen;
  row.fuente_imagen = source
    ? `${source.sitio_origen} | ${source.autor_fotografo} | ${source.licencia}`
    : "";
  row.estado_generacion = "contenido_e_imagen_validados";
  row.estado_publicacion = publicationStatus;

  listRows.push({
    expediente: row.expediente,
    id_noticia: article.id,
    titulo: article.titulo,
    bajada: article.subtitulo,
    fecha_publicacion: article.fecha,
    url_noticia: `https://www.ceciliagortari.com.ar/novedades/detalle/?id=${encodeURIComponent(article.id)}`,
    estado: publicationStatus,
    url_proyecto: row.url_proyecto,
    url_expediente: row.url_expediente,
    imagen: article.imagen,
    fuente_imagen: row.fuente_imagen,
    palabras: words,
  });

  if (source) source.noticia = article.id;
}

if (publishable.length !== 35) errors.push(`Se esperaban 35 expedientes publicables y hay ${publishable.length}.`);
if (pending.length !== 1) errors.push(`Se esperaba 1 caso pendiente y hay ${pending.length}.`);
if (listRows.length !== 35) errors.push(`Se esperaban 35 noticias auditadas y hay ${listRows.length}.`);

matrix.counts = {
  ...matrix.counts,
  publishable: publishable.length,
  published_or_loaded: listRows.length,
  pending: pending.length,
};
matrix.audit = {
  generated_at: new Date().toISOString(),
  publication_status: publicationStatus,
  errors: errors.length,
  warnings: warnings.length,
};

const matrixColumns = Object.keys(matrix.items[0]);
await fs.writeFile(matrixJsonPath, JSON.stringify(matrix, null, 2) + "\n", "utf8");
await fs.writeFile(
  matrixCsvPath,
  [matrixColumns.join(","), ...matrix.items.map((row) => matrixColumns.map((column) => escapeCsv(row[column])).join(","))].join("\n") + "\n",
  "utf8",
);
await fs.writeFile(sourcesPath, stringifyCsv(sourceRows), "utf8");
await fs.writeFile(listPath, stringifyCsv(listRows), "utf8");
await fs.writeFile(
  auditPath,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      publication_status: publicationStatus,
      totals: {
        publications_before_update: 13,
        publications_after_update: press.length,
        project_articles: listRows.length,
        existing_articles_updated: 7,
        new_articles_created: 28,
        pending_cases: pending.length,
      },
      errors,
      warnings,
      pending: pending.map((row) => ({
        identificador: row.identificador_interno,
        fecha: row.fecha_presentacion,
        titulo: row.titulo_proyecto,
        reason: row.observaciones,
      })),
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

const pendingLines = pending.map(
  (row) =>
    `- **${row.identificador_interno} — ${row.fecha_presentacion}:** ${row.titulo_proyecto}. ${row.observaciones}`,
);
await fs.writeFile(
  pendingPath,
  `# Casos pendientes — Novedades de proyectos de autoría\n\n` +
    `Corte de control: 29 de julio de 2026.\n\n` +
    `Se publicaron los 35 expedientes clasificados como de autoría propia, presentados y respaldados por una fuente oficial verificable. Quedó excluido el siguiente caso:\n\n` +
    `${pendingLines.join("\n")}\n\n` +
    `## Acción requerida\n\n` +
    `Confirmar el número de expediente, el texto oficial, la fecha efectiva de presentación y las firmas. Una vez incorporada esa evidencia al sistema, el caso puede pasar por el mismo control editorial antes de publicarse.\n`,
  "utf8",
);

console.log(
  JSON.stringify(
    {
      publicationStatus,
      totalPressItems: press.length,
      auditedProjectArticles: listRows.length,
      pending: pending.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    null,
    2,
  ),
);

if (errors.length) process.exitCode = 1;
