/**
 * Cloudflare Pages Function: /api/contacto
 * Recibe formularios de contacto y envía emails via Resend.
 *
 * Variables de entorno requeridas:
 *   RESEND_API_KEY  – API key de Resend (https://resend.com)
 *   CONTACT_FROM    – Email "from" verificado en Resend (ej: "Cecilia Gortari Web <web@ceciliagortari.com.ar>")
 */

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX = 5; // max 5 envíos por IP por minuto
const ipTimestamps = new Map();

/** Destinatarios por defecto si no se configura FORM_RECIPIENTS. */
const DEFAULT_RECIPIENTS = [
  "cecigortari@gmail.com",
  "gonzalo891751@gmail.com",
];

/**
 * Destinatarios configurables por entorno.
 * FORM_RECIPIENTS acepta una lista separada por comas, por ejemplo:
 *   FORM_RECIPIENTS=cecigortari@gmail.com,gonzalo891751@gmail.com
 */
function resolveRecipients(env) {
  const raw = (env && env.FORM_RECIPIENTS) || "";
  const list = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => validateEmail(value));
  return list.length ? list : DEFAULT_RECIPIENTS;
}

/** Orígenes autorizados a llamar al endpoint desde el navegador. */
const ALLOWED_ORIGINS = [
  "https://ceciliagortari.com.ar",
  "https://www.ceciliagortari.com.ar",
];

function resolveCorsOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return ALLOWED_ORIGINS[0];
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Deploys de vista previa de Cloudflare Pages y desarrollo local.
  try {
    const { hostname, protocol } = new URL(origin);
    const isPreview = hostname.endsWith(".pages.dev");
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    if ((isPreview && protocol === "https:") || isLocal) return origin;
  } catch {
    /* origen inválido: se cae al valor por defecto */
  }
  return ALLOWED_ORIGINS[0];
}

function corsHeaders(request) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": resolveCorsOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = ipTimestamps.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }

  recent.push(now);
  ipTimestamps.set(ip, recent);
  return false;
}

function sanitize(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim()
    .slice(0, 5000);
}

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Normaliza y acorta un campo de texto libre.
 * Colapsa espacios repetidos y escapa el HTML para que el correo no pueda
 * inyectar marcado.
 */
function field(value, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Igual que field() pero conservando los saltos de línea de un textarea. */
function multiline(value, maxLength = 2000) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, maxLength)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Deshace el escape de HTML para armar la versión de texto plano. */
function unescapeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function formatDate() {
  return new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "full",
    timeStyle: "short",
  });
}

function buildGeneralEmail(data) {
  const nombre = sanitize(data.nombre);
  const contacto = sanitize(data.contacto);
  const asunto = sanitize(data.asunto);
  const mensaje = sanitize(data.mensaje);

  if (!nombre || !contacto || !asunto || !mensaje) {
    return { error: "Todos los campos son obligatorios." };
  }

  return {
    subject: `[Web Contacto] ${asunto}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1C5CFF, #9F57A7); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">Nuevo mensaje desde la web</h2>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 140px;">Nombre y Apellido</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${nombre}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Contacto</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${contacto}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Asunto</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${asunto}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
          <p style="color: #666; font-size: 13px; margin-bottom: 4px;">Mensaje:</p>
          <p style="color: #11103B; line-height: 1.6; white-space: pre-wrap;">${mensaje}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
          <p style="color: #999; font-size: 12px;">Enviado el ${formatDate()}</p>
        </div>
      </div>
    `,
  };
}

function buildPrensaEmail(data) {
  const nombre = sanitize(data.nombre);
  const medio = sanitize(data.medio);
  const telefono = sanitize(data.telefono);
  const fecha = sanitize(data.fecha);
  const mensaje = sanitize(data.mensaje);

  if (!nombre || !medio || !telefono || !mensaje) {
    return { error: "Todos los campos son obligatorios." };
  }

  return {
    subject: `[Web Prensa] ${medio}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #24BCDE, #1C5CFF); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">Solicitud de Prensa</h2>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 160px;">Periodista / Productor</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${nombre}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Medio / Organizacion</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${medio}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Telefono</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${telefono}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Fecha / Urgencia</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${fecha}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
          <p style="color: #666; font-size: 13px; margin-bottom: 4px;">Motivo de la nota:</p>
          <p style="color: #11103B; line-height: 1.6; white-space: pre-wrap;">${mensaje}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
          <p style="color: #999; font-size: 12px;">Enviado el ${formatDate()}</p>
        </div>
      </div>
    `,
  };
}

