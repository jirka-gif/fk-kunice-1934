// =============================================================================
//  FK KUNICE 1934 — KOMPLETNÍ OBSAH KLUBU (single source of truth)
//  Převzato 1:1 z designu „FK Kunice 1934.dc.html".
//  Tato data slouží zároveň jako seed pro headless CMS (viz /studio, /admin).
// =============================================================================

export const club = {
  name: 'FK Kunice',
  fullName: 'FK Kunice 1934',
  since: 1934,
  motto: 'Společně silnější.',
  region: 'Středočeský kraj',
  address: { street: 'Kunice 130', zip: '251 63', city: 'Kunice' },
  email: 'info@fkkunice.cz',
  phone: '+420 777 123 456',
  messenger: '@fkkunice1934',
  description:
    'Společně silnější. Moderní fotbalová akademie pro děti, mládež i dospělé ve Středočeském kraji.',
};

// -----------------------------------------------------------------------------
//  TÝMY — 11 reálných týmů, soupisky, realizační týmy, soutěže, kontakty
// -----------------------------------------------------------------------------
export const teams = [
  {
    id: 'muziA',
    name: 'Muži A',
    cat: 'Muži · A-tým',
    short: 'A-tým',
    comp: '7. liga sk. D',
    contact: '+420 725 972 229',
    coaches: [
      { n: 'Lukáš Liška', r: 'Hlavní trenér' },
      { n: 'Antonín Simandl', r: 'Asistent trenéra' },
      { n: 'Tomáš Burminov', r: 'Vedoucí týmu' },
    ],
    players: [
      'Daniel Moravec', 'Lukáš Dvořák', 'Adam Tůma', 'Šimon Dytrich', 'Ondřej Gottwald',
      'Pavel Chrdle', 'Petr Janků', 'Jakub Kaucký', 'Petr Kubice', 'Adam Lenner',
      'Jakub Al Obaid', 'Daniel Prokš', 'Michal Skála', 'Tomáš Skála', 'Matěj Soucha',
      'Marek Svoboda', 'Ondřej Šíma', 'David Vodička', 'Jan Vodička', 'Jakub Zaal',
    ],
  },
  {
    id: 'muziB',
    name: 'Muži B',
    cat: 'Muži · B-tým',
    short: 'B-tým',
    comp: '9. liga',
    contact: 'Zdeněk Zderadička · +420 606 792 160',
    coaches: [
      { n: 'Pavel Chlubna', r: 'Hlavní trenér' },
      { n: 'Zdeněk Zderadička', r: 'Vedoucí týmu' },
    ],
    players: [
      'Samuel Al Obaid', 'Martin Dolejš', 'Zdeněk Zderadička', 'Jan Garček', 'Radek Chadima',
      'Jakub Kment', 'Martin Gregor', 'Jakub Drábek', 'Pavel Lehovec', 'Jiří Novák',
      'Matěj Ryger', 'Marek Řepa', 'Ján Kordiak', 'Martin Konečný', 'Patrik Bříza',
      'Ondřej Havelka', 'Roman Kotrč', 'Matěj Bednář',
    ],
  },
  { id: 'dorostU19', name: 'Dorost U19', cat: 'Mládež · U19', short: 'U19', comp: 'Krajská soutěž', contact: '', coaches: [], players: [] },
  { id: 'dorostU17', name: 'Dorost U17', cat: 'Mládež · U17', short: 'U17', comp: 'Krajská soutěž', contact: '', coaches: [], players: [] },
  {
    id: 'zaciU15',
    name: 'Žáci U15',
    cat: 'Mládež · U15',
    short: 'U15',
    comp: 'Okresní přebor',
    contact: '',
    coaches: [
      { n: 'Zdeněk Zderadička', r: 'Hlavní trenér' },
      { n: 'Marek Urx', r: 'Trenér' },
      { n: 'Marek Řepa', r: 'Trenér' },
    ],
    players: [
      'Lukáš Brabec', 'Matěj Brožík', 'Nicolas Bulava', 'Martin Dušek', 'Antonín Fiala',
      'Tobias Hanzalius', 'Matěj Horák', 'Vendelín Horák', 'Adam Horálek', 'František Hrubeš',
      'Tomáš Hruška', 'Vendelín Jiráček', 'František Kubice', 'Matěj Mahďák', 'Stella Mandíková',
      'Tobias Marciniak', 'Antonín Štěpán Němeček', 'Alex Orinič', 'Matěj Pavlíček', 'Pavel Poljak',
      'Vilém Raida', 'Alice Rejzková', 'Michael Říha', 'Tomáš Souček', 'Jakub Suk',
      'Samuel Sulanský', 'Dominik Šopejstal', 'Přemysl Uchytil', 'David Vávra', 'Mikuláš Venzara',
      'Ben Vít', 'Nela Zderadičková',
    ],
  },
  { id: 'zaciU15B', name: 'Žáci U15 B', cat: 'Mládež · U15 B', short: 'U15 B', comp: 'Okresní soutěž', contact: '', coaches: [], players: [] },
  { id: 'zaciU13', name: 'Žáci U13', cat: 'Mládež · U13', short: 'U13', comp: 'Okresní přebor', contact: '', coaches: [], players: [] },
  {
    id: 'starsiP',
    name: 'Starší přípravka',
    cat: 'Mládež · U11',
    short: 'St. přípravka',
    comp: 'Okresní přebor',
    contact: '',
    coaches: [
      { n: 'Lukáš Liška ml.', r: 'Hlavní trenér' },
      { n: 'Daniel Moravec', r: 'Trenér' },
      { n: 'Jiří Vaněk', r: 'Trenér' },
    ],
    players: [
      'Michal Čepišák', 'Tobias Hlaváč', 'Vilém Horák', 'Benjamin Hrach', 'Petr Jakeš',
      'Jonáš Jamrich', 'František Křivohlavý', 'Martin Ondra', 'Ondřej Brinda', 'Dominik Poláček',
      'Daniel Prachař', 'Erik Rusyn', 'Roman Šádek', 'Filip Šála', 'Patrik Suk',
      'Johana Svobodová', 'Adam Sýkora', 'Josef Tureček', 'Matyáš Vaněk',
    ],
  },
  { id: 'starsiPB', name: 'Starší přípravka B', cat: 'Mládež · U11 B', short: 'St. příp. B', comp: 'Okresní soutěž', contact: '', coaches: [], players: [] },
  { id: 'mladsiP', name: 'Mladší přípravka', cat: 'Mládež · U9', short: 'Ml. přípravka', comp: 'Miniliga', contact: '', coaches: [], players: [] },
  { id: 'skolicka', name: 'Fotbalová školička', cat: 'Děti 4–6 let', short: 'Školička', comp: 'Nábor', contact: '', coaches: [], players: [] },
];

