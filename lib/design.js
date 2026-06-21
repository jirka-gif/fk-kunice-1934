// Design tokeny převzaté 1:1 z návrhu FK Kunice 1934.

export const COLORS = {
  red: '#C1121F',
  redBright: '#D62839',
  redDark: '#8E0F18',
  ink: '#121212',
  text: '#1E1E1E',
  bg: '#F6F7F9',
  muted: '#9AA1AC',
  line: '#F2F3F5',
  greenBg: '#EAF6EE',
  green: '#1F8A4C',
};

// Kinematické foto-placeholdery (teplé večerní světlo) — než dodáš reálné fotky.
export const PH = {
  dusk: 'linear-gradient(145deg,#2c2620,#7a4e2e)',
  slate: 'linear-gradient(145deg,#1d2127,#3b4452)',
  sunset: 'linear-gradient(150deg,#b15f2c,#291a13)',
  char: 'linear-gradient(145deg,#262626,#48413a)',
  red: 'linear-gradient(150deg,#5e2026,#180f10)',
  cool: 'linear-gradient(150deg,#2b323e,#11151b)',
  warm: 'linear-gradient(145deg,#3c372f,#16120e)',
  ember: 'linear-gradient(150deg,#8a3b22,#1c1411)',
};
export const PH_ARR = [PH.dusk, PH.slate, PH.sunset, PH.cool, PH.char, PH.warm, PH.red, PH.ember];

export function photo(key) {
  return PH[key] || key || PH.slate;
}

export const HERO_BGS = [
  'linear-gradient(135deg,#1a1210 0%,#5e2026 52%,#b15f2c 100%)',
  'linear-gradient(120deg,#121212 0%,#2a1416 52%,#8E0F18 100%)',
  'linear-gradient(150deg,#7a4e2e 0%,#2c2620 46%,#121212 100%)',
];

// Iniciály ze jména
export function initials(name) {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

// Badge styl pro V/R/P výsledek
export function wldBadge(t) {
  const map = {
    V: 'background:#C1121F;color:#fff',
    R: 'background:#EFF1F4;color:#9AA1AC',
    P: 'background:#F3F0E9;color:#A98C4E',
  };
  return `width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;font-family:Inter;${map[t] || map.V}`;
}

// Parsuje "a:b;c:d" inline-style string na React style objekt
export function css(str) {
  const out = {};
  if (!str) return out;
  for (const part of str.split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const prop = part.slice(0, i).trim();
    const val = part.slice(i + 1).trim();
    if (!prop) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = val;
  }
  return out;
}
