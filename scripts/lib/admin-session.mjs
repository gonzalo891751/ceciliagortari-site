// Inicia sesión en la API interna (protegida por functions/api/_middleware.js) y devuelve
// los encabezados con la cookie de sesión. El PIN se toma de la variable de entorno ADMIN_PIN.
export async function adminHeaders(base) {
  const pin = process.env.ADMIN_PIN;
  if (!pin) throw new Error('Definí ADMIN_PIN en el entorno para usar la API interna.');
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ pin }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Login ${response.status}: ${await response.text()}`);
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie') || ''];
  const session = cookies.map((c) => c.split(';')[0]).find((c) => c.startsWith('cg_admin='));
  if (!session) throw new Error('El servidor no devolvió la cookie de sesión.');
  return { Cookie: session };
}
