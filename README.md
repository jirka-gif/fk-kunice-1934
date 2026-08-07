# FK Kunice 1934 — web + CMS

Oficiální web fotbalového klubu **FK Kunice 1934** postavený podle schváleného návrhu
(„FK Kunice 1934.dc.html"). **Next.js 14 (App Router) + React**, běží jako kontejner
v nethost clusteru (namespace `fk-kunice`) na adrese **www.fkkunice.cz** — postup
nasazení v [k8s/README.md](k8s/README.md).

> Společně silnější.

## Stránky

| Route | Obsah |
|---|---|
| `/` | Domů — hero, match centre, týmy, proč my, kempy, pronájem, novinky, galerie, partneři |
| `/tymy/[id]` | Detail týmu — soupiska, realizační tým, profil hráče (modal), rozpis, tabulka |
| `/zapasy` | Detail zápasu — průběh, statistiky, fotky |
| `/kempy` | Letní kemp — program, trenéři, FAQ, registrace |
| `/pronajem` | Pronájem areálu — ceník, kalendář, poptávka |
| `/novinky` | Magazín — filtrování podle kategorií |
| `/kontakt` | Kontakt — lidé, mapa, formulář |
| `/admin` | CMS dashboard — přehled, registrace, rezervace, rychlé akce |

## Data

Veškerý obsah klubu (11 týmů, kompletní soupisky, realizační týmy, soutěže, kontakty,
výsledky, tabulka, novinky, kempy, pronájem, partneři) je převzatý 1:1 z návrhu a žije
jako jeden zdroj pravdy v [`content/club.js`](content/club.js). Celý web i admin čtou
odsud — úprava jednoho souboru se propíše všude.

## Lokální vývoj

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # produkční build
```

## CMS

Klub má **vlastní administraci** na `/admin` — zápasy, soupisky, novinky, kempy,
rezervace i texty stránek se editujou z prohlížeče. Obsah je uložený jako jeden
JSON záznam v Postgresu, `content/club.js` slouží jen jako výchozí seed.
Podrobnosti v [CLAUDE.md](CLAUDE.md) a [README-BACKEND.md](README-BACKEND.md).

> Dřív tu stál návrh napojit hostované CMS (Sanity). Neudělalo se to — vlastní
> administrace byla levnější a klub nemusí spravovat další účet.

## Logo a fotky

`public/logo.webp` je oficiální znak klubu. Fotky týmů, hráčů a areálu jsou zatím
elegantní gradientní placeholdery (`lib/design.js` → `PH`) — po dodání reálných snímků
stačí vyměnit pozadí za `url(...)`.

---

© 2026 FK Kunice 1934
