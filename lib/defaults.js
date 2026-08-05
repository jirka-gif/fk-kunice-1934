// =============================================================================
//  FK KUNICE — SPOLEČNÁ DATOVÁ VRSTVA (bez Reactu, běží na serveru i klientu)
//  Sestaví výchozí obsah z content/club.js a normalizuje týmová data.
//  Používá to jak klientský store (lib/store.js), tak serverové API (app/api/*).
// =============================================================================
import * as club from '@/content/club';
import { emptySocialSettings, normalizeSocial } from '@/lib/social';
import { emptyRentalSettings, normalizeRentalSettings, slotEnd, czechDate } from '@/lib/rental';

export const clone = (o) => JSON.parse(JSON.stringify(o));

// prázdné zápasové struktury pro tým bez dat
export function emptyNextMatch() {
  return { home: { short: 'FK', name: 'KUNICE', side: 'Domácí' }, away: { short: '?', name: 'SOUPEŘ', side: 'Hosté' }, when: '', venue: 'Areál Kunice', dateISO: '' };
}
export function emptyMatchDetail() {
  return { header: '', when: '', home: { short: 'FK', name: 'KUNICE' }, away: { short: '?', name: 'SOUPEŘ' }, score: { home: 0, away: 0 }, result: 'VÝHRA', events: [], stats: [] };
}
export function emptyLastMatch() {
  return { opp: '', score: '', result: 'VÝHRA', scorers: '' };
}

// zápasová data týmu — z club.teamMatches; Muži A navíc detailní průběh + homepage výsledky
function teamMatch(id) {
  const m = club.teamMatches && club.teamMatches[id];
  // `sourceUrl` (odkud se stahují návrhy zápasů) startuje na odkazu z FAČR,
  // aby výchozí obsah odpovídal tomu, co z něj udělá normalizeTeams()
  if (id === 'muziA' && m) return { ...m, sourceUrl: m.sourceUrl || m.facrUrl || '', photo: m.photo || '', results: club.results, matchDetail: club.matchDetail };
  if (m) return { ...m, sourceUrl: m.sourceUrl || m.facrUrl || '', photo: m.photo || '', results: [], matchDetail: emptyMatchDetail() };
  return { nextMatch: emptyNextMatch(), lastMatch: emptyLastMatch(), results: [], table: [], facrUrl: '', sourceUrl: '', photo: '', matchDetail: emptyMatchDetail() };
}

// Hráč = jméno, číslo, pozice, fotka a datum narození. Věk se z data dopočítá,
// ať se nemusí každý rok přepisovat. Starý zápis (jen jméno) se převede.
const POS_CYCLE = club.posCycle;
export function toPlayer(p, i) {
  const pos = POS_CYCLE[i % POS_CYCLE.length];
  if (typeof p === 'string') return { name: p, number: i + 1, position: pos, photo: '', birthdate: '' };
  const src = p && typeof p === 'object' ? p : {};
  return {
    name: src.name || '',
    number: src.number != null && src.number !== '' ? src.number : i + 1,
    position: src.position || pos,
    photo: src.photo || '',
    birthdate: src.birthdate || '',
  };
}

// --- KEMPY ---------------------------------------------------------------
// Jeden kemp = karta na homepage (tag, titulek, popis, cena) + celý detail
// na /kempy (program, trenéři, FAQ…). Kempů může být víc, staré se archivují.
export function emptyCamp() {
  return {
    id: '', archived: false,
    tag: '', title: '', desc: '', img: 'sunset',
    badge: '', lead: '', price: '', term: '', startISO: '',
    capacity: { taken: 0, total: 0 },
    perks: [], program: [], includes: [], coaches: [], faq: [],
  };
}

export function toCamp(c, i) {
  const base = emptyCamp();
  const src = c && typeof c === 'object' ? c : {};
  return {
    ...base,
    ...src,
    id: src.id || `kemp-${i + 1}`,
    archived: !!src.archived,
    capacity: { ...base.capacity, ...(src.capacity || {}) },
    perks: src.perks || [],
    program: src.program || [],
    includes: src.includes || [],
    coaches: src.coaches || [],
    faq: src.faq || [],
  };
}

