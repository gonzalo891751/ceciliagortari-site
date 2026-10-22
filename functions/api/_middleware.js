import { authConfigured, isAuthenticated } from "../../lib/admin-auth.mjs";

// Protects every /api route except the public project catalogue, the contact form and the
// session endpoints. Fails closed: without the ADMIN_PIN secret the internal API stays locked.
const HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function isPublic(pathname, method) {
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/api/contacto" || pathname.startsWith("/api/contacto/")) return true;
  if (pathname === "/api/projects/public" || pathname.startsWith("/api/projects/public/")) {
    return method === "GET" || method === "HEAD" || method === "OPTIONS";
  }
  return false;
}

function deny(status, error) {
  return new Response(JSON.stringify({ ok: false, error }), { status, headers: HEADERS });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (isPublic(url.pathname, request.method)) return context.next();

  if (!authConfigured(env)) {
    return deny(503, "Acceso interno no configurado: definir el secreto ADMIN_PIN en Cloudflare Pages.");
  }

  // Same-origin only for state-changing requests (defence in depth on top of SameSite=Strict).
  const origin = request.headers.get("Origin");
  if (request.method !== "GET" && request.method !== "HEAD" && origin && origin !== url.origin) {
    return deny(403, "Origen no permitido.");
  }

  if (!(await isAuthenticated(request, env))) {
    return deny(401, "Sesión requerida.");
  }
  return context.next();
}
