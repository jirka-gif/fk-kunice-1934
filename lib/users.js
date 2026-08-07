// =============================================================================
//  FK KUNICE — UŽIVATELÉ A ROLE (server only)
//  Hesla se ukládají jen jako hash (PBKDF2-SHA256 přes Web Crypto — bez další
//  závislosti a funguje v kontejneru i lokálně). Uživatelé jsou v samostatném
//  úložišti (site_auth), aby se nikdy nedostali do veřejného obsahu webu.
// =============================================================================
import { getStoredAuth, saveStoredAuth } from '@/lib/db';
import { defaultRoles, normalizePermissions, permissionsForRole, SUPER_ROLE } from '@/lib/permissions';

const ITERATIONS = 100_000;
const KEY_LEN = 32;

function b64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function fromB64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export function randomToken(bytes = 18) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return b64(arr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- hesla ------------------------------------------------------------------
export async function hashPassword(password, saltB64, iterations = ITERATIONS) {
  const salt = saltB64 ? fromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, KEY_LEN * 8);
  return { hash: b64(bits), salt: b64(salt), iterations };
}

export async function verifyPassword(password, user) {
  if (!user || !user.passwordHash || !user.salt) return false;
  const { hash } = await hashPassword(password, user.salt, user.iterations || ITERATIONS);
  // porovnání v konstantním čase (délky jsou vždy stejné)
  const a = hash, b = user.passwordHash;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isStrongEnough(password) {
  return typeof password === 'string' && password.length >= 8;
}

export const normalizeEmail = (e) => String(e || '').trim().toLowerCase();

// --- úložiště ---------------------------------------------------------------
function emptyAuth() {
  return { users: [], roles: defaultRoles() };
}

// Doplní chybějící části a zahodí nesmysly (obrana proti poškozenému záznamu).
export function normalizeAuth(stored) {
  const base = emptyAuth();
  if (!stored || typeof stored !== 'object') return base;
  const roles = Array.isArray(stored.roles) && stored.roles.length
    ? stored.roles.map((r) => ({
        id: String(r.id || ''),
        name: String(r.name || r.id || ''),
        description: String(r.description || ''),
        system: !!r.system,
        permissions: normalizePermissions(r.permissions),
      })).filter((r) => r.id)
    : base.roles;
  // systémová role Správce musí existovat a mít vždy plná práva
  // Systémové role musí existovat vždy a jejich práva se vynucují — jinak by
  // šlo Super správci odebrat přístup k záznamu, nebo Správci přidat.
  const vychozi = defaultRoles();
  for (const zaklad of vychozi.filter((r) => r.system)) {
    if (!roles.some((r) => r.id === zaklad.id)) roles.unshift({ ...zaklad });
    for (const r of roles) if (r.id === zaklad.id) { r.system = true; r.permissions = zaklad.permissions; }
  }

  const users = (Array.isArray(stored.users) ? stored.users : []).map((u) => ({
    id: String(u.id || ''),
    email: normalizeEmail(u.email),
    name: String(u.name || ''),
    role: String(u.role || ''),
    active: u.active !== false,
    mustChangePassword: !!u.mustChangePassword,
    createdAt: u.createdAt || '',
    // poslední úspěšné přihlášení — vidí ho Super správce u uživatele
    lastLoginAt: u.lastLoginAt || '',
    passwordHash: u.passwordHash || '',
    salt: u.salt || '',
    iterations: u.iterations || ITERATIONS,
  })).filter((u) => u.id && u.email);

  return { users, roles };
}

export async function readAuth() {
  return normalizeAuth(await getStoredAuth());
}

export async function writeAuth(auth) {
  return saveStoredAuth(normalizeAuth(auth));
}

// První spuštění: založí správce z proměnných prostředí, aby se šlo přihlásit.
export async function ensureSeedUser() {
  const auth = await readAuth();
  if (auth.users.length > 0) return auth;
  const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@fkkunice.cz');
  const password = process.env.ADMIN_PASSWORD || 'fkkunice';
  const { hash, salt, iterations } = await hashPassword(password);
  auth.users = [{
    id: randomToken(9),
    email,
    name: 'Správce webu',
    role: SUPER_ROLE,
    active: true,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
    iterations,
  }];
  await writeAuth(auth);
  return auth;
}

// --- přihlášení -------------------------------------------------------------
// Vrátí uživatele při správném e-mailu i hesle, jinak null.
export async function authenticate(email, password) {
  const auth = await ensureSeedUser();
  const user = auth.users.find((u) => u.email === normalizeEmail(email));
  if (!user || !user.active) return null;
  if (!(await verifyPassword(password, user))) return null;
  return user;
}

export async function findUserById(id) {
  const auth = await readAuth();
  return auth.users.find((u) => u.id === id) || null;
}

// Uživatel pro klienta — nikdy neposílej hash ani sůl.
export function publicUser(user, roles) {
  if (!user) return null;
  const role = (roles || []).find((r) => r.id === user.role);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roleName: role ? role.name : 'Bez role',
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || '',
    permissions: permissionsForRole(roles, user.role),
  };
}

// Načte přihlášeného uživatele podle id ze session; deaktivovaný se nepočítá.
// Poznamená čas posledního úspěšného přihlášení. Selhání zápisu nesmí
// zabránit přihlášení samotnému.
export async function zapisPrihlaseni(userId) {
  try {
    const auth = await readAuth();
    auth.users = auth.users.map((u) => (u.id === userId ? { ...u, lastLoginAt: new Date().toISOString() } : u));
    await writeAuth(auth);
  } catch (err) {
    console.error('[users] zápis přihlášení selhal:', err.message);
  }
}

export async function currentUser(userId) {
  if (!userId) return null;
  const auth = await readAuth();
  const user = auth.users.find((u) => u.id === userId);
  if (!user || !user.active) return null;
  return { user, roles: auth.roles, permissions: permissionsForRole(auth.roles, user.role) };
}
