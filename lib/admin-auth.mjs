// Sesión del panel interno: el PIN se valida en el servidor contra el secreto ADMIN_PIN
// y se emite una cookie HttpOnly firmada con HMAC-SHA256. No hay credenciales en el cliente.

export const COOKIE_NAME = 'cg_admin';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const REMEMBER_TTL_SECONDS = 7 * 24 * 60 * 60;

const encoder = new TextEncoder();

function base64url(bytes) {
  let binary = '';
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export function authConfigured(env) {
  return Boolean(env && typeof env.ADMIN_PIN === 'string' && env.ADMIN_PIN.length >= 6);
}

function sessionSecret(env) {
  return env.ADMIN_SESSION_SECRET || `cg-admin-session:${env.ADMIN_PIN}`;
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function pinMatches(env, pin) {
  if (!authConfigured(env) || typeof pin !== 'string') return false;
  const secret = sessionSecret(env);
  return sameBytes(await hmac(secret, `pin:${pin}`), await hmac(secret, `pin:${env.ADMIN_PIN}`));
}

export async function createSession(env, ttlSeconds) {
  const payload = base64url(encoder.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
  return `${payload}.${base64url(await hmac(sessionSecret(env), payload))}`;
}

export async function verifySession(env, token) {
  if (!authConfigured(env) || !token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  try {
    if (!sameBytes(fromBase64url(signature), await hmac(sessionSecret(env), payload))) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(fromBase64url(payload)));
    return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000);
  } catch (_) {
    return false;
  }
}

export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

export function sessionCookie(token, maxAge) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAuthenticated(request, env) {
  return verifySession(env, readCookie(request, COOKIE_NAME));
}
