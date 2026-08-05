# Zadání pro Claude Code — FK Kunice 1934 (jedno souvislé zadání)

Toto je **jedno zadání**, které odpracuješ **v jedné větvi**, **sekvenčně** krok za krokem.
Kontext projektu (stack, datový tok, konvence, guardraily) je v **`CLAUDE.md`** — přečti si
ho jako první. Veškeré texty pro uživatele piš **česky**.

Cílem je **jistota funkčního prostředí**: každý krok musí být hotový, otestovaný a zelený,
teprve pak se pokračuje na další. Nespěchej dopředu.

---

## JAK PRACUJEŠ — závazná smyčka pro KAŽDÝ krok

U každého kroku (0 až 4) projdi přesně tyto fáze a **neodbočuj**:

1. **PROJDI AKTUÁLNÍ KÓD.** Než začneš, znovu si přečti relevantní části repozitáře a ověř
   skutečný stav po předchozím kroku (ne co „mělo být", ale co v kódu opravdu je).
2. **NAPLÁNUJ.** Krátce sepiš, co konkrétně změníš a proč (které soubory, jaká data, jaké API).
3. **IMPLEMENTUJ** po malých, srozumitelných commitech.
4. **NAPIŠ / AKTUALIZUJ TESTY** pokrývající nové chování (viz „Testovací režim" níže).
5. **SPUSŤ VŠE:** `npm run build` **a** `npm test`. (Kde je to v kroku uvedené, i e2e testy.)
6. **MUSÍ BÝT ZELENÉ.** Pokud cokoli padá → **oprav a opakuj od fáze 5.** Na další krok
   **nepokračuj**, dokud není build i testy zelené a funkce reálně funguje.
7. **ZKONTROLUJ PO SOBĚ.** Projdi vlastní diff a ověř guardraily: web běží i bez databáze
   (fallback na `DEFAULTS`), `PUT /api/content` a admin akce zůstávají chráněné, dodrženy
   konvence (JS, inline styly, české texty, klubové barvy), nic nefunkčního jsi nenechal.
   Co je potřeba, **oprav** a znovu spusť fázi 5.
8. **AŽ TEĎ DALŠÍ KROK** — a začni zase fází 1 (znovu se podívej do kódu a navaž na něj).

Na konci každého kroku napiš krátké shrnutí: co je hotové, výsledek `build`/`test`
(zeleně), a co bude následovat.

**Pravidlo bezpečnosti:** pokud by krok rozbil něco funkčního a nejde to rychle opravit,
vrať změnu, nech prostředí funkční a nahlas problém — nikdy nenechávej repo v nefunkčním
stavu kvůli postupu dál.

---

## TESTOVACÍ REŽIM (zaveď v Kroku 0, používej ve všech dalších)

Projekt zatím testy nemá — proto je jejich zavedení součástí zadání.

- **Unit / integrační testy: Vitest.** Přidej `vitest`, skript `"test": "vitest run"`.
  Testuj čistou logiku a serverové route handlery: `lib/defaults.js` (mergeStored,
  normalizeTeams), `lib/auth.js` (podpis/ověření cookie, kontrola hesla),
  `app/api/content` (GET vrací obsah; PUT bez přihlášení = 401; s přihlášením uloží),
  `app/api/submit` (přidá rezervaci/registraci/zprávu, nepřepíše zbytek).
- **E2e smoke (kritické toky): Playwright.** Přidej `@playwright/test`, skript
  `"test:e2e"`. Pokrytí: přihlášení do `/admin`, uložení úpravy a její přetrvání po
  reloadu, odeslání formuláře pronájmu/kontaktu, `/admin` bez přihlášení přesměruje na
  login. E2e spouštěj u kroků, kde má smysl (typicky 1 a 2).
- **Brána (gate) pro pokračování:** `npm run build` **zelený** a `npm test` **zelený**.
  Kde je to relevantní, i `npm run test:e2e` zelený. Bez toho se nepokračuje.
- Testy udržuj — v každém kroku přidej testy na nové chování a nech projít i ty starší.

---

## VÝCHOZÍ STAV
Hotový je frontend (všechny stránky) a admin pro většinu sekcí. Hotový je i testovací
backend: obsah se ukládá přes `/api/content`, formuláře přes `/api/submit`, `/admin` je za
heslem, web jede i bez DB (fallback na `DEFAULTS`). Detaily v `README-BACKEND.md` a `CLAUDE.md`.

---

## KROK 0 — Zorientuj se a postav testovací základ
1. Projdi celý repozitář a v krátkém souhrnu popiš, jak co funguje (datový tok, admin,
   backend) — ať víš, na co navazuješ.
2. Zaveď Vitest + Playwright dle „Testovacího režimu" a napiš **výchozí sadu testů** na
   **stávající** chování (viz seznam výše). Nic nového zatím neimplementuj.
3. **Gate:** `npm run build` zelený a `npm test` zelený (výchozí testy popisují realitu).
Teprve pak Krok 1.

## KROK 1 — Dokončení adminu (plná správa webu)
**Cíl:** klub upraví v adminu úplně vše viditelné, bez programátora.
Doplň:
1. Editaci dnes „natvrdo" napsaných textů — projdi `app/page.jsx` a `app/components/Footer.jsx`,
   najdi hardcoded texty (hero, sekce „PROČ MY" = `whyCards`, bloky kempy/pronájem/partneři,
   patička), přesuň je do obsahu (`content/club.js` + `lib/defaults.js`) a přidej pro ně
   editaci v `app/admin/sections.jsx` (sekce „Domů / texty").
2. Kempy jako **seznam více kempů** (přidat/archivovat/smazat) — admin i `app/kempy/page.jsx`.
3. Novinky: detail článku `app/novinky/[id]/page.jsx` + stránkování v přehledu.
4. Sekci **„Zprávy"** v adminu nad polem `messages` (z kontaktního formuláře) — nová/vyřízená/smazat.
5. Přehled v `app/admin/page.jsx`: nahraď vymyšlené `cmsStats` reálnými počty.

**Testy tohoto kroku:** editace textu se propíše do obsahu a přetrvá (unit nad defaults +
e2e uložení/reload); novinka má detailní stránku (e2e navigace); zprávy z formuláře se
zobrazí v adminu.
**Gate:** `build` + `test` (+ `test:e2e`) zelené, pak sebe-kontrola, pak Krok 2.

## KROK 2 — Role a přístupy
**Cíl:** vlastní uživatelé a role; zaškrtat, co která role vidí a smí upravovat (po sekcích).
1. Uživatelské účty (e-mail + heslo, **hashovaná** hesla) místo jednoho sdíleného hesla —
   doporučeno **Auth.js (NextAuth)**, credentials.
2. Model **rolí a oprávnění** na úrovni „sekce adminu × (view / edit)".
3. V adminu editor rolí (zaškrtávací matice) + správa uživatelů (pozvat/deaktivovat/reset).
4. **Vynucení ve frontendu i na serveru** — API musí odmítnout neoprávněnou úpravu.
5. Perzistence uživatelů/rolí: rozhodni mezi rozšířením `site_content` a Prisma tabulkami
   a volbu zdůvodni.

**Testy tohoto kroku:** přihlášení uživatele; role bez práva na sekci ji nevidí a **API ji
odmítne** (integrační test na 403); hashování hesel.
**Gate:** `build` + `test` (+ `test:e2e`) zelené, sebe-kontrola, pak Krok 3.

## KROK 3 — Zápasy z fotbal.cz
**Cíl:** plánované zápasy a výsledky se aktualizují automaticky (Pá/So/Ne/St).
**Pozor:** fotbal.cz nemá veřejné API a scraping blokuje (403), HTML se mění → řešení musí
být **odolné a s ruční kontrolou**.
1. V adminu u týmu doplň URL zdroje (k existujícímu `facrUrl`).
2. `scripts/scrape-matches.mjs` (Playwright, headless): nejbližší zápas, poslední výsledek,
   tabulka → odešle jako **návrh** do chráněného API (tajný token).
3. Naplánování 4× týdně přes **GitHub Actions** cron (`.github/workflows/matches.yml`) —
   Playwright se nehodí na Vercel serverless.
4. V adminu (Zápasy) schvalování návrhů (Potvrdit/Upravit/Zahodit) napojené na stávající editor.
5. Monitoring: při selhání upozornění; web neukazuje stará data jako nová.

**Testy tohoto kroku:** parser scraperu na uloženém vzorku HTML (bez volání živého webu);
API pro příjem návrhu odmítne bez tokenu; schválení zapíše data do obsahu.
**Gate:** `build` + `test` zelené, sebe-kontrola, pak Krok 4.

## KROK 4 — Meta Business (automatické posty)
**Cíl:** z výsledku zápasu vytvořit post (vizuál + text) na FB/IG, s úpravou v adminu.
1. Generátor vizuálu výsledku přes **@vercel/og** (šablona v klubových barvách: znak, skóre,
   soupeř, střelci) s upravitelnými proměnnými.
2. V adminu sekce „Sociální sítě": náhled a úprava textu i vizuálu, výběr FB/IG.
3. Publikování přes **Meta Graph API** (FB feed/photo, IG media container→publish);
   volba ruční schválení / auto po potvrzení výsledku. Tokeny **z env**, nikdy v kódu.
4. Fronta a historie postů (naplánované/odeslané/chybné, opakování při chybě).
5. Spouštěč napoj na potvrzený výsledek z Kroku 3.
   (Pozn.: založení Meta aplikace a schválení oprávnění dělá člověk mimo kód — v kódu
   připrav vše ostatní a jasně popiš, které env proměnné doplnit.)

**Testy tohoto kroku:** generátor vizuálu vrátí obrázek pro vzorová data; sestavení textu
postu; publikační vrstva ošetří chybu a zapíše ji do historie (Meta API zamockuj).
**Gate:** `build` + `test` zelené, sebe-kontrola. Hotovo.

---

## JEDEN MASTER PROMPT (zkopíruj do Claude Code na začátku)

> Přečti si `CLAUDE.md` a `ZADANI-CLAUDE-CODE.md`. Pracuj jako **jedno souvislé zadání v
> jedné větvi**, sekvenčně Krok 0 → 1 → 2 → 3 → 4. U **každého** kroku dodrž závaznou
> smyčku ze zadání: nejdřív projdi aktuální kód a ověř skutečný stav, naplánuj, naimplementuj,
> napiš/aktualizuj testy, spusť `npm run build` a `npm test` (kde je uvedeno i `npm run
> test:e2e`), a **na další krok pokračuj až když je vše zelené a funkce reálně funguje**.
> Po každém kroku zkontroluj vlastní práci proti guardrailům (web běží i bez databáze, admin
> a `PUT /api/content` chráněné, JS + inline styly + české texty), oprav nedostatky a znovu
> ověř zeleň. Nikdy nenech repo v nefunkčním stavu — když něco nejde opravit, vrať změnu a
> nahlas to. Po každém kroku napiš krátké shrnutí (co hotovo, výsledek build/testů, co dál).
> Začni Krokem 0.

*Připraveno 31. 7. 2026 · FK Kunice 1934*
