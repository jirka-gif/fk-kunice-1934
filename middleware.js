// Chrání /admin — bez platné přihlašovací cookie přesměruje na /admin/login.
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  // Přihlašovací stránku nechráníme (jinak by vznikla smyčka).
  if (pathname.startsWith('/admin/login')) return NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Chráníme jen /admin (a podstránky), NE /admin/login.
export const config = {
  matcher: ['/admin/:path*'],
};
