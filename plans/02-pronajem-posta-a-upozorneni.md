# Plán: pošta, upozornění a dlouhodobý pronájem

Zadání vzniklo z ostrého vyzkoušení pronájmu. Tři nahlášené věci:

1. systém nepočítá s dlouhodobým (pravidelným) pronájmem,
2. po „Potvrdit" v administraci nedorazil žadateli potvrzovací e-mail,
3. nová poptávka dorazila, ale v Přehledu ani v Pronájmu nic nesvítilo.

Při čtení kódu se našla ještě čtvrtá, nenahlášená a horší: **souběžná editace maže
příchozí poštu**. Je proto první fází.

Každá fáze je samostatná: dá se vykonat v novém sezení, má vlastní odkazy do kódu
a vlastní kontrolu. Na další fázi se jde jen tehdy, když `npm run build` i `npm test`
projdou.

> Build spouštěj jako `NEXT_DIST_DIR=.next-build npm run build`, jinak přepíše složku
> běžícího vývojového serveru a rozbije ho.

**Kde testovat.** Projekt nemá staging. Sandbox je lokální režim `FK_LOCAL_STORE=1`
(data v `.data/`, viz `LOKALNI-TESTOVANI.md`) — tam se zkouší všechno. Na ostrá data
v clusteru se během vývoje nesahá; nasazuje se až hotová fáze přes `k8s/README.md`.

---

## Fáze 0 — Co už v kódu je (přečteno, ne odhadnuto)

Zdroje: `lib/rental.js`, `lib/defaults.js`, `lib/store.js`, `lib/mail.js`,
`app/api/content/route.js`, `app/api/submit/route.js`, `app/api/notify/route.js`,
`app/admin/sections.jsx`, `app/admin/page.jsx`, `app/pronajem/page.jsx`,
`tests/rental.test.js`, `tests/api-submit.test.js`.

### Dlouhodobý pronájem — hotový je skoro celý

| co | kde | stav |
|---|---|---|
| `repeat`, `repeatUntil`, `skipDates` v záznamu | `lib/defaults.js:303` | **je** |
| normalizace těch polí | `lib/defaults.js:340-342` | **je** |
| `REPEAT_MODES`, `REPEAT_LABELS` | `lib/rental.js:79-85` | **je** |
| `occursOn(reservation, dateISO)` | `lib/rental.js:97` | **je** — respektuje `skipDates` i `repeatUntil` |
| `occurrencesInRange(...)` | `lib/rental.js:114` | **je** — podklad pro kalendář |
| `blockingReservations(...)` | `lib/rental.js:150` | **je** — série drží místo ve všech termínech |
| editor „Opakování" + „Opakovat do" v adminu | `app/admin/sections.jsx:1142-1152` | **je** |
| značka ⟳ u opakované rezervace v kalendáři | `app/admin/sections.jsx:1302` | **je** |
| testy opakování | `tests/rental.test.js:207-263` | **je** |
| **veřejný formulář nabízí opakování** | `app/pronajem/page.jsx:96-110` | **NENÍ** — posílá jen `dateISO` a `from` |
| **`/api/submit` přebírá `repeat*`** | `app/api/submit/route.js:50-68` | **NENÍ** — pole se zahodí |
| **editor `skipDates` (výjimky)** | — | **NENÍ** — pole existuje, rozhraní ne |

Závěr: **nestavět znovu.** Chybí jen cesta „z webu do záznamu" a editor výjimek.

### Odesílání e-mailů — nikdy neodchází samo

- `sendMail` (`lib/mail.js:52`) volá jen `app/api/submit/route.js:75` (upozornění klubu)
  a `app/api/notify/route.js:47` (zpráva žadateli).
- `/api/notify` se volá **výhradně** z `ZpravaZadateli` (`app/admin/adminui.jsx:405`),
  tedy až po ručním kliknutí na „Odeslat".
