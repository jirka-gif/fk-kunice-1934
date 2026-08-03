// POST /api/login  { password } → ověří heslo a nastaví přihlašovací cookie.
import { NextResponse } from 'next/server';
import { checkPassword, createSessionToken, SESSION_COOKIE, cookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }
  if (!checkPassword(body?.password)) {
    return NextResponse.json({ error: 'Nesprávné heslo' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), cookieOptions);
  return res;
}
