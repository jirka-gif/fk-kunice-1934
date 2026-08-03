// =============================================================================
//  FK KUNICE — PŘIHLAŠOVACÍ SESSION (server only)
//  Podepsaná cookie (HMAC-SHA256 přes Web Crypto), takže ji umí ověřit i edge
//  middleware bez přístupu k databázi. V cookie je jen id uživatele a expirace.
//
//  Kdo je uživatel, jakou má roli a co smí, řeší lib/users.js + lib/permissions.js.
//  Middleware ověří jen podpis; platnost účtu (deaktivace, změna role) se
//  kontroluje v API a na /api/me — tam už je přístup k úložišti uživatelů.
// =============================================================================

export const SESSION_COOKIE = 'fk_session';
const DAY = 60 * 60 * 24;
const MAX_AGE = 7 * DAY; // platnost přihlášení 7 dní

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || 'fk-kunice-dev-secret';
}

function b64url(bytes) {
  let s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function hmac(msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return b64url(sig);
}

// vytvoří token "payloadB64.signature"; v payloadu je id uživatele a expirace
export async function createSessionToken(userId) {
  const payload = { uid: String(userId || ''), exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

// Vrátí obsah tokenu ({ uid, exp }), nebo null když je neplatný či prošlý.
export async function readSessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = await hmac(body);
  if (sig !== expected) return null;
  try {
    const json = JSON.parse(decodeURIComponent(escape(atob(body.replace(/-/g, '+').replace(/_/g, '/')))));
    if (!json.exp || json.exp < Math.floor(Date.now() / 1000)) return null;
    return json;
  } catch {
    return null;
  }
}

// Jen ověření platnosti (používá edge middleware, které nemá přístup k DB).
export async function verifySessionToken(token) {
  return (await readSessionToken(token)) !== null;
}

// Id přihlášeného uživatele z tokenu, jinak null.
export async function sessionUserId(token) {
  const payload = await readSessionToken(token);
  return payload && payload.uid ? payload.uid : null;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: MAX_AGE,
  secure: process.env.NODE_ENV === 'production',
};
