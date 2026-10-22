import { clearedCookie } from "../../../lib/admin-auth.mjs";

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Set-Cookie": clearedCookie() },
  });
}
