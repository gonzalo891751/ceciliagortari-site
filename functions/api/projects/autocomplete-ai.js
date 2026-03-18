const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const VALID_AREAS = [
  "Salud", "Educación", "Niñez y Adolescencia", "Género y Diversidad",
  "Derechos Humanos", "Transparencia Institucional", "Trabajo y Salud Ocupacional",
  "Desarrollo Social", "Discapacidad", "Seguridad", "Justicia",
  "Economía y Producción", "Ambiente", "Cultura", "Deportes",
  "Infraestructura", "Gobierno y Administración", "Sin clasificar"
];

const VALID_TIPOS = ["ley", "resolucion", "declaracion"];
const VALID_AUTORIA = ["propio_cecilia", "coautoria", "externo_con_acompanamiento"];

function buildSystemPrompt() {
  return `Eres un analista de gestión legislativa de la Cámara de Diputados de la Provincia de Corrientes, Argentina. Tu tarea es generar metadatos de gestión interna a partir de secciones extraídas de expedientes legislativos.

REGLAS ABSOLUTAS:
1. Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin explicaciones, sin texto previo ni posterior al JSON.
2. Si no puedes inferir un dato, usa null. NO inventes.
3. La confianza es un número entre 0.0 y 1.0.

CATÁLOGO CERRADO DE TIPOS (solo estos valores exactos):
- "ley"
- "resolucion"
- "declaracion"

CATÁLOGO CERRADO DE ÁREAS/TEMAS (solo estos valores exactos):
${VALID_AREAS.map(a => `- "${a}"`).join('\n')}

REGLAS CRÍTICAS PARA EL TÍTULO:
El título es para GESTIÓN INTERNA, no para publicación oficial. Debe ser:
- Corto: ideal 50-110 caracteres, MÁXIMO ABSOLUTO 140
- Claro y directo: que al leerlo en una lista se entienda de qué trata
- PROHIBIDO copiar textualmente el bloque OBJETO
- PROHIBIDO empezar con verbos imperativos legales ("Declarar...", "Disponer...", "Solicitar...")
- PROHIBIDO usar "..." para truncar
- Transformar la acción legal en sustantivo: "Declarar de interés" → "Interés legislativo de...", "Disponer la colocación" → "Colocación de..."
- Eliminar fórmulas institucionales redundantes ("de esta Honorable Cámara de Diputados de la Provincia de Corrientes")

REGLAS CRÍTICAS PARA EL RESUMEN:
- NO repetir el título textualmente
- Explicar qué propone/declara/solicita el proyecto y a quién afecta
- Empezar con "Proyecto de [ley/resolución/declaración] para..."
- Ideal 120-240 caracteres
- PROHIBIDO copiar párrafos del documento
- Debe sonar como la descripción de una ficha de gestión, no como texto legal

AUTORÍA:
La legisladora titular del sistema es María Cecilia Gortari (Diputada Provincial de Corrientes).
- "propio_cecilia": Gortari es la única autora/iniciadora
- "coautoria": Gortari aparece junto a otros legisladores como co-iniciadores
- "externo_con_acompanamiento": otro legislador es claramente el autor principal y Gortari acompaña/cofirma

EJEMPLOS DE TRANSFORMACIÓN CORRECTA:

Ejemplo 1 - Resolución:
OBJETO: "Disponer la colocación de una placa recordatoria de adhesión de la Honorable Cámara de Diputados de la Provincia de Corrientes por el Sexagésimo Quinto Aniversario de la Escuela Normal Superior Dr. Juan Pujol de la Ciudad de Gobernador Virasoro"
titulo_sugerido CORRECTO: "Placa conmemorativa por el 65° aniversario de la Escuela Normal de Virasoro"
titulo_sugerido INCORRECTO: "Disponer la colocación de una placa recordatoria de adhesión de la Honorable Cámara..."
resumen_sugerido CORRECTO: "Proyecto de resolución para colocar una placa de adhesión institucional por el aniversario de la creación de la Escuela Normal Superior Dr. Juan Pujol de Gobernador Virasoro."

Ejemplo 2 - Declaración:
OBJETO: "Declarar de interés legislativo y social el informe elaborado por la Fundación FUNDHEG sobre el monitoreo de la implementación de normativas de salud sexual y reproductiva en la Provincia de Corrientes"
titulo_sugerido CORRECTO: "Interés legislativo del informe FUNDHEG sobre salud sexual y reproductiva"
titulo_sugerido INCORRECTO: "Declarar de interés legislativo y social el informe elaborado por la Fundación FUNDHEG sobre el monitoreo..."
resumen_sugerido CORRECTO: "Proyecto de declaración para expresar interés legislativo por el informe de FUNDHEG sobre el monitoreo de la implementación de normas de salud sexual y reproductiva en Corrientes."

Ejemplo 3 - Ley:
OBJETO: "Inhabilitación de acceso a salas de juego y plataformas de apuestas para personas inscriptas en el Registro de Deudores Alimentarios Morosos"
titulo_sugerido CORRECTO: "Inhabilitación de deudores alimentarios para acceso a salas de juego"
titulo_sugerido INCORRECTO: "Inhabilitación de acceso a salas de juego y plataformas de apuestas para personas inscriptas en el Registro de Deudores Alimentarios Morosos"
resumen_sugerido CORRECTO: "Proyecto de ley para impedir el ingreso o permanencia de deudores alimentarios morosos en casinos, bingos, agencias de apuesta y plataformas de juego online."

FORMATO DE RESPUESTA (JSON exacto, sin nada más):
{
  "tipo_proyecto": { "valor": "ley|resolucion|declaracion", "confianza": 0.0 },
  "titulo_sugerido": { "valor": "string", "confianza": 0.0 },
  "resumen_sugerido": { "valor": "string", "confianza": 0.0 },
  "area_tema": { "valor": "string del catálogo", "confianza": 0.0 },
  "autoria": { "valor": "propio_cecilia|coautoria|externo_con_acompanamiento", "confianza": 0.0 },
  "autor_principal": { "valor": "string|null", "confianza": 0.0 },
  "coautores": { "valor": ["string"], "confianza": 0.0 },
  "justificacion_breve": "string breve"
}`;
}

