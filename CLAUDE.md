# CLAUDE.md — FK Kunice 1934

Kontext projektu pro Claude Code. Přečti si tento soubor před jakoukoli prací.
Veškeré texty pro uživatele (UI, hlášky, komentáře v adminu) piš **česky**.

## Co to je
Oficiální web fotbalového klubu **FK Kunice 1934** + vlastní administrace (CMS).
**Next.js 14 (App Router), React 18, čistý JavaScript (JSX) — NE TypeScript.**

**Kde to běží:** jako kontejner v nethost clusteru (namespace `fk-kunice`),
obraz z GHCR staví workflow **Build image** při každém pushi do `main`.
Databáze je taky v clusteru (`fk-kunice-db`, CloudNativePG). Doména
`www.fkkunice.cz` má DNS v Cloudflare — ten provoz jen směruje, neproxuje ho,
takže požadavky chodí rovnou na ingress clusteru. Postup nasazení je
v `k8s/README.md`. **Na Vercelu web neběží** — kdyby v kódu zbyla zmínka,
je to pozůstatek, ne návod.

## Lokální testování
`.env.local` (není v gitu) zapíná `FK_LOCAL_STORE=1` → obsah i uživatelé se
ukládají do složky `.data/`, takže **přežijí restart** `npm run dev`.
Testovací data nalejeme přes `node --env-file=.env.local scripts/seed-local.mjs`.
Smazání `.data/` = návrat na úplně čistý web. E2E testy tenhle režim schválně
nepoužívají (Playwright si `FK_LOCAL_STORE` přebíjí na prázdno).

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
  kempy, pronájem, kontakty, partneři, texty homepage (`homeTexts`) a patičky (`footer`).
  **Needituj tu ručně data, je to jen seed.**
- `lib/defaults.js` — sestaví z club.js objekt `DEFAULTS` a normalizuje data
  (`mergeStored`, `normalizeTeams`, `normalizeCamps`, `normalizeNews`, `fillDefaults`,
  `toPlayer`). Běží na serveru i klientu (bez Reactu).
  - **kempy** jsou seznam (karta + detail v jednom objektu, `archived` je schová z webu),
  - **novinky** mají `id` (adresa detailu `/novinky/<id>`) a delší text `body`,
  - `fillDefaults` doplní chybějící vnořené klíče, aby starý uložený obsah
    nepřišel o nově přidané texty.
- `lib/store.js` (`'use client'`) — React Context. Web čte přes `useContent()`,
  admin přes `useData()`. Zápis přes `setSection(key, value)` a `updateData(mutator)`
  → interní `commit()` uloží do localStorage (cache) a **debounced PUT `/api/content`**.
- `ContentProvider` (v `app/layout.jsx`) při startu načte `GET /api/content`.

**Pravidlo:** komponenty nikdy nesahají na DB ani API napřímo kvůli obsahu —
vždy přes `useContent()` / `useData()` / `setSection` / `updateData`.

## Uživatelé, role a oprávnění (Krok 2)
Přihlášení je **na uživatele** (e-mail + heslo), ne na jedno sdílené heslo.
- `lib/permissions.js` — seznam sekcí adminu (`ADMIN_SECTIONS`), úrovně
  `none / view / edit`, mapa `SECTION_CONTENT_KEYS` (která sekce vlastní které
  klíče obsahu) a `canSaveContent()` — podle ní server pozná, jestli uživatel
  smí uložit konkrétní změnu. Běží na serveru i klientu.
- `lib/users.js` (server only) — hesla jen jako **PBKDF2-SHA256 hash** (Web Crypto,
  bez další závislosti), přihlášení, správa uživatelů a rolí.
- **Úložiště:** uživatelé a role jsou v **oddělené tabulce `site_auth`**, ne
  v `site_content`. Důvod: obsah je veřejný přes `GET /api/content`, hesla se do
  něj nesmí dostat. Prisma jsme nepoužili záměrně — vyžadovala by běžící databázi
  a rozbila guardrail „web musí jet i bez `DATABASE_URL`"; stejný JSONB záznam
  s fallbackem do paměti drží obojí konzistentní.
- `lib/apiauth.js` — `requireUser()` / `requireEdit(sekce)` pro chráněná API.
- API: `/api/login` (e-mail + heslo), `/api/me` (kdo jsem + změna hesla),
  `/api/users`, `/api/roles`. `PUT /api/content` porovná starý a nový obsah
  a odmítne (403) změny v sekcích, na které uživatel nemá `edit`.
