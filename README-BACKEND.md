# FK Kunice — testovací verze backendu

Tento dokument popisuje **testovací (vývojovou) verzi backendu**, která byla přidána k webu FK Kunice, a **postup nasazení do reálné produkční databáze**.

Cílem této verze je jediné: aby web běžel **s reálnou perzistencí** — tedy aby se úpravy z administrace ukládaly na server (ne jen do prohlížeče), formuláře dorazily ke klubu a do `/admin` se dalo přihlásit. Přitom je udělaná tak, aby **fungovala i bez databáze** (spadne zpět na výchozí obsah), takže ji lze bezpečně zapnout a zprovoznit postupně.

> **Kde web běží dnes:** jako kontejner v nethost clusteru (namespace `fk-kunice`), databáze je v clusteru taky (`fk-kunice-db`, CloudNativePG). Doména `www.fkkunice.cz` má DNS v Cloudflare. Nasazení a provoz popisuje [k8s/README.md](k8s/README.md). Vercel ani Neon se už nepoužívají.

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

## 4. Nasazení do provozu

Web běží v nethost clusteru. Celý postup — přístup ke clusteru, uložení hesel do secretu, nasazení, verze obrazu, DNS a certifikát — je v [k8s/README.md](k8s/README.md). Tady jen shrnutí, jak to do sebe zapadá:

1. **Push do `main`** spustí workflow **Build image**, který postaví obraz a pošle ho do GHCR pod tagem `sha-<sedm znaků>`.
2. **Proměnné prostředí** jsou v secretu `fk-kunice-secrets`. Deployment si je tahá přes `envFrom`, takže cokoli do secretu přidáš, stane se proměnnou. Přidání jedné hodnoty bez přepsání ostatních:

   ```bash
   kubectl --context client-admin@frankee-dev -n fk-kunice patch secret fk-kunice-secrets --type=merge -p '{"stringData":{"KLIC":"hodnota"}}'
   ```

3. **Nasazení nové verze** = `set image` na ten tag a `rollout status`. Po změně samotného secretu (beze změny obrazu) stačí `rollout restart` — běžící pod má staré proměnné v paměti.
4. **Databáze** se při prvním otevření webu sama naplní výchozím obsahem, žádný import se nedělá.

Přihlášení do administrace: <https://www.fkkunice.cz/admin>.

---

## 5. Zálohy a bezpečnost dat

1. **Zálohy databáze** běží v clusteru jako naplánovaná úloha (`fk-kunice-db-backup`). Že proběhly, ověříš přes `kubectl -n fk-kunice get jobs`.
2. **Ruční záloha** jde kdykoli z administrace tlačítkem **Export dat (JSON)** — celý obsah je jeden JSON, takže se dá i nahrát zpátky.
3. **Silné heslo správce.** `ADMIN_PASSWORD` v secretu slouží jen k založení prvního účtu; další uživatele zakládá správce v administraci a každý si mění heslo sám.
4. **Hesla nikdy do gitu.** Secret se zakládá příkazem, ne souborem v repozitáři — proto v `k8s/fk-kunice.yaml` schválně není.

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
- **Fotky se zatím ukládají jako base64 uvnitř obsahu.** Funguje to, ale pro hodně velkých fotek je lepší přejít na úložiště souborů (S3-kompatibilní bucket nebo objektové úložiště v clusteru).
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

---

## Zápasy z fotbal.cz (Krok 3)

fotbal.cz nemá veřejné API a scraping blokuje (403), HTML se navíc mění.
Řešení je proto postavené tak, aby **selhání nikdy nerozbilo web**:

1. `scripts/parse-fotbal.mjs` — čistý parser, žádná síť. Nehledá CSS třídy,
   ale tvar dat (datum + skóre = odehráno, datum + čas = plánováno). Testuje se
   nad uloženým vzorkem `tests/fixtures/fotbal-sample.html`.
2. `scripts/scrape-matches.mjs` — Playwright headless projde týmy s vyplněným
   `sourceUrl` a výsledek pošle jako **návrh** na `POST /api/matches`
   (hlavička `x-scraper-token`). Bez tokenu API vrátí 401.
3. `.github/workflows/matches.yml` — cron 4× týdně (St/Pá/So/Ne). Ve webovém
   kontejneru to nejde, Playwright potřebuje skutečný prohlížeč a ten se do
   obrazu nedává. Při selhání workflow založí issue.
4. **Návrh se nikdy nepropíše sám.** V adminu (Zápasy → Návrhy) ho člověk
   zkontroluje, případně upraví a potvrdí — teprve pak se zapíše k týmu.
5. Monitoring: `matchesSync` drží stav posledního běhu. Admin ukáže červený pruh
   při chybě i když jsou data starší než týden.

### Co nastavit
| Kde | Co |
|---|---|
| Secret `fk-kunice-secrets` / `.env.local` | `MATCHES_TOKEN` |
| GitHub → Secrets | `MATCHES_TOKEN` (stejná hodnota), `SITE_URL` |
| Administrace | u týmu „Adresa soutěže na fotbal.cz" |

---

## Sociální sítě — Meta Business (Krok 4)

### Co musí udělat člověk mimo kód
1. Založit aplikaci v **Meta for Developers** a propojit ji s FB stránkou klubu.
2. Propojit instagramový profil klubu (Business / Creator) s touto stránkou.
3. Nechat schválit oprávnění `pages_manage_posts` a `instagram_content_publish`.
4. Vygenerovat **dlouhodobý token stránky**.

### Co doplnit do proměnných prostředí
| Proměnná | K čemu |
|---|---|
| `META_PAGE_ID` | id facebookové stránky klubu |
| `META_PAGE_TOKEN` | dlouhodobý token stránky (platí pro FB i IG) |
| `META_IG_USER_ID` | id instagramového business účtu |
| `META_GRAPH_VERSION` | volitelně, výchozí `v21.0` |
| `SITE_URL` | veřejná adresa webu — Meta si z ní stahuje obrázek |

Bez nich se nic neodešle a v administraci se ukáže, která proměnná chybí.

### Jak to funguje
- Vizuál výsledku vzniká na `/api/og/match` (knihovna @vercel/og — jen balíček na
  kreslení obrázků, s hostingem nesouvisí) — klubové barvy, skóre,
  soupeř, střelci. Všechno jsou parametry adresy, takže se dá měnit z adminu.
- Po potvrzení výsledku zápasu vznikne **koncept** příspěvku. V nastavení jde
  přepnout na „rovnou dát ke schválení".
- Publikace: Facebook `/{page}/photos` (fotka + popisek), Instagram nejdřív
  `media` container a pak `media_publish`. Instagram proto potřebuje obrázek
  na veřejné adrese — proto `SITE_URL`.
- Fronta drží stav (`koncept`, `ke schválení`, `odesláno`, `chyba`), počet pokusů
  a historii. Chyba z Mety se uloží čitelně a jde zkusit znovu.
