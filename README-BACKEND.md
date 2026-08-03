# FK Kunice — testovací verze backendu

Tento dokument popisuje **testovací (vývojovou) verzi backendu**, která byla přidána k webu FK Kunice, a **postup nasazení do reálné produkční databáze**.

Cílem této verze je jediné: aby web běžel **celý na Vercelu s reálnou perzistencí** — tedy aby se úpravy z administrace ukládaly na server (ne jen do prohlížeče), formuláře dorazily ke klubu a do `/admin` se dalo přihlásit. Přitom je udělaná tak, aby **fungovala i bez databáze** (spadne zpět na výchozí obsah), takže ji lze bezpečně zapnout a zprovoznit postupně.

---

## 1. Jak to funguje (v kostce)

Celý obsah webu se ukládá jako **jeden JSON záznam** (jeden řádek v databázi). Je to záměrně jednoduché řešení pro testovací fázi:

- **Je nastavená databáze** (`DATABASE_URL`) → obsah se ukládá do Postgresu a platí pro všechny návštěvníky i zařízení.
- **Není nastavená databáze** → web běží z výchozího obsahu (`content/club.js`) a změny se drží jen dočasně v paměti. Ideální pro rychlé lokální vyzkoušení.

Přihlášení do `/admin` je zatím na **jedno sdílené heslo** (proměnná `ADMIN_PASSWORD`) — pro testovací verzi to stačí. Plnohodnotné uživatele a role řeší až další fáze (viz plán rozvoje).

> **Důležité:** tohle je vědomě „malý" backend, který nerozbíjí stávající web. Až budeš chtít plný relační model (samostatné tabulky pro týmy, zápasy, novinky…), stačí přepsat dvě funkce v `lib/db.js` a zbytek aplikace se nemění — viz sekci 6.

---

## 2. Co bylo přidáno / změněno

**Nové soubory:**

| Soubor | Co dělá |
|---|---|
| `lib/defaults.js` | Sestaví výchozí obsah z `content/club.js` (sdílí server i klient). |
| `lib/db.js` | Ukládání obsahu do Postgresu (Neon), se záložním úložištěm v paměti. |
| `lib/auth.js` | Jednoduché přihlášení heslem (podepsaná cookie). |
| `app/api/content/route.js` | Čtení (`GET`) a ukládání (`PUT`, jen přihlášený) obsahu webu. |
| `app/api/submit/route.js` | Příjem formulářů z webu (rezervace, registrace, zpráva). |
| `app/api/login/route.js`, `app/api/logout/route.js` | Přihlášení / odhlášení. |
| `app/admin/login/page.jsx` | Přihlašovací stránka administrace. |
| `middleware.js` | Chrání `/admin` — bez přihlášení přesměruje na login. |
| `.env.example` | Vzor proměnných prostředí. |

**Změněné soubory:**

| Soubor | Změna |
|---|---|
| `lib/store.js` | Místo `localStorage` čte a ukládá obsah přes server (`/api/content`). |
| `app/pronajem/page.jsx` | Poptávka rezervace se odesílá na server (`/api/submit`). |
| `app/kontakt/page.jsx` | Kontaktní formulář je funkční a odesílá zprávu na server. |
| `package.json` | Přidána závislost `@neondatabase/serverless`. |

Původní data v `content/club.js` zůstávají beze změny a slouží jako výchozí obsah.

---

## 3. Spuštění lokálně (na vlastním počítači)

```bash
npm install
npm run dev      # http://localhost:3000
```

Bez jakéhokoli nastavení web funguje — obsah se bere z `content/club.js`. Do administrace se dostaneš na `/admin`, heslo je dočasně **`fkkunice`** (dokud nenastavíš vlastní).

Chceš-li lokálně i ukládání do databáze, vytvoř soubor `.env.local` podle `.env.example` a doplň `DATABASE_URL`.

---

## 4. Nasazení na Vercel (testovací provoz)

Web už na Vercelu běží. Aby fungovala i perzistence, stačí přidat databázi a dvě proměnné:

### Krok 1 — Přidej databázi (Neon Postgres)
1. Ve Vercelu otevři svůj projekt → záložka **Storage**.
2. **Create Database** → vyber **Neon (Serverless Postgres)** → **Continue** a databázi vytvoř (stačí bezplatný tarif).
3. Po vytvoření klikni na **Connect Project** a připoj ji k tomuto projektu.

