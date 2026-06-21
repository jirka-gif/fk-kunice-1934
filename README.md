# FK Kunice 1934 — web + CMS

Oficiální web fotbalového klubu **FK Kunice 1934** postavený podle schváleného návrhu
(„FK Kunice 1934.dc.html"). **Next.js 14 (App Router) + React**, nasazeno na **Vercelu**.

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

## CMS / headless backend

`content/club.js` je navržený jako **seed a zároveň datová vrstva**, takže napojení
reálného headless CMS je jen výměna zdroje dat (`content/club.js` → CMS dotaz) bez
zásahu do komponent.

Doporučené napojení **Sanity** (hosted, zdarma, vizuální Studio na `/studio`):

1. `npm create sanity@latest` (přihlášení k Sanity účtu — provede správce klubu).
2. Naimportovat `content/club.js` jako seed dokumenty.
3. Do Vercelu přidat `NEXT_PUBLIC_SANITY_PROJECT_ID` + `NEXT_PUBLIC_SANITY_DATASET`.
4. Komponenty pak místo `content/club.js` čtou z CMS — vedení klubu edituje
   zápasy, soupisky, novinky a rezervace z prohlížeče.

Do té doby `/admin` slouží jako živý přehledový dashboard.

## Logo a fotky

`public/logo.webp` je oficiální znak klubu. Fotky týmů, hráčů a areálu jsou zatím
elegantní gradientní placeholdery (`lib/design.js` → `PH`) — po dodání reálných snímků
stačí vyměnit pozadí za `url(...)`.

---

© 2026 FK Kunice 1934
