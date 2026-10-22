import { authConfigured, isAuthenticated } from "../../../lib/admin-auth.mjs";

export async function onRequestGet(context) {
  const configured = authConfigured(context.env);
  const authenticated = configured && (await isAuthenticated(context.request, context.env));
  return new Response(JSON.stringify({ ok: true, configured, authenticated }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
