// =============================================================================
//  FK KUNICE — ODESLÁNÍ UPOZORNĚNÍ E-MAILEM (server only)
//
//  Záměrně bez SMTP knihovny: posílá se HTTP requestem na Resend
//  (https://resend.com), takže nepřibývá žádná závislost a funguje to i na
//  Vercelu, kde SMTP porty bývají zavřené.
//
//  Proměnné prostředí:
//    RESEND_API_KEY  klíč z Resendu
//    MAIL_FROM       odesílatel ověřený v Resendu, např. "web@fkkunice.cz"
//  Kam se posílá, se nastavuje v administraci (Pronájem → Nastavení).
//
//  Když klíč není nastavený, e-mail se prostě nepošle a poptávka zůstane
//  v administraci — odeslání formuláře kvůli tomu nikdy neselže.
// =============================================================================

export function mailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export function missingMailConfig() {
  if (!process.env.RESEND_API_KEY) return 'Chybí RESEND_API_KEY — upozornění se neposílají.';
  if (!process.env.MAIL_FROM) return 'Chybí MAIL_FROM — upozornění se neposílají.';
  return '';
}

// Vrací { ok, skipped, error } — nikdy nevyhodí výjimku.
export async function sendMail({ to, subject, text }, fetchImpl = fetch) {
  if (!to) return { ok: false, skipped: true, error: 'Není nastavená adresa příjemce.' };
  const missing = missingMailConfig();
  if (missing) return { ok: false, skipped: true, error: missing };

  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text }),
    });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok || (data && data.error)) {
      const message = (data && data.error && (data.error.message || data.error)) || `Odeslání e-mailu selhalo (${res.status})`;
      return { ok: false, skipped: false, error: String(message) };
    }
    return { ok: true, skipped: false, error: '' };
  } catch (err) {
    return { ok: false, skipped: false, error: err.message };
  }
}

// Text upozornění na novou poptávku pronájmu.
export function reservationMail(reservation) {
  const r = reservation || {};
  const lines = [
    'Na webu dorazila nová poptávka pronájmu.',
    '',
    `Plocha:  ${r.area || '—'}`,
    `Termín:  ${r.date || '—'}${r.from ? `, ${r.from}–${r.to}` : ''}`,
    `Jméno:   ${r.name || '—'}`,
    `Kontakt: ${r.contact || '—'}`,
    r.note ? `Poznámka: ${r.note}` : '',
    '',
    'Potvrdit nebo zamítnout jde v administraci: Pronájem → Rezervace.',
    'Dokud poptávku nevyřídíte, termín drží obsazený.',
  ].filter((l) => l !== '');
  return {
    subject: `Nová poptávka pronájmu — ${r.area || 'areál'}, ${r.date || ''}`.trim(),
    text: lines.join('\n'),
  };
}