export const playersTotal = teams.reduce((s, t) => s + t.players.length, 0);
export const coachesTotal = teams.reduce((s, t) => s + t.coaches.length, 0);

// Věkový základ pro odvození věku hráče v soupisce (z designu)
export const ageBase = {
  muziA: 23, muziB: 26, dorostU19: 17, dorostU17: 16, zaciU15: 14, zaciU15B: 14,
  zaciU13: 12, starsiP: 10, starsiPB: 10, mladsiP: 8, skolicka: 5,
};
export const posCycle = ['GK', 'OBR', 'OBR', 'OBR', 'OBR', 'ZÁL', 'ZÁL', 'ZÁL', 'ZÁL', 'ÚTO', 'ÚTO', 'KŘÍ'];

// -----------------------------------------------------------------------------
//  HOME — statistiky, příští zápas, výsledky, tabulka
// -----------------------------------------------------------------------------
export const homeStats = [
  { value: 1934, suffix: '', label: 'Založeno' },
  { value: 11, suffix: '', label: 'Týmů' },
  { value: playersTotal, suffix: '', label: 'Hráčů' },
  { value: coachesTotal, suffix: '', label: 'Trenérů' },
];

export const nextMatch = {
  home: { short: 'FK', name: 'KUNICE', side: 'Domácí' },
  away: { short: 'MN', name: 'MNICHOVICE', side: 'Hosté' },
  when: 'NE 16:30 · III. TŘÍDA',
  venue: 'Areál Kunice',
};

export const results = [
  { wld: 'V', opp: 'Sokol Struhařov', score: '3:1' },
  { wld: 'V', opp: 'TJ Velké Popovice', score: '2:0' },
  { wld: 'P', opp: 'SK Mukařov', score: '1:1' },
];

