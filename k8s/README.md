# Nasazení webu FK Kunice — krok za krokem

Web pojede jako kontejner v nethost clusteru, ve vlastním prostoru
(`namespace`) vedle webu frenkee.cz — odděleně, takže se navzájem nemůžou
ovlivnit.

| | |
|---|---|
| přístupový soubor | `~/.kube/frankee-dev-config` (dostaneš ho zvlášť) |
| namespace | `fk-kunice` |
| doména | `www.fkkunice.cz` (+ `fkkunice.cz` → přesměruje na www) |
| obraz | `ghcr.io/jirka-gif/fk-kunice-1934:sha-<sha>` |

| soubor v `k8s/` | k čemu je |
|---|---|
| `fk-kunice.yaml` | samotný web — kroky 3 a 4 |
| `postgres.yaml` | vlastní databáze místo Neonu (volitelné, až na konci) |
| `migrace-z-neonu.yaml` | jednorázový přenos dat, taky až na konci |
| `bara-rbac.yaml` | tvůj účet; aplikoval ho Tomáš, ty ho nepotřebuješ |

Projdi kroky **v tomhle pořadí**. Každý má na konci kontrolu — dokud
nesedí, nepokračuj dál.

---

## Co si připrav předem

1. **Připojovací řetězec k databázi** (`DATABASE_URL`). Web teď jede na
   hostované databázi Neon a nejjednodušší je nechat ho tam i po přestěhování;
   vlastní databázi v clusteru řeší až poslední sekce návodu. Vypadá jako
   `postgres://uzivatel:heslo@host/dbname?sslmode=require`.
   Bez něj web funguje, ale **všechno, co v administraci nastavíš, zmizí při
   každém restartu** — data se drží jen v paměti. Řetězec je v nastavení
   projektu na Vercelu (Settings → Environment Variables), nebo v Neonu.
   Vezmi ten **stávající**, ne nový — v novém by web neměl žádný obsah.
2. **E-mail a heslo do administrace**, které chceš používat. Vymýšlíš si je
   teď, nikdo ti je neposílá.
3. **Přístup do Blueboardu** k doméně `fkkunice.cz` (krok 6).

---

## 1. Nastav přístup ke clusteru

Přístupový soubor si ulož jako `~/.kube/frankee-dev-config`.

**V každém novém okně terminálu** pak nejdřív:

```bash
export KUBECONFIG=~/.kube/frankee-dev-config
```

**Kontrola:**

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice get pods
```

Musí to projít. `No resources found` je v pořádku — ještě tam nic neběží.

> Když to skončí `i/o timeout` nebo `connection refused`, chybí ten `export`
> výše. Není to výpadek sítě ani clusteru — je to nejčastější chyba a vypadá
> přesně jako porucha.

---

## 2. Ulož hesla a přístupy

Jednorázově. Hodnoty se **nikdy nedávají do gitu**, proto ne souborem, ale
příkazem. Doplň si své hodnoty místo `...`:

```bash
export KUBECONFIG=~/.kube/frankee-dev-config

kubectl --context client-admin@frankee-dev -n fk-kunice \
  create secret generic fk-kunice-secrets \
  --from-literal=DATABASE_URL='...' \
  --from-literal=ADMIN_EMAIL='...' \
  --from-literal=ADMIN_PASSWORD='...' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=MATCHES_TOKEN="$(openssl rand -hex 16)" \
  --from-literal=SITE_URL='https://www.fkkunice.cz' \
  --dry-run=client -o yaml \
  | kubectl --context client-admin@frankee-dev apply -f -
```

`AUTH_SECRET` a `MATCHES_TOKEN` negeneruj hlavou — `openssl` výše je udělá
za tebe. Hodnoty dávej do **jednoduchých uvozovek**, jinak si shell splete
znaky jako `$` nebo `!` v hesle.

Volitelné, když je klub používá (rozesílání e-mailů a příspěvky na sítě).
Bez nich web funguje, jen tyhle funkce mlčí:

```bash
# RESEND_API_KEY, MAIL_FROM, META_PAGE_ID, META_PAGE_TOKEN,
# META_IG_USER_ID, META_GRAPH_VERSION
```

Přidávají se stejným příkazem — dopiš další `--from-literal=KLIC='hodnota'`
a spusť ho znovu celý (přepíše se najednou, takže **vyjmenuj i ty původní**).

**Kontrola** — vypíše jen názvy klíčů, ne hodnoty:

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice \
  get secret fk-kunice-secrets -o jsonpath='{.data}' | tr ',' '\n' | cut -d'"' -f2
```

