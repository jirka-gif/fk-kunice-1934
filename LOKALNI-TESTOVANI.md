# Lokální testování — FK Kunice

Prostředí, kde si můžeš naklikat úplně všechno bez databáze a bez Vercelu.
Data se ukládají do složky `.data/`, takže **přežijí restart serveru**.
Smazání `.data/` = návrat na čistý web.

## Spuštění

```bash
npm run dev
```

Web běží na <http://localhost:3000>, administrace na <http://localhost:3000/admin>.
Když je port 3000 obsazený, Next si vezme první volný a vypíše ho do terminálu.

> **Pozor:** nespouštěj `npm run build`, dokud běží `npm run dev` — oba zapisují
> do složky `.next` a build dev serveru podtrhne nohy (`Cannot find module './379.js'`).
> Když se to stane: zastav server, `rm -rf .next` a spusť `npm run dev` znovu.

Naplnění testovacími daty (při běžícím serveru, v druhém okně terminálu):

```bash
node --env-file=.env.local scripts/seed-local.mjs
```

## Přihlašovací údaje

| Účet | E-mail | Heslo | Co uvidí |
|---|---|---|---|
| Správce | `admin@fkkunice.cz` | `admin` | všechno včetně uživatelů a rolí |
| Redaktor | `redaktor@fkkunice.cz` | `redaktor` | jen novinky, kempy, texty; týmy má jen ke čtení |

Údaje se dají změnit v `.env.local` (ten není v gitu). Po změně `ADMIN_EMAIL`
nebo `ADMIN_PASSWORD` smaž `.data/auth.json`, aby se správce založil znovu.

## Co si projít

**Role a přístupy**
1. Přihlas se jako **redaktor** — v menu chybí Nastavení i Uživatelé a role.
2. Otevři **Týmy** — nahoře je pruh „jen pro čtení" a všechna pole jsou vypnutá.
3. Přihlas se jako **správce** → **Uživatelé a role** → záložka *Role a oprávnění*.
   Přepni redaktorovi nějakou sekci a ulož; při dalším přihlášení se to hned projeví.

**Texty webu**
4. **Domů / texty** → změň hlavní nadpis v hero a podívej se na <http://localhost:3000>.
5. Záložka *Patička* → odkazy a sociální sítě (prázdný odkaz ikonu schová).

**Novinky a kempy**
6. **Novinky** → přidej článek, vyplň perex i text a klikni na „Otevřít detail →".
   Při víc než 6 článcích se v přehledu objeví stránkování.
7. **Kempy** → přidej kemp, archivuj ho a zkontroluj, že z <http://localhost:3000/kempy> zmizel.

**Zprávy a rezervace**
8. Odešli formulář na <http://localhost:3000/kontakt> → objeví se v **Zprávy**.
9. **Pronájem** → vyber plochu, klikni na volný den v kalendáři a na čas.
   Odešli poptávku → objeví se v adminu (Pronájem → Rezervace) jako **nová**
   a její termín zmizí z nabídky. Zkus ho poptat znovu — web ho odmítne.
   Po zamítnutí v adminu se termín zase uvolní.
   Otevírací dobu a zavřené dny nastavíš v **Pronájem → Otevírací doba**.
10. **Přehled** ukazuje skutečné počty, ne vymyšlená čísla.

**Zápasy z fotbal.cz**
11. **Zápasy** → záložka *Návrhy z fotbal.cz* — seed tam jeden nachystal.
    Rozklikni, uprav třeba střelce a dej *Potvrdit a zapsat k týmu*.
12. Potvrzení zároveň založí koncept příspěvku v sekci **Sociální sítě**.
13. Simulace selhání stahování (v adminu pak svítí červený pruh):

```bash
curl -X POST http://localhost:3000/api/matches -H 'content-type: application/json' -H 'x-scraper-token: lokalni-scraper-token' -d '{"proposals":[],"error":"fotbal.cz vrátil 403"}'
```

**Sociální sítě**
14. **Sociální sítě** → rozklikni koncept, uprav skóre a text, náhled vizuálu
    se překreslí (formát 1080 × 1350 px, tedy 4:5 pro Instagram i Facebook).
    Zkus i **Fotka na pozadí** — nahraj libovolný snímek ze zápasu; ořízne se
    na výšku a ztmaví, aby zůstaly texty čitelné. Bez fotky zůstane tmavé pozadí.
15. **Znaky soupeřů** (v téže sekci) → *Spravovat znaky*. Seznam soupeřů už je
    předvyplněný (20 klubů ze soutěží), stačí ke každému nahrát znak. Tlačítko
    *Doplnit soupeře ze zápasů* přidá další, jakmile se v tabulkách objeví.
    Znak platí pro celý klub — „SK Mukařov U15" i „SK Mukařov B" použijí ten samý.
16. Klikni na *Zveřejnit*. Bez tokenů Mety to **schválně** selže a do historie
    příspěvku se zapíše, která proměnná chybí — přesně tak se to chová i ostře.

Vizuál se dá zkoušet i přímo v prohlížeči:
<http://localhost:3000/api/og/match?title=KONEC&home=SK%20PO%C5%98%C3%8D%C4%8CANY&away=FK%20KUNICE&score=4:3>

## Testy

```bash
npm test          # 215 unit / integračních testů
npm run test:e2e  # 40 e2e testů (vlastní server na portu 3100, tvoje data nechá být)
npm run build     # produkční build
```

## Když je potřeba čistý stav

```bash
rm -rf .data
```

Při dalším spuštění se web vrátí na výchozí obsah z `content/club.js`
a správce se založí znovu podle `.env.local`.
