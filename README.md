# MKH Werk — weboldal

Egyoldalas bemutatkozó oldal egyedi lakatosmunkákhoz (kapuk, korlátok, kerítések,
lovas szerkezetek). Statikus HTML/CSS/JS, build lépés nélkül, egyetlen Vercel
serverless függvénnyel az ajánlatkérő űrlaphoz.

```
index.html          a főoldal
adatkezeles.html    adatkezelési tájékoztató (GDPR)
styles.css          a teljes stíluslap
main.js             menü, galéria szűrő, lightbox, előtte/utána csúszka
assets/             fotók, logó, favicon
source/             eredeti, feldolgozatlan forrásfájlok (nem kerül ki élesbe)
```

## Helyi futtatás

```bash
npm run dev            # http://127.0.0.1:5173
```

Teljesen statikus oldal: nincs build lépés, nincs szerveroldali kód, nincs
adatbázis és nincsenek környezeti változók. A kapcsolatfelvétel `tel:` és
`mailto:` linkeken keresztül történik.

> Ha később mégis kell ajánlatkérő űrlap, a `5269fca` commit tartalmazza a
> működő változatot (Gmail SMTP, validáció, fotócsatolás) — onnan visszaemelhető.

## Mielőtt élesbe megy — cseréld ki

A kódban `TODO` megjegyzés jelöli mindegyiket:

- **Facebook URL** — `index.html` (kapcsolat blokk és footer), jelenleg
  általános `facebook.com` link
- **Cégadatok** (cégnév, székhely, adószám) — `adatkezeles.html`
- **Domain** — `index.html` `canonical` + JSON-LD, `robots.txt`, `sitemap.xml`

## Fotók cseréje, új munka hozzáadása

Tedd a képet az `assets/` mappába, majd másolj egy `<article class="card">`
blokkot az `index.html` galériájában. A `data-cat` értéke határozza meg, melyik
szűrőre jelenik meg — ha új kategóriát adsz meg, vegyél fel hozzá egy gombot is a
`.filters` sávba ugyanazzal a `data-cat` értékkel.

A lightboxhoz a gomb `data-src`, `data-cat`, `data-title` és `data-line`
attribútumai kellenek.

### „A műhely" képhelyek

A szekció három helyőrzőt tartalmaz (`.slot`): egy magasat balra
(„Hegesztés a műhelyben"), és két kisebbet jobbra („Készülő szerkezet",
„Részlet, felület"). Fotó behelyezése: a `.slot` div teljes tartalmát — az
SVG ikont és a feliratot — cseréld le egyetlen képre:

```html
<div class="slot slot--tall">
  <img src="/assets/hegesztes.jpg" alt="Hegesztés a műhelyben" loading="lazy">
</div>
```

A `.craft__shots img` szabály gondoskodik a kitöltésről, más módosítás nem kell.

> A „Lovas" szekcióhoz sem érkezett fotó, ott jelenleg az embléma szerepel.

## Tesztek

```bash
npm run check          # szintaxis-ellenőrzés
```

A böngészős teszteket a fejlesztés során Playwrighttal futtattuk
(galéria szűrő, lightbox, előtte/utána csúszka, mobilmenü, horgonylinkek).

## Deploy

`main` branchre pusholva a Vercel automatikusan buildel és élesít.