export const leagueTable = [
  { pos: 1, team: 'FK Kunice', gp: 14, pts: 34, me: true },
  { pos: 2, team: 'SK Mukařov', gp: 14, pts: 30, me: false },
  { pos: 3, team: 'TJ Mnichovice', gp: 14, pts: 27, me: false },
  { pos: 4, team: 'Sokol Struhařov', gp: 14, pts: 22, me: false },
];

// -----------------------------------------------------------------------------
//  PROČ MY / KEMPY / AREÁL / NOVINKY / SPONZOŘI
// -----------------------------------------------------------------------------
export const whyCards = [
  { title: 'Profesionální trenéři', text: 'Licencovaní kouči s individuálním přístupem ke každému dítěti.', icon: 'star' },
  { title: 'Krásný areál', text: 'Travnaté hřiště, umělá tráva a moderní zázemí pro každý trénink.', icon: 'home' },
  { title: 'Přátelské prostředí', text: 'Rodinná atmosféra, kde se každý cítí být součástí týmu.', icon: 'users' },
  { title: 'Fotbal pro všechny', text: 'Od školičky po dospělé — místo najde každý, kdo má rád míč.', icon: 'ball' },
];

export const camps = [
  { tag: 'ČERVENEC', title: 'Letní fotbalový kemp', desc: 'Týden plný tréninků, her a zábavy pro děti 6–14 let. Profi trenéři, strava i dárky.', price: '4 290 Kč', term: 'týden', img: 'sunset' },
  { tag: 'SRPEN', title: 'Příměstský kemp', desc: 'Denní program 8–16h bez přespání. Ideální pro nejmenší fotbalisty a jejich rodiče.', price: '2 990 Kč', term: 'týden', img: 'dusk' },
];

export const facilities = [
  { name: 'Hlavní stadion', spec: 'Travnaté hřiště · 105×68 m · tribuna', price: '1 200 Kč', status: 'VOLNO', img: 'char' },
  { name: 'Tréninkové hřiště', spec: 'Travnaté · 90×60 m · osvětlení', price: '800 Kč', status: 'VOLNO', img: 'warm' },
  { name: 'Umělá tráva', spec: '3G povrch · 60×40 m · LED osvětlení', price: '950 Kč', status: 'OBSAZENO', img: 'cool' },
];

export const sponsors = ['STAVOSPOL', 'ENERGY', 'KUNICE', 'SPORTISIMO', 'RAIFFEISEN', 'FORTUNA', 'KOZEL', 'ŠKODA'];

// -----------------------------------------------------------------------------
//  ZÁPAS — detail odehraného zápasu
// -----------------------------------------------------------------------------
export const matchDetail = {
  header: 'OKRESNÍ PŘEBOR · 16. KOLO · ODEHRÁNO',
  when: 'Neděle 8. června 2026 · 16:30 · Areál FK Kunice',
  home: { short: 'FK', name: 'KUNICE' },
  away: { short: 'MN', name: 'MNICHOVICE' },
  score: { home: 3, away: 1 },
  result: 'VÝHRA',
  events: [
    { min: 12, type: 'goal', team: 'h', player: 'A. Pokorný', note: '1:0' },
    { min: 28, type: 'yellow', team: 'a', player: 'J. Černý', note: 'ŽK' },
    { min: 34, type: 'goal', team: 'h', player: 'J. Svoboda', note: '2:0' },
    { min: 51, type: 'goal', team: 'a', player: 'M. Dušek', note: '2:1' },
    { min: 67, type: 'yellow', team: 'h', player: 'P. Mareš', note: 'ŽK' },
    { min: 78, type: 'goal', team: 'h', player: 'F. Veselý', note: '3:1' },
    { min: 84, type: 'red', team: 'a', player: 'T. Holub', note: 'ČK' },
  ],
  stats: [
    { label: 'Držení míče', h: '58%', a: '42%', hPct: '58%' },
    { label: 'Střely', h: '14', a: '7', hPct: '67%' },
    { label: 'Na branku', h: '6', a: '3', hPct: '67%' },
    { label: 'Rohy', h: '7', a: '4', hPct: '64%' },
    { label: 'Fauly', h: '9', a: '13', hPct: '41%' },
  ],
};

