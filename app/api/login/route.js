// POST /api/login  { email, password } → ověří uživatele a nastaví cookie.
// Když e-mail chybí, použije se první (výchozí) správce — kvůli zpětné
// kompatibilitě s dřívějším přihlášením jen heslem.
import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE, cookieOptions } from '@/lib/auth';
import { authenticate, ensureSeedUser, publicUser, normalizeEmail } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }

  const auth = await ensureSeedUser();
  const email = normalizeEmail(body?.email) || (auth.users[0] ? auth.users[0].email : '');
  const user = await authenticate(email, body?.password);
  if (!user) {
    return NextResponse.json({ error: 'Nesprávný e-mail nebo heslo' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, user: publicUser(user, auth.roles) });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(user.id), cookieOptions);
  return res;
}