/**
 * Build user prompt with STRUCTURED sections, not raw text blob.
 */
function buildUserPrompt(sections, sourceType, extractionMethod) {
  const sourceLabel = sourceType === 'expediente' ? 'expediente definitivo legislativo' : 'documento del proyecto';
  const methodLabel = {
    digital: 'extracción digital directa de PDF',
    ocr: 'OCR (puede contener errores de reconocimiento)',
    docx: 'extracción de documento DOCX'
  }[extractionMethod] || 'extracción de texto';

  let prompt = `Documento fuente: ${sourceLabel} (método: ${methodLabel})\n\n`;

  // Add each section as clearly labeled block
  if (sections.tipo_detectado) {
    prompt += `TIPO DETECTADO POR REGLAS: ${sections.tipo_detectado}\n(Dato ya validado por parsing. No contradecir salvo error evidente.)\n\n`;
  }

  if (sections.expediente_numero) {
    prompt += `EXPEDIENTE N°: ${sections.expediente_numero}\n\n`;
  }

  if (sections.fecha_ingreso) {
    prompt += `FECHA DE INGRESO: ${sections.fecha_ingreso}\n\n`;
  }

  if (sections.encabezado) {
    prompt += `=== ENCABEZADO DEL DOCUMENTO ===\n${sections.encabezado}\n\n`;
  }

  if (sections.iniciador) {
    prompt += `=== INICIADOR/ES ===\n${sections.iniciador}\n\n`;
  }

  if (sections.objeto) {
    prompt += `=== OBJETO (TEXTO ORIGINAL — NO COPIAR COMO TÍTULO) ===\n${sections.objeto}\n\n`;
  }

  if (sections.fundamentos) {
    prompt += `=== FUNDAMENTOS (extracto inicial) ===\n${sections.fundamentos}\n\n`;
  }

  if (sections.firmas) {
    prompt += `=== FIRMAS / CIERRE ===\n${sections.firmas}\n\n`;
  }

  prompt += `Genera el JSON con los metadatos de gestión. Recuerda: el título debe ser CORTO y REESCRITO, no una copia del OBJETO.`;

  return prompt;
}

/**
 * Extract structured sections from raw text.
 * Returns an object with labeled sections instead of one text blob.
 */
