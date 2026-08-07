// GET  /api/content → vrátí obsah webu (uložený v DB, jinak výchozí z club.js)
// PUT  /api/content → uloží obsah (jen přihlášený a jen ty části, na které má
//                     jeho role právo „upravovat")
import { NextResponse } from 'next/server';
import { getStoredContent, saveStoredContent, hasDatabase } from '@/lib/db';
import { DEFAULTS, mergeStored, mergeInbox } from '@/lib/defaults';
import { getSession } from '@/lib/apiauth';
import { canSaveContent, changedContentKeys } from '@/lib/permissions';
import { zapisZaznam, AKCE } from '@/lib/audit';

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

  const stored = await getStoredContent();
  const before = stored ? mergeStored(stored) : mergeStored(null);

  // Administrace posílá obsah tak, jak si ho načetla při otevření stránky. Poptávka,
  // zpráva nebo přihláška, která dorazila mezitím, v něm chybí — a bez tohohle kroku
  // by ji uložení smazalo. `mergeInbox` ji vrátí zpátky; co klient při načtení viděl
  // a přesto neposlal, bere jako smazání, takže mazání z administrace dál funguje.
  //
  // Hlavička nese jen otisky smazaných položek, žádná data — bývá prázdná nebo
  // krátká, protože se maže po jedné.
  let smazane = null;
  try {
    const raw = req.headers.get('x-fk-inbox-removed');
    if (raw) smazane = JSON.parse(raw);
  } catch { smazane = null; } // poškozená hlavička = chováme se, jako by nepřišla
  const after = mergeInbox(before, mergeStored(body), smazane);

  // Oprávnění se posuzují až na sloučeném obsahu. Kdyby se braly na tom, co přišlo
  // od klienta, vypadala by mezitím doručená poptávka jako smazání a redaktor by
  // kvůli ní neuložil ani novinku, na kterou právo má.
  const { ok, denied } = canSaveContent(session.permissions, before, after);
  if (!ok) {
    return NextResponse.json(
      { error: 'K úpravě těchto částí webu nemáš oprávnění', denied },
      { status: 403 },
    );
  }

  // Co se změnilo, zjistíme dřív, než se `after` uloží — potom už není s čím
  // porovnávat. Zapisuje se AŽ po úspěšném uložení, aby záznam netvrdil něco
  // jiného, než co je na webu.
  const zmenene = changedContentKeys(before, after);
  const result = await saveStoredContent(after);
  if (zmenene.length) {
    await zapisZaznam({ akce: AKCE.obsahZmena, user: session.user, detail: zmenene.join(', ') });
  }
  return NextResponse.json({ ok: true, ...result });
}
