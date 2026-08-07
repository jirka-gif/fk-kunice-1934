// GET  /api/mail        → stav odesílání pošty (je Resend nastavený?)
// POST /api/mail  { to } → pošle zkušební e-mail na zadanou adresu
//
// Klíč k Resendu je serverový a do prohlížeče se nikdy neposílá — proto tohle
// API. Vrací se jen `configured`, adresa odesílatele a čitelná hláška, co chybí.
//
// Oprávnění: stav vidí, kdo smí prohlížet Pronájem (tam se nastavuje adresa pro
// upozornění); zkušební e-mail smí poslat jen ten, kdo Pronájem edituje.
import { NextResponse } from 'next/server';
import { requireEdit, requireView } from '@/lib/apiauth';
import { mailStatus, sendMail, testMail } from '@/lib/mail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const { response } = await requireView('pronajem');
  if (response) return response;
  return NextResponse.json(mailStatus());
}

export async function POST(req) {
  const { response } = await requireEdit('pronajem');
  if (response) return response;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Neplatná data' }, { status: 400 }); }

  const to = String(body?.to || '').trim();
  if (!EMAIL_RE.test(to)) return NextResponse.json({ error: 'Vyplň platnou e-mailovou adresu.' }, { status: 400 });

  const { subject, text } = testMail();
  const vysledek = await sendMail({ to, subject, text });

  // 409 = pošta není nastavená (nic se neposílalo), 502 = Resend odmítl.
  if (!vysledek.ok) {
    return NextResponse.json(
      { error: vysledek.error || 'E-mail se nepodařilo odeslat.', skipped: !!vysledek.skipped },
      { status: vysledek.skipped ? 409 : 502 },
    );
  }
  return NextResponse.json({ ok: true, to });
}
