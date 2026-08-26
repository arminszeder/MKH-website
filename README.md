# MKH Werk — weboldal

Egyoldalas bemutatkozó oldal egyedi lakatosmunkákhoz (kapuk, korlátok, kerítések,
lovas szerkezetek). Statikus HTML/CSS/JS, build lépés nélkül, egyetlen Vercel
serverless függvénnyel az ajánlatkérő űrlaphoz.

```
index.html          a főoldal
adatkezeles.html    adatkezelési tájékoztató (GDPR)
styles.css          a teljes stíluslap
main.js             menü, galéria szűrő, lightbox, előtte/utána csúszka, űrlap
api/contact.js      POST /api/contact — e-mail küldés Resenden keresztül
assets/             fotók, logó, favicon
source/             eredeti, feldolgozatlan forrásfájlok (nem kerül ki élesbe)
```

## Helyi futtatás

```bash
npm run dev            # http://127.0.0.1:5173 — statikus, /api nélkül
```

Az `/api/contact` végponthoz a Vercel CLI kell:

```bash
npm i -g vercel
cp .env.example .env.local     # töltsd ki a kulcsokat
vercel dev
```

Az űrlap `/api` nélkül is használható marad: ha a küldés nem sikerül, a látogató
egy előre kitöltött `mailto:` linket kap.

## Környezeti változók

A Vercelen: **Project → Settings → Environment Variables**.

| Név | Kötelező | Leírás |
| --- | --- | --- |
| `GMAIL_USER` | igen | a küldő Gmail-fiók, pl. `info.mkhwerk@gmail.com` |
| `GMAIL_APP_PASSWORD` | igen | 16 karakteres Google App Password — **nem** a fiók jelszava |
| `MAIL_TO` | nem | ide érkeznek az ajánlatkérések; alapértelmezés a `GMAIL_USER` |

### App Password létrehozása

1. A Google-fiókon kapcsold be a **2-lépcsős azonosítást**
2. Nyisd meg: https://myaccount.google.com/apppasswords
3. Adj neki nevet (pl. „MKH Werk weboldal"), és másold ki a 16 karaktert
4. Szóközök nélkül illeszd be a `GMAIL_APP_PASSWORD` értékének

A Gmail csak a hitelesített fiókot (vagy annak igazolt aliasát) engedi a
`From` mezőben, ezért az ügyfél címe a `Reply-To`-ba kerül — a levélre válaszolva
közvetlenül az érdeklődőnek írsz. A Gmail napi kb. 500 kimenő levelet enged.

## Mielőtt élesbe megy — cseréld ki

A kódban `TODO` megjegyzés jelöli mindegyiket:

- **Telefonszám** `+36 30 000 0000` — `index.html` (ajánlatkérés blokk, footer,
  JSON-LD), `adatkezeles.html`
- **E-mail** `info@mkhwerk.hu` — `index.html` footer + JSON-LD,
  `main.js` (`FALLBACK_MAIL`), `adatkezeles.html`
- **Facebook URL** — `index.html` footer
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

A böngészős és API-teszteket a fejlesztés során Playwrighttal futtattuk
(galéria szűrő, lightbox, csúszka, űrlap-validáció, Resend hívás alakja).

## Deploy

`main` branchre pusholva a Vercel automatikusan buildel és élesít.