// -----------------------------------------------------------------------------
//  KEMP — detail letního kempu
// -----------------------------------------------------------------------------
export const campDetail = {
  badge: 'LETNÍ KEMP 2026 · 7.–11. ČERVENCE',
  title: 'Léto plné fotbalu',
  lead: 'Pět dní tréninků, her a kamarádství pro děti 6–14 let pod vedením profesionálních trenérů.',
  price: '4 290 Kč',
  term: '7.–11. července 2026 · 8:00–16:00',
  startISO: '2026-07-07T08:00:00',
  capacity: { taken: 32, total: 40 },
  perks: [
    { emoji: '🏆', title: 'Profi trenéři', text: 'Licencovaní kouči z mládeže klubu.' },
    { emoji: '🍽️', title: 'Strava v ceně', text: 'Svačiny, obědy a pitný režim.' },
    { emoji: '🎁', title: 'Dárkový balíček', text: 'Dres, míč a medaile pro každého.' },
    { emoji: '📸', title: 'Foto & video', text: 'Sdílíme fotky z celého týdne.' },
  ],
  program: [
    { time: '08:00', title: 'Příchod a rozcvička' },
    { time: '09:00', title: 'Technický trénink' },
    { time: '12:00', title: 'Oběd a odpočinek' },
    { time: '13:30', title: 'Herní situace a zápasy' },
    { time: '16:00', title: 'Vyhodnocení dne' },
  ],
  includes: ['Trénink 5 dní (8–16h)', 'Strava a pitný režim', 'Klubový dres a míč', 'Medaile a diplom'],
  coaches: [
    { name: 'Lukáš Liška', role: 'Hlavní trenér mládeže', img: 'dusk' },
    { name: 'Daniel Moravec', role: 'Trenér', img: 'slate' },
    { name: 'Jiří Vaněk', role: 'Trenér', img: 'warm' },
  ],
  faq: [
    { q: 'Pro jaký věk je kemp určen?', a: 'Kemp je pro děti od 6 do 14 let, rozdělené do skupin podle věku a úrovně.' },
    { q: 'Musí mít dítě fotbalové zkušenosti?', a: 'Ne. Kemp je otevřený úplným začátečníkům i pokročilým hráčům.' },
    { q: 'Co když dítě onemocní?', a: 'Při doložení nemoci vracíme poměrnou část ceny nebo nabídneme náhradní termín.' },
    { q: 'Jak je řešena strava?', a: 'Zajišťujeme dopolední svačinu, teplý oběd a pitný režim po celý den.' },
  ],
};

// -----------------------------------------------------------------------------
//  PRONÁJEM — plochy, ceník, FAQ, obsazené dny v červenci
// -----------------------------------------------------------------------------
export const rentalPlans = [
  { name: 'Hlavní stadion', spec: 'Travnaté · 105×68 m', price: '1 200 Kč', status: 'VOLNO', img: 'char', features: ['Tribuna 200 míst', 'Šatny a sprchy', 'Osvětlení'] },
  { name: 'Tréninkové hřiště', spec: 'Travnaté · 90×60 m', price: '800 Kč', status: 'VOLNO', img: 'warm', features: ['Osvětlení', 'Šatny', 'Parkování'] },
  { name: 'Umělá tráva', spec: '3G povrch · 60×40 m', price: '950 Kč', status: 'OBSAZENO', img: 'cool', features: ['LED osvětlení', 'Celoročně', 'Malá kopaná'] },
];
export const rentalBusyDays = [3, 4, 9, 12, 17, 23, 24, 30];
export const rentalFaq = [
  { q: 'Jak rezervaci potvrdíte?', a: 'Po odeslání poptávky vás do 24 hodin kontaktujeme a potvrdíme dostupnost termínu.' },
  { q: 'Je možný pravidelný pronájem?', a: 'Ano, nabízíme zvýhodněné ceny pro pravidelné dlouhodobé rezervace.' },
  { q: 'Jsou k dispozici šatny?', a: 'Ke každému hřišti patří vybavené šatny se sprchami.' },
  { q: 'Lze pronajmout i na turnaj?', a: 'Samozřejmě. Pro celodenní akce připravíme individuální nabídku.' },
];

