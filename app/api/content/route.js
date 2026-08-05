// GET  /api/content → vrátí obsah webu (uložený v DB, jinak výchozí z club.js)
// PUT  /api/content → uloží obsah (jen přihlášený a jen ty části, na které má
//                     jeho role právo „upravovat")
import { NextResponse } from 'next/server';
import { getStoredContent, saveStoredContent, hasDatabase } from '@/lib/db';
import { DEFAULTS, mergeStored } from '@/lib/defaults';
import { getSession } from '@/lib/apiauth';
import { canSaveContent } from '@/lib/permissions';

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
  const session = await getSession();
  if (!session) {
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

  // Porovnáme s uloženým obsahem a povolíme jen změny v sekcích, na které má
  // uživatel právo „upravovat". Zbytek zůstane beze změny.
  const stored = await getStoredContent();
  const before = stored ? mergeStored(stored) : mergeStored(null);
  const after = mergeStored(body);
  const { ok, denied } = canSaveContent(session.permissions, before, after);
  if (!ok) {
    return NextResponse.json(
      { error: 'K úpravě těchto částí webu nemáš oprávnění', denied },
      { status: 403 },
    );
  }

  const result = await saveStoredContent(after);
  return NextResponse.json({ ok: true, ...result });
}
