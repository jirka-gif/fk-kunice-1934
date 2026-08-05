// =============================================================================
//  PARSER STRÁNKY SOUTĚŽE (fotbal.cz)
//  Čistá funkce nad HTML — žádná síť, žádný prohlížeč. Díky tomu se dá otestovat
//  na uloženém vzorku stránky (tests/fixtures/).
//
//  POZOR: fotbal.cz nemá veřejné API a HTML se mění. Parser je proto napsaný
//  „volně" — nehledá konkrétní CSS třídy, ale tvar dat v tabulkách:
//    · řádek tabulky s pořadím, názvem týmu a čísly  → tabulka soutěže
//    · řádek s datem a skóre (2:1)                   → odehraný zápas
//    · řádek s datem a časem (16:30)                 → plánovaný zápas
//  Když se stránka změní tak, že parser nic nenajde, vrátí prázdný výsledek
//  a varování — nikdy nevymýšlí data.
// =============================================================================

const RE_TR = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
const RE_CELL = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
const RE_DATE = /(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/;
const RE_TIME = /\b(\d{1,2}):(\d{2})\b/;
const RE_SCORE = /\b(\d{1,2})\s*:\s*(\d{1,2})\b/;

// české znaky se na fotbal.cz běžně píšou jako pojmenované entity
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
  aacute: 'á', ccaron: 'č', dcaron: 'ď', eacute: 'é', ecaron: 'ě', iacute: 'í',
  ncaron: 'ň', oacute: 'ó', rcaron: 'ř', scaron: 'š', tcaron: 'ť', uacute: 'ú',
  uring: 'ů', yacute: 'ý', zcaron: 'ž',
  Aacute: 'Á', Ccaron: 'Č', Dcaron: 'Ď', Eacute: 'É', Ecaron: 'Ě', Iacute: 'Í',
  Ncaron: 'Ň', Oacute: 'Ó', Rcaron: 'Ř', Scaron: 'Š', Tcaron: 'Ť', Uacute: 'Ú',
  Uring: 'Ů', Yacute: 'Ý', Zcaron: 'Ž',
};

export function decodeEntities(text) {
  return String(text)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (ENTITIES[name] !== undefined ? ENTITIES[name] : m));
}

