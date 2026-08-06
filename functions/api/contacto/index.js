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
const CONTACT_RECIPIENTS = [
  "cecigortari@gmail.com",
  "gonzalo891751@gmail.com",
];

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

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

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

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Solicitud invalida." }),
      { status: 400, headers }
    );
  }

  if (body._hp_website) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
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
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: CONTACT_RECIPIENTS,
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error("Resend error:", resendResponse.status, errorBody);
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
    console.error("Error enviando email:", err);
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