Musí být vidět `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
`AUTH_SECRET`, `MATCHES_TOKEN`, `SITE_URL`.

> Secret **není** v `k8s/fk-kunice.yaml`, a to schválně: kdyby tam byl jako
> vzor, každé další `apply` v kroku 3 by hesla přepsalo zpátky na vzorové
> hodnoty. Takhle můžeš krok 3 opakovat, kolikrát chceš, a hesel se to
> nedotkne.

---

## 3. Nasaď

```bash
kubectl --context client-admin@frankee-dev apply -f k8s/fk-kunice.yaml
```

---

## 4. Nastav verzi webu

`SHA` opiš ze souhrnu běhu workflow **Build image** v záložce Actions — je to
sedm znaků, například `a1b2c3d`:

```bash
SHA=sem_vloz_tech_sedm_znaku

kubectl --context client-admin@frankee-dev -n fk-kunice \
  set image deploy/fk-kunice "web=ghcr.io/jirka-gif/fk-kunice-1934:sha-${SHA}"

kubectl --context client-admin@frankee-dev -n fk-kunice \
  rollout status deploy/fk-kunice --timeout=180s
```

Konkrétní `sha`, ne `latest`. Z `latest` nepoznáš, co běží — přepisuje se.

**Kontrola:**

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice get pods
```

Musí být `Running` a `1/1`. Když ne, skoč na *Když se něco pokazí*.

---

## 5. Vyzkoušej web ještě před přepnutím DNS

Tohle je důvod, proč se DNS mění až teď: web si otevřeš dřív, než ho uvidí
veřejnost, a případnou chybu opravíš bez výpadku.

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice \
  port-forward deploy/fk-kunice 8080:3000
```

Příkaz zůstane běžet — otevři si **http://localhost:8080** v prohlížeči.
Zkontroluj i přihlášení do `/admin` údaji z kroku 2. Až budeš hotová,
ukonči ho **Ctrl+C**.

Bez CSS a s divným vzhledem je to v pořádku — část stylů se načítá až
z ostré adresy. Co musí sedět: web se načte, obsah je správný, admin pustí
dovnitř.

---

## 6. Přepni DNS na Blueboardu

Teprve teď se web zveřejní. **Do téhle chvíle je vše vratné.**

V Blueboardu u domény `fkkunice.cz` změň **dva A záznamy**:

| typ | název | nová hodnota |
|---|---|---|
| A | `fkkunice.cz` (apex, někdy `@`) | `77.78.95.252` |
| A | `www` | `77.78.95.252` |

Obě dnes míří na `217.11.249.139`.

> ### ⚠️ Čeho se nedotýkej
>
> Na doméně běží i **klubová pošta**. Tyto záznamy nech přesně tak, jak jsou:
>
> - **MX** → `mx.blueboard.cz`
> - **TXT** se `v=spf1 ...`
>
> Kdyby se smazaly nebo změnily, přestane chodit e-mail — a na webu to
> nepoznáš. Měň **jen ty dva A záznamy** z tabulky výše.

**Tip před změnou:** když Blueboard nabízí nastavení TTL, sniž ho u obou
A záznamů na `300` a počkej hodinu. Případný návrat zpátky se pak projeví
za pět minut místo za hodinu.

**Kontrola** (chvíli trvá, než se rozšíří):

```bash
dig +short www.fkkunice.cz A
```

Musí vypsat `77.78.95.252`.

---

## 7. Počkej na certifikát

Zabezpečení (`https`) se vystaví samo, ale **až po kroku 6** — vydavatel
certifikátu si doménu ověřuje.

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice get certificate
```

Sloupec `READY` musí být `True`. Obvykle do pár minut, někdy až po hodině
podle toho, jak rychle se DNS rozšíří.

---

## 8. Hotovo — podívej se na web

Otevři **https://www.fkkunice.cz**.

Že příkazy doběhly bez chyby neznamená, že web vypadá správně. Zkontroluj
očima: úvodní stránku, jednu podstránku a přihlášení do `/admin`.

---

## Když se něco pokazí

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice get pods
kubectl --context client-admin@frankee-dev -n fk-kunice logs deploy/fk-kunice --tail=50
```

| co vidíš | co to znamená | co s tím |
|---|---|---|
| `ImagePullBackOff` | obraz neexistuje nebo není veřejný | ověř `sha`; balíček na GitHubu musí být *public* |
| `CreateContainerConfigError` | chybí secret z kroku 2 | zopakuj krok 2 |
| `CrashLoopBackOff` | web startuje a padá | čti `logs` — obvykle špatný `DATABASE_URL` |
| `Pending` | nevešel se na server | ozvi se Tomášovi |
| certifikát není `True` | DNS ještě nemíří na cluster | zopakuj kontrolu z kroku 6, počkej |
| v adminu zmizely změny | chybí `DATABASE_URL` | zopakuj krok 2 i s ním, pak krok 4 |
| web ukazuje prázdný obsah po migraci | web běží, ale míří jinam | `rollout restart` z kroku 4 migrace |

### Vrátit předchozí verzi

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice rollout undo deploy/fk-kunice
```

### Vrátit všechno (nouzově)

V Blueboardu přepiš oba A záznamy zpátky na `217.11.249.139`. Starý web
naběhne, jakmile se DNS rozšíří.

---