function extractSections(rawText) {
  if (!rawText || rawText.length === 0) return { _raw_length: 0 };

  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const result = { _raw_length: text.length };

  // 1. Header (first ~800 chars)
  result.encabezado = text.substring(0, Math.min(800, text.length)).trim();

  // 2. TIPO detection from header
  if (/PROYECTO\s+DE\s+LEY/i.test(text)) result.tipo_detectado = 'Proyecto de Ley';
  else if (/PROYECTO\s+DE\s+RESOLUCI[OÓ]N/i.test(text)) result.tipo_detectado = 'Proyecto de Resolución';
  else if (/PROYECTO\s+DE\s+DECLARACI[OÓ]N/i.test(text)) result.tipo_detectado = 'Proyecto de Declaración';

  // 3. EXPEDIENTE number
  const exptePatterns = [
    /EXPTE\.?\s*(?:N[°º.]?\s*)?(\d{3,6})/i,
    /Expediente\s+(?:N[°º.]?\s*)?(\d{3,6})/i,
    /EXP(?:TE|EDIENTE)[.\s]*(\d{3,6})/i,
  ];
  for (const pat of exptePatterns) {
    const m = text.match(pat);
    if (m) { result.expediente_numero = m[1]; break; }
  }

  // 4. FECHA INGRESO
  const fechaMatch = text.match(/INGRESO\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (fechaMatch) result.fecha_ingreso = fechaMatch[1];

  // 5. INICIADOR block — try multiple patterns, be generous with end boundary
  const iniciadorPatterns = [
    /INICIADOR(?:ES)?[:\s]+(.+?)(?:\.\-\s*\n|OBJETO)/is,
    /INICIADOR(?:ES)?[:\s]*[:.]?\s*(.+?)(?:\n\s*(?:OBJETO|FUNDAMENTOS))/is,
    /INICIADOR[:\s]+(.+?)(?:OBJETO)/is,
  ];
  for (const pat of iniciadorPatterns) {
    const m = text.match(pat);
    if (m && m[1].trim().length > 5) {
      result.iniciador = m[1].trim().replace(/\.\-$/, '').replace(/\s+/g, ' ').substring(0, 500);
      break;
    }
  }

  // 6. OBJETO block — critical, try multiple patterns
  const objetoPatterns = [
    /OBJETO[:\s]+(.+?)(?:\n\s*FUNDAMENTOS)/is,
    /OBJETO[:\s]+(.+?)(?:\n\s*Honorable\s+C[aá]mara)/is,
    /OBJETO[:\s]+(.+?)(?:\n\s*\n)/is,
    /OBJETO[:\s]*[:.]?\s*(.+?)(?:\n\n)/is,
  ];
  for (const pat of objetoPatterns) {
    const m = text.match(pat);
    if (m && m[1].trim().length > 10) {
      result.objeto = m[1].trim().replace(/\.\-$/, '').replace(/\s+/g, ' ').substring(0, 1000);
      break;
    }
  }

  // 7. FUNDAMENTOS — first substantive paragraphs
  const fundPatterns = [
    /FUNDAMENTOS[:\s]*\n(.+?)(?:\n\s*\n)/is,
    /FUNDAMENTOS[:\s]*\n(.+)/is,
  ];
  for (const pat of fundPatterns) {
    const m = text.match(pat);
    if (m) {
      let fundText = m[1].trim().replace(/\s+/g, ' ');
      // Skip greeting
      fundText = fundText.replace(/^Honorable\s+C[aá]mara[:\s]*/i, '');
      if (fundText.length > 30) {
        result.fundamentos = fundText.substring(0, 1500);
        break;
      }
    }
  }

  // 8. Signature area
  if (text.length > 1000) {
    const tail = text.substring(text.length - 600);
    if (/Diputad[oa]|firma|suscrib/i.test(tail)) {
      result.firmas = tail.trim().substring(0, 600);
    }
  }

  // Calculate how much useful content we found
  result._sections_found = ['encabezado', 'iniciador', 'objeto', 'fundamentos', 'firmas']
    .filter(k => result[k]).length;

  // Total chars being sent
  result._prepared_length = Object.entries(result)
    .filter(([k]) => !k.startsWith('_'))
    .reduce((sum, [, v]) => sum + (typeof v === 'string' ? v.length : 0), 0);

  return result;
}

async function callLLM(systemPrompt, userPrompt, apiKey, model) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`LLM API error ${response.status}: ${errorBody.substring(0, 200)}`);
  }

  const data = await response.json();
  if (data.content && data.content.length > 0) {
    return data.content[0].text;
  }
  throw new Error('Empty LLM response');
}

