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
| `RESEND_API_KEY` | igen | https://resend.com/api-keys |
| `MAIL_TO` | igen | ide érkeznek az ajánlatkérések |
| `MAIL_FROM` | nem | pl. `MKH Werk <ajanlat@mkhwerk.hu>` — csak Resenden hitelesített domainnel |

`MAIL_FROM` nélkül a Resend megosztott feladóját használjuk
(`onboarding@resend.dev`), ami **csak a saját Resend-fiókod e-mail címére tud
kézbesíteni**. Éles használathoz igazold a domaint a Resendben, és állítsd be a
`MAIL_FROM`-ot.

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

> A „Lovas" és „A műhely" szekcióhoz nem érkezett fotó, ezért ezek jelenleg
> emblémával, illetve szöveges adatlappal jelennek meg. Ha lesz műhelyfotó,
> érdemes képre cserélni.

## Tesztek

```bash
npm run check          # szintaxis-ellenőrzés
```

A böngészős és API-teszteket a fejlesztés során Playwrighttal futtattuk
(galéria szűrő, lightbox, csúszka, űrlap-validáció, Resend hívás alakja).

## Deploy

`main` branchre pusholva a Vercel automatikusan buildel és élesít.
