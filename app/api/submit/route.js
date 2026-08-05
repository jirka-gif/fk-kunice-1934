// POST /api/submit → veřejné odeslání z formulářů na webu (bez přihlášení).
// Bezpečně PŘIDÁ položku do obsahu (rezervace / registrace / zpráva) — nikdy
// nepřepisuje celý obsah. Tělo: { type, payload }.
import { NextResponse } from 'next/server';
import { getStoredContent, saveStoredContent } from '@/lib/db';
import { DEFAULTS, mergeStored, clone, emptyReservation } from '@/lib/defaults';
import { validateRequest, slotEnd, czechDate } from '@/lib/rental';
import { sendMail, reservationMail } from '@/lib/mail';

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
    const area = s(payload.area, 120);
    const dateISO = s(payload.dateISO, 10);
    const from = s(payload.from, 5);
    if (!s(payload.name, 120).trim()) {
      return NextResponse.json({ error: 'Vyplň prosím jméno.' }, { status: 400 });
    }
    // Poslední kontrola na serveru: mezi zobrazením kalendáře a odesláním mohl
    // termín někdo zabrat. Bez tohohle by na stejný čas dorazily dvě poptávky.
    const check = validateRequest({
      reservations: content.reservations,
      area,
      dateISO,
      from,
      settings: content.rentalSettings,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 409 });
    }

    const reservation = {
      ...emptyReservation(),
      id: `rezervace-${new Date().toISOString()}`,
      name: s(payload.name, 120),
      contact: s(payload.contact, 200),
      area,
      dateISO,
      from,
      to: slotEnd(from, content.rentalSettings),
      date: czechDate(dateISO),
      time: from,
      note: s(payload.note, 800),
      source: 'web',
      status: 'nová',
      createdAt: new Date().toISOString(),
    };
    content.reservations = [reservation, ...(content.reservations || [])].slice(0, 500);
    await saveStoredContent(content);

    // Upozornění e-mailem je bonus — když není nastavené, poptávka už je uložená
    // v administraci a odeslání formuláře kvůli tomu nesmí selhat.
    const mail = reservationMail(reservation);
    const sent = await sendMail({ to: content.rentalSettings.notifyEmail, ...mail });
    return NextResponse.json({ ok: true, emailSent: sent.ok });
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