// -----------------------------------------------------------------------------
//  NOVINKY — jeden jednoduchý seznam (fotka, kategorie, titulek, text, datum).
//  Stejná data se zobrazují na homepage (poslední 4) i v magazínu /novinky.
//  `image` je nahraná fotka (data URL) z administrace; když chybí, web použije
//  elegantní barevný placeholder podle pořadí.
// -----------------------------------------------------------------------------
export const newsCategories = ['Vše', 'Áčko', 'Mládež', 'Klub', 'Akce'];
export const news = [
  { category: 'Áčko', title: 'Áčko slaví postup do okresního přeboru', text: 'Historický okamžik pro klub. Po dramatické sezóně a vítězství v posledním kole slaví naše áčko zasloužený postup do okresního přeboru.', date: '14. 6. 2026', image: '' },
  { category: 'Mládež', title: 'Přípravka vyhrála zimní turnaj v Říčanech', text: 'Naši nejmenší předvedli skvělý fotbal a z turnaje v Říčanech dovezli pohár.', date: '10. 6. 2026', image: '' },
  { category: 'Klub', title: 'Otevíráme nábor pro sezónu 2026/27', text: 'Hledáme nové talenty do všech věkových kategorií. Přijď si k nám zatrénovat.', date: '2. 6. 2026', image: '' },
  { category: 'Akce', title: 'Den otevřených dveří se vydařil', text: 'Areál zaplnily desítky rodin a budoucích fotbalistů. Děkujeme všem, kdo dorazili.', date: '28. 5. 2026', image: '' },
  { category: 'Mládež', title: 'Dorost postoupil do krajského finále', text: 'Výborný výkon a postup přes silného soupeře. Držte nám palce ve finále.', date: '20. 5. 2026', image: '' },
  { category: 'Klub', title: 'Nové LED osvětlení na umělé trávě', text: 'Investice do areálu, která prodlouží tréninkový čas i do večerních hodin.', date: '12. 5. 2026', image: '' },
];

// -----------------------------------------------------------------------------
//  KONTAKT — rychlé akce, lidé
// -----------------------------------------------------------------------------
export const quickActions = [
  { emoji: '📞', title: 'Zavolejte nám', value: '+420 777 123 456' },
  { emoji: '✉️', title: 'Napište e-mail', value: 'info@fkkunice.cz' },
  { emoji: '💬', title: 'Messenger', value: '@fkkunice1934' },
  { emoji: '📍', title: 'Navigovat', value: 'Kunice 130, 251 63' },
];
export const people = [
  { name: 'Petr Dvořák', role: 'Předseda klubu', ini: 'PD', bg: '#C1121F', phone: '+420 777 123 456', email: 'predseda@fkkunice.cz' },
  { name: 'Martina Krásná', role: 'Sekretariát / nábor', ini: 'MK', bg: '#2d6b8a', phone: '+420 776 234 567', email: 'nabor@fkkunice.cz' },
  { name: 'Jiří Sport', role: 'Správce areálu', ini: 'JS', bg: '#7a4a8c', phone: '+420 775 345 678', email: 'areal@fkkunice.cz' },
];

// -----------------------------------------------------------------------------
//  CMS / ADMIN — dashboard přehled (z designu)
// -----------------------------------------------------------------------------
export const cmsStats = [
  { label: 'Členové', value: '342', trend: '↑ +12 tento měsíc', up: true },
  { label: 'Návštěvy webu', value: '8 420', trend: '↑ +18 % týdně', up: true },
  { label: 'Rezervace', value: '27', trend: '↑ +4 tento týden', up: true },
  { label: 'Příjmy (Kč)', value: '64 300', trend: '↑ +9 % měsíc', up: true },
];
export const cmsRegistrations = [
  { name: 'Tobiáš Malý', team: 'Přípravka U9', ini: 'TM', bg: '#C1121F', tag: 'Nová', tg: 'new' },
  { name: 'Eliška Horká', team: 'Žáci U13', ini: 'EH', bg: '#2d6b8a', tag: 'Nová', tg: 'new' },
  { name: 'Matěj Dušek', team: 'Dorost U17', ini: 'MD', bg: '#7a4a8c', tag: 'Čeká', tg: 'wait' },
  { name: 'Klára Veselá', team: 'Školička', ini: 'KV', bg: '#c0853c', tag: 'Schváleno', tg: 'ok' },
];
export const cmsTodayMatches = [
  { match: 'Kunice – Mnichovice', team: 'A-tým', time: '16:30' },
  { match: 'Kunice – Mukařov', team: 'Dorost', time: '10:00' },
  { match: 'Struhařov – Kunice', team: 'Žáci', time: '09:00' },
];
// Rezervace pronájmu — z webu i ručně založené (telefon/osobně).
// status: 'nová' | 'potvrzená' | 'zamítnutá';  source: 'web' | 'telefon' | 'osobně'
export const reservations = [
  { name: 'TJ Velké Popovice', contact: '', area: 'Hlavní stadion', date: '22. 6. 2026', time: '18:00', note: '', source: 'web', status: 'nová' },
  { name: 'Firma Stavospol', contact: 'stavospol@email.cz', area: 'Umělá tráva', date: '24. 6. 2026', time: '17:00', note: 'Firemní turnaj, cca 20 osob', source: 'web', status: 'nová' },
  { name: 'Z. Marek', contact: '+420 777 000 111', area: 'Tréninkové hřiště', date: '25. 6. 2026', time: '19:00', note: 'Pravidelně každý čtvrtek', source: 'telefon', status: 'potvrzená' },
];

