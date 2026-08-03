#!/usr/bin/env node
// =============================================================================
//  NAPLNĚNÍ LOKÁLNÍHO PROSTŘEDÍ TESTOVACÍMI DATY
//  Spusť při běžícím `npm run dev`:  node scripts/seed-local.mjs
//
//  Založí přes veřejná / chráněná API pár věcí, na kterých jde hned zkoušet
//  celý tok: zprávu z kontaktu, rezervaci, registraci, návrh zápasu z fotbal.cz
//  a uživatele s omezenou rolí. Nic nemaže — jen přidává.
// =============================================================================
const SITE = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const EMAIL = process.env.ADMIN_EMAIL || 'admin@fkkunice.cz';
const PASSWORD = process.env.ADMIN_PASSWORD || 'lokalniheslo';
const TOKEN = process.env.MATCHES_TOKEN || 'lokalni-scraper-token';

const log = (...a) => console.log('  ', ...a);

async function post(path, body, headers = {}) {
  const res = await fetch(`${SITE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function main() {
  // ověření, že server běží
  try {
    const ping = await fetch(`${SITE}/api/content`);
    if (!ping.ok) throw new Error(String(ping.status));
  } catch {
    console.error(`Server na ${SITE} neběží. Spusť nejdřív: npm run dev`);
    process.exit(1);
  }

  console.log('\nPlním testovací data…\n');

  // --- veřejné formuláře ---
  await post('/api/submit', { type: 'message', payload: { name: 'Jana Testovací', email: 'jana@example.com', text: 'Dobrý den, ráda bych přihlásila syna (7 let) do přípravky. Kdy máte tréninky?' } });
  log('zpráva z kontaktního formuláře');

  await post('/api/submit', { type: 'message', payload: { name: 'Martin Novotný', email: 'martin@example.com', text: 'Máte volný termín na firemní turnaj v září?' } });
  log('druhá zpráva');

  await post('/api/submit', { type: 'reservation', payload: { name: 'Firma ABC s.r.o.', contact: '777 111 222 · abc@example.com', area: 'Hlavní stadion', date: '12. července 2026', time: '17:00', note: 'Firemní turnaj, cca 30 lidí.' } });
  log('poptávka pronájmu');

  await post('/api/submit', { type: 'registration', payload: { name: 'Tomáš Malý', team: 'Přípravka U9', contact: 'rodice@example.com' } });
  log('registrace do klubu');

  // --- návrh zápasu (jako by ho poslal scraper z fotbal.cz) ---
  const matches = await post('/api/matches', {
    proposals: [{
      teamId: 'muziA',
      teamName: 'Muži A',
      sourceUrl: 'https://www.fotbal.cz/souteze/vysledky-a-tabulky/p316',
      warnings: ['Tabulka se stáhla jen částečně — zkontroluj ji.'],
      data: {
        nextMatch: {
          home: { short: 'TK', name: 'TJ KAMENICE', side: 'Domácí' },
          away: { short: 'FK', name: 'FK KUNICE', side: 'Hosté' },
          when: '21. 6. 2026 · 16:30', venue: 'TJ Kamenice', dateISO: '2026-06-21T16:30:00',
        },
        lastMatch: { opp: 'TJ Mnichovice', score: '3:1', result: 'VÝHRA', scorers: '', dateISO: '2026-06-14T00:00:00' },
        table: [
          { pos: 1, team: 'FK Kunice', gp: 17, pts: 38, me: true },
          { pos: 2, team: 'SK Mukařov', gp: 17, pts: 33, me: false },
          { pos: 3, team: 'TJ Mnichovice', gp: 17, pts: 29, me: false },
          { pos: 4, team: 'Sokol Struhařov', gp: 17, pts: 24, me: false },
        ],
      },
    }],
  }, { 'x-scraper-token': TOKEN });
  log(matches.ok ? 'návrh zápasu z fotbal.cz' : `návrh zápasu SELHAL (${matches.status}) — sedí MATCHES_TOKEN?`);

  // --- uživatel s omezenou rolí (na vyzkoušení oprávnění) ---
  const login = await fetch(`${SITE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!login.ok) {
    log(`přihlášení správce selhalo (${login.status}) — zkontroluj ADMIN_EMAIL / ADMIN_PASSWORD`);
  } else {
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    const res = await post('/api/users', { email: 'redaktor@fkkunice.cz', name: 'Radek Redaktor', role: 'redaktor', password: 'redaktorheslo' }, { cookie });
    if (res.ok) log('uživatel redaktor@fkkunice.cz / redaktorheslo (role Redaktor)');
    else if (res.status === 409) log('uživatel redaktor@fkkunice.cz už existuje');
    else log(`založení redaktora selhalo (${res.status})`);
  }

  console.log(`
Hotovo. Otevři ${SITE}/admin/login

  Správce:  ${EMAIL} / ${PASSWORD}
  Redaktor: redaktor@fkkunice.cz / redaktorheslo   (uvidí míň sekcí)
`);
}

main().catch((err) => {
  console.error('Naplnění dat selhalo:', err.message);
  process.exit(1);
});