- Předvyplněné texty: `reservationDecisionMail` a `registrationDecisionMail`
  (`lib/mail.js:87` a `:122`).

Tři různá „Potvrdit" u rezervace, každé jiné:

| místo | kód | změní stav | nabídne e-mail |
|---|---|---|---|
| řádek seznamu | `app/admin/sections.jsx:1100` | ano | **ne** |
| rozbalený detail | `app/admin/sections.jsx:1163` | ano | ano (koncept) |
| fajfka v Přehledu | `app/admin/page.jsx:317` | ano | **ne** |

U přihlášek totéž: koncept otevře jen detail (`app/admin/sections.jsx:1553-1558`),
Přehled ne.

### Upozornění na novou poštu — počítá se, ale nenačítá

- Přehled počty počítá správně: `app/admin/page.jsx:66-68`
  (`messages` ≠ vyřízená, `reservations` = nová, `cmsRegistrations` = nová).
- Obsah se ale načte **jednou** při zapnutí administrace: `lib/store.js:90-112`.
  Žádný polling, žádné znovunačtení. Co dorazí potom, není vidět až do reloadu.

### Přepisování obsahu — ztráta dat

- `PUT /api/content` (`app/api/content/route.js:56`) uloží **celý** objekt z klienta.
- `lib/store.js:53` posílá celé `_data` — tedy i seznam rezervací tak, jak vypadal
  při načtení stránky.
- Důsledek: administrace otevřená od rána + jakákoli odpolední úprava =
  `reservations`, `messages`, `cmsRegistrations` i `matchProposals` se vrátí do
  ranního stavu. **Poptávka, zpráva nebo přihláška, která mezitím přišla, zmizí.**
- Oprávnění to nechytí — `canSaveContent` řeší jen *kdo smí*, ne *co je novější*.

### Vzory ke zkopírování

- **Chráněné API se zápisem:** `app/api/mail/route.js` — ověření oprávnění, akce,
  čitelná chyba. Kopíruj strukturu.
- **Test route handleru:** `tests/api-mail.test.js` — mock cookie, `loginAs(role)`,
  `vi.stubGlobal('fetch', …)`.
- **Test čisté logiky:** `tests/rental.test.js` — bez Reactu, bez sítě.
- **E2E přes administraci:** `e2e/registrace.spec.js` — projde web → admin → vyřízení.

### Čeho se nedotýkat (anti-vzory)

- Nevymýšlet nové API na obsah. Zápis vede **jen** přes `setSection` / `updateData`
  (guardrail 2 v `CLAUDE.md`).
- Needitovat `content/club.js` jako způsob úpravy dat (guardrail 6).
- Nezavádět TypeScript, Tailwind ani nové těžké závislosti (guardrail 4).
- `BLOCKING_STATUSES` nechat být — „nová" musí dál držet termín, jinak dva lidé
  poptají stejný čas.
- Nepřidávat automatické odesílání e-mailů. Rozhodnutí zadavatelky: **vždy koncept**.

---

## Fáze 1 — Příchozí pošta se nesmí přepsat

**Proč první:** dokud tohle platí, můžou ostatní opravy ztrátu dat jen schovat.

**Co udělat.** V `app/api/content/route.js` mezi `before` a `after` doplnit slučování
pro klíče, kam přispívá veřejnost a scraper:
`reservations`, `messages`, `cmsRegistrations`, `matchProposals`.

Pravidlo (nové funkci dej domov v `lib/defaults.js` vedle `mergeStored`, ať je
testovatelná bez sítě):

> Položku, která je v `before` a chybí v `after`, **vrať zpátky**, pokud je novější
> než nejnovější položka, kterou klient v tom klíči poslal. Starší chybějící položky
> ber jako záměrné smazání.

- Časové razítko: `createdAt` u rezervací a přihlášek, `date` u zpráv. Když chybí,
  položku **vždy zachovej** (bezpečnější než ji zahodit).
