# Plán: Super správce, záznam změn a přihlášení

Zadání: role nad Správcem, která jediná vidí, **kdo co změnil** na webu a v administraci,
a **kdo se kdy přihlásil**. Změny kódu se neřeší — ty zůstávají v historii na GitHubu.

Každá fáze je samostatná: dá se vykonat v novém sezení, má vlastní odkazy do kódu
a vlastní kontrolu. Na další fázi se jde jen tehdy, když `npm run build` i `npm test`
projdou.

> Build spouštěj jako `NEXT_DIST_DIR=.next-build npm run build`, jinak přepíše složku
> běžícího vývojového serveru a rozbije ho (ověřeno, stalo se).

---

## Fáze 0 — Co už v kódu je (přečteno, ne odhadnuto)

Zdroje: `lib/permissions.js`, `lib/users.js`, `lib/db.js`, `lib/apiauth.js`,
`app/api/content/route.js`, `app/api/login/route.js`, `tests/*`.

### Dostupná rozhraní, na kterých se staví

| co | kde | k čemu |
|---|---|---|
| `changedContentKeys(before, after)` | `lib/permissions.js:118` | **vrací seznam změněných klíčů obsahu** — přesně to, co má záznam zapsat |
| `canSaveContent(perms, before, after)` | `lib/permissions.js:132` | už dnes rozhoduje, co uživatel smí uložit |
| `ADMIN_SECTIONS` | `lib/permissions.js:12` | seznam sekcí; nová sekce se přidává sem |
| `ADMIN_GROUPS` | `lib/permissions.js:33` | skupiny v levém menu |
| `SECTION_CONTENT_KEYS` | `lib/permissions.js:62` | která sekce vlastní které klíče obsahu |
| `defaultRoles()` | `lib/permissions.js:153` | výchozí role; `spravce` má `system: true` |
| `normalizeAuth()` | `lib/users.js:73` | tvar uživatele — **`lastLoginAt` zatím nemá** |
| `authenticate(email, password)` | `lib/users.js:122` | jediné místo, kudy vede přihlášení |
| `getStoredAuth` / `saveStoredAuth` | `lib/db.js:156` a `:169` | oddělené úložiště mimo veřejný obsah |
| `requireUser` / `requireView` / `requireEdit` | `lib/apiauth.js:25`, `:40`, `:32` | ochrana API |
| mock přihlašovací cookie v testech | `tests/api-content.test.js:4-8` | vzor pro testy chráněných API |

### Vzory ke zkopírování

- **Chráněné API se zápisem do úložiště:** `app/api/notify/route.js` — ověření oprávnění,
  načtení obsahu, akce, zápis výsledku, uložení. Kopíruj strukturu, ne obsah.
- **Test chráněného API:** `tests/api-notify.test.js` — mock cookie, `loginAs(role)`,
  kontrola 401/403.
- **Sbalený seznam v administraci:** `ListEditor` v `app/admin/adminui.jsx:216`.
- **Tabulka záznamů s detailem:** `RezervaceTable` v `app/admin/sections.jsx`.

### Past, na kterou se musí dát pozor

`lib/users.js:71` **přepisuje oprávnění role Správce na plná při každém načtení**:

```js
for (const r of roles) if (r.id === 'spravce') { r.system = true; r.permissions = defaultRoles()[0].permissions; }
```

Kdyby se nová sekce jen přidala do `ADMIN_SECTIONS`, Správce by na ni automaticky
dostal právo a rozdíl mezi Správcem a Super správcem by neexistoval. Tenhle řádek
se **musí** upravit ve fázi 1.

### Zakázané postupy

- **Záznam nikdy neukládat do `site_content`.** Ten je veřejný přes `GET /api/content`
  (`app/api/content/route.js`) — kdokoli by si stáhl historii i s e-maily.
