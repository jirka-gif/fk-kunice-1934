// =============================================================================
//  FK KUNICE — ODESLÁNÍ UPOZORNĚNÍ E-MAILEM (server only)
//
//  Záměrně bez SMTP knihovny: posílá se HTTP requestem na Resend
//  (https://resend.com), takže nepřibývá žádná závislost a neřešíme odchozí
//  SMTP porty, které bývají v hostingu i v clusterech zavřené.
//
//  Proměnné prostředí:
//    RESEND_API_KEY  klíč z Resendu
//    MAIL_FROM       odesílatel ověřený v Resendu, např. "web@fkkunice.cz"
//  Kam se posílá, se nastavuje v administraci (Pronájem → Nastavení).
//
//  Když klíč není nastavený, e-mail se prostě nepošle a poptávka zůstane
//  v administraci — odeslání formuláře kvůli tomu nikdy neselže.
// =============================================================================

// =============================================================================
//  POJISTKA PROTI OMYLEM ODESLANÉ POŠTĚ
//
//  Odesílá se JEN v produkci. Kdekoli jinde (vývojový server, testy, ruční
//  skript) je pošta vypnutá, i když je v .env.local platný klíč k Resendu.
//  Zapnout jde výslovně proměnnou FK_MAIL_LIVE=1 — a to je vědomé rozhodnutí,
//  ne něco, co se stane omylem.
//
//  Proč: klíč v .env.local si načte i `next dev`, takže e2e testy i obyčejné
//  klikání na lokále rozesílaly skutečné e-maily na adresu klubu. Jeden běh
//  testů jich pošle deset až patnáct. Stalo se, proto tahle pojistka.
// =============================================================================
import { czechDate } from '@/lib/rental';

export function mailBlocked() {
  if (process.env.FK_MAIL_LIVE === '1') return '';
  if (process.env.NODE_ENV === 'production') return '';
  return 'Odesílání pošty je mimo produkci vypnuté (zapneš proměnnou FK_MAIL_LIVE=1).';
}

export function mailConfigured() {
  return !mailBlocked() && !!process.env.RESEND_API_KEY;
}

export function missingMailConfig() {
  const blokovano = mailBlocked();
  if (blokovano) return blokovano;
  if (!process.env.RESEND_API_KEY) return 'Chybí RESEND_API_KEY — upozornění se neposílají.';
  if (!process.env.MAIL_FROM) return 'Chybí MAIL_FROM — upozornění se neposílají.';
  return '';
}

// Stav odesílání pro administraci. Vrací jen to, jestli je pošta nastavená
// a z jaké adresy se posílá — **klíč se sem nikdy nedostane**, z prohlížeče
// by se dal přečíst.
export function mailStatus() {
  const error = missingMailConfig();
  return { configured: !error, from: process.env.MAIL_FROM || '', error };
}

// Text zkušebního e-mailu (tlačítko v administraci).
export function testMail() {
  return {
    subject: 'FK Kunice — zkouška odesílání',
    text: [
      'Dobrý den,',
      '',
      'tenhle e-mail odešel z administrace webu FK Kunice 1934 jako zkouška.',
      'Když dorazil, odesílání pošty funguje — upozornění na poptávky pronájmu',
      'i odpovědi žadatelům budou chodit.',
      '',
      'FK Kunice 1934',
    ].join('\n'),
  };
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
      // Resend vrací důvod jednou jako { error: { message } }, jindy rovnou
      // jako { message } — bez druhé varianty by v administraci svítilo jen
      // „selhalo (403)" a nikdo by se nedozvěděl, že chybí ověřená doména.
      const message =
        (data && data.error && (data.error.message || data.error))
        || (data && data.message)
        || `Odeslání e-mailu selhalo (${res.status})`;
      return { ok: false, skipped: false, error: String(message) };
    }
    return { ok: true, skipped: false, error: '' };
  } catch (err) {
    return { ok: false, skipped: false, error: err.message };
  }
}

// Jak často chce žadatel termín opakovat — slovy, do textu e-mailu.
const OPAKOVANI_SLOVY = { weekly: 'každý týden', biweekly: 'každý druhý týden' };

// Text upozornění na novou poptávku pronájmu.
export function reservationMail(reservation) {
  const r = reservation || {};
  const prani = OPAKOVANI_SLOVY[r.repeatWanted]
    ? `Žádá o pravidelný termín: ${OPAKOVANI_SLOVY[r.repeatWanted]}${r.repeatUntilWanted ? `, přibližně do ${czechDate(r.repeatUntilWanted) || r.repeatUntilWanted}` : ''}.`
    : '';
  const lines = [
    'Na webu dorazila nová poptávka pronájmu.',
    '',
    `Plocha:  ${r.area || '—'}`,
    `Termín:  ${r.date || '—'}${r.from ? `, ${r.from}–${r.to}` : ''}`,
    `Jméno:   ${r.name || '—'}`,
    `Kontakt: ${r.contact || '—'}`,
    r.note ? `Poznámka: ${r.note}` : null,
    prani || null,
    '',
    'Potvrdit nebo zamítnout jde v administraci: Pronájem → Rezervace.',
    'Dokud poptávku nevyřídíte, termín drží obsazený.',
    prani ? 'Opakování se samo nezabírá — zapnout ho jde v detailu poptávky.' : null,
  ].filter((l) => l !== null);
  return {
    subject: `Nová poptávka pronájmu — ${r.area || 'areál'}, ${r.date || ''}`.trim(),
    text: lines.join('\n'),
  };
}