// HTML → čistý text jedné buňky
export function cellText(html) {
  return decodeEntities(String(html).replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

// HTML → pole řádků, každý řádek je pole textů buněk
export function tableRows(html) {
  const rows = [];
  const source = String(html || '');
  let tr;
  RE_TR.lastIndex = 0;
  while ((tr = RE_TR.exec(source)) !== null) {
    const cells = [];
    let cell;
    RE_CELL.lastIndex = 0;
    while ((cell = RE_CELL.exec(tr[1])) !== null) cells.push(cellText(cell[1]));
    if (cells.length) rows.push(cells);
  }
  return rows;
}

const isInt = (s) => /^\d+$/.test(String(s).trim());

// „16:30" je čas (dvě číslice za dvojtečkou), „3:1" je skóre (jedna číslice).
// Rozlišení je důležité — obojí se v rozpisu objevuje ve stejném sloupci.
export function isTimeCell(text) {
  const t = String(text).replace(/\s/g, '');
  if (!/^\d{1,2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h < 24 && m < 60;
}
export function isScoreCell(text) {
  const t = String(text).trim();
  return /^\d{1,2}\s*:\s*\d{1,2}$/.test(t) && !isTimeCell(t);
}
const toInt = (s) => parseInt(String(s).replace(/\D/g, ''), 10) || 0;

// --- tabulka soutěže --------------------------------------------------------
// Hledáme řádky tvaru: pořadí | tým | zápasy | … | body
export function parseTable(html, myTeam) {
  const out = [];
  for (const cells of tableRows(html)) {
    if (cells.length < 4) continue;
    const pos = cells[0].replace(/\.$/, '');
    if (!isInt(pos)) continue;
    const team = cells[1];
    if (!team || isInt(team)) continue;
    const numbers = cells.slice(2).filter((c) => isInt(c.replace(/\.$/, '')));
    if (numbers.length < 2) continue;
    out.push({
      pos: toInt(pos),
      team,
      gp: toInt(numbers[0]),
      pts: toInt(numbers[numbers.length - 1]),
      me: !!myTeam && team.toLowerCase().includes(String(myTeam).toLowerCase()),
    });
  }
  // pořadí musí jít vzestupně, jinak jsme chytili něco jiného než tabulku
  return out.filter((r, i, arr) => i === 0 || r.pos > arr[i - 1].pos);
}

// --- zápasy -----------------------------------------------------------------
// Řádek zápasu: datum, (čas nebo skóre) a dva názvy týmů.
function parseMatchRow(cells) {
  const joined = cells.join(' | ');
  const date = joined.match(RE_DATE);
  if (!date) return null;

  // dvojice týmů bývá v jedné buňce ("Kunice - Mnichovice") nebo ve dvou
  let home = '';
  let away = '';
  for (const c of cells) {
    const split = c.split(/\s+[-–—]\s+/);
    if (split.length === 2 && split[0].length > 1 && split[1].length > 1 && !RE_DATE.test(c)) {
      home = split[0].trim();
      away = split[1].trim();
      break;
    }
  }
  if (!home) {
    const names = cells.filter((c) => c && !isInt(c) && !RE_DATE.test(c) && !RE_TIME.test(c) && !RE_SCORE.test(c) && c.length > 2);
    if (names.length >= 2) { home = names[0]; away = names[1]; }
  }
  if (!home || !away) return null;

  const scoreCell = cells.find((c) => isScoreCell(c));
  const score = scoreCell ? scoreCell.match(RE_SCORE) : null;
  const timeCell = cells.find((c) => isTimeCell(c));
  const time = timeCell ? timeCell.replace(/\s/g, '').match(RE_TIME) : null;

  const [, d, m, y] = date;
  const hh = time ? time[1] : '00';
  const mm = time ? time[2] : '00';
  const dateISO = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${mm}:00`;

  return {
    dateISO,
    dateText: `${toInt(d)}. ${toInt(m)}. ${y}`,
    time: time ? `${time[1]}:${time[2]}` : '',
    home,
    away,
    score: score ? { home: toInt(score[1]), away: toInt(score[2]) } : null,
  };
}

export function parseMatches(html) {
  const out = [];
  for (const cells of tableRows(html)) {
    const match = parseMatchRow(cells);
    if (match) out.push(match);
  }
  return out;
}

// zkratka týmu pro dlaždici na webu (max 2 velká písmena)
export function shortName(name) {
  const words = String(name || '').replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// --- hlavní vstup -----------------------------------------------------------
// Vrátí návrh dat pro jeden tým: nejbližší zápas, poslední výsledek a tabulku.
export function parseTeamPage(html, options = {}) {
  const myTeam = options.teamName || 'Kunice';
  const now = options.now ? new Date(options.now) : new Date();
  const warnings = [];

  const table = parseTable(html, myTeam);
  if (!table.length) warnings.push('Nepodařilo se najít tabulku soutěže.');

  const all = parseMatches(html).filter((m) =>
    m.home.toLowerCase().includes(myTeam.toLowerCase()) || m.away.toLowerCase().includes(myTeam.toLowerCase()),
  );
  if (!all.length) warnings.push(`Na stránce nejsou žádné zápasy týmu „${myTeam}".`);

  // poslední výsledek = nejnovější odehraný zápas, který už proběhl
  const played = all
    .filter((m) => m.score && new Date(m.dateISO) <= now)
    .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
  const upcoming = all.filter((m) => !m.score && new Date(m.dateISO) >= now).sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));

  let nextMatch = null;
  if (upcoming[0]) {
    const m = upcoming[0];
    const homeIsUs = m.home.toLowerCase().includes(myTeam.toLowerCase());
    nextMatch = {
      home: { short: shortName(m.home), name: m.home.toUpperCase(), side: 'Domácí' },
      away: { short: shortName(m.away), name: m.away.toUpperCase(), side: 'Hosté' },
      when: `${m.dateText}${m.time ? ` · ${m.time}` : ''}`,
      venue: homeIsUs ? 'Areál Kunice' : m.home,
      dateISO: m.dateISO,
    };
  } else {
    warnings.push('Nenašel jsem žádný plánovaný zápas.');
  }

  let lastMatch = null;
  if (played[0]) {
    const m = played[0];
    const homeIsUs = m.home.toLowerCase().includes(myTeam.toLowerCase());
    const my = homeIsUs ? m.score.home : m.score.away;
    const opp = homeIsUs ? m.score.away : m.score.home;
    lastMatch = {
      opp: homeIsUs ? m.away : m.home,
      score: `${my}:${opp}`,
      result: my > opp ? 'VÝHRA' : my === opp ? 'REMÍZA' : 'PROHRA',
      scorers: '',
      dateISO: m.dateISO,
    };
  } else {
    warnings.push('Nenašel jsem žádný odehraný zápas.');
  }

  return { nextMatch, lastMatch, table, warnings, matchesFound: all.length };
}