## Vlastní databáze místo Neonu (volitelné)

Web umí obojí. Neon je hostovaná databáze mimo cluster; tenhle postup ji
nahradí Postgresem, který běží vedle webu ve stejném prostoru `fk-kunice`.

**Proč to udělat:** všechno je na jednom místě, nic neodchází ven, žádný
další účet a žádné měsíční limity cizí služby.

**Proč to neuspěchat:** dokud Neon funguje, nic nehoří. Klidně to nech na
později — web mezitím jede dál a tenhle postup půjde udělat kdykoli.

Napřed si přečti celou sekci, teprve pak spusť první příkaz.

### 1. Založ databázi

```bash
export KUBECONFIG=~/.kube/frankee-dev-config
kubectl --context client-admin@frankee-dev apply -f k8s/postgres.yaml
```

Počkej, až bude připravená (obvykle do minuty):

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice \
  get cluster fk-kunice-db -w
```

Ve sloupci `STATUS` musí být `Cluster in healthy state` a v `INSTANCES` `1`.
Ukonči sledování **Ctrl+C**.

Heslo k databázi si vyrobil operátor sám a uložil ho do secretu
`fk-kunice-db-app`. **Nikam ho neopisuj** — web si ho bere přímo odtud.

### 2. Přenes obsah z Neonu

Ulož adresu staré databáze. Je to ta samá hodnota, kterou jsi zadala jako
`DATABASE_URL` v kroku 2 nahoře:

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice \
  create secret generic neon-migrace --from-literal=uri='...'
```

Spusť přenos a sleduj, co dělá:

```bash
kubectl --context client-admin@frankee-dev apply -f k8s/migrace-z-neonu.yaml

kubectl --context client-admin@frankee-dev -n fk-kunice \
  logs -f job/migrace-z-neonu
```

Na konci musí být `== HOTOVO ==` a nad tím počty řádků. Když skončí chybou,
**nepokračuj** — web zatím pořád jede na Neonu, takže se nic nestalo.

> ### ⚠️ Přenos jde jen jedním směrem
>
> Job cílovou databázi nejdřív vyprázdní a pak do ní nalije obsah z Neonu.
> Spustit ho **podruhé, až budou v clusteru novější data**, by je přepsalo
> tím starým obsahem. Proto se hned po úspěchu maže — krok 3.

### 3. Ukliď po přenosu

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice delete job migrace-z-neonu
kubectl --context client-admin@frankee-dev -n fk-kunice delete secret neon-migrace
```

Tím ze clusteru zmizí i adresa staré databáze.

### 4. Přepni web na novou databázi

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice \
  rollout restart deploy/fk-kunice

kubectl --context client-admin@frankee-dev -n fk-kunice \
  rollout status deploy/fk-kunice --timeout=180s
```

Web si novou databázi vezme sám — nastavení z `postgres.yaml` má přednost
před `DATABASE_URL`, které jsi zadala v kroku 2. Přepnutí se tedy dělá
založením databáze, ne přepisováním hesel.

### 5. Zkontroluj

Otevři web a **projdi administraci**: musí tam být všechen obsah jako
předtím. Pak zkus něco malého změnit, uložit a načíst stránku znovu —
změna musí zůstat.

Teprve až tohle sedí, můžeš v Neonu databázi zrušit. **Nespěchej s tím**,
je to jediná záložní kopie starého obsahu. Nech ji tam aspoň měsíc.

### Zálohy

Každou noc ve 2:15 se databáze uloží do souboru na oddělený svazek; drží se
posledních 14 dní. Ruční kontrola, že zálohy vznikají:

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice \
  get jobs -l job-name --sort-by=.metadata.creationTimestamp | tail -5
```

Vypsat, co je uložené:

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice \
  create job rucni-vypis --from=cronjob/fk-kunice-db-backup
```

Obnova ze zálohy je zásah, u kterého se **nejdřív ozvi Tomášovi** — přepisuje
se jí celý obsah webu.

---

## Aktualizace webu potom

1. Změna se mergne do `main` → workflow **Build image** postaví obraz sám
2. V Actions si opiš `sha-…` ze souhrnu běhu
3. Krok 4 (`set image` + `rollout status`)
4. Podívej se na web

Kroky 1, 2, 3, 6 a 7 se už neopakují.

---

## Co všechno smíš

Účet má **plná práva v prostoru `fk-kunice` a nikde jinde**. Ověřeno:

```
create deployments  -n fk-kunice          yes
create ingresses    -n fk-kunice          yes
get secrets         -n fk-kunice          yes
get pods            -n frenkee-web-prod   no
get secrets         -n insurecrm          no
create deployments  -n frenkee-web-prod   no
```

Uvnitř `fk-kunice` si můžeš dělat cokoli a nic mimo něj nerozbiješ — web
frenkee.cz ani CRM na to nedosáhnou a ty na ně taky ne. Jediné, co je
mimo cluster a je společné, je DNS v kroku 6 — proto to varování u pošty.