- Middleware ověřuje jen podpis cookie (edge nemá přístup k DB); platnost účtu
  se kontroluje v API a na `/api/me`.

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
- `lib/auth.js` — podepsaná cookie (Web Crypto HMAC) s id přihlášeného uživatele.
  `app/api/login`, `app/api/logout`. Uživatele a role řeší `lib/users.js` (viz výš).
- `middleware.js` — chrání `/admin` (kromě `/admin/login`).

## Zápasy z fotbal.cz (Krok 3)
fotbal.cz nemá veřejné API a scraping blokuje (403), HTML se mění → řešení je
odolné a **vždy s ruční kontrolou**.
- `scripts/parse-fotbal.mjs` — čistý parser HTML (žádná síť). Nehledá CSS třídy,
  ale tvar dat (datum + skóre = odehráno, datum + čas = plánováno). Testuje se
  na uloženém vzorku `tests/fixtures/fotbal-sample.html`.
- `scripts/scrape-matches.mjs` — Playwright headless: projde týmy s vyplněným
  `sourceUrl`, HTML pošle parseru a výsledek odešle jako **návrh** na
  `POST /api/matches` (hlavička `x-scraper-token`, proměnná `MATCHES_TOKEN`).
- `.github/workflows/matches.yml` — cron 4× týdně (St/Pá/So/Ne). Běží
  v GitHub Actions, ne ve webovém kontejneru — Playwright potřebuje skutečný
  prohlížeč a ten se do obrazu webu nedává. Při selhání založí issue.
- Obsah: `matchProposals` (návrhy) + `matchesSync` (stav posledního běhu).
  **Návrh se na web nikdy nepropíše sám** — v adminu (Zápasy → Návrhy) ho člověk
  potvrdí, upraví nebo zahodí. Web tak nikdy neukazuje neověřená data a při
  selhání stahování svítí v adminu varování.

## Sociální sítě (Krok 4)
- `app/api/og/match/route.js` — vizuál výsledku přes knihovnu **@vercel/og**.
  (Je to jen npm balíček na kreslení obrázků, s hostingem nemá nic společného —
  běží nám v clusteru stejně dobře. Neodstraňovat při úklidu zmínek o Vercelu.)
  **Formát 1080 × 1350 px (4:5)** — ten Instagram i Facebook zobrazí v plné výšce.
  Široké 1200 × 630 je jen pro náhledy odkazů, ne pro příspěvky.
  Všechny texty jsou parametry adresy, takže admin mění vizuál bez zásahu do kódu.
  Znak klubu se bere z `public/logo-og.png` (satori neumí webp), znak soupeře
  z registru `opponents` — páruje se podle názvu přes `opponentKey()`
  (bez diakritiky, velikosti písmen, zkratky klubu na začátku a označení týmu
  na konci, takže „SK Mukařov U15" najde znak „SK Mukařov"). Soupeř bez znaku
  dostane dlaždici se zkratkou. `collectOpponentNames()` posbírá soupeře
  z tabulek a výsledků, aby je klub nemusel vypisovat ručně.
  **Fotka na pozadí:** nahraje se v adminu a uloží jako data URL — do adresy by
  se nevešla, proto se posílá jen `?post=<id>` a route si obsah načte sama
  (proto běží na `nodejs`, ne na edge). Fotka se ořízne na výšku a ztmaví
  přechodem, aby zůstaly texty čitelné.
  Pozor: satori vyžaduje `display:flex` u každého `div` s víc než jedním potomkem.
- `lib/social.js` — čistá logika: šablona textu (`{vysledek} {domaci} {skore}…`),
  adresa vizuálu, fronta (koncept → ke schválení → odesláno / chyba) a
  `postFromResult()` — spouštěč z potvrzeného výsledku (Krok 3).
- `lib/meta.js` (server only) — Graph API: FB `/{page}/photos`, IG
  `/{ig}/media` → `/{ig}/media_publish`. Tokeny **jen z prostředí**, nikdy v kódu
  ani v administraci. Chyby se vrací čitelně a zapisují do historie příspěvku.
- `app/api/social/route.js` — publikace (vyžaduje `edit` na sekci Sociální sítě);
  počítá pokusy, při chybě vrací 502 a stav uloží.
- Obsah: `socialPosts` (fronta + historie) a `socialSettings`
  (ruční / automatické schvalování, sítě, šablona, počet opakování).

