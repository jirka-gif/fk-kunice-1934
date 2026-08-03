// =============================================================================
//  FK KUNICE — JEDNODUCHÉ PŘIHLÁŠENÍ DO ADMINU (server only)
//  Testovací verze: jedno sdílené heslo (ADMIN_PASSWORD) + podepsaná cookie.
//  Používá Web Crypto (HMAC-SHA256), takže funguje i v edge middleware.
//
//  Pro produkci doporučeno nahradit plnohodnotným přihlášením s uživateli
//  a rolemi (Auth.js / NextAuth) — viz README-BACKEND.md, fáze 2.
// =============================================================================

export const SESSION_COOKIE = 'fk_session';
const DAY = 60 * 60 * 24;
const MAX_AGE = 7 * DAY; // platnost přihlášení 7 dní

function adminPassword() {
  // Pro lokální vývoj bez nastavení funguje výchozí heslo (změň v produkci!).
  return process.env.ADMIN_PASSWORD || 'fkkunice';
}
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

// vytvoří token "payloadB64.signature"
export async function createSessionToken() {
  const payload = { exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [body, sig] = token.split('.');
  const expected = await hmac(body);
  if (sig !== expected) return false;
  try {
    const json = JSON.parse(decodeURIComponent(escape(atob(body.replace(/-/g, '+').replace(/_/g, '/')))));
    if (!json.exp || json.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(pw) {
  return typeof pw === 'string' && pw.length > 0 && pw === adminPassword();
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: MAX_AGE,
  secure: process.env.NODE_ENV === 'production',
};