// výchozí kempy: karty z club.camps doplněné detailem z club.campDetail
function buildCamps() {
  const detail = club.campDetail || {};
  return (club.camps || []).map((c, i) =>
    toCamp(
      {
        ...c,
        badge: i === 0 ? detail.badge : `${c.tag || ''} · ${(c.title || '').toUpperCase()}`.trim(),
        lead: i === 0 ? detail.lead : c.desc,
        startISO: i === 0 ? detail.startISO : '',
        capacity: i === 0 ? detail.capacity : { taken: 0, total: 0 },
        perks: clone(detail.perks || []),
        program: clone(detail.program || []),
        includes: clone(detail.includes || []),
        coaches: clone(detail.coaches || []),
        faq: clone(detail.faq || []),
      },
      i,
    ),
  );
}

// doplní chybějící pole u kempů; starý obsah s jedním `campDetail` přenese
// do prvního kempu, aby se po aktualizaci nic neztratilo
export function normalizeCamps(data, legacy) {
  const legacyDetail = (legacy && legacy.campDetail) || null;
  data.camps = (Array.isArray(data.camps) ? data.camps : []).map((c, i) => {
    if (!legacyDetail || (c && c.perks)) return toCamp(c, i);
    // starý formát: první kemp převezme celý detail, další jen jeho kostru
    const skeleton = {
      perks: clone(legacyDetail.perks || []), program: clone(legacyDetail.program || []),
      includes: clone(legacyDetail.includes || []), coaches: clone(legacyDetail.coaches || []),
      faq: clone(legacyDetail.faq || []),
    };
    return toCamp({ ...(i === 0 ? legacyDetail : skeleton), ...c }, i);
  });
  delete data.campDetail;
  return data;
}