## Rezervace pronájmu (poptávky)
- `lib/rental.js` — čistá logika: z otevírací doby nakrájí termíny, z rezervací
  spočítá obsazenost, `validateRequest()` rozhodne, jestli jde termín poptat.
  **Termín blokuje rezervace ve stavu `nová` i `potvrzená`** — nepotvrzená
  poptávka drží místo, dokud ji klub nezamítne.
- `app/api/availability` — veřejné, vrací **jen časy a stavy**, nikdy jména
  ani kontakty (ty patří do administrace).
- `POST /api/submit` (typ `reservation`) kontroluje termín ještě jednou na
  serveru a při kolizi vrací **409** — jinak by dva lidé poptali stejný čas.
- `lib/mail.js` — upozornění přes Resend HTTP API (bez SMTP knihovny).
  Bez `RESEND_API_KEY` se e-mail neodešle, ale poptávka se uloží.
  **Odesílání je mimo produkci vypnuté** (`mailBlocked()`): posílá se jen když
  `NODE_ENV=production`, jinak je potřeba výslovně `FK_MAIL_LIVE=1`. Důvod:
  klíč z `.env.local` si načte i `npm run dev`, takže lokální klikání i jeden běh
  e2e testů rozeslaly desítky skutečných e-mailů na adresu klubu. **Tuhle pojistku
  neobcházej** a při vývoji neposílej naostro bez domluvy s klubem.
  Kam upozornění chodí, říká `notifyAddress()` — **jen** `rentalSettings.notifyEmail`.
  Klubový e-mail z Nastavení je odesílací adresa (`MAIL_FROM`), ne schránka:
  jako náhrada se nepoužívá, upozornění by mizela do prázdna.
  Důvod odmítnutí čteme z `error.message` i z `message` — Resend vrací obojí.
- `app/api/mail/route.js` — `GET` vrací stav pošty (`configured`, odesílatel,
  co chybí; **klíč nikdy**), `POST { to }` pošle zkušební e-mail. Stav vidí, kdo
  smí prohlížet Pronájem, odeslat smí jen ten, kdo ho edituje. V administraci to
  ukazuje `StavPosty` (Pronájem → Otevírací doba) — bez toho šlo nefunkční
  odesílání poznat jen podle toho, že e-maily nechodí.
- Obsah: `reservations` (s `dateISO`/`from`/`to`) + `rentalSettings`
  (otevírací doba, délka termínu, zavřené dny, e-mail pro upozornění).
- `app/components/Vyber.jsx` — rozbalovací nabídka v klubovém stylu
  (nativní `<select>` nejde napříč prohlížeči nastylovat).

## Administrace
`app/admin/page.jsx` (layout + přehled) + `app/admin/sections.jsx` (sekce)
+ `app/admin/adminui.jsx` (prvky) + `app/admin/users.jsx` (uživatelé a role)
+ `app/admin/account.jsx` (změna vlastního hesla). Sekce v levém menu: Přehled,
Domů / texty, Týmy, Zápasy, Novinky, Kempy, Pronájem, Kontakt, Zprávy, Partneři,
Registrace, Sociální sítě, Nastavení, Uživatelé a role —
**menu se skládá podle oprávnění role**.
Přehled ukazuje **reálné počty** z obsahu (nové zprávy, rezervace, registrace,
vypsané kempy, nejbližší zápasy) — žádná vymyšlená čísla.

## Proměnné prostředí
`DATABASE_URL` (Postgres), `ADMIN_EMAIL` + `ADMIN_PASSWORD` (první správce,
založí se při prvním spuštění), `AUTH_SECRET` (podpis cookie),
`MATCHES_TOKEN` (+ `SITE_URL` v GitHub Actions) pro stahování zápasů,
`META_PAGE_ID` / `META_PAGE_TOKEN` / `META_IG_USER_ID` pro sociální sítě.
Vzor v `.env.example`. Podrobnosti v `README-BACKEND.md`.

## Guardraily (co NErozbít)
1. Web musí běžet i **bez** `DATABASE_URL` (fallback na `DEFAULTS`).
2. Obsah teče **jen** přes store a `/api/content`. Neobcházej to.
3. `PUT /api/content` a admin akce **musí zůstat chráněné** přihlášením —
   a navíc oprávněním role (server kontroluje, ne jen frontend).
   Hesla ani uživatelé se **nikdy** nesmí dostat do obsahu webu.
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
