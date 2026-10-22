import {
  authConfigured, pinMatches, createSession, sessionCookie, SESSION_TTL_SECONDS, REMEMBER_TTL_SECONDS,
} from "../../../lib/admin-auth.mjs";

const HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map(); // Best effort per isolate.

function tooManyAttempts(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(ip, recent);
  return recent.length >= MAX_ATTEMPTS;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!authConfigured(env)) {
    return new Response(JSON.stringify({ ok: false, error: "Acceso interno no configurado." }), { status: 503, headers: HEADERS });
  }
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return new Response(JSON.stringify({ ok: false, error: "Origen no permitido." }), { status: 403, headers: HEADERS });
  }
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  if (tooManyAttempts(ip)) {
    return new Response(JSON.stringify({ ok: false, error: "Demasiados intentos. Probá en unos minutos." }), { status: 429, headers: HEADERS });
  }

  let body = {};
  try { body = await request.json(); } catch (_) {}
  if (!(await pinMatches(env, String(body.pin || "")))) {
    attempts.get(ip).push(Date.now());
    return new Response(JSON.stringify({ ok: false, error: "PIN incorrecto." }), { status: 401, headers: HEADERS });
  }

  attempts.delete(ip);
  const ttl = body.remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS;
  const token = await createSession(env, ttl);
  return new Response(JSON.stringify({ ok: true, expires_in: ttl }), {
    status: 200,
    headers: { ...HEADERS, "Set-Cookie": sessionCookie(token, ttl) },
  });
}