// --- NOVINKY -------------------------------------------------------------
// Každá novinka má vlastní `id` do adresy detailu (/novinky/<id>) a delší
// text `body`, který se ukazuje jen na detailu.
const CZ_MAP = { á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o', ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z' };
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .split('')
    .map((ch) => (CZ_MAP[ch] !== undefined ? CZ_MAP[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function emptyNews() {
  return { id: '', category: 'Klub', title: '', text: '', body: '', date: '', image: '' };
}

// zajistí, že každá novinka má neprázdné a jedinečné id (adresa detailu)
export function normalizeNews(data) {
  const used = new Set();
  data.news = (Array.isArray(data.news) ? data.news : []).map((n, i) => {
    const item = { ...emptyNews(), ...(n && typeof n === 'object' ? n : {}) };
    let id = item.id || slugify(item.title) || `novinka-${i + 1}`;
    if (used.has(id)) {
      let k = 2;
      while (used.has(`${id}-${k}`)) k++;
      id = `${id}-${k}`;
    }
    used.add(id);
    return { ...item, id };
  });
  return data;
}

// --- AUTOMATICKÉ STAHOVÁNÍ ZÁPASŮ ------------------------------------------
// Stav posledního běhu skriptu — admin podle něj pozná, že stahování selhalo.
export function emptyMatchesSync() {
  return { lastRunAt: '', lastOkAt: '', status: 'nikdy', message: '', teams: [] };
}

// Jeden návrh = data pro jeden tým, dokud je člověk nepotvrdí.
export function emptyProposal() {
  return {
    id: '', teamId: '', teamName: '', sourceUrl: '',
    createdAt: '', status: 'nová', // nová | schválená | zahozená
    warnings: [],
    data: { nextMatch: null, lastMatch: null, table: [] },
  };
}

export function normalizeProposals(data) {
  data.matchProposals = (Array.isArray(data.matchProposals) ? data.matchProposals : [])
    .map((p, i) => {
      const base = emptyProposal();
      const src = p && typeof p === 'object' ? p : {};
      return {
        ...base,
        ...src,
        id: src.id || `navrh-${i + 1}`,
        warnings: Array.isArray(src.warnings) ? src.warnings : [],
        data: { ...base.data, ...(src.data || {}) },
      };
    })
    .slice(0, 200);
  const sync = data.matchesSync && typeof data.matchesSync === 'object' ? data.matchesSync : {};
  data.matchesSync = { ...emptyMatchesSync(), ...sync, teams: Array.isArray(sync.teams) ? sync.teams : [] };
  return data;
}

// --- ZNAKY SOUPEŘŮ ---------------------------------------------------------
// Znak se nahraje jednou a použije se u každého dalšího zápasu proti stejnému
// soupeři. Páruje se podle názvu — bez ohledu na diakritiku, velikost písmen
// a zkratky typu „TJ" / „SK" na začátku.
const CLUB_PREFIXES = ['fk', 'tj', 'sk', 'fc', 'af', 'sokol', 'spartak', 'slavoj', 'viktoria'];
// Označení týmu uvnitř klubu — znak má klub jeden, ať hraje áčko nebo U15.
const TEAM_SUFFIXES = /^(a|b|c|u\d{1,2}|prip|pripravka|dorost|muzi|zaci|zeny|junior|juniori|st|ml|mini|minizaci)$/;

export function opponentKey(name) {
  const words = slugify(name).split('-').filter(Boolean);
  while (words.length > 1 && CLUB_PREFIXES.includes(words[0])) words.shift();
  while (words.length > 1 && TEAM_SUFFIXES.test(words[words.length - 1])) words.pop();
  return words.join('-');
}

// Ořízne z názvu označení týmu, ať v seznamu svítí „FK Brandýs" a ne
// „FK Brandýs U19" — znak je společný pro celý klub.
export function cleanClubName(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  while (words.length > 1 && TEAM_SUFFIXES.test(slugify(words[words.length - 1]))) words.pop();
  return words.join(' ');
}

// --- PARTNEŘI --------------------------------------------------------------
// Partner byl dřív jen text. Teď má i logo (nahrané v adminu) a odkaz na web.
// Starý zápis (pole řetězců) se automaticky převede, ať se nic neztratí.
export function emptySponsor() {
  return { id: '', name: '', logo: '', url: '' };
}

export function normalizeSponsors(data) {
  data.sponsors = (Array.isArray(data.sponsors) ? data.sponsors : [])
    .map((sp, i) => {
      const src = typeof sp === 'string' ? { name: sp } : (sp && typeof sp === 'object' ? sp : {});
      return {
        ...emptySponsor(),
        ...src,
        id: src.id || slugify(src.name) || `partner-${i + 1}`,
        name: String(src.name || ''),
        logo: String(src.logo || ''),
        url: String(src.url || ''),
      };
    })
    .filter((sp) => sp.name || sp.logo)
    .slice(0, 60);
  return data;
}

// --- GALERIE ---------------------------------------------------------------
// Osm dlaždic „Momenty" na hlavní stránce. Bez nahrané fotky zůstane barevný
// přechod jako zástupný obrázek, aby mřížka nikdy nezela prázdnotou.
export function emptyGalleryItem() {
  return { id: '', image: '', alt: '' };
}

export function normalizeGallery(data) {
  data.gallery = (Array.isArray(data.gallery) ? data.gallery : [])
    .map((g, i) => {
      const src = typeof g === 'string' ? { image: g } : (g && typeof g === 'object' ? g : {});
      return { ...emptyGalleryItem(), ...src, id: src.id || `foto-${i + 1}`, image: String(src.image || ''), alt: String(src.alt || '') };
    })
    .slice(0, 24);
  return data;
}

// --- REZERVACE PRONÁJMU ----------------------------------------------------
// Poptávka z webu i ručně zapsaná rezervace. `dateISO` + `from` jsou strojová
// podoba termínu (podle nich se počítá obsazenost), `date` a `time` zůstávají
// kvůli starším záznamům a čitelnému výpisu v administraci.
export function emptyReservation() {
  return {
    id: '', name: '', contact: '', area: '',
    dateISO: '', from: '', to: '',
    date: '', time: '',
    note: '', source: 'web', status: 'nová', createdAt: '',
  };
}

export function normalizeReservations(data) {
  const settings = normalizeRentalSettings(data.rentalSettings);
  data.rentalSettings = settings;
  data.reservations = (Array.isArray(data.reservations) ? data.reservations : [])
    .map((r, i) => {
      const src = r && typeof r === 'object' ? r : {};
      const from = /^\d{1,2}:\d{2}$/.test(src.from) ? src.from : (/^\d{1,2}:\d{2}$/.test(src.time) ? src.time : '');
      const dateISO = /^\d{4}-\d{2}-\d{2}$/.test(src.dateISO) ? src.dateISO : '';
      return {
        ...emptyReservation(),
        ...src,
        id: src.id || `rezervace-${i + 1}`,
        dateISO,
        from,
        to: src.to || (from ? slotEnd(from, settings) : ''),
        // čitelný zápis pro administraci; u starých záznamů zůstane původní text
        date: src.date || (dateISO ? czechDate(dateISO) : ''),
        time: src.time || from,
        status: ['nová', 'potvrzená', 'zamítnutá'].includes(src.status) ? src.status : 'nová',
      };
    })
    .slice(0, 500);
  return data;
}

export function emptyOpponent() {
  return { id: '', name: '', logo: '' };
}

export function normalizeOpponents(data) {
  data.opponents = (Array.isArray(data.opponents) ? data.opponents : [])
    .map((o, i) => {
      const src = o && typeof o === 'object' ? o : {};
      return {
        ...emptyOpponent(),
        ...src,
        id: src.id || opponentKey(src.name) || `soupere-${i + 1}`,
        name: String(src.name || ''),
        logo: String(src.logo || ''),
      };
    })
    .slice(0, 200);
  return data;
}

// Najde znak soupeře podle názvu; když ho nemáme, vrátí prázdný řetězec.
export function findOpponentLogo(opponents, name) {
  const key = opponentKey(name);
  if (!key) return '';
  const found = (opponents || []).find((o) => o.logo && opponentKey(o.name) === key);
  return found ? found.logo : '';
}

// Posbírá názvy soupeřů ze všeho, co v obsahu je — tabulky, poslední výsledky,
// příští zápasy a stažené návrhy. Administrace z toho udělá seznam k doplnění
// znaků, ať je klub nemusí vypisovat ručně.
export function collectOpponentNames(content) {
  const names = [];
  const push = (name) => {
    const clean = String(name || '').trim();
    if (clean && opponentKey(clean) && opponentKey(clean) !== 'kunice') names.push(clean);
  };

  // Bereme jen místa, kde je název zapsaný pořádně (tabulky a výsledky).
  // Názvy u „příštího zápasu" jsou psané verzálkami pro vizuál („V. POPOVICE"),
  // z těch by vznikly duplicity, tak je vynecháváme.
  for (const team of content.teams || []) {
    for (const row of team.table || []) push(row.team);
    if (team.lastMatch) push(team.lastMatch.opp);
    for (const r of team.results || []) push(r.opp);
  }
  for (const p of content.matchProposals || []) {
    const d = p.data || {};
    if (d.lastMatch) push(d.lastMatch.opp);
    for (const row of d.table || []) push(row.team);
  }

  // jeden název na klub — vyhrává nejkratší slušný zápis („SK Mukařov"
  // před „SK Mukařov U15 B") a název psaný verzálkami až jako poslední možnost
  const byKey = new Map();
  const score = (n) => (/^[^a-zá-ž]*$/.test(n) ? 1000 : 0) + n.length;
  for (const name of names) {
    const key = opponentKey(name);
    const current = byKey.get(key);
    if (!current || score(name) < score(current)) byKey.set(key, name);
  }
  return [...byKey.values()].map(cleanClubName).sort((a, b) => a.localeCompare(b, 'cs'));
}

export function buildDefaults() {
  return {
    club: club.club,
    teams: club.teams.map((t) => ({ ...t, ...teamMatch(t.id), players: (t.players || []).map(toPlayer) })),
    homeTexts: club.homeTexts,
    footer: club.footer,
    whyCards: club.whyCards,
    camps: buildCamps(),
    facilities: club.facilities,
    news: normalizeNews({ news: clone(club.news) }).news,
    sponsors: normalizeSponsors({ sponsors: clone(club.sponsors) }).sponsors,
    rentalPlans: club.rentalPlans,
    rentalBusyDays: club.rentalBusyDays,
    rentalFaq: club.rentalFaq,
    quickActions: club.quickActions,
    people: club.people,
    cmsRegistrations: club.cmsRegistrations,
    reservations: normalizeReservations({ reservations: clone(club.reservations) }).reservations,
    rentalSettings: emptyRentalSettings(),
    messages: [], // zprávy z kontaktního formuláře (nové – naplní /api/submit)
    matchProposals: [], // návrhy stažené z fotbal.cz, čekají na schválení v adminu
    matchesSync: emptyMatchesSync(), // stav automatického stahování (monitoring)
    gallery: [], // fotky do sekce „Momenty" na hlavní stránce
    opponents: [], // znaky soupeřů pro vizuály na sociální sítě
    socialPosts: [], // fronta a historie příspěvků na FB/IG
    socialSettings: emptySocialSettings(),
  };
}
export const DEFAULTS = buildDefaults();

// zajistí, že každý tým má zápasová pole (+ migrace starých globálních dat na Muži A)
export function normalizeTeams(data, legacy) {
  data.teams = (data.teams || []).map((t) => {
    const def = DEFAULTS.teams.find((d) => d.id === t.id) || {};
    const isA = t.id === 'muziA';
    return {
      ...t,
      players: (t.players || []).map(toPlayer),
      lastMatch: t.lastMatch || def.lastMatch || emptyLastMatch(),
      nextMatch: t.nextMatch || (isA && legacy ? legacy.nextMatch : null) || def.nextMatch || emptyNextMatch(),
      results: t.results || (isA && legacy ? legacy.results : null) || def.results || [],
      table: t.table || (isA && legacy ? legacy.leagueTable : null) || def.table || [],
      facrUrl: t.facrUrl != null ? t.facrUrl : (def.facrUrl || ''),
      // adresa stránky soutěže na fotbal.cz, ze které se stahují návrhy zápasů
      sourceUrl: t.sourceUrl != null ? t.sourceUrl : (t.facrUrl || def.sourceUrl || ''),
      // fotka týmu na kartu (bez ní se použije barevný přechod)
      photo: t.photo != null ? t.photo : (def.photo || ''),
      matchDetail: t.matchDetail || (isA && legacy ? legacy.matchDetail : null) || def.matchDetail || emptyMatchDetail(),
    };
  });
  delete data.nextMatch; delete data.results; delete data.leagueTable; delete data.matchDetail;
  return data;
}

// doplní do uloženého objektu klíče, které v něm chybí (rekurzivně, jen objekty).
// Díky tomu nerozbije starý uložený obsah nově přidané texty na webu.
const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
export function fillDefaults(saved, defs) {
  if (!isPlainObject(defs)) return saved === undefined ? clone(defs) : saved;
  if (!isPlainObject(saved)) return clone(defs);
  const out = { ...saved };
  for (const key of Object.keys(defs)) out[key] = fillDefaults(saved[key], defs[key]);
  return out;
}

// sekce, které jsou vnořené objekty s texty — u nich doplňujeme chybějící klíče
const DEEP_SECTIONS = ['homeTexts', 'footer', 'club'];

// sloučí uložený obsah z DB s výchozími hodnotami (aby nové sekce nechyběly)
export function mergeStored(saved) {
  if (!saved || typeof saved !== 'object') return clone(DEFAULTS);
  const merged = normalizeReservations(normalizeGallery(normalizeSponsors(normalizeOpponents(normalizeSocial(normalizeProposals(normalizeNews(normalizeCamps(normalizeTeams({ ...clone(DEFAULTS), ...saved }, saved), saved))))))));
  for (const key of DEEP_SECTIONS) merged[key] = fillDefaults(merged[key], DEFAULTS[key]);
  if (!Array.isArray(merged.messages)) merged.messages = [];
  return merged;
}