function buildProyectoEmail(data) {
  const nombre = sanitize(data.nombre);
  const contacto = sanitize(data.contacto);
  const localidad = sanitize(data.localidad);
  const sector = sanitize(data.sector);
  const titulo = sanitize(data.titulo);
  const descripcion = sanitize(data.descripcion);
  const reunion = data.reunion ? "Si, solicita reunion" : "No solicita reunion";

  if (!nombre || !contacto || !localidad || !titulo || !descripcion) {
    return { error: "Todos los campos obligatorios deben completarse." };
  }

  return {
    subject: `[Web Propuesta] ${titulo} - ${localidad}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9F57A7, #7A3E82); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 20px;">Nueva Propuesta Ciudadana</h2>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 140px;">Nombre</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${nombre}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Contacto</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${contacto}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Localidad</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${localidad}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Area / Sector</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${sector}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Reunion</td><td style="padding: 8px 0; font-weight: 600; color: #11103B;">${reunion}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
          <h3 style="color: #9F57A7; margin-bottom: 8px;">${titulo}</h3>
          <p style="color: #11103B; line-height: 1.6; white-space: pre-wrap;">${descripcion}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
          <p style="color: #999; font-size: 12px;">Enviado el ${formatDate()}</p>
        </div>
      </div>
    `,
  };
}

// ---------------------------------------------------------------------------
// ESCUELA DE EMPRENDEDORES
// ---------------------------------------------------------------------------