Vercel tím sám do projektu vloží proměnnou s připojením (obvykle `DATABASE_URL`, případně `POSTGRES_URL` — aplikace umí obojí). Nemusíš nic kopírovat ručně.

### Krok 2 — Nastav přihlašovací heslo a klíč
V projektu → **Settings → Environment Variables** přidej:

| Název | Hodnota |
|---|---|
| `ADMIN_PASSWORD` | vlastní silné heslo do administrace |
| `AUTH_SECRET` | náhodný dlouhý řetězec (např. z `openssl rand -base64 32`) |

### Krok 3 — Znovu nasaď
V záložce **Deployments** dej u posledního nasazení **Redeploy** (nebo pushni jakoukoli změnu). Po nasazení:

- Web běží normálně a **úpravy v `/admin` se ukládají do databáze** — platí pro všechny.
- Databáze se při prvním otevření webu **sama naplní** výchozím obsahem (není potřeba žádný import).
- Formuláře (kontakt, pronájem) se ukládají a objeví se v administraci.

Přihlášení do administrace: otevři `https://tvuj-web.vercel.app/admin`, zadej `ADMIN_PASSWORD`.

---

## 5. Přechod na reálnou produkční databázi

Až se rozhodneš jít „naostro", **není potřeba nic přenášet ani přepisovat kód** — jde jen o oddělení testovacích a produkčních dat. Doporučený postup:

1. **Založ samostatnou produkční databázi.** Buď novou Neon databázi jako v kroku 4, nebo si u Neonu odděl **produkční větev** (Neon má tzv. branches — testovací data pak nemíchají s ostrými).
2. **Nastav proměnné pro produkční prostředí.** Ve Vercelu mají proměnné tři úrovně — *Production*, *Preview*, *Development*. Produkční `DATABASE_URL`, `ADMIN_PASSWORD` a `AUTH_SECRET` nastav pro **Production**; testovací hodnoty klidně nech pro Preview.
3. **Nasaď na produkční doménu** (např. `fkkunice.cz`) — v **Settings → Domains** přidej vlastní doménu a nasměruj na ni DNS. Web zůstává na Vercelu, mění se jen adresa a produkční databáze.
4. **Zapni zálohy.** V Neonu zkontroluj *Point-in-Time Restore* / zálohy, ať jsou data klubu chráněná.
5. **Změň výchozí heslo.** Ujisti se, že `ADMIN_PASSWORD` je v produkci silné a jiné než testovací.

> Protože obsah je uložený jako JSON, **zálohu uděláš i ručně** kdykoli tlačítkem **Export dat (JSON)** přímo v administraci. Ten samý JSON jde v případě potřeby nahrát zpět do databáze.

### Migrace obsahu mezi databázemi (když už máš data)
Pokud jsi v testovací databázi nav­kládala reálný obsah a chceš ho přenést do produkční:

1. V administraci testovacího webu klikni **Export dat (JSON)** → stáhne se `fk-kunice-obsah.json`.
2. Přepni web na produkční databázi (krok 2 výše) a nasaď.
3. Přihlas se do produkční administrace a proveď libovolnou úpravu (tím se obsah zapíše), **nebo** obsah nahraj do tabulky `site_content` (řádek `id = 1`, sloupec `data`) přímo v Neon konzoli. Struktura odpovídá staženému JSON.

---

## 6. Až budeš chtít plný relační model (další fáze)

Tato verze ukládá vše jako jeden JSON. Pro větší web se hodí rozpad na samostatné tabulky (týmy, hráči, zápasy, novinky, rezervace…). Výhodou stávajícího návrhu je, že **aplikace o způsobu uložení neví** — čte a zapisuje přes `/api/content`. Přechod tedy znamená:

1. Navrhnout relační schéma (doporučeno **Prisma**) a migrovat data z JSON.
2. Přepsat `getStoredContent` / `saveStoredContent` v `lib/db.js` tak, aby skládaly/rozkládaly obsah z tabulek.
3. Volitelně nahradit přihlášení heslem za **Auth.js (NextAuth)** s uživateli a rolemi (fáze „Role a přístupy" z plánu rozvoje).

Frontend ani administraci není nutné měnit.

---

## 7. Meze testovací verze (vědomé kompromisy)

- **Přihlášení je na jedno sdílené heslo** — bez uživatelů a rolí (to řeší další fáze).
- **Fotky se zatím ukládají jako base64 uvnitř obsahu.** Funguje to, ale pro hodně velkých fotek je lepší přejít na úložiště souborů (Vercel Blob / Supabase Storage).
- **Bez databáze se změny neuloží natrvalo** (drží se jen v paměti běžícího procesu) — pro ostrý provoz vždy nastav `DATABASE_URL`.
- **Formulářové zprávy** se ukládají do pole `messages` v obsahu; samostatná sekce v administraci pro ně přijde v další fázi (zatím je vidět v exportu JSON).

Podrobný plán dalších fází (plný admin, role a přístupy, zápasy z fotbal.cz, Meta posty) najdeš v samostatném dokumentu *Plán rozvoje webu*.

---

*Připraveno 31. 7. 2026 · FK Kunice 1934*

---

## Uživatelé, role a oprávnění (Krok 2)

Do administrace se přihlašuje **e-mailem a heslem**, ne jedním sdíleným heslem.

### Kde jsou uložení
V **samostatné tabulce `site_auth`** (jeden JSONB řádek `id=1`), ne v `site_content`.
Obsah webu je veřejný přes `GET /api/content` — hesla se do něj nesmí dostat.
Bez `DATABASE_URL` funguje stejný fallback do paměti jako u obsahu.

**Proč ne Prisma:** Prisma by přinesla migrace, generovaného klienta a hlavně
nutnost mít vždy běžící databázi. To by rozbilo pravidlo „web musí jet i bez
`DATABASE_URL`". Jeden JSONB záznam se stejným fallbackem drží obě úložiště
konzistentní a bez další závislosti. Až bude potřeba relační model, stačí
přepsat `getStoredAuth` / `saveStoredAuth` — zbytek aplikace se nemění.

**Proč ne Auth.js (NextAuth):** zadání ji doporučovalo, ale nepoužili jsme žádného
z jejích providerů ani adaptérů — potřebujeme jen e-mail + heslo proti vlastnímu
úložišti. Přihlášení stojí na podepsané cookie (Web Crypto HMAC), kterou umí ověřit
i edge middleware, a hesla se hashují PBKDF2-SHA256. Žádná nová závislost.

### První spuštění
Z `ADMIN_EMAIL` a `ADMIN_PASSWORD` se založí účet správce. Další uživatele
zakládá on sám v sekci **Uživatelé a role**; heslo se vygeneruje a zobrazí
jednou — správce ho předá uživateli, ten si ho změní v sekci **Můj účet**.

### Model oprávnění
Oprávnění se nastavuje po **sekcích administrace** ve třech úrovních:

| Úroveň | Co znamená |
|---|---|
| `none` | sekce se v menu vůbec nezobrazí |
| `view` | uživatel ji vidí, ale nic neuloží (formuláře jsou vypnuté) |
| `edit` | plný přístup |

Výchozí role: **Správce** (vše, nelze oslabit), **Redaktor**, **Trenér**,
**Sekretariát**. Matice se edituje v adminu, role se dají přidávat i mazat
(kromě Správce a rolí, které někdo používá).

### Vynucení na serveru
`PUT /api/content` porovná uložený a nový obsah, zjistí **které klíče se změnily**
a podle mapy `SECTION_CONTENT_KEYS` ověří, že na každý z nich má uživatel `edit`.
Když ne, vrátí **403** se seznamem odmítnutých klíčů a **neuloží nic**.
`/api/users` a `/api/roles` vyžadují `edit` na sekci „Uživatelé a role".

Middleware ověřuje jen podpis cookie (edge nemá přístup k databázi). Platnost
účtu — deaktivace, smazání, změna role — se kontroluje v API a na `/api/me`,
takže deaktivovaný uživatel sice projde middlewarem, ale administrace ho vyhodí
na přihlášení a žádné API mu nic neuloží.

### API přehled
| Endpoint | Kdo | Co dělá |
|---|---|---|
| `POST /api/login` | veřejné | přihlášení e-mailem a heslem |
| `POST /api/logout` | veřejné | odhlášení |
| `GET /api/me` | přihlášený | kdo jsem + moje oprávnění |
| `PUT /api/me` | přihlášený | změna vlastního hesla |
| `GET/POST/PUT/DELETE /api/users` | sekce „Uživatelé a role" | správa uživatelů |
| `GET/PUT /api/roles` | sekce „Uživatelé a role" | matice oprávnění |