// Text upozornění na novou přihlášku do klubu.
export function registrationMail(registration) {
  const g = registration || {};
  const lines = [
    'Na webu dorazila nová přihláška do klubu.',
    '',
    `Jméno:     ${g.name || '—'}`,
    g.birthdate ? `Narozen(a): ${g.birthdate}` : null,
    `Kategorie: ${g.team || '—'}`,
    `Rodič:     ${g.parent || '—'}`,
    `Kontakt:   ${g.contact || g.email || '—'}`,
    g.note ? `Poznámka: ${g.note}` : null,
    '',
    'Vyřídit jde v administraci: Pošta → Přihlášky.',
  ].filter((l) => l !== null);
  return {
    subject: `Nová přihláška do klubu — ${g.name || 'bez jména'}`,
    text: lines.join('\n'),
  };
}

// Text upozornění na novou zprávu z kontaktního formuláře.
export function messageMail(message) {
  const m = message || {};
  const lines = [
    'Na webu dorazila nová zpráva z kontaktního formuláře.',
    '',
    `Od:      ${m.name || '—'}`,
    `E-mail:  ${m.email || '—'}`,
    '',
    m.text || '(bez textu)',
    '',
    'Odpovědět jde v administraci: Pošta → Zprávy.',
  ].filter((l) => l !== null);
  return {
    subject: `Nová zpráva z webu — ${m.name || 'bez jména'}`,
    text: lines.join('\n'),
  };
}

// Kam posílat upozornění klubu — výhradně adresa z nastavení pronájmu.
//
// Schválně BEZ náhrady za klubový e-mail z Nastavení: ten je odesílací adresa
// (MAIL_FROM), ne schránka, kterou někdo čte. Když se na něj upozornění posílala,
// mizela do prázdna. Prázdná adresa tedy znamená „neposílat" a administrace na
// to upozorní (viz StavPosty) — to je lepší než tiše střílet vedle.
export function notifyAddress(content) {
  const c = content || {};
  return String(c.rentalSettings?.notifyEmail || '').trim();
}

// -----------------------------------------------------------------------------
//  ZPRÁVY ŽADATELI
//  Předvyplněné texty, které klub v administraci ještě může doplnit před
//  odesláním. Píšou se tak, aby dávaly smysl samy o sobě — příjemce nezná
//  administraci a nemusí si nic domýšlet.
// -----------------------------------------------------------------------------

function terminText(r) {
  const cas = r.from && r.to ? `${r.from}–${r.to}` : r.time || '';
  return [r.date, cas].filter(Boolean).join(', ');
}

export function reservationDecisionMail(reservation, potvrzeno, klubEmail) {
  const r = reservation || {};
  const termin = terminText(r);
  const podpis = ['', 'S pozdravem', 'FK Kunice 1934', klubEmail || null].filter((l) => l !== null);

  if (potvrzeno) {
    return {
      subject: `Rezervace potvrzena — ${r.area || 'areál'}${termin ? `, ${termin}` : ''}`,
      text: [
        `Dobrý den${r.name ? `, ${r.name}` : ''},`,
        '',
        'vaši rezervaci potvrzujeme.',
        '',
        `Plocha: ${r.area || '—'}`,
        `Termín: ${termin || '—'}`,
        r.repeat ? 'Rezervace se opakuje podle domluvy.' : null,
        '',
        'Kdyby se cokoli změnilo, dejte nám prosím vědět.',
        ...podpis,
      ].filter((l) => l !== null).join('\n'),
    };
  }
  return {
    subject: `Rezervace nepotvrzena — ${r.area || 'areál'}${termin ? `, ${termin}` : ''}`,
    text: [
      `Dobrý den${r.name ? `, ${r.name}` : ''},`,
      '',
      `bohužel vám nemůžeme potvrdit termín ${termin || 'který jste poptali'}${r.area ? ` na ploše ${r.area}` : ''}.`,
      '',
      'Rádi vám najdeme jiný termín — stačí odpovědět na tento e-mail.',
      ...podpis,
    ].filter((l) => l !== null).join('\n'),
  };
}

export function registrationDecisionMail(registration, prijato, klubEmail) {
  const g = registration || {};
  const podpis = ['', 'S pozdravem', 'FK Kunice 1934', klubEmail || null].filter((l) => l !== null);
  const komu = g.name || 'vaše dítě';

  if (prijato) {
    return {
      subject: `Přihláška do FK Kunice — ${komu}`,
      text: [
        `Dobrý den${g.parent ? `, ${g.parent}` : ''},`,
        '',
        `děkujeme za přihlášku${g.name ? ` pro ${g.name}` : ''}.`,
        g.team ? `Kategorie: ${g.team}` : null,
        '',
        'Ozveme se vám s termínem prvního tréninku.',
        ...podpis,
      ].filter((l) => l !== null).join('\n'),
    };
  }
  return {
    subject: `Přihláška do FK Kunice — ${komu}`,
    text: [
      `Dobrý den${g.parent ? `, ${g.parent}` : ''},`,
      '',
      `děkujeme za zájem${g.name ? ` o ${g.name}` : ''}. Bohužel vás teď do týmu přijmout nemůžeme.`,
      '',
      'Kapacita se v průběhu roku mění — ozvěte se nám prosím znovu, rádi se k tomu vrátíme.',
      ...podpis,
    ].filter((l) => l !== null).join('\n'),
  };
}

// Záznam do historie: co, komu a kdy odešlo. Ukládá se i neúspěch, aby bylo
// v administraci vidět, že se e-mail neodeslal.
export function historyEntry({ to, subject, text, ok, error }) {
  return {
    at: new Date().toISOString(),
    to: to || '',
    subject: subject || '',
    text: text || '',
    ok: !!ok,
    error: error || '',
  };
}
