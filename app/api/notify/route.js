// POST /api/notify  { typ, id, subject, text } → pošle e-mail žadateli.
//
// Klíč k Resendu je serverový, z prohlížeče se posílat nedá — proto tohle API.
// Chráněné oprávněním na sekci, které se záznam týká: rezervace potřebují
// právo na Pronájem, přihlášky na Přihlášky.
//
// Výsledek (i chyba) se zapíše do historie záznamu, aby bylo v administraci
// vidět, co komu odešlo — a hlavně kdyby se e-mail neodeslal.
import { NextResponse } from 'next/server';
import { getStoredContent, saveStoredContent } from '@/lib/db';
import { DEFAULTS, mergeStored, clone } from '@/lib/defaults';
import { requireEdit } from '@/lib/apiauth';
import { sendMail, historyEntry } from '@/lib/mail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// typ záznamu → sekce s oprávněním + klíč v obsahu
const TYPY = {
  rezervace: { sekce: 'pronajem', klic: 'reservations' },
  prihlaska: { sekce: 'registrace', klic: 'cmsRegistrations' },
};

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Neplatná data' }, { status: 400 }); }

  const typ = TYPY[String(body?.typ || '')];
  if (!typ) return NextResponse.json({ error: 'Neznámý typ záznamu' }, { status: 400 });

  const { response } = await requireEdit(typ.sekce);
  if (response) return response;

  const subject = String(body?.subject || '').trim();
  const text = String(body?.text || '').trim();
  if (!subject || !text) return NextResponse.json({ error: 'Vyplň prosím předmět i text.' }, { status: 400 });

  const stored = await getStoredContent();
  const content = stored ? mergeStored(stored) : clone(DEFAULTS);
  const seznam = content[typ.klic] || [];
  const zaznam = seznam.find((z) => z.id === String(body?.id || ''));
  if (!zaznam) return NextResponse.json({ error: 'Záznam nenalezen' }, { status: 404 });

  const komu = String(zaznam.email || '').trim();
  if (!komu) return NextResponse.json({ error: 'U záznamu není vyplněný e-mail.' }, { status: 400 });

  const vysledek = await sendMail({ to: komu, subject, text });

  // Do historie jde i neúspěch — jinak by v administraci vypadal stejně
  // jako odeslaný e-mail a nikdo by se nedozvěděl, že nedorazil.
  zaznam.messages = [
    historyEntry({ to: komu, subject, text, ok: vysledek.ok, error: vysledek.error }),
    ...(Array.isArray(zaznam.messages) ? zaznam.messages : []),
  ].slice(0, 50);
  await saveStoredContent(content);

  if (!vysledek.ok) {
    return NextResponse.json(
      { error: vysledek.error || 'E-mail se nepodařilo odeslat.', skipped: !!vysledek.skipped },
      { status: vysledek.skipped ? 409 : 502 },
    );
  }
  return NextResponse.json({ ok: true, to: komu });
}
