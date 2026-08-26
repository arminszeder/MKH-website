# CLAUDE.md — MKH Werk

Static one-page site for a Hungarian metalworking business (lakatosmunkák) in
Mosonmagyaróvár: gates, railings, fences, equestrian structures.

**All user-facing copy is Hungarian.** Write new copy in Hungarian.

## Stack

Plain HTML/CSS/JS. No framework, no build step, no server-side code, no runtime
dependencies, no environment variables. The only `npm` dependency is Playwright,
dev-only, for the test script.

```
index.html          the page
adatkezeles.html    GDPR notice
styles.css          all styles
main.js             header, mobile nav, gallery filter, lightbox, compare slider
assets/             web-ready images (originals are NOT here)
source/             original unprocessed art — gitignored, local only
unpacked/           the Claude Design canvas this was built from — gitignored
```

```bash
npm run dev     # http://127.0.0.1:5173
```

## Deploy

`local → git push → Vercel auto-deploy`. Repo:
`github.com/arminszeder/MKH-website`, branch `main`.

**Not deployed yet.** Import at vercel.com/new, framework preset **Other**,
leave build command and output directory empty. No domain yet — canonical URL,
JSON-LD and sitemap still say `mkhwerk.hu` as a placeholder.

## Gotchas — read before editing these

- **The railing before/after files are renamed.** The originals in the design
  export were labelled backwards. `assets/railing-before.jpg` is the bare steps
  and `railing-after.jpg` has the finished railing. Do not "correct" them.
- **The compare slider's top layer is revealed from the left.** It currently
  holds the *before* shot, so before reads on the left. Swapping the images
  means also swapping the `--before`/`--after` tag sides and the gold emphasis,
  plus `aria-valuetext` in `main.js`.
- **`assets/mkh-logo.png` is derived art.** The supplied logo
  (`source/mkh-logo-original.png`) is gold artwork on an opaque gold background.
  The background was flood-filled out from the borders with a per-neighbour
  tolerance, plus a separate seed for the pocket enclosed between the K and H.
  Never swap the original back in — it renders as a gold block.
- **`<img width>/<height>` are CSS presentational hints.** Setting only `width`
  in CSS leaves the height hint active and stretches the image. A global
  `img { height: auto }` guards this; keep it.
- **`[hidden]` loses to `display: grid/flex`.** Rules like `.form[hidden]`
  exist to restate `display: none`. Any new flex/grid element that gets toggled
  with `hidden` needs the same.
- **`--header-h` (87px) drives three things**: the mobile hero's top offset, the
  mobile nav panel's `top`, and `scroll-padding-top`. Change the header's size
  and all three must follow.

## Conventions

- Palette and fonts are set as custom properties at the top of `styles.css`
  (`--deep`, `--panel`, `--g`, `--g2`, `--cream`, `--muted`). Cinzel for
  headings, Jost for body.
- **Write headings in sentence case.** Cinzel renders lowercase as small caps,
  which produces the large-initial look. Typing them in caps loses that.
- Cinzel is unreadable for addresses and long strings — use
  `.contact__value--plain` (switches to Jost) for those.

## Adding a project to the gallery

Put the web-sized image in `assets/`, copy an `<article class="card">` block in
the gallery. `data-cat` decides which filter shows it; a new category also needs
a button in `.filters` with the same `data-cat`. The lightbox reads `data-src`,
`data-cat`, `data-title`, `data-line` from each `[data-lightbox]` button.

For a multi-photo project, follow the Oázis Padel card: lead image in
`.card__shot`, extras as `.card__thumb` buttons inside `.card__thumbs`.

Resize before committing — the source photos are 3–4 MB, the site's are 150–650 KB.

## Removed on purpose

The enquiry form (validation, photo upload, Gmail SMTP serverless function)
was built and then dropped — the site exists to establish presence, not to
capture leads. It is intact at commit `5269fca`; `git show 5269fca` restores it.
Do not rebuild it from scratch.

## Still outstanding

- Facebook URL is a bare `facebook.com` link in two places in `index.html`
- `adatkezeles.html` needs the company name, registered address and tax number
- "A műhely" section has three dashed `.slot` placeholders awaiting real
  workshop photos — drop an `<img>` in and the styling handles the rest
- No custom domain

## Verifying changes

`tests/site.mjs` is a Playwright script covering the filter, lightbox, compare
slider, mobile nav and anchors. It needs the dev server running:

```bash
npm install                       # first run only
npx playwright install chromium   # first run only
npm run dev &
npm test
```

Screenshotting is the fastest way to check layout work — and note that
`scroll-behavior: smooth` swallows scripted `window.scrollTo`, so force
`scrollBehavior = 'auto'` before scrolling a page to trigger its reveal
animations.