function validateAndNormalize(rawJson) {
  let jsonStr = rawJson.trim();
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); }
      catch (e2) { throw new Error('Invalid JSON from LLM: ' + jsonStr.substring(0, 100)); }
    } else {
      throw new Error('No JSON found in LLM response: ' + jsonStr.substring(0, 100));
    }
  }

  return {
    tipo_proyecto: normalizeField(parsed.tipo_proyecto, v => VALID_TIPOS.includes(v) ? v : null),
    titulo_sugerido: normalizeField(parsed.titulo_sugerido, v => {
      if (typeof v !== 'string' || v.length < 5) return null;
      return v.length > 160 ? v.substring(0, 157) : v;
    }),
    resumen_sugerido: normalizeField(parsed.resumen_sugerido, v => {
      if (typeof v !== 'string' || v.length < 10) return null;
      return v.length > 300 ? v.substring(0, 297) : v;
    }),
    area_tema: normalizeField(parsed.area_tema, v => {
      if (typeof v !== 'string') return null;
      const match = VALID_AREAS.find(a => a.toLowerCase() === v.toLowerCase());
      return match || null;
    }),
    autoria: normalizeField(parsed.autoria, v => VALID_AUTORIA.includes(v) ? v : null),
    autor_principal: normalizeField(parsed.autor_principal, v => typeof v === 'string' && v.length >= 3 ? v : null),
    coautores: normalizeField(parsed.coautores, v => {
      if (Array.isArray(v) && v.length > 0) return v.filter(c => typeof c === 'string' && c.length >= 3);
      return null;
    }),
    justificacion_breve: typeof parsed.justificacion_breve === 'string' ? parsed.justificacion_breve.substring(0, 500) : null,
  };
}

function normalizeField(field, validator) {
  if (!field || typeof field !== 'object') return { valor: null, confianza: 0 };
  const rawValor = field.valor;
  const confianza = typeof field.confianza === 'number' ? Math.max(0, Math.min(1, field.confianza)) : 0;
  const valor = rawValor != null ? validator(rawValor) : null;
  return { valor, confianza: valor != null ? confianza : 0 };
}

/**
 * POST /api/projects/autocomplete-ai
 * Accepts: { text, source_type, extraction_method, rule_data? }
 * Returns: { ok, data, debug }
 */
export async function onRequestPost(context) {
  const t0 = Date.now();
  try {
    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'AI no configurada. Falta ANTHROPIC_API_KEY.',
        fallback: true,
      }), { status: 503, headers: HEADERS });
    }

    const body = await context.request.json();
    const { text, source_type, extraction_method, rule_data } = body;

    if (!text || typeof text !== 'string' || text.length < 30) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Texto insuficiente para análisis IA.',
        fallback: true,
      }), { status: 400, headers: HEADERS });
    }

    // Extract structured sections
    const sections = extractSections(text);

    // Inject rule-detected data into sections so LLM knows what's already found
    if (rule_data) {
      if (rule_data.tipo && !sections.tipo_detectado) sections.tipo_detectado = rule_data.tipo;
      if (rule_data.numero_expediente && !sections.expediente_numero) sections.expediente_numero = rule_data.numero_expediente;
      if (rule_data.fecha_presentacion && !sections.fecha_ingreso) sections.fecha_ingreso = rule_data.fecha_presentacion;
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(sections, source_type || 'documento', extraction_method || 'digital');

    const model = context.env.AI_MODEL || 'claude-haiku-4-5-20251001';
    const rawResponse = await callLLM(systemPrompt, userPrompt, apiKey, model);
    const result = validateAndNormalize(rawResponse);

    const elapsed = Date.now() - t0;

    return new Response(JSON.stringify({
      ok: true,
      data: result,
      debug: {
        model_used: model,
        elapsed_ms: elapsed,
        raw_text_length: text.length,
        sections_found: sections._sections_found,
        prepared_length: sections._prepared_length,
        has_objeto: !!sections.objeto,
        has_iniciador: !!sections.iniciador,
        has_fundamentos: !!sections.fundamentos,
        has_firmas: !!sections.firmas,
        prompt_preview: userPrompt.substring(0, 500),
        ai_raw_response: rawResponse.substring(0, 800),
      },
    }), { status: 200, headers: HEADERS });

  } catch (err) {
    console.error('[autocomplete-ai] Error:', err.message);
    return new Response(JSON.stringify({
      ok: false,
      error: 'Análisis IA falló: ' + (err.message || 'Error desconocido').substring(0, 200),
      fallback: true,
      debug: { elapsed_ms: Date.now() - t0 },
    }), { status: 500, headers: HEADERS });
  }
}