- Porovnávej podle `id`; zprávy `id` nemají — u nich použij dvojici `date` + `email`.
- Když klient klíč vůbec neposlal, nech `before` beze změny.

**Kontrola**
- `tests/api-content.test.js`: nový popis „souběžná poptávka se neztratí" —
  ulož obsah s rezervací A, pošli PUT s obsahem bez A a bez novějších položek
  (simulace staré záložky), ověř, že A v úložišti zůstala.
- Druhý test: **smazání pořád funguje** — PUT bez starší rezervace B, kde `after`
  obsahuje novější položku, B zmizí.
- `npm test` a `NEXT_DIST_DIR=.next-build npm run build` zelené.
- `git diff` přečíst: mimo `app/api/content/route.js`, `lib/defaults.js` a testy
  se nesmí nic změnit.

---

## Fáze 2 — Klub se o nové poště dozví

Poptávky nechodí často, takže se administrace nemusí pořád na nic ptát. Skutečné
upozornění je **e-mail**; administrace se jen srovná, až do ní člověk přijde.

> Proč to nejde „spustit odesláním formuláře": formulář odesílá návštěvník ze svého
> zařízení. Server umí jen odpovídat na dotazy, sám od sebe do otevřené stránky
> zaklepat nedokáže (leda přes trvale otevřené spojení, což je nepoměrně víc
> součástek). E-mail tuhle roli plní bez otevřené administrace.

### 2a — Upozorňovací e-mail i na přihlášky a zprávy

Dnes se e-mail posílá **jen** u pronájmu (`app/api/submit/route.js:74-75`). Větve pro
`registration` (`:77-96`) a `message` (`:97-107`) neposílají nic, takže zápis do týmu
ani zpráva z kontaktu klubu nikde nezacinkají.

**Co udělat.**
1. Do `lib/mail.js` přidat `registrationMail(registration)` a `messageMail(message)`
   vedle stávající `reservationMail` (`lib/mail.js:55`) — stejná stavba textu,
   stejný závěr „vyřídit jde v administraci: …".
2. V `app/api/submit/route.js` poslat upozornění i u obou zbylých typů. Adresát je
   **výhradně** `rentalSettings.notifyEmail`.
   **Nesahat na `club.email` jako náhradu.** Zkusilo se to a byla to chyba: klubový
   e-mail je odesílací adresa (`MAIL_FROM`), ne schránka, kterou někdo čte —
   upozornění tam mizela do prázdna. Navíc tím začaly skutečné e-maily odcházet
   i z e2e testů, kde je `notifyEmail` prázdný. Prázdná adresa = neposílat,
   a administrace na to upozorní (`StavPosty`).
   V `playwright.config.mjs` musí zůstat `RESEND_API_KEY: ''` a `MAIL_FROM: ''` —
   `next dev` si jinak načte ostrý klíč z `.env.local` a testy rozesílají pravou poštu.
3. Odeslání zůstává bonus: když pošta není nastavená, položka se **uloží tak jako tak**
   a odeslání formuláře nesmí selhat (stejně jako dnes u pronájmu).

**Kontrola**
- `tests/api-submit.test.js`: přihláška i zpráva se uloží a zavolá se odeslání
  e-mailu (`vi.stubGlobal('fetch', …)`, vzor `tests/api-mail.test.js:132`).
- Bez `RESEND_API_KEY` se položka pořád uloží a odpověď je 200.

### 2b — Administrace se srovná při návratu na záložku

**Co udělat.**
1. Nové API `app/api/inbox/route.js`, `GET` → počty čekajících položek
   (`{ reservations, messages, registrations, proposals }`). Chráněné `requireUser()`.
   Vrací **jen čísla**, žádná jména ani kontakty — stejné pravidlo jako u
   `app/api/availability`.
2. V administraci (`app/admin/page.jsx`) se na to zeptat, když se záložka stane
   aktivní (`visibilitychange` + `focus`) — **žádný časovač**.
