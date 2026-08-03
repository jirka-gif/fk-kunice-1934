// POST /api/submit → veřejné odeslání z formulářů na webu (bez přihlášení).
// Bezpečně PŘIDÁ položku do obsahu (rezervace / registrace / zpráva) — nikdy
// nepřepisuje celý obsah. Tělo: { type, payload }.
import { NextResponse } from 'next/server';
import { getStoredContent, saveStoredContent } from '@/lib/db';
import { DEFAULTS, mergeStored, clone } from '@/lib/defaults';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const s = (v, max = 400) => (typeof v === 'string' ? v.slice(0, max) : '');

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
  }
  const { type, payload = {} } = body || {};
  if (!['reservation', 'registration', 'message'].includes(type)) {
    return NextResponse.json({ error: 'Neznámý typ' }, { status: 400 });
  }

  const stored = await getStoredContent();
  const content = stored ? mergeStored(stored) : clone(DEFAULTS);

  if (type === 'reservation') {
    content.reservations = [
      {
        name: s(payload.name, 120),
        contact: s(payload.contact, 200),
        area: s(payload.area, 120),
        date: s(payload.date, 60),
        time: s(payload.time, 30),
        note: s(payload.note, 800),
        source: 'web',
        status: 'nová',
      },
      ...(content.reservations || []),
    ].slice(0, 500);
  } else if (type === 'registration') {
    content.cmsRegistrations = [
      {
        name: s(payload.name, 120),
        team: s(payload.team, 120),
        ini: s(payload.ini, 4) || s(payload.name, 2).toUpperCase(),
        bg: '#C1121F',
        tag: 'Nová',
        tg: 'new',
        contact: s(payload.contact, 200),
        note: s(payload.note, 800),
      },
      ...(content.cmsRegistrations || []),
    ].slice(0, 500);
  } else if (type === 'message') {
    content.messages = [
      {
        name: s(payload.name, 120),
        email: s(payload.email, 200),
        text: s(payload.text, 2000),
        date: new Date().toISOString(),
        status: 'nová',
      },
      ...(content.messages || []),
    ].slice(0, 500);
  }

  await saveStoredContent(content);
  return NextResponse.json({ ok: true });
}