// -----------------------------------------------------------------------------
//  ZÁPASY PO TÝMECH — příští zápas (+ odpočet), poslední zápas se střelci, kompletní tabulka.
//  Ukázková data; klub si je upraví v administraci.
// -----------------------------------------------------------------------------
const _nmHome = (awayShort, awayName, when, dateISO) => ({ home: { short: 'FK', name: 'KUNICE', side: 'Domácí' }, away: { short: awayShort, name: awayName, side: 'Hosté' }, when, venue: 'Areál Kunice', dateISO });
const _nmAway = (homeShort, homeName, when, dateISO, venue) => ({ home: { short: homeShort, name: homeName, side: 'Domácí' }, away: { short: 'FK', name: 'KUNICE', side: 'Hosté' }, when, venue: venue || homeName, dateISO });
const _lm = (opp, score, result, scorers) => ({ opp, score, result, scorers });
// vygeneruje kompletní tabulku: vloží náš tým na pozici myPos, body sestupně
function _table(myName, myPos, opponents, gp) {
  const names = opponents.slice();
  names.splice(myPos - 1, 0, myName);
  const len = names.length;
  return names.map((team, i) => ({ pos: i + 1, team, gp, pts: Math.max(3, (len - i) * 3 - (i % 2)), me: team === myName }));
}
const _local = (suf) => ['SK Mukařov', 'Sokol Struhařov', 'TJ Velké Popovice', 'TJ Mnichovice', 'SK Strančice', 'Sokol Pyšely', 'TJ Kamenice', 'SK Senohraby', 'Sokol Ondřejov'].map((n) => `${n} ${suf}`);
const _region = (suf) => ['SK Říčany', 'FK Brandýs', 'Spartak Příbram', 'SK Kladno', 'FK Dobříš', 'Sokol Vlašim', 'TJ Benešov', 'FK Kolín'].map((n) => `${n} ${suf}`);

