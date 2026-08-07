// Správa uživatelů — jen pro toho, kdo smí editovat sekci „Uživatelé a role".
//   GET    /api/users            → seznam uživatelů (bez hesel) + role
//   POST   /api/users            → pozvat nového uživatele (vrátí první heslo)
//   PUT    /api/users            → úprava (jméno, role, aktivní, reset hesla)
//   DELETE /api/users?id=…       → smazání uživatele
import { NextResponse } from 'next/server';
import { requireEdit } from '@/lib/apiauth';
import { readAuth, writeAuth, publicUser, hashPassword, randomToken, normalizeEmail, isStrongEnough } from '@/lib/users';
import { SUPER_ROLE } from '@/lib/permissions';
import { zapisZaznam, AKCE } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SECTION = 'uzivatele';

// Poslední aktivní správce se nesmí zamknout ven z administrace. Počítá se
// Správce i Super správce — do administrace se dostanou oba.
const SPRAVCOVSKE = [SUPER_ROLE, 'spravce'];
function wouldLockOut(users, changedId, patch) {
  const next = users.map((u) => (u.id === changedId ? { ...u, ...patch } : u));
  return !next.some((u) => u.active && SPRAVCOVSKE.includes(u.role));
}

// Roli Super správce smí přidělit i odebrat JEN Super správce, a jen on smí
// takového uživatele měnit. Bez toho by si běžný správce roli přidal sám a
// rozdíl mezi rolemi by nic neznamenal. Kontrola patří na server — rozhraní
// se dá obejít.
function jeSuper(session) {
  return session?.user?.role === SUPER_ROLE;
}
const odepreno = () =>
  NextResponse.json({ error: 'S rolí Super správce smí pracovat jen Super správce.' }, { status: 403 });

export async function GET() {
  const { session, response } = await requireEdit(SECTION);
  if (response) return response;
  const auth = await readAuth();
  return NextResponse.json(
    { users: auth.users.map((u) => publicUser(u, auth.roles)), roles: auth.roles, meId: session.user.id },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

export async function POST(req) {
  const { session, response } = await requireEdit(SECTION);
  if (response) return response;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Neplatná data' }, { status: 400 }); }

  const email = normalizeEmail(body?.email);
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Zadej platný e-mail' }, { status: 400 });

  const auth = await readAuth();
  if (auth.users.some((u) => u.email === email)) {
    return NextResponse.json({ error: 'Uživatel s tímto e-mailem už existuje' }, { status: 409 });
  }
  const role = String(body?.role || '');
  if (!auth.roles.some((r) => r.id === role)) return NextResponse.json({ error: 'Neznámá role' }, { status: 400 });
  if (role === SUPER_ROLE && !jeSuper(session)) return odepreno();

  // Heslo buď zadané ručně, nebo vygenerované — správce ho předá uživateli.
  const password = isStrongEnough(body?.password) ? body.password : randomToken(9);
  const { hash, salt, iterations } = await hashPassword(password);
  const user = {
    id: randomToken(9),
    email,
    name: String(body?.name || '').slice(0, 120),
    role,
    active: true,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
    iterations,
  };
  auth.users = [...auth.users, user];
  await writeAuth(auth);
  await zapisZaznam({ akce: AKCE.uzivatelZmena, user: session.user, detail: `pozvání: ${email} (${role})` });
  return NextResponse.json({ ok: true, user: publicUser(user, auth.roles), password });
}

export async function PUT(req) {
  const { session, response } = await requireEdit(SECTION);
  if (response) return response;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Neplatná data' }, { status: 400 }); }

  const auth = await readAuth();
  const user = auth.users.find((u) => u.id === String(body?.id || ''));
  if (!user) return NextResponse.json({ error: 'Uživatel nenalezen' }, { status: 404 });

  const patch = {};
  if (typeof body.name === 'string') patch.name = body.name.slice(0, 120);
  if (typeof body.role === 'string') {
    if (!auth.roles.some((r) => r.id === body.role)) return NextResponse.json({ error: 'Neznámá role' }, { status: 400 });
    if (body.role === SUPER_ROLE && !jeSuper(session)) return odepreno();
    patch.role = body.role;
  }
  // Ani zásah do stávajícího Super správce (přejmenování, deaktivace, reset hesla)
  if (user.role === SUPER_ROLE && !jeSuper(session)) return odepreno();
  if (typeof body.active === 'boolean') patch.active = body.active;

  if ((patch.active === false || (patch.role && !SPRAVCOVSKE.includes(patch.role))) && wouldLockOut(auth.users, user.id, patch)) {
    return NextResponse.json({ error: 'Musí zůstat aspoň jeden aktivní správce' }, { status: 400 });
  }

  let newPassword = null;
  if (body.resetPassword) {
    newPassword = isStrongEnough(body.password) ? body.password : randomToken(9);
    const { hash, salt, iterations } = await hashPassword(newPassword);
    Object.assign(patch, { passwordHash: hash, salt, iterations, mustChangePassword: true });
  }

  auth.users = auth.users.map((u) => (u.id === user.id ? { ...u, ...patch } : u));
  await writeAuth(auth);
  // Do detailu jdou jen názvy změněných polí, nikdy hodnoty (heslo!).
  await zapisZaznam({
    akce: AKCE.uzivatelZmena, user: session.user,
    detail: `${user.email}: ${[...Object.keys(patch).filter((k) => !['passwordHash', 'salt', 'iterations'].includes(k)), body.resetPassword ? 'reset hesla' : ''].filter(Boolean).join(', ')}`,
  });
  const updated = auth.users.find((u) => u.id === user.id);
  return NextResponse.json({ ok: true, user: publicUser(updated, auth.roles), password: newPassword, meId: session.user.id });
}

export async function DELETE(req) {
  const { session, response } = await requireEdit(SECTION);
  if (response) return response;

  const id = new URL(req.url).searchParams.get('id') || '';
  const auth = await readAuth();
  if (!auth.users.some((u) => u.id === id)) return NextResponse.json({ error: 'Uživatel nenalezen' }, { status: 404 });
  if (id === session.user.id) return NextResponse.json({ error: 'Sám sebe smazat nemůžeš' }, { status: 400 });

  const mazany = auth.users.find((u) => u.id === id);
  if (mazany.role === SUPER_ROLE && !jeSuper(session)) return odepreno();

  const rest = auth.users.filter((u) => u.id !== id);
  if (!rest.some((u) => u.active && SPRAVCOVSKE.includes(u.role))) {
    return NextResponse.json({ error: 'Musí zůstat aspoň jeden aktivní správce' }, { status: 400 });
  }
  auth.users = rest;
  await writeAuth(auth);
  await zapisZaznam({ akce: AKCE.uzivatelZmena, user: session.user, detail: `smazán: ${mazany.email}` });
  return NextResponse.json({ ok: true });
}
