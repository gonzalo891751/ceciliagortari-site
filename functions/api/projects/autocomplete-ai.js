const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// Closed catalog of areas/topics
const VALID_AREAS = [
  "Salud", "Educación", "Niñez y Adolescencia", "Género y Diversidad",
  "Derechos Humanos", "Transparencia Institucional", "Trabajo y Salud Ocupacional",
  "Desarrollo Social", "Discapacidad", "Seguridad", "Justicia",
  "Economía y Producción", "Ambiente", "Cultura", "Deportes",
  "Infraestructura", "Gobierno y Administración", "Sin clasificar"
];

const VALID_TIPOS = ["ley", "resolucion", "declaracion"];
const VALID_AUTORIA = ["propio_cecilia", "coautoria", "externo_con_acompanamiento"];

/**
 * Build the system prompt for legislative document analysis.
 */
function buildSystemPrompt() {
  return `Eres un analista experto en documentos legislativos argentinos, específicamente de la Cámara de Diputados de la Provincia de Corrientes. Tu tarea es analizar texto extraído de expedientes y proyectos legislativos y devolver datos estructurados.

REGLAS ESTRICTAS:
1. Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin explicaciones, sin texto extra.
2. Si no puedes inferir un dato con suficiente confianza, usa null como valor.
3. NO inventes datos. Si no hay evidencia clara en el texto, deja null.
4. La confianza es un número entre 0.0 y 1.0.
5. Prioriza exactitud sobre creatividad.

CATÁLOGO CERRADO DE TIPOS DE PROYECTO (usar solo estos valores):
- "ley"
- "resolucion"
- "declaracion"

CATÁLOGO CERRADO DE ÁREAS/TEMAS (usar solo estos valores):
${VALID_AREAS.map(a => `- "${a}"`).join('\n')}

REGLAS PARA EL TÍTULO SUGERIDO:
- NO copiar textualmente el bloque OBJETO del expediente
- Generar un título corto, claro y útil para gestión interna
- Ideal entre 50 y 110 caracteres, máximo 140
- Sin fórmulas jurídicas innecesarias ("Declarar de interés..." → "Interés legislativo de...")
- Sin cortar con "..."
- Mantener el núcleo temático real del proyecto
- Natural y bien escrito en español

REGLAS PARA EL RESUMEN:
- NO repetir el título
- Explicar de qué trata el proyecto, qué propone/declara/solicita
- Breve: ideal entre 120 y 240 caracteres
- Sonar natural y útil para una ficha interna
- NO copiar textualmente del documento

REGLAS SOBRE AUTORÍA:
La legisladora principal del sistema es María Cecilia Gortari (Diputada Provincial).
- Si aparece solo Cecilia Gortari como autora/iniciadora: "propio_cecilia"
- Si aparece Cecilia junto a otros legisladores como coautores: "coautoria"
- Si otro legislador es claramente el autor principal y Cecilia acompaña/adhiere: "externo_con_acompanamiento"
- Si no hay claridad: dejar baja confianza

FORMATO DE RESPUESTA (JSON exacto):
{
  "tipo_proyecto": { "valor": "ley|resolucion|declaracion|null", "confianza": 0.0 },
  "titulo_sugerido": { "valor": "string|null", "confianza": 0.0 },
  "resumen_sugerido": { "valor": "string|null", "confianza": 0.0 },
  "area_tema": { "valor": "string del catálogo|null", "confianza": 0.0 },
  "autoria": { "valor": "propio_cecilia|coautoria|externo_con_acompanamiento|null", "confianza": 0.0 },
  "autor_principal": { "valor": "string|null", "confianza": 0.0 },
  "coautores": { "valor": ["string"]|null, "confianza": 0.0 },
  "justificacion_breve": "string breve explicando las decisiones clave",
  "fragmentos_respaldo": ["fragmento relevante del texto"]
}`;
}

/**
 * Build the user prompt with the document text and context.
 */
function buildUserPrompt(text, sourceType, extractionMethod) {
  const sourceLabel = sourceType === 'expediente' ? 'expediente definitivo legislativo' : 'documento del proyecto';
  const methodLabel = {
    digital: 'extracción digital directa de PDF',
    ocr: 'OCR (reconocimiento óptico, puede contener errores)',
    docx: 'extracción de documento DOCX'
  }[extractionMethod] || 'extracción de texto';

  return `Analiza el siguiente texto extraído de un ${sourceLabel} (método: ${methodLabel}).

Devuelve SOLO el JSON estructurado con los campos solicitados. Sin explicaciones adicionales.

TEXTO DEL DOCUMENTO:
---
${text}
---`;
}

/**
 * Prepare text for LLM: extract key sections, trim intelligently.
 * We want to send the most relevant parts without exceeding token limits.
 */
