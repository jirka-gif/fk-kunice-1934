// GET /api/me → kdo je přihlášený a co smí. Používá administrace při načtení.
// PUT /api/me → změna vlastního hesla.
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/apiauth';
import { readAuth, writeAuth, publicUser, hashPassword, verifyPassword, isStrongEnough } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nepřihlášeno' }, { status: 401 });
  return NextResponse.json(
    { user: publicUser(session.user, session.roles) },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

export async function PUT(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nepřihlášeno' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }
  if (!(await verifyPassword(body?.currentPassword, session.user))) {
    return NextResponse.json({ error: 'Současné heslo nesouhlasí' }, { status: 400 });
  }
  if (!isStrongEnough(body?.newPassword)) {
    return NextResponse.json({ error: 'Nové heslo musí mít aspoň 8 znaků' }, { status: 400 });
  }

  const auth = await readAuth();
  const { hash, salt, iterations } = await hashPassword(body.newPassword);
  auth.users = auth.users.map((u) =>
    u.id === session.user.id ? { ...u, passwordHash: hash, salt, iterations, mustChangePassword: false } : u,
  );
  await writeAuth(auth);
  return NextResponse.json({ ok: true });
}
