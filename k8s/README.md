# Nasazení FK Kunice do nethost clusteru

Web běží jako kontejner ve vlastním namespace `fk-kunice`, vedle frenkee.cz —
ale odděleně, takže se navzájem nemůžou ovlivnit.

| | |
|---|---|
| cluster | `~/.kube/frankee-dev-config`, context `client-admin@frankee-dev` |
| namespace | `fk-kunice` |
| doména | `www.fkkunice.cz` (+ `fkkunice.cz` → přesměruje na www) |
| obraz | `ghcr.io/jirka-gif/fk-kunice-1934:sha-<commit>` |

> ⚠️ **Tohle NENÍ cluster, kde běží draive/lexia/petrisk.** Ten má vlastní
> kubeconfig (`~/.kube/nethost/config`). Oba obsahují cluster jménem `forj`
> nebo podobným — vždy si ověř, že máš nastavený ten správný soubor.

---

## 1. Nastav přístup

**Každé nové okno terminálu:**

```bash
export KUBECONFIG=~/.kube/frankee-dev-config
```

Kontrola:

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice get deploy
```

Když to vrátí `i/o timeout`, chybí ten `export` — není to výpadek sítě.

---

## 2. Hesla do administrace

Jednorázově. Hodnoty se **nikdy nedávají do gitu** — proto ne přes `apply`
souboru, ale příkazem:

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice \
  create secret generic fk-kunice-secrets \
  --from-literal=ADMIN_EMAIL='...' \
  --from-literal=ADMIN_PASSWORD='...' \
  --from-literal=AUTH_SECRET="$(openssl rand -hex 32)" \
  --from-literal=MATCHES_TOKEN="$(openssl rand -hex 16)" \
  --dry-run=client -o yaml | kubectl --context client-admin@frankee-dev apply -f -
```

`AUTH_SECRET` a `MATCHES_TOKEN` negeneruj hlavou — `openssl` výše je udělá za tebe.

Secret **není** v `k8s/fk-kunice.yaml`, a to schválně: kdyby tam byl jako vzor,
každé další `apply` v kroku 3 by hesla přepsalo zpátky na vzorové hodnoty.
Takhle můžeš krok 3 opakovat, kolikrát chceš, a hesel se to nedotkne.

---

## 3. Nasaď

```bash
kubectl --context client-admin@frankee-dev apply -f k8s/fk-kunice.yaml
```

Pak nastav konkrétní verzi obrazu. `SHA` opiš ze souhrnu běhu workflow
**Build image** v záložce Actions — je to sedm znaků, například `a1b2c3d`:

```bash
SHA=sem_vloz_tech_sedm_znaku

kubectl --context client-admin@frankee-dev -n fk-kunice \
  set image deploy/fk-kunice "web=ghcr.io/jirka-gif/fk-kunice-1934:sha-${SHA}"

kubectl --context client-admin@frankee-dev -n fk-kunice \
  rollout status deploy/fk-kunice --timeout=180s
```

> Konkrétní `sha`, ne `latest`. Z `latest` nepoznáš, co běží — přepisuje se.

---

## 4. DNS

**Tohle je jediný krok mimo cluster a bez něj web nepojede.**

```
www.fkkunice.cz   A   77.78.95.252
fkkunice.cz       A   77.78.95.252
```

Dneska míří na `217.11.249.139`. Certifikát si cert-manager vyřídí sám,
**ale až po přesměrování DNS** — Let's Encrypt si doménu ověřuje.

---

## 5. Ověř

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice get pods
```

Musí být `Running` a `1/1`.

Certifikát (chvíli po DNS trvá, než se vystaví):

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice get certificate
```

Sloupec `READY` musí být `True`.

A nakonec **otevři `https://www.fkkunice.cz` v prohlížeči.** Že příkazy
doběhly bez chyby neznamená, že web vypadá správně.

---

## Když se něco pokazí

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice get pods
kubectl --context client-admin@frankee-dev -n fk-kunice logs deploy/fk-kunice --tail=50
```

| co vidíš | co to znamená |
|---|---|
| `ImagePullBackOff` | obraz neexistuje, nebo není na GHCR veřejný |
| `CrashLoopBackOff` | aplikace startuje a padá — čti log |
| `Pending` | nevešel se na uzel |
| certifikát není `True` | DNS ještě nemíří na cluster |

**Obraz musí být na GHCR veřejný.** Po prvním buildu ho jednou přepni:
GitHub → repo → Packages → `fk-kunice-1934` → Package settings → Change
visibility → Public. Cluster ho jinak nestáhne.

### Vrátit předchozí verzi

```bash
kubectl --context client-admin@frankee-dev -n fk-kunice rollout undo deploy/fk-kunice
```

---

## Aktualizace webu

1. Merge do `main` → workflow **Build image** postaví obraz sám
2. V Actions si opiš `sha-…` ze souhrnu běhu
3. `set image` + `rollout status` (krok 3)
4. Podívej se na web

---

## Co je čí

Účet `bara` (`k8s/bara-rbac.yaml`) má **plná práva v `fk-kunice` a nikde
jinde**. Ověřeno:

```
create deployments  -n fk-kunice          yes
create ingresses    -n fk-kunice          yes
get secrets         -n fk-kunice          yes
get pods            -n frenkee-web-prod   no
get secrets         -n insurecrm          no
create deployments  -n frenkee-web-prod   no
```

Ve svém namespace si můžeš dělat cokoli — frenkee.cz ani CRM se to nedotkne.
