// GET  /api/content → vrátí obsah webu (uložený v DB, jinak výchozí z club.js)
// PUT  /api/content → uloží obsah (jen pro přihlášeného admina)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStoredContent, saveStoredContent, hasDatabase } from '@/lib/db';
import { DEFAULTS, mergeStored } from '@/lib/defaults';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  let stored = await getStoredContent();
  // První spuštění s databází: automaticky nasadíme výchozí obsah (lazy seed).
  if (!stored && hasDatabase()) {
    try { await saveStoredContent(DEFAULTS); stored = DEFAULTS; } catch (e) { console.error('[content] lazy seed selhal:', e.message); }
  }
  const content = stored ? mergeStored(stored) : DEFAULTS;
  return NextResponse.json(content, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function PUT(req) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'Nepřihlášeno' }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Očekáván objekt obsahu' }, { status: 400 });
  }
  const result = await saveStoredContent(body);
  return NextResponse.json({ ok: true, ...result });
}
