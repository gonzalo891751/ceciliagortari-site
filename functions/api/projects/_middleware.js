// Admin API Key middleware
// Protects all /api/projects/* endpoints EXCEPT /api/projects/public*
// The API key must be set as ADMIN_API_KEY environment variable in Cloudflare

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Public endpoints — no auth required
  if (path === "/api/projects/public" || path.startsWith("/api/projects/public/")) {
    return context.next();
  }

  // All other /api/projects/* endpoints require API key
  const apiKey = context.request.headers.get("X-Admin-Key");
  const expectedKey = context.env.ADMIN_API_KEY;

  if (!expectedKey) {
    // If ADMIN_API_KEY is not configured, block admin access entirely
    return new Response(
      JSON.stringify({ ok: false, error: "Acceso no configurado." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "No autorizado." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }

  return context.next();
}
