# CLAUDE.md — FK Kunice 1934

Kontext projektu pro Claude Code. Přečti si tento soubor před jakoukoli prací.
Veškeré texty pro uživatele (UI, hlášky, komentáře v adminu) piš **česky**.

## Co to je
Oficiální web fotbalového klubu **FK Kunice 1934** + vlastní administrace (CMS).
**Next.js 14 (App Router), React 18, čistý JavaScript (JSX) — NE TypeScript.**
Nasazeno na **Vercelu**.

## Jak spustit / ověřit
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # MUSÍ projít bez chyb — spouštěj po každém modulu
npm test         # Vitest (unit/integrační) — MUSÍ být zelené
npm run test:e2e # Playwright (e2e) — startuje vlastní dev server na portu 3100
```
Po větší změně vždy: `npm run build`, `npm test` a rychlý manuální test dotčeného toku.

**Testy:** `tests/` = Vitest (`lib/*`, API route handlery, běží bez databáze —
úložiště v paměti). `e2e/` = Playwright (přihlášení, uložení+reload, formuláře,
ochrana `/admin`). Před prvním e2e během: `npx playwright install chromium`.

## Konvence (drž se jich, nepřepisuj styl)
- **Žádný TypeScript, žádný Tailwind.** Stylování je **inline** přes `style={{...}}`.
- Design tokeny (barvy, placeholdery) jsou v `lib/design.js`. Klubová červená `#C1121F`,
  tmavá `#121212`, pozadí `#F6F7F9`. Nadpisy font **'Bebas Neue'**, text **Inter**.
- Sdílené admin prvky (Field, Select, Btn, Card, ListEditor, ImageField…) jsou
  v `app/admin/adminui.jsx`. Používej je, nevymýšlej nové varianty.
- Komponenty jsou převážně `'use client'`.
- Nepřidávej těžké závislosti bez důvodu. Preferuj stávající vzory.

## Datový tok (klíčové — pochop před úpravami)
Jeden zdroj obsahu, který čte web i admin:
- `content/club.js` — výchozí obsah (seed): klub, 11 týmů, soupisky, zápasy, novinky,
  kempy, pronájem, kontakty, partneři. **Needituj tu ručně data, je to jen seed.**
- `lib/defaults.js` — sestaví z club.js objekt `DEFAULTS` a normalizuje týmy
  (`mergeStored`, `normalizeTeams`, `toPlayer`). Běží na serveru i klientu (bez Reactu).
- `lib/store.js` (`'use client'`) — React Context. Web čte přes `useContent()`,
  admin přes `useData()`. Zápis přes `setSection(key, value)` a `updateData(mutator)`
  → interní `commit()` uloží do localStorage (cache) a **debounced PUT `/api/content`**.
- `ContentProvider` (v `app/layout.jsx`) při startu načte `GET /api/content`.

**Pravidlo:** komponenty nikdy nesahají na DB ani API napřímo kvůli obsahu —
vždy přes `useContent()` / `useData()` / `setSection` / `updateData`.

## Backend (testovací verze — už hotová)
Obsah je uložený jako **jeden JSON záznam** (řádek `id=1` v tabulce `site_content`).
- `lib/db.js` — `getStoredContent()`, `saveStoredContent(obj)`, `hasDatabase()`.
  Když je `DATABASE_URL` → **Neon Postgres** (`@neondatabase/serverless`).
  Když není → dočasné úložiště v paměti. **Tento fallback zachovej** — web musí jet
  i bez databáze (spadne na `DEFAULTS`).
- `app/api/content/route.js` — `GET` (veřejné, vrací obsah; lazy-seed při prvním běhu),
  `PUT` (jen přihlášený, uloží obsah).
- `app/api/submit/route.js` — veřejné odeslání formulářů (`reservation` / `registration`
  / `message`); jen **přidává** položku, nikdy nepřepisuje celý obsah.
- `lib/auth.js` — **zatím jedno sdílené heslo** (`ADMIN_PASSWORD`) + podepsaná cookie
  (Web Crypto HMAC). `app/api/login`, `app/api/logout`.
- `middleware.js` — chrání `/admin` (kromě `/admin/login`).

## Administrace
`app/admin/page.jsx` (layout + přehled) + `app/admin/sections.jsx` (sekce)
+ `app/admin/adminui.jsx` (prvky). Sekce v levém menu: Přehled, Týmy, Zápasy, Novinky,
Kempy, Pronájem, Kontakt, Partneři, Registrace, Nastavení.

## Proměnné prostředí
`DATABASE_URL` (Postgres), `ADMIN_PASSWORD` (heslo do adminu), `AUTH_SECRET`
(podpis cookie). Vzor v `.env.example`. Podrobnosti v `README-BACKEND.md`.

## Guardraily (co NErozbít)
1. Web musí běžet i **bez** `DATABASE_URL` (fallback na `DEFAULTS`).
2. Obsah teče **jen** přes store a `/api/content`. Neobcházej to.
3. `PUT /api/content` a admin akce **musí zůstat chráněné** přihlášením.
4. Zachovej JS (žádný TS), inline styly, české texty, klubové barvy.
5. Pracuj **po malých modulech**, každý samostatně nasaditelný. Po každém `npm run build`.
6. Neměň `content/club.js` jako způsob úprav dat — je to jen výchozí seed.

## Postup práce (jedno souvislé zadání)
Vše probíhá jako **jedno zadání v jedné větvi**, sekvenčně krok za krokem — viz
`ZADANI-CLAUDE-CODE.md`. Pro **každý** krok platí závazná smyčka: projdi aktuální kód →
naplánuj → naimplementuj → napiš/aktualizuj testy → spusť `npm run build` + `npm test`
(kde je uvedeno i `npm run test:e2e`) → **na další krok jen když je vše zelené a funkční**
→ zkontroluj po sobě a oprav → znovu se podívej do kódu a navaž. Nikdy nenech repo v
nefunkčním stavu — raději vrať změnu a nahlas problém.

**Testy:** projekt je zaváděj v Kroku 0 — **Vitest** (unit/integrační: `lib/*`, API route
handlery) a **Playwright** (e2e: přihlášení, uložení+reload, formuláře, ochrana `/admin`).
Brána pro pokračování = `npm run build` a `npm test` zelené (kde relevantní i e2e).