3. Když se čísla liší od načteného obsahu, ukázat **pruh** „Přišly 2 nové poptávky —
   Načíst" s tlačítkem, které zavolá `location.reload()`.

**Proč pruh a ne automatické načtení:** obsah se v administraci edituje. Tiché
přepsání by sebralo rozepsanou práci. Rozhoduje člověk.

**Kontrola**
- `tests/api-inbox.test.js`: bez přihlášení 401; přihlášený dostane počty; v odpovědi
  **není** žádné jméno ani e-mail (kontrola přes `JSON.stringify`).
- E2E `e2e/upozorneni.spec.js`: admin má otevřený Přehled → přes `/api/submit` přijde
  poptávka → po přepnutí na záložku se objeví pruh → po kliknutí je poptávka v seznamu.
- Build a testy zelené, `git diff` přečíst.

---

## Fáze 3 — Potvrzení nabídne e-mail ze všech míst

**Co udělat.** Sjednotit tři cesty na chování, které už dnes má detail
(`app/admin/sections.jsx:1163`) — tedy: změň stav **a** otevři předvyplněný koncept.

1. Řádek seznamu rezervací (`sections.jsx:1100-1102`) — po „Potvrdit" i „Zamítnout"
   rozbal detail (`setOpen(i)`) a nastav `setZprava({ i, ...reservationDecisionMail(...) })`.
2. Přihlášky — stejné sjednocení, ať se „Označit jako vyřízenou" chová všude stejně.
3. Fajfka a křížek v Přehledu (`app/admin/page.jsx:317-318`) — místo tiché změny
   stavu přepnout do příslušné sekce s otevřeným záznamem a konceptem. Přesun mezi
   sekcemi už umí `ukoly` výš na stránce, použij stejnou cestu.
4. Když záznam **nemá e-mail**, stav se změní a místo konceptu se ukáže hláška, že
   odepsat nejde (`ZpravaZadateli` to už umí, `adminui.jsx:437`).

**Anti-vzor:** nikdy neodesílat rovnou. Text musí jít před odesláním upravit.

**Kontrola**
- E2E `e2e/pronajem-potvrzeni.spec.js`: poptávka z webu → v adminu „Potvrdit"
  v řádku → objeví se koncept s předmětem „Rezervace potvrzena" → po „Odeslat"
  přibude záznam v historii. (Resend v testech není nastavený, takže se ověřuje
  neúspěšné odeslání zapsané do historie — vzor `tests/api-notify.test.js:96`.)
- Build a testy zelené, `git diff` přečíst.

---

## Fáze 4 — Pravidelný termín se dá poptat z webu

**Rozhodnutí zadavatelky:** poptávka je **nezávazný zájem**. Zabere se jen první
termín; opakování zapne klub ručně. Jedna poptávka tak nezablokuje půl roku dřív,
než ji někdo schválí.

**Co udělat.**
1. Nová pole v `emptyReservation()` (`lib/defaults.js:293`):
   `repeatWanted` (`''|'weekly'|'biweekly'`) a `repeatUntilWanted` (datum).
   Doplnit do normalizace vedle `repeat` (`lib/defaults.js:340`).
   **Důležité:** `occursOn` je ignoruje — dokud klub nenastaví `repeat`, blokuje se
   jen první termín.
2. `app/pronajem/page.jsx` — do formuláře zaškrtávátko „Chci termín pravidelně"
   a po zaškrtnutí výběr četnosti (`REPEAT_LABELS`) a „přibližně do". Použij
   `Vyber` z `app/components/Vyber.jsx`, ne nativní `<select>`.
3. `app/api/submit/route.js` — převzít obě pole do `repeatWanted` / `repeatUntilWanted`
   (validovat proti `REPEAT_MODES`, neznámou hodnotu zahodit). Do textu upozornění
   klubu (`reservationMail`, `lib/mail.js:55`) přidat řádek o přání opakování.
