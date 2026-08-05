import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://ceciliagortari.com.ar";
const OFFICIAL_BASE = "https://hcdcorrientes.gov.ar";
const args = process.argv.slice(2);

function argument(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const apply = args.includes("--apply");
const resume = args.includes("--resume");
const backupDir = argument("--backup-dir");
const officialDir = argument("--official-dir");
const outputPath = argument("--output", "work/sesion-2026-08-05-resultado.json");

if (!backupDir || !officialDir) {
  throw new Error(
    "Uso: node scripts/actualizar-sesion-2026-08-05.mjs " +
      "--backup-dir <respaldo> --official-dir <pdfs> " +
      "[--output <resultado.json>] [--apply] [--resume]",
  );
}

const PROJECTS = [
  {
    number: "20211",
    id: "EXP-20211",
    type: "Proyecto de Resolución",
    officialTitle:
      "Solicita al Poder Ejecutivo, que a través de los organismos competentes, informe sobre el estado y financiamiento de obras públicas anunciadas por el Gobierno Provincial.",
    publicTitle: "Pedido de informes sobre obras públicas anunciadas por el Gobierno Provincial",
    area: "Infraestructura",
    commissions: ["Energía, Transporte, Obras y Servicios Públicos"],
    status: "En comisiones",
    authorship: "coautoria",
    authorPrincipal: "Gustavo Canteros y Emiliano Fernández Recalde",
    summary:
      "El proyecto solicita información detallada sobre el estado actual, el financiamiento, los convenios, los plazos, el avance físico y presupuestario y las eventuales demoras de distintas obras públicas anunciadas por el Gobierno provincial. Su objetivo es garantizar transparencia y permitir el seguimiento efectivo de los compromisos públicos asumidos.",
    filename: "EXPTE-20211-RESOLUCION-obras-publicas.pdf",
    expectedText: ["EXPTE 20211", "PROYECTO DE RESOLUCIÓN", "obras públicas", "estratégicas anunciadas"],
  },
  {
    number: "20212",
    id: "EXP-20212",
    legacyId: "P-0086",
    type: "Proyecto de Ley",
    officialTitle:
      "Crea el Régimen de Aprovechamiento Social, Energético y Productivo de la Porción Provincial de las Regalías Hidroeléctricas de Yacyretá.",
    publicTitle: "Aprovechamiento social y productivo de las regalías de Yacyretá",
    area: "Producción",
    commissions: ["Energía, Transporte, Obras y Servicios Públicos"],
    status: "En comisiones",
    authorship: "coautoria",
    authorPrincipal: "Gustavo Canteros y Emiliano Fernández Recalde",
    summary:
      "La iniciativa propone establecer un régimen provincial para que una parte de las regalías hidroeléctricas provenientes de Yacyretá sea destinada de manera planificada, transparente y verificable a inversiones sociales, energéticas, productivas y de infraestructura que generen desarrollo para Corrientes.",
    filename: "EXPTE-20212-LEY-regalias-yacyreta.pdf",
    expectedText: ["EXPTE 20212", "PROYECTO DE LEY", "Regalías Hidroeléctricas de Yacyretá"],
  },
  {
    number: "20213",
    id: "EXP-20213",
    type: "Proyecto de Ley",
    officialTitle: "De Efectividad e Implementación de las Leyes Provinciales.",
    publicTitle: "Efectividad e implementación de las leyes provinciales",
    area: "Transparencia institucional",
    commissions: ["Asuntos Constitucionales y Legislación General"],
    status: "En comisiones",
    authorship: "acompanado",
    authorPrincipal: "",
    summary:
      "La iniciativa propone que las leyes provinciales no queden sin aplicación por falta de reglamentación. Prevé plazos, un registro público digital, informes anuales y un relevamiento de normas pendientes para fortalecer la transparencia, la seguridad jurídica y la eficacia de la acción estatal.",
    filename: "EXPTE-20213-LEY-efectividad-leyes.pdf",
    expectedText: ["EXPTE 20213", "PROYECTO DE LEY", "Efectividad e Implementación de las Leyes"],
  },
  {
    number: "20214",
    id: "EXP-20214",
    legacyId: "P-0089",
    type: "Proyecto de Ley",
    officialTitle: "Adopción del Símbolo Internacional de Accesibilidad Universal.",
    publicTitle: "Adopción del nuevo Símbolo Internacional de Accesibilidad Universal",
    area: "Discapacidad",
    commissions: ["Protección de Personas con Discapacidad"],
    status: "En comisiones",
    authorship: "coautoria",
    authorPrincipal: "Gustavo Canteros y Emiliano Fernández Recalde",
    summary:
      "El proyecto propone adoptar progresivamente en la Provincia de Corrientes el Símbolo Internacional de Accesibilidad Universal, promoviendo una concepción integral de la accesibilidad que contemple las barreras físicas, sensoriales, cognitivas, comunicacionales y digitales.",
    filename: "EXPTE-20214-LEY-accesibilidad-universal.pdf",
    expectedText: ["EXPTE 20214", "PROYECTO DE LEY", "Símbolo Internacional de Accesibilidad Universal"],
  },
  {
    number: "20215",
    id: "EXP-20215",
    legacyId: "P-0088",
    type: "Proyecto de Resolución",
    officialTitle: "Modifica el Reglamento de la Honorable Cámara de Diputados.",
    publicTitle: "Reforma del Reglamento para evitar la paralización de los proyectos",
    area: "Transparencia institucional",
    commissions: ["Peticiones, Reglamento y Poderes"],
    status: "En comisiones",
    authorship: "coautoria",
    authorPrincipal: "Gustavo Canteros y Emiliano Fernández Recalde",
    summary:
      "La propuesta modifica el Reglamento de la Cámara de Diputados para fortalecer el funcionamiento de las comisiones, promover el tratamiento efectivo de los expedientes y evitar que proyectos de ley y de resolución permanezcan indefinidamente paralizados hasta perder estado parlamentario.",
    filename: "EXPTE-20215-RESOLUCION-reforma-reglamento.pdf",
    expectedText: ["EXPTE 20215", "PROYECTO DE RESOLUCIÓN", "Modificar el Reglamento Interno"],
  },
  {
    number: "20224",
    id: "EXP-20224",
    type: "Proyecto de Ley",
    officialTitle:
      "Regulación de la Sedación Consciente en Odontología y Modernización del Ejercicio Profesional.",
    publicTitle: "Regulación de la sedación consciente en odontología",
    area: "Salud",
    commissions: ["Salud Pública"],
    status: "En comisiones",
    authorship: "acompanado",
    authorPrincipal: "",
    summary:
      "La propuesta actualiza la Ley 2839 para regular la sedación consciente con óxido nitroso y oxígeno en odontología, bajo capacitación, protocolos y fiscalización sanitaria. También incorpora la teleodontología y las unidades móviles, con prioridad para niñas y niños, personas con discapacidad, pacientes neurodivergentes y personas con odontofobia.",
    filename: "EXPTE-20224-LEY-sedacion-odontologia.pdf",
    expectedText: ["EXPTE 20224", "PROYECTO DE LEY", "SEDACIÓN CONSCIENTE EN ODONTOLOGÍA"],
  },
  {
    number: "20225",
    id: "EXP-20225",
    type: "Proyecto de Ley",
    officialTitle: "Modifica la ley 6724 -Accesibilidad Cognitiva y Comunicacional: Lectura fácil-.",
    publicTitle: "Actualización de la Ley de Accesibilidad Cognitiva y Lectura Fácil",
    area: "Discapacidad",
    commissions: ["Protección de Personas con Discapacidad"],
    status: "En comisiones",
    authorship: "acompanado",
    authorPrincipal: "",
    summary:
      "El proyecto modifica la Ley 6724 para ampliar la accesibilidad cognitiva y comunicacional mediante lectura fácil, sistemas alternativos y aumentativos de comunicación, pictogramas y formatos comprensibles. Prevé una aplicación gradual en ámbitos públicos y privados de concurrencia masiva, con adecuaciones, incentivos y controles.",
    filename: "EXPTE-20225-LEY-lectura-facil.pdf",
    expectedText: ["PROYECTO DE LEY", "Ley Provincial 6.724", "ACCESIBILIDAD COGNITIVA"],
    officialSourceNote:
      "La ficha oficial y la URL corresponden al expediente 20225, pero la primera línea interna del PDF oficial dice 'EXPTE 20254'. El objeto, tipo e iniciadores sí coinciden con la ficha 20225.",
  },
  {
    number: "20226",
    id: "EXP-20226",
    type: "Proyecto de Declaración",
    officialTitle:
      "De interés la destacada participación y los premios obtenidos por los reproductores y cabañas de la provincia de Corrientes en la Exposición Rural de Palermo.",
    publicTitle: "Reconocimiento a las cabañas correntinas premiadas en la Exposición Rural de Palermo",
    area: "Producción",
    commissions: ["Sobre Tablas"],
    status: "Aprobado",
    authorship: "acompanado",
    authorPrincipal: "",
    summary:
      "La iniciativa reconoce la destacada participación de reproductores, cabañas y productores correntinos en la Exposición Rural de Palermo, poniendo en valor la excelencia genética y el aporte del sector al desarrollo agropecuario. Fue tratada sobre tablas y aprobada como Declaración 257 junto con el expediente 20235, referido al mismo tema.",
    filename: "EXPTE-20226-DECLARACION-cabana-rural-palermo.pdf",
    expectedText: ["EXPTE 20226", "PROYECTO DE DECLARACION", "Exposición Rural de Palermo"],
  },
  {
    number: "20231",
    id: "EXP-20231",
    type: "Proyecto de Declaración",
    officialTitle:
      "De interés las actividades que se realicen en conmemoración de la fiesta patronal de San Cayetano, patrono del trabajo, en la localidad de San Cayetano.",
    publicTitle: "Actividades en honor a San Cayetano, patrono del trabajo",
    area: "Cultura",
    commissions: ["Sobre Tablas"],
    status: "Aprobado",
    authorship: "acompanado",
    authorPrincipal: "",
    summary:
      "La declaración reconoce las actividades religiosas, culturales y comunitarias de la fiesta patronal de San Cayetano, que cada 7 de agosto reúne a fieles y peregrinos en la localidad homónima y forma parte del patrimonio espiritual e identitario de Corrientes. Fue aprobada como Declaración 261.",
    filename: "EXPTE-20231-DECLARACION-san-cayetano.pdf",
    expectedText: ["EXPTE 20231", "PROYECTO DE DECLARACIÓN", "Fiesta Patronal de San Cayetano"],
  },
  {
    number: "20232",
    id: "EXP-20232",
    type: "Proyecto de Declaración",
    officialTitle:
      "De interés las actividades que se realicen en conmemoración del Día Nacional de la Educación Especial.",
    publicTitle: "Conmemoración del Día Nacional de la Educación Especial",
    area: "Educación",
    commissions: ["Sobre Tablas"],
    status: "Aprobado",
    authorship: "acompanado",
    authorPrincipal: "",
    summary:
      "La declaración reconoce las actividades por el Día Nacional de la Educación Especial y la labor de docentes, profesionales, instituciones, familias y organizaciones que promueven trayectorias educativas inclusivas, accesibles y respetuosas de la diversidad. Fue aprobada como Declaración 262.",
    filename: "EXPTE-20232-DECLARACION-educacion-especial.pdf",
    expectedText: ["EXPTE 20232", "PROYECTO DE DECLARACIÓN", "Día Nacional de la Educación Especial"],
  },
];

const backupSummary = JSON.parse(
  await readFile(path.join(backupDir, "backup-summary.json"), "utf8"),
);
const backupProjects = JSON.parse(
  await readFile(path.join(backupDir, "projects.json"), "utf8"),
);
const backupDocumentGroups = JSON.parse(
  await readFile(path.join(backupDir, "documents-metadata.json"), "utf8"),
);
const backupManifest = JSON.parse(
  await readFile(path.join(backupDir, "documents-manifest.json"), "utf8"),
);
const officialManifest = JSON.parse(
  await readFile(path.join(officialDir, "official-manifest.json"), "utf8"),
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function comparableDocument(document) {
  return `${document.kind}|${document.original_name}|${Number(document.size_bytes || 0)}`;
}

async function fetchBytes(url, options = {}) {
  const response = await fetch(url, { redirect: "follow", ...options });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) {
    throw new Error(`${response.status} ${url}: ${bytes.toString("utf8", 0, 600)}`);
  }
  return { response, bytes };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 600) };
  }
  if (!response.ok) {
    const error = new Error(`${response.status} ${url}: ${JSON.stringify(data)}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function uploadFile(url, filePath, originalName, mimeType) {
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType }), originalName);
  return fetchJson(url, { method: "POST", body: form });
}

function validateBackup() {
  const checks = {
    project_count_matches: backupSummary.projects === backupProjects.length,
    document_count_matches: backupSummary.documents_listed === backupManifest.length,
    all_documents_downloaded:
      backupSummary.documents_downloaded === backupSummary.documents_listed,
    no_empty_documents: backupSummary.documents_empty === 0,
    no_failed_documents: backupSummary.documents_failed === 0,
    all_manifest_items_valid: backupManifest.every(
      (item) => item.status === "downloaded" && item.bytes > 0 && item.sha256,
    ),
  };
  if (Object.values(checks).some((value) => !value)) {
    throw new Error(`El respaldo no supera integridad: ${JSON.stringify(checks)}`);
  }
  return checks;
}

async function validateOfficialFiles() {
  const validations = [];
  for (const record of PROJECTS) {
    const manifest = officialManifest.find((item) => item.expediente === record.number);
    if (!manifest) throw new Error(`${record.id}: falta en el manifiesto oficial`);
    const filePath = path.join(officialDir, record.filename);
    const bytes = await readFile(filePath);
    const textPath = filePath.replace(/\.pdf$/i, ".txt");
    const extracted = normalizeText(await readFile(textPath, "utf8"));
    const expectedHash = manifest.sha256;
    const actualHash = sha256(bytes);
    const expectedPage = `${OFFICIAL_BASE}/expedientes/${record.number}/`;
    const expectedPdf = `${OFFICIAL_BASE}/wp-content/uploads/2026/08/Expte-${record.number}.pdf`;
    const missingTokens = record.expectedText.filter(
      (token) => !extracted.includes(normalizeText(token)),
    );
    const result = {
      id: record.id,
      filename: record.filename,
      page_url: manifest.page_url,
      pdf_url: manifest.pdf_url,
      page_status: manifest.page_status,
      pdf_status: manifest.pdf_status,
      content_type: manifest.content_type,
      bytes: bytes.length,
      sha256: actualHash,
      header: bytes.subarray(0, 5).toString("ascii"),
      missing_tokens: missingTokens,
      official_source_note: record.officialSourceNote || "",
    };
    const ok =
      manifest.page_url === expectedPage &&
      manifest.pdf_url === expectedPdf &&
      manifest.page_status === 200 &&
      manifest.pdf_status === 200 &&
      /^application\/pdf/i.test(manifest.content_type) &&
      result.header === "%PDF-" &&
      result.bytes > 0 &&
      actualHash === expectedHash &&
      missingTokens.length === 0;
    if (!ok) throw new Error(`${record.id}: PDF oficial inválido: ${JSON.stringify(result)}`);
    validations.push(result);
  }
  return validations;
}

async function verifyProductionMatchesBackup(allowAppliedTargets = false) {
  const liveProjects = await fetchJson(`${BASE_URL}/api/projects`);
  const fields = [
    "id",
    "tipo",
    "titulo",
    "responsable",
    "area_tema",
    "resumen",
    "estado_preparacion",
    "fecha_presentacion",
    "estado_tramite",
    "created_at",
    "updated_at",
    "tipo_autoria",
    "autor_principal",
    "has_main_doc",
    "has_expediente",
    "materials_count",
  ];
  const canonical = (project) =>
    fields.map((field) => `${field}=${String(project[field] ?? "")}`).join("|");
  const targetIds = new Set(PROJECTS.map((record) => record.id));
  const legacyIds = new Set(PROJECTS.map((record) => record.legacyId).filter(Boolean));
  const liveMap = new Map(
    liveProjects
      .filter((project) => !allowAppliedTargets || !targetIds.has(project.id))
      .map((project) => [project.id, canonical(project)]),
  );
  const backupMap = new Map(
    backupProjects
      .filter((project) => !allowAppliedTargets || !legacyIds.has(project.id))
      .map((project) => [project.id, canonical(project)]),
  );
  if (
    liveMap.size !== backupMap.size ||
    [...backupMap].some(([id, value]) => liveMap.get(id) !== value)
  ) {
    throw new Error("Producción cambió desde el respaldo; se requiere un respaldo nuevo.");
  }

  for (const group of backupDocumentGroups) {
    const live = await fetchJson(group.metadata_url);
    const flatten = (documents) =>
      [
        ...(documents.main ? [documents.main] : []),
        ...(documents.expediente ? [documents.expediente] : []),
        ...(documents.materials || []),
      ]
        .map(comparableDocument)
        .sort();
    if (JSON.stringify(flatten(live)) !== JSON.stringify(flatten(group))) {
      throw new Error(`Los documentos de ${group.project_id} cambiaron desde el respaldo.`);
    }
  }
  return liveProjects;
}

function projectPayload(record, existingTarget, legacyProject, now) {
  return {
    id: record.id,
    tipo: record.type,
    titulo: record.publicTitle,
    responsable: "Gonzalo",
    area_tema: record.area,
    resumen: record.summary,
    estado_preparacion: "Presentado",
    fecha_objetivo_presentacion: "",
    fecha_presentacion: "2026-08-05",
    estado_tramite: record.status,
    created_at: existingTarget?.created_at || legacyProject?.created_at || now,
    updated_at: now,
    action_plan: existingTarget?.action_plan || legacyProject?.action_plan || [],
    tipo_autoria: record.authorship,
    autor_principal: record.authorPrincipal,
    comisiones: record.commissions,
  };
}

async function documentHash(projectId, document) {
  const url =
    `${BASE_URL}/api/projects/public/${encodeURIComponent(projectId)}` +
    `/documents/${encodeURIComponent(document.id)}/download`;
  const { response, bytes } = await fetchBytes(url);
  return {
    url,
    status: response.status,
    content_type: response.headers.get("content-type") || "",
    bytes,
    sha256: sha256(bytes),
    header: bytes.subarray(0, 5).toString("ascii"),
  };
}

async function processProject(record, initialProjects) {
  const now = new Date().toISOString();
  const existingTarget = initialProjects.find((project) => project.id === record.id);
  const legacyProject = record.legacyId
    ? initialProjects.find((project) => project.id === record.legacyId)
    : null;
  const payload = projectPayload(record, existingTarget, legacyProject, now);
  const projectUrl = `${BASE_URL}/api/projects`;
  const docsUrl = `${BASE_URL}/api/projects/${encodeURIComponent(record.id)}/documents`;
  const officialPath = path.join(officialDir, record.filename);
  const officialBytes = await readFile(officialPath);
  const officialHash = sha256(officialBytes);

  await fetchJson(projectUrl, { method: "POST", body: JSON.stringify(payload) });
  let documents = await fetchJson(docsUrl);
  let mainMigrated = false;

  if (record.legacyId && legacyProject?.has_main_doc && !documents.main) {
    const legacyMain = backupManifest.find(
      (item) => item.project_id === record.legacyId && item.kind === "main",
    );
    if (!legacyMain) throw new Error(`${record.id}: no se halló el DOCX legado en el respaldo`);
    await uploadFile(
      `${docsUrl}/main`,
      path.join(backupDir, legacyMain.local_path),
      legacyMain.original_name,
      legacyMain.content_type || legacyMain.declared_mime_type,
    );
    mainMigrated = true;
    documents = await fetchJson(docsUrl);
  }

  let expedienteUploaded = false;
  if (documents.expediente) {
    const current = await documentHash(record.id, documents.expediente);
    if (current.sha256 !== officialHash) {
      await uploadFile(`${docsUrl}/expediente`, officialPath, record.filename, "application/pdf");
      expedienteUploaded = true;
      documents = await fetchJson(docsUrl);
    }
  } else {
    await uploadFile(`${docsUrl}/expediente`, officialPath, record.filename, "application/pdf");
    expedienteUploaded = true;
    documents = await fetchJson(docsUrl);
  }

  if (!documents.expediente) throw new Error(`${record.id}: expediente ausente después de cargar`);
  const downloaded = await documentHash(record.id, documents.expediente);
  const previewUrl =
    `${BASE_URL}/api/projects/public/${encodeURIComponent(record.id)}` +
    `/documents/${encodeURIComponent(documents.expediente.id)}/preview`;
  const preview = await fetchBytes(previewUrl);
  const errors = [];
  if (downloaded.sha256 !== officialHash) errors.push("SHA-256 remoto distinto del oficial");
  if (downloaded.header !== "%PDF-") errors.push("cabecera PDF remota inválida");
  if (!/^application\/pdf/i.test(downloaded.content_type)) {
    errors.push(`Content-Type de descarga inválido: ${downloaded.content_type}`);
  }
  if (preview.bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    errors.push("vista previa sin cabecera PDF");
  }
  if (!/^application\/pdf/i.test(preview.response.headers.get("content-type") || "")) {
    errors.push("vista previa sin Content-Type PDF");
  }
  if (Number(documents.expediente.size_bytes) !== downloaded.bytes.length) {
    errors.push("tamaño declarado distinto del descargado");
  }
  if (record.legacyId && legacyProject?.has_main_doc && !documents.main) {
    errors.push("DOCX legado no migrado");
  }
  if (errors.length) throw new Error(`${record.id}: ${errors.join("; ")}`);

  if (record.legacyId && legacyProject) {
    await fetchJson(`${BASE_URL}/api/projects/${encodeURIComponent(record.legacyId)}`, {
      method: "DELETE",
    });
  }

  return {
    id: record.id,
    action: existingTarget ? "updated" : "created",
    legacy_id: record.legacyId || null,
    legacy_soft_deleted: Boolean(record.legacyId && legacyProject),
    main_migrated: mainMigrated,
    expediente_uploaded: expedienteUploaded,
    project: payload,
    official_page_url: `${OFFICIAL_BASE}/expedientes/${record.number}/`,
    official_pdf_url: `${OFFICIAL_BASE}/wp-content/uploads/2026/08/Expte-${record.number}.pdf`,
    public_project_url: `${BASE_URL}/proyectos/?id=${encodeURIComponent(record.id)}`,
    document: {
      id: documents.expediente.id,
      original_name: documents.expediente.original_name,
      bytes: downloaded.bytes.length,
      sha256: downloaded.sha256,
      download_url: downloaded.url,
      preview_url: previewUrl,
      download_status: downloaded.status,
      preview_status: preview.response.status,
      content_type: downloaded.content_type,
    },
    official_source_note: record.officialSourceNote || "",
  };
}

function countBy(items, field) {
  return Object.fromEntries(
    [...new Set(items.map((item) => item[field]))]
      .sort()
      .map((value) => [value, items.filter((item) => item[field] === value).length]),
  );
}

function sameCounts(actual, expected) {
  const keys = [...new Set([...Object.keys(actual), ...Object.keys(expected)])];
  return keys.every((key) => Number(actual[key] || 0) === Number(expected[key] || 0));
}

async function auditFinal(results) {
  const live = await fetchJson(`${BASE_URL}/api/projects`);
  const ids = new Set(PROJECTS.map((record) => record.id));
  const targets = live.filter((project) => ids.has(project.id));
  const errors = [];
  for (const record of PROJECTS) {
    const project = targets.find((item) => item.id === record.id);
    if (!project) {
      errors.push(`${record.id}: ausente`);
      continue;
    }
    const expected = projectPayload(record, project, null, project.updated_at);
    for (const field of [
      "tipo",
      "titulo",
      "area_tema",
      "resumen",
      "estado_preparacion",
      "fecha_presentacion",
      "estado_tramite",
      "tipo_autoria",
      "autor_principal",
    ]) {
      if (String(project[field] ?? "") !== String(expected[field] ?? "")) {
        errors.push(`${record.id}: ${field} no coincide`);
      }
    }
    if (JSON.stringify(project.comisiones) !== JSON.stringify(record.commissions)) {
      errors.push(`${record.id}: comisiones no coinciden`);
    }
    if (!project.has_expediente) errors.push(`${record.id}: sin expediente`);
  }

  const duplicateIds = live
    .map((project) => project.id)
    .filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`IDs duplicados: ${duplicateIds.join(", ")}`);

  const legacyActive = PROJECTS.filter((record) => record.legacyId)
    .map((record) => record.legacyId)
    .filter((id) => live.some((project) => project.id === id));
  if (legacyActive.length) errors.push(`IDs provisorios aún activos: ${legacyActive.join(", ")}`);

  const expectedTypeCounts = {
    "Proyecto de Ley": 5,
    "Proyecto de Resolución": 2,
    "Proyecto de Declaración": 3,
  };
  const expectedAuthorshipCounts = { acompanado: 6, coautoria: 4 };
  const expectedStatusCounts = { Aprobado: 3, "En comisiones": 7 };
  const typeCounts = countBy(targets, "tipo");
  const authorshipCounts = countBy(targets, "tipo_autoria");
  const statusCounts = countBy(targets, "estado_tramite");
  if (!sameCounts(typeCounts, expectedTypeCounts)) {
    errors.push(`tipos inesperados: ${JSON.stringify(typeCounts)}`);
  }
  if (!sameCounts(authorshipCounts, expectedAuthorshipCounts)) {
    errors.push(`autorías inesperadas: ${JSON.stringify(authorshipCounts)}`);
  }
  if (!sameCounts(statusCounts, expectedStatusCounts)) {
    errors.push(`trámites inesperados: ${JSON.stringify(statusCounts)}`);
  }

  return {
    audited_at: new Date().toISOString(),
    active_projects: live.length,
    targets_present: targets.length,
    types: typeCounts,
    authorship: authorshipCounts,
    statuses: statusCounts,
    legacy_active: legacyActive,
    duplicate_ids: duplicateIds,
    documents_verified: results.filter((result) => result.document?.sha256).length,
    errors,
  };
}

const startedAt = new Date().toISOString();
const backupChecks = validateBackup();
const officialFiles = await validateOfficialFiles();
const initialProjects = await verifyProductionMatchesBackup(apply && resume);
const initialTargetIds = PROJECTS.filter((record) =>
  initialProjects.some((project) => project.id === record.id),
).map((record) => record.id);

const result = {
  started_at: startedAt,
  finished_at: null,
  mode: apply ? (resume ? "resume" : "apply") : "dry-run",
  branch: "feat/sesion-2026-08-05-proyectos",
  backup_dir: backupDir,
  backup_summary: backupSummary,
  backup_checks: backupChecks,
  official_files: officialFiles,
  initial_targets: initialTargetIds,
  records: [],
  audit: null,
  errors: [],
};

if (apply) {
  for (const record of PROJECTS) {
    try {
      result.records.push(await processProject(record, initialProjects));
      await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    } catch (error) {
      result.errors.push({
        id: record.id,
        error: error instanceof Error ? error.message : String(error),
      });
      break;
    }
  }
  if (result.errors.length === 0) result.audit = await auditFinal(result.records);
} else {
  result.records = PROJECTS.map((record) => ({
    id: record.id,
    action: initialTargetIds.includes(record.id) ? "would_update" : "would_create",
    legacy_id: record.legacyId || null,
    official_pdf: path.join(officialDir, record.filename),
  }));
}

result.finished_at = new Date().toISOString();
result.success =
  result.errors.length === 0 && (!result.audit || result.audit.errors.length === 0);
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      mode: result.mode,
      success: result.success,
      records: result.records.length,
      created: result.records.filter((record) => record.action === "created").length,
      updated: result.records.filter((record) => record.action === "updated").length,
      errors: result.errors,
      audit: result.audit,
      output: outputPath,
    },
    null,
    2,
  ),
);
if (!result.success) process.exitCode = 1;