/** Valida un teléfono argentino escrito de forma libre (8 a 15 dígitos). */
function validatePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Arma el cuerpo HTML y la versión de texto plano a partir de una lista de filas. */
function renderEmail({ title, accent, rows, blocks }) {
  const tableRows = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#666;width:190px;vertical-align:top;">${label}</td>` +
        `<td style="padding:8px 0;font-weight:600;color:#11103B;">${value}</td></tr>`
    )
    .join("");

  const blockHtml = (blocks || [])
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">` +
        `<p style="color:#666;font-size:13px;margin:0 0 4px;">${label}</p>` +
        `<p style="color:#11103B;line-height:1.6;white-space:pre-wrap;margin:0;">${value}</p>`
    )
    .join("");

  const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:${accent};padding:24px 32px;border-radius:12px 12px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:20px;">${title}</h2>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
          ${blockHtml}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
          <p style="color:#999;font-size:12px;margin:0;">Enviado el ${formatDate()}</p>
        </div>
      </div>`;

  const textLines = [title, "".padEnd(title.length, "=" ), ""];
  rows.filter(([, v]) => v).forEach(([label, value]) => {
    textLines.push(`${label}: ${unescapeHtml(value)}`);
  });
  (blocks || []).filter(([, v]) => v).forEach(([label, value]) => {
    textLines.push("", `${label}:`, unescapeHtml(value));
  });
  textLines.push("", `Enviado el ${formatDate()}`);

  return { html, text: textLines.join("\n") };
}

function buildEscuelaAlumnoEmail(data) {
  const nombre = field(data.nombre, 120);
  const celular = field(data.celular, 30);
  const email = field(data.email, 160);
  const localidad = field(data.localidad, 120);
  const curso = field(data.curso, 160);
  const mensaje = multiline(data.mensaje, 1500);
  const origen = field(data.origen, 200);

  if (!nombre || nombre.length < 3) {
    return { error: "Ingresá tu nombre y apellido." };
  }
  if (!validatePhone(celular)) {
    return { error: "Ingresá un número de celular válido." };
  }
  if (email && !validateEmail(unescapeHtml(email))) {
    return { error: "Revisá el correo electrónico." };
  }
  if (!curso) {
    return { error: "Elegí el curso que te interesa." };
  }
  if (data.consentimiento !== true) {
    return { error: "Necesitamos tu autorización para poder contactarte." };
  }

  const { html, text } = renderEmail({
    title: "Consulta de alumno/a — Escuela de Emprendedores",
    accent: "linear-gradient(135deg,#1C5CFF,#9F57A7)",
    rows: [
      ["Nombre y apellido", nombre],
      ["Celular", celular],
      ["Correo electrónico", email],
      ["Localidad", localidad],
      ["Curso de interés", curso],
      ["Página de procedencia", origen],
    ],
    blocks: [["Consulta o comentario", mensaje]],
  });

  return {
    subject: `[Escuela de Emprendedores] Consulta de alumno/a – ${unescapeHtml(nombre)} – ${unescapeHtml(curso)}`,
    html,
    text,
    replyTo: email ? unescapeHtml(email) : null,
  };
}

function buildEscuelaFormadorEmail(data) {
  const nombre = field(data.nombre, 120);
  const celular = field(data.celular, 30);
  const email = field(data.email, 160);
  const localidad = field(data.localidad, 160);
  const oficio = field(data.oficio, 200);
  const experiencia = multiline(data.experiencia, 1500);
  const disponibilidad = field(data.disponibilidad, 200);
  const origen = field(data.origen, 200);

  if (!nombre || nombre.length < 3) {
    return { error: "Ingresá tu nombre y apellido." };
  }
  if (!validatePhone(celular)) {
    return { error: "Ingresá un número de celular válido." };
  }
  if (email && !validateEmail(unescapeHtml(email))) {
    return { error: "Revisá el correo electrónico." };
  }
  if (!oficio) {
    return { error: "Contanos qué te gustaría enseñar." };
  }
  if (data.consentimiento !== true) {
    return { error: "Necesitamos tu autorización para poder contactarte." };
  }

  const { html, text } = renderEmail({
    title: "Propuesta de formador/a — Escuela de Emprendedores",
    accent: "linear-gradient(135deg,#9F57A7,#FBA85F)",
    rows: [
      ["Nombre y apellido", nombre],
      ["Celular", celular],
      ["Correo electrónico", email],
      ["Localidad o dirección", localidad],
      ["Oficio o habilidad", oficio],
      ["Disponibilidad horaria", disponibilidad],
      ["Página de procedencia", origen],
    ],
    blocks: [["Experiencia o presentación", experiencia]],
  });

  return {
    subject: `[Escuela de Emprendedores] Propuesta de formador/a – ${unescapeHtml(nombre)}`,
    html,
    text,
    replyTo: email ? unescapeHtml(email) : null,
  };
}

/**
 * Verifica el token de Cloudflare Turnstile del lado del servidor.
 * Sólo se exige cuando TURNSTILE_SECRET_KEY está configurada, de modo que el
 * endpoint sigue funcionando mientras la protección no esté dada de alta.
 */
async function verifyTurnstile(env, token, ip) {
  const secret = env && env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false };

  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip && ip !== "unknown") form.append("remoteip", ip);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    const result = await response.json();
    return { ok: result.success === true };
  } catch (err) {
    console.error("Turnstile: fallo al verificar el token");
    return { ok: false };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = corsHeaders(request);

  const clientIP =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";

  if (isRateLimited(clientIP)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Demasiados envios en poco tiempo. Por favor esperá un momento e intentá de nuevo.",
      }),
      { status: 429, headers }
    );
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return new Response(
      JSON.stringify({ ok: false, error: "Formato de solicitud no soportado." }),
      { status: 415, headers }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Solicitud invalida." }),
      { status: 400, headers }
    );
  }

  if (!body || typeof body !== "object") {
    return new Response(
      JSON.stringify({ ok: false, error: "Solicitud invalida." }),
      { status: 400, headers }
    );
  }

  if (body._hp_website) {
    // Bot detectado: se responde 200 para no revelar el honeypot.
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }

  const turnstile = await verifyTurnstile(
    env,
    body["cf-turnstile-response"],
    clientIP
  );
  if (!turnstile.ok) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "No pudimos verificar que seas una persona. Recargá la página e intentá de nuevo.",
      }),
      { status: 403, headers }
    );
  }

  let emailData;

  switch (body.tipo) {
    case "general":
      emailData = buildGeneralEmail(body);
      break;
    case "prensa":
      emailData = buildPrensaEmail(body);
      break;
    case "proyecto":
      emailData = buildProyectoEmail(body);
      break;
    case "escuela-alumno":
      emailData = buildEscuelaAlumnoEmail(body);
      break;
    case "escuela-formador":
      emailData = buildEscuelaFormadorEmail(body);
      break;
    default:
      return new Response(
        JSON.stringify({ ok: false, error: "Tipo de formulario no valido." }),
        { status: 400, headers }
      );
  }

  if (emailData.error) {
    return new Response(
      JSON.stringify({ ok: false, error: emailData.error }),
      { status: 400, headers }
    );
  }

  const RESEND_API_KEY = env.RESEND_API_KEY;
  const CONTACT_FROM =
    env.CONTACT_FROM || "Cecilia Gortari Web <web@ceciliagortari.com.ar>";

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY no configurada");
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Error de configuracion del servidor. Contactanos directamente por email.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const payload = {
      from: CONTACT_FROM,
      to: resolveRecipients(env),
      subject: emailData.subject,
      html: emailData.html,
    };
    if (emailData.text) payload.text = emailData.text;
    // El correo del visitante va en Reply-To, nunca en From.
    if (emailData.replyTo) payload.reply_to = emailData.replyTo;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resendResponse.ok) {
      // No se registran datos personales, sólo el estado del proveedor.
      console.error("Resend error:", resendResponse.status);
      return new Response(
        JSON.stringify({
          ok: false,
          error:
            "No se pudo enviar el mensaje. Por favor intentá nuevamente o contactanos directamente por email.",
        }),
        { status: 502, headers }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers,
    });
  } catch (err) {
    // Se registra el tipo de error sin exponer el contenido del formulario.
    console.error("Error enviando email:", err && err.name);
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Error interno. Por favor intentá nuevamente o contactanos directamente por email.",
      }),
      { status: 500, headers }
    );
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": resolveCorsOrigin(request),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}

/** Cualquier otro método queda rechazado: el endpoint sólo acepta POST. */
export async function onRequest({ request }) {
  return new Response(
    JSON.stringify({ ok: false, error: "Método no permitido." }),
    { status: 405, headers: { ...corsHeaders(request), Allow: "POST, OPTIONS" } }
  );
}