- Neukládat hesla, hashe ani celý obsah změny (rozhodnuto: bez „před a po").
- Nevymýšlet si funkce, které v `lib/db.js` nejsou. Nové úložiště se přidá stejným
  vzorem jako `site_auth` (tabulka + záložní úložiště v paměti + režim `.data/`).
- Nezapisovat záznam, dokud se změna neuloží — jinak by log tvrdil něco jiného než web.

---

## Fáze 1 — Role Super správce a nová sekce

**Co udělat**

1. `lib/permissions.js`: do `ADMIN_SECTIONS` přidat sekci `{ id: 'zaznam', label: 'Záznam změn', icon: 'dashboard' }`.
2. Do `ADMIN_GROUPS` přidat skupinu `zaznam` (samostatná položka v menu).
3. Do `defaultRoles()` přidat na první místo roli:
   `{ id: 'superspravce', name: 'Super správce', description: 'Vidí záznam změn a přihlášení.', system: true, permissions: allEdit() }`.
4. `defaultRoles()` u role `spravce`: `permissions: { ...allEdit(), zaznam: 'none' }`.
5. `lib/users.js:71` upravit tak, aby doplňoval plná práva **oběma** systémovým rolím,
   ale Správci držel `zaznam: 'none'`. Kopíruj stávající zápis, jen rozliš id role.
6. `SECTION_CONTENT_KEYS` **neměnit** — záznam nebydlí v obsahu webu.

**Kontrola**

- `npm test` — `tests/permissions.test.js` musí projít; doplnit případy:
  Správce `canView(perms,'zaznam') === false`, Super správce `=== true`.
- `grep -n "superspravce" lib/permissions.js lib/users.js` — role je na obou místech.
- Ověřit, že stávající uživatel s rolí `spravce` po přihlášení sekci Záznam **nevidí**.

**Nedělat**

- Neodebírat Správci nic jiného než `zaznam`.
- Nepřejmenovávat existující role — uživatelé je mají přiřazené podle `id`.

---

## Fáze 2 — Úložiště záznamu

**Co udělat**

1. `lib/db.js`: přidat tabulku `site_audit` vedle `site_auth` (`lib/db.js:117` je vzor)
   a funkce `getStoredAudit()` / `saveStoredAudit(obj)` podle `getStoredAuth` / `saveStoredAuth`
   (`lib/db.js:156` a `:169`), včetně záložního úložiště v paměti a režimu `.data/`.
2. Nový modul `lib/audit.js` (bez Reactu, běží na serveru):
   - `emptyAuditEntry()` — `{ id, at, userId, userEmail, userName, akce, sekce, detail, ip }`
   - `zapisZaznam(entry)` — načte, přidá na začátek, **ořízne na 1000 položek**, uloží
   - `normalizeAudit(data)` — doplní chybějící pole u starých záznamů
   - typy akcí jako konstanty: `obsah-zmena`, `prihlaseni-ok`, `prihlaseni-chyba`,
     `uzivatel-zmena`, `role-zmena`
3. Testy `tests/audit.test.js`: ořez na 1000, nejnovější první, normalizace neúplného záznamu.

**Kontrola**

- `npm test` zelené.
- `grep -rn "site_audit" lib/db.js` — tabulka se vytváří.
- `grep -rn "audit" app/api/content/route.js` — zatím **nic**, zápis přijde ve fázi 3.

**Nedělat**

- Neukládat do záznamu obsah polí (fotky jsou v obsahu jako data URL, log by narostl).
- Nepoužívat `saveStoredContent` — to je veřejné úložiště.

---

## Fáze 3 — Zápis změn obsahu a přihlášení

**Co udělat**

1. `app/api/content/route.js` (PUT, `:38-51`): **po úspěšném** `saveStoredContent`
   zapsat záznam. Seznam změněných částí vzít z `changedContentKeys(before, after)`
   (`lib/permissions.js:118`) — nevymýšlet vlastní porovnání.
   Detail = seznam klíčů, ne hodnoty.
2. `app/api/login/route.js:21`: zapsat `prihlaseni-ok` i `prihlaseni-chyba`
   (u chyby jen zadaný e-mail, nikdy heslo).
3. `lib/users.js`: do tvaru uživatele (`:73`) přidat `lastLoginAt` a při úspěšném
   přihlášení ho aktualizovat.
4. `app/api/users/route.js` a `app/api/roles/route.js`: zapsat `uzivatel-zmena`
   a `role-zmena` (kdo, koho, co — bez hesel).

**Kontrola**

- Nové testy: po `PUT /api/content` existuje záznam se správnými klíči;
  neúspěšné přihlášení vytvoří `prihlaseni-chyba`; **heslo se v záznamu nevyskytuje**
  (`expect(JSON.stringify(zaznam)).not.toContain('heslo')`).
- `npm test` + build zelené.

**Nedělat**

- Nezapisovat záznam, když `canSaveContent` vrátí 403 — pokus o změnu bez oprávnění
  je vhodné logovat zvlášť, ale ne jako provedenou změnu.
- Neblokovat uložení, když zápis do záznamu selže. Záznam je doplněk, ne podmínka.

---

## Fáze 4 — API pro čtení záznamu

**Co udělat**

1. `app/api/audit/route.js` — `GET`, chráněné `requireView('zaznam')`
   (`lib/apiauth.js:40`). Vzor struktury: `app/api/notify/route.js`.
2. Parametry: `?limit=` (výchozí 100, strop 500), `?akce=`, `?userId=`.
3. Vracet jen to, co se zobrazuje. Žádné hashe, žádné tokeny.

**Kontrola**

- Testy podle `tests/api-notify.test.js`: bez přihlášení 401, Správce 403,
  Super správce 200 a dostane pole záznamů.
- `npm test` + build zelené.

**Nedělat**

- Nedělat z toho veřejné API. Žádný `export const dynamic` bez ověření.

---

## Fáze 5 — Zobrazení v administraci

**Co udělat**

1. Nová sekce `app/admin/zaznam.jsx`: tabulka kdy / kdo / akce / co,
   filtr podle typu akce a podle uživatele.
   Rozložení podle `SectionHead` + `SubTabs` (`app/admin/adminui.jsx:124`).
2. Zaregistrovat sekci v `app/admin/page.jsx` (mapa `SECTIONS`).
3. V sekci Uživatelé ukázat u každého **poslední přihlášení** (`lastLoginAt`).

**Kontrola**

- Přihlásit se jako Super správce → sekce je vidět, tabulka se plní.
- Přihlásit se jako Správce → sekce v menu **není** a přímý přístup skončí odmítnutím.
- Změnit něco na webu → do minuty je to v záznamu se správným jménem.

**Nedělat**

- Nezobrazovat IP adresy návštěvníků webu. Záznam je o administraci, ne o čtenářích.

---

## Fáze 6 — Závěrečné ověření

1. `NEXT_DIST_DIR=.next-build npm run build` a `npm test` zelené.
2. `grep -rn "site_audit\|zapisZaznam" app lib | grep -v node_modules` — zápis je jen
   tam, kde má být.
3. `curl -s https://www.fkkunice.cz/api/content | grep -c audit` musí být **0** —
   záznam se nesmí objevit ve veřejném obsahu.
4. Projít akceptační kritéria a u každého napsat, jestli je splněné.

---

## Akceptační kritéria

| # | kritérium |
|---|---|
| 1 | Existuje role **Super správce**, kterou nejde smazat |
| 2 | Správce sekci Záznam změn **nevidí** a API mu vrátí 403 |
| 3 | Změna obsahu z administrace i z webu vytvoří záznam: kdo, kdy, které části |
| 4 | Přihlášení úspěšné i neúspěšné je v záznamu |
| 5 | U uživatele je vidět poslední přihlášení |
| 6 | Změny uživatelů a rolí jsou v záznamu |
| 7 | V záznamu není žádné heslo, hash ani token |
| 8 | Záznam není dostupný přes veřejné `GET /api/content` |
| 9 | Záznam se ořezává na 1000 položek |
| 10 | Web funguje i bez databáze (záložní úložiště v paměti) |

## Co plán vědomě neřeší

- **Změny kódu.** Zůstávají v historii na GitHubu; do administrace se netahají.
- **Před a po.** Ukládá se, které části se změnily, ne staré a nové hodnoty.
- **Úpravy přímo na webu** se zapíšou stejně jako z administrace, protože obojí
  teče přes `PUT /api/content`. Rozliší se jen tím, které klíče se změnily.