function prepareTextForLLM(rawText, maxChars = 6000) {
  if (!rawText || rawText.length === 0) return '';

  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Try to extract key sections
  const sections = [];

  // 1. Header area (first ~800 chars usually has EXPTE, tipo, iniciador)
  sections.push(text.substring(0, Math.min(800, text.length)));

  // 2. INICIADOR block
  const iniciadorMatch = text.match(/INICIADOR(?:ES)?[:\s]+(.+?)(?:OBJETO|FUNDAMENTOS)/is);
  if (iniciadorMatch) {
    sections.push('INICIADOR: ' + iniciadorMatch[1].trim().substring(0, 400));
  }

  // 3. OBJETO block (full — this is critical)
  const objetoMatch = text.match(/OBJETO[:\s]+(.+?)(?:FUNDAMENTOS|Honorable\s+C[aá]mara|\n\s*\n)/is);
  if (objetoMatch) {
    sections.push('OBJETO: ' + objetoMatch[1].trim().substring(0, 800));
  }

  // 4. FUNDAMENTOS first paragraphs (skip greeting)
  const fundMatch = text.match(/FUNDAMENTOS[:\s]*\n(.+?)(?:\n\s*\n\s*\n)/is);
  if (fundMatch) {
    let fundText = fundMatch[1].trim();
    // Skip "Honorable Cámara:" greeting
    fundText = fundText.replace(/^Honorable\s+C[aá]mara[:\s]*\n?/i, '');
    if (fundText.length > 30) {
      sections.push('FUNDAMENTOS (extracto): ' + fundText.substring(0, 1200));
    }
  }

  // 5. Signature area (last ~500 chars often has names)
  if (text.length > 1000) {
    const signatureArea = text.substring(text.length - 500);
    if (/Diputad[oa]|firma|suscrib/i.test(signatureArea)) {
      sections.push('FIRMAS/CIERRE: ' + signatureArea);
    }
  }

  let result = sections.join('\n\n');

  // If sections are shorter than maxChars and we have more text, include more context
  if (result.length < maxChars * 0.6 && text.length > result.length) {
    result = text.substring(0, maxChars);
  }

  // Final trim
  if (result.length > maxChars) {
    result = result.substring(0, maxChars);
  }

  return result;
}

/**
 * Call the LLM provider (Anthropic Claude API).
 */
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

  // Extract text from response
  if (data.content && data.content.length > 0) {
    return data.content[0].text;
  }

  throw new Error('Empty LLM response');
}

/**
 * Validate and normalize the LLM response JSON.
 */
function validateAndNormalize(rawJson) {
  let parsed;

  // Try to parse JSON, handling potential markdown wrapping
  let jsonStr = rawJson.trim();
  // Remove markdown code fences if present
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    // Try to extract JSON from mixed text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        throw new Error('Invalid JSON from LLM');
      }
    } else {
      throw new Error('No JSON found in LLM response');
    }
  }

  // Normalize and validate each field
  const result = {
    tipo_proyecto: normalizeField(parsed.tipo_proyecto, v => VALID_TIPOS.includes(v) ? v : null),
    titulo_sugerido: normalizeField(parsed.titulo_sugerido, v => {
      if (typeof v !== 'string' || v.length < 5) return null;
      // Enforce max length
      return v.length > 160 ? v.substring(0, 157) + '...' : v;
    }),
    resumen_sugerido: normalizeField(parsed.resumen_sugerido, v => {
      if (typeof v !== 'string' || v.length < 10) return null;
      return v.length > 300 ? v.substring(0, 297) + '...' : v;
    }),
    area_tema: normalizeField(parsed.area_tema, v => {
      if (typeof v !== 'string') return null;
      // Find closest match in catalog (case-insensitive)
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
    fragmentos_respaldo: Array.isArray(parsed.fragmentos_respaldo)
      ? parsed.fragmentos_respaldo.filter(f => typeof f === 'string').slice(0, 3).map(f => f.substring(0, 200))
      : [],
  };

  return result;
}

/**
 * Normalize a field object { valor, confianza } with a validator function.
 */
function normalizeField(field, validator) {
  if (!field || typeof field !== 'object') {
    return { valor: null, confianza: 0 };
  }

  const rawValor = field.valor;
  const confianza = typeof field.confianza === 'number'
    ? Math.max(0, Math.min(1, field.confianza))
    : 0;

  const valor = rawValor != null ? validator(rawValor) : null;

  return { valor, confianza: valor != null ? confianza : 0 };
}


/**
 * POST handler for AI-powered autocomplete.
 * Expects JSON body: { text: string, source_type: string, extraction_method: string }
 */
export async function onRequestPost(context) {
  try {
    // Check for API key
    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'AI analysis not configured. Set ANTHROPIC_API_KEY in environment.',
        fallback: true,
      }), { status: 503, headers: HEADERS });
    }

    const body = await context.request.json();
    const { text, source_type, extraction_method } = body;

    if (!text || typeof text !== 'string' || text.length < 30) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Insufficient text for AI analysis.',
        fallback: true,
      }), { status: 400, headers: HEADERS });
    }

    // Prepare text (smart truncation)
    const preparedText = prepareTextForLLM(text, 6000);

    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(preparedText, source_type || 'documento', extraction_method || 'digital');

    // Call LLM
    const model = context.env.AI_MODEL || 'claude-haiku-4-5-20251001';
    const rawResponse = await callLLM(systemPrompt, userPrompt, apiKey, model);

    // Validate and normalize
    const result = validateAndNormalize(rawResponse);

    return new Response(JSON.stringify({
      ok: true,
      data: result,
      model_used: model,
    }), { status: 200, headers: HEADERS });

  } catch (err) {
    // Log error server-side (without sensitive data)
    console.error('[autocomplete-ai] Error:', err.message);

    return new Response(JSON.stringify({
      ok: false,
      error: 'AI analysis failed: ' + (err.message || 'Unknown error').substring(0, 200),
      fallback: true,
    }), { status: 500, headers: HEADERS });
  }
}
