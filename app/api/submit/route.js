// POST /api/submit → veřejné odeslání z formulářů na webu (bez přihlášení).
// Bezpečně PŘIDÁ položku do obsahu (rezervace / registrace / zpráva) — nikdy
// nepřepisuje celý obsah. Tělo: { type, payload }.
import { NextResponse } from 'next/server';
import { getStoredContent, saveStoredContent } from '@/lib/db';
import { DEFAULTS, mergeStored, clone, emptyReservation, emptyRegistration } from '@/lib/defaults';
import { validateRequest, slotEnd, czechDate, REPEAT_MODES } from '@/lib/rental';
import { sendMail, reservationMail, registrationMail, messageMail, notifyAddress } from '@/lib/mail';

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
      // Zvlášť, aby šlo žadateli odepsat — z volného textu se adresa vytáhnout nedá.
      email: s(payload.email, 200),
      phone: s(payload.phone, 60),
      area,
      dateISO,
      from,
      to: slotEnd(from, content.rentalSettings),
      date: czechDate(dateISO),
      time: from,
      note: s(payload.note, 800),
      // Přání pravidelného termínu — jen poznámka k poptávce, termíny neblokuje.
      // Sérii založí klub v administraci, viz `repeatWanted` v lib/defaults.js.
      repeatWanted: REPEAT_MODES.includes(payload.repeat) ? payload.repeat : '',
      repeatUntilWanted: /^\d{4}-\d{2}-\d{2}$/.test(s(payload.repeatUntil, 10)) ? s(payload.repeatUntil, 10) : '',
      source: 'web',
      status: 'nová',
      createdAt: new Date().toISOString(),
    };
    content.reservations = [reservation, ...(content.reservations || [])].slice(0, 500);
    await saveStoredContent(content);

    // Upozornění e-mailem je bonus — když není nastavené, poptávka už je uložená
    // v administraci a odeslání formuláře kvůli tomu nesmí selhat.
    const sent = await sendMail({ to: notifyAddress(content), ...reservationMail(reservation) });
    return NextResponse.json({ ok: true, emailSent: sent.ok });
  } else if (type === 'registration') {
    if (!s(payload.name, 120).trim()) {
      return NextResponse.json({ error: 'Vyplň prosím jméno.' }, { status: 400 });
    }
    const registration = {
      ...emptyRegistration(),
      id: `prihlaska-${new Date().toISOString()}`,
      name: s(payload.name, 120),
      birthdate: s(payload.birthdate, 10),
      team: s(payload.team, 120),
      parent: s(payload.parent, 120),
      contact: s(payload.contact, 200),
      email: s(payload.email, 200),
      note: s(payload.note, 800),
      source: 'web',
      status: 'nová',
      createdAt: new Date().toISOString(),
    };
    content.cmsRegistrations = [registration, ...(content.cmsRegistrations || [])].slice(0, 500);
    await saveStoredContent(content);
    const sent = await sendMail({ to: notifyAddress(content), ...registrationMail(registration) });
    return NextResponse.json({ ok: true, emailSent: sent.ok });
  } else if (type === 'message') {
    const message = {
      name: s(payload.name, 120),
      email: s(payload.email, 200),
      text: s(payload.text, 2000),
      date: new Date().toISOString(),
      status: 'nová',
    };
    content.messages = [message, ...(content.messages || [])].slice(0, 500);
    await saveStoredContent(content);
    const sent = await sendMail({ to: notifyAddress(content), ...messageMail(message) });
    return NextResponse.json({ ok: true, emailSent: sent.ok });
  }

  await saveStoredContent(content);
  return NextResponse.json({ ok: true });
}