4. `app/admin/sections.jsx` — v detailu rezervace nad polem „Opakování" ukázat, když
   je `repeatWanted` vyplněné: „Žadatel chce opakovat každý týden do 30. 6. 2027"
   plus tlačítko **Zapnout opakování podle přání**, které přepíše `repeat`
   a `repeatUntil` a `repeatWanted` vyprázdní.

**Kontrola**
- `tests/rental.test.js`: `occursOn` na `repeatWanted` nereaguje — série se
  neblokuje, dokud klub nepotvrdí.
- `tests/api-submit.test.js`: poptávka s `repeat: 'weekly'` se uloží jako
  `repeatWanted`, `repeat` zůstane prázdné, a **další týden je pořád volný**.
- E2E: z webu poptat pravidelný termín → v adminu je vidět přání → po „Zapnout
  opakování" se v kalendáři objeví ⟳ u dalších týdnů.
- Build a testy zelené, `git diff` přečíst.

---

## Fáze 5 — Výjimky z opakování (volitelná, až po zbytku)

Bez ní se dlouhodobý pronájem nedá v praxi provozovat přes prázdniny a turnaje.
Pole `skipDates` existuje a `occursOn` ho respektuje (`lib/rental.js:101`), chybí
jen editor.

**Co udělat.** V detailu rezervace, jen když je `repeat` vyplněné, přidat
`StringListEditor` (`app/admin/adminui.jsx:299`) na `skipDates` s popiskem
„Vynechané dny (prázdniny, turnaj)" a placeholderem `2026-07-04` — stejně jako
„Zavřené dny" v nastavení pronájmu (`sections.jsx:1214`).

**Kontrola:** `tests/rental.test.js` už vyjímání testuje (`:239`), takže stačí ověřit,
že se hodnoty ukládají — E2E: přidat vynechaný den → ten den je v kalendáři volný.

---

## Fáze 6 — Závěrečné ověření

1. `NEXT_DIST_DIR=.next-build npm run build`
2. `npm test`
3. `npm run test:e2e`
4. Projít akceptační kritéria níž a u každého napsat splněno / nesplněno.
5. Shrnout změny po souborech a co zbývá ověřit ručně na ostré verzi.

### Akceptační kritéria

| # | kritérium | fáze |
|---|---|---|
| A1 | Poptávka odeslaná z webu se neztratí, ani když má admin otevřenou starou záložku a uloží změnu | 1 |
| A2 | Smazání staršího záznamu z administrace dál funguje | 1 |
| A3 | Přihláška do týmu i zpráva z kontaktu pošlou klubu upozorňovací e-mail | 2a |
| A4 | Bez nastavené pošty se položka pořád uloží a formulář neselže | 2a |
| A5 | Po přepnutí zpátky na administraci se ukáže pruh s nově příchozí poštou | 2b |
| A6 | Upozorňovací API nevrací jména ani kontakty | 2b |
| A7 | „Potvrdit" v řádku seznamu nabídne předvyplněný e-mail | 3 |
| A8 | Fajfka v Přehledu nabídne předvyplněný e-mail | 3 |
| A9 | Žádný e-mail neodejde bez kliknutí na „Odeslat" | 3 |
| A10 | Z webu jde poptat pravidelný termín | 4 |
| A11 | Nepotvrzené přání opakování neblokuje další týdny | 4 |
| A12 | Klub přání jedním tlačítkem promění ve skutečné opakování | 4 |
| A13 | U opakované rezervace jdou vynechat konkrétní dny | 5 |
| A14 | `npm run build`, `npm test` i `npm run test:e2e` zelené | 6 |

### Co se záměrně nemění

- Automatické odesílání e-mailů se nezavádí.
- `BLOCKING_STATUSES` zůstává — „nová" dál drží termín.
- Kroky 5–8 v `k8s/README.md` (historie stěhování) se netýkají tohoto zadání.