export const teamMatches = {
  muziA: {
    nextMatch: _nmHome('MN', 'MNICHOVICE', 'NE 16:30 · 7. LIGA SK. D', '2026-06-28T16:30'),
    lastMatch: _lm('TJ Mnichovice', '3:1', 'VÝHRA', 'A. Pokorný, J. Svoboda, F. Veselý'),
    table: [
      { pos: 1, team: 'FK Kunice', gp: 14, pts: 34, me: true },
      { pos: 2, team: 'SK Mukařov', gp: 14, pts: 30, me: false },
      { pos: 3, team: 'TJ Mnichovice', gp: 14, pts: 27, me: false },
      { pos: 4, team: 'Sokol Struhařov', gp: 14, pts: 22, me: false },
      { pos: 5, team: 'TJ Velké Popovice', gp: 14, pts: 21, me: false },
      { pos: 6, team: 'SK Strančice', gp: 14, pts: 19, me: false },
      { pos: 7, team: 'Sokol Pyšely', gp: 14, pts: 17, me: false },
      { pos: 8, team: 'FK Říčany B', gp: 14, pts: 16, me: false },
      { pos: 9, team: 'TJ Kamenice', gp: 14, pts: 14, me: false },
      { pos: 10, team: 'Sokol Ondřejov', gp: 14, pts: 12, me: false },
      { pos: 11, team: 'SK Senohraby', gp: 14, pts: 11, me: false },
      { pos: 12, team: 'TJ Mrač', gp: 14, pts: 9, me: false },
      { pos: 13, team: 'Sokol Čerčany', gp: 14, pts: 6, me: false },
      { pos: 14, team: 'SK Čtyřkoly', gp: 14, pts: 4, me: false },
    ],
  },
  muziB: {
    nextMatch: _nmAway('VP', 'V. POPOVICE B', 'SO 17:00 · 9. LIGA', '2026-06-27T17:00', 'Velké Popovice'),
    lastMatch: _lm('Sokol Struhařov B', '2:2', 'REMÍZA', 'M. Dolejš, J. Novák'),
    table: _table('FK Kunice B', 6, ['Sokol Struhařov B', 'TJ Velké Popovice B', 'SK Mukařov B', 'TJ Kamenice B', 'Sokol Pyšely B', 'SK Senohraby B', 'TJ Mrač B', 'Sokol Ondřejov B', 'SK Čtyřkoly B'], 13),
  },
  dorostU19: {
    nextMatch: _nmHome('ŘÍ', 'ŘÍČANY U19', 'SO 10:15 · KRAJSKÁ SOUTĚŽ', '2026-06-27T10:15'),
    lastMatch: _lm('FK Dobříš U19', '1:3', 'PROHRA', 'T. Beneš'),
    table: _table('FK Kunice U19', 4, _region('U19'), 18),
  },
  dorostU17: {
    nextMatch: _nmAway('KL', 'KLADNO U17', 'SO 12:30 · KRAJSKÁ SOUTĚŽ', '2026-06-27T12:30', 'Kladno'),
    lastMatch: _lm('SK Říčany U17', '2:1', 'VÝHRA', 'D. Král, M. Pošta'),
    table: _table('FK Kunice U17', 5, _region('U17'), 16),
  },
  zaciU15: {
    nextMatch: _nmHome('MU', 'MUKAŘOV U15', 'SO 10:00 · OKRESNÍ PŘEBOR', '2026-06-27T10:00'),
    lastMatch: _lm('Sokol Struhařov U15', '4:1', 'VÝHRA', 'M. Horák 2×, A. Fiala, T. Souček'),
    table: _table('FK Kunice U15', 1, _local('U15'), 14),
  },
  zaciU15B: {
    nextMatch: _nmAway('ST', 'STRANČICE U15', 'NE 09:00 · OKRESNÍ SOUTĚŽ', '2026-06-28T09:00', 'Strančice'),
    lastMatch: _lm('TJ Kamenice U15 B', '1:1', 'REMÍZA', 'V. Raida'),
    table: _table('FK Kunice U15 B', 5, _local('U15 B').slice(0, 7), 12),
  },
  zaciU13: {
    nextMatch: _nmHome('PY', 'PYŠELY U13', 'SO 09:00 · OKRESNÍ PŘEBOR', '2026-06-27T09:00'),
    lastMatch: _lm('SK Mukařov U13', '5:2', 'VÝHRA', 'J. Toman 2×, P. Kočí 2×, M. Brázda'),
    table: _table('FK Kunice U13', 3, _local('U13'), 13),
  },
  starsiP: {
    nextMatch: _nmHome('ON', 'ONDŘEJOV', 'NE 10:00 · OKRESNÍ PŘEBOR', '2026-06-28T10:00'),
    lastMatch: _lm('SK Mukařov', '6:3', 'VÝHRA', 'A. Sýkora 3×, F. Šála 2×, P. Suk'),
    table: _table('FK Kunice St. příp.', 2, _local('příp.'), 12),
  },
  starsiPB: {
    nextMatch: _nmAway('SE', 'SENOHRABY', 'NE 11:30 · OKRESNÍ SOUTĚŽ', '2026-06-28T11:30', 'Senohraby'),
    lastMatch: _lm('Sokol Pyšely příp.', '3:4', 'PROHRA', 'M. Vaněk 2×, J. Tureček'),
    table: _table('FK Kunice příp. B', 6, _local('příp. B').slice(0, 7), 11),
  },
  mladsiP: {
    nextMatch: _nmHome('VP', 'V. POPOVICE', 'SO 09:30 · MINILIGA', '2026-06-27T09:30'),
    lastMatch: _lm('TJ Kamenice', '4:4', 'REMÍZA', 'Hrály všechny děti — bez evidence střelců'),
    table: [],
  },
};
