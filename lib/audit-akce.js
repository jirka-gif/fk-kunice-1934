// Typy akcí v záznamu a jejich popisky. Schválně bez importu úložiště —
// používá je i administrace v prohlížeči a `lib/audit.js` sahá na server
// (node:fs), což by se do klienta nesmělo dostat.
export const AKCE = {
  obsahZmena: 'obsah-zmena',
  prihlaseniOk: 'prihlaseni-ok',
  prihlaseniChyba: 'prihlaseni-chyba',
  uzivatelZmena: 'uzivatel-zmena',
  roleZmena: 'role-zmena',
};

export const AKCE_POPIS = {
  'obsah-zmena': 'Změna obsahu',
  'prihlaseni-ok': 'Přihlášení',
  'prihlaseni-chyba': 'Neúspěšné přihlášení',
  'uzivatel-zmena': 'Změna uživatele',
  'role-zmena': 'Změna role',
};
