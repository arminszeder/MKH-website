/* Smoke tests for the interactive parts of the site.
   Needs the dev server up:  npm run dev
   First run only:           npm install && npx playwright install chromium
   Then:                     npm test  */

import { chromium } from 'playwright';
const base = 'http://127.0.0.1:5173';
const b = await chromium.launch();
const ok = [], bad = [];
const t = (name, pass, extra = '') => (pass ? ok : bad).push(name + (extra ? ` → ${extra}` : ''));

const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(base + '/', { waitUntil: 'networkidle' });

// --- filters -------------------------------------------------------------
await p.getByRole('button', { name: 'Kapuk', exact: true }).click();
t('filter Kapuk shows 1 card', await p.locator('.card:visible').count() === 1);
t('filter Kapuk pressed', await p.getByRole('button', { name: 'Kapuk', exact: true }).getAttribute('aria-pressed') === 'true');
await p.getByRole('button', { name: 'Korlátok', exact: true }).click();
t('filter Korlátok shows the compare card', await p.locator('.card--wide:visible').count() === 1);
t('empty msg hidden when results exist', await p.locator('#galleryEmpty').isHidden());
await p.getByRole('button', { name: 'Kerti munkák', exact: true }).click();
t('filter Kerti munkák shows the padel project', await p.locator('.card:visible').count() === 1);
t('multi-photo card exposes 3 lightbox targets',
  (await p.locator('.card:visible [data-lightbox]').count()) === 3);
await p.getByRole('button', { name: 'Mind', exact: true }).click();
t('filter Mind restores 4', await p.locator('.card:visible').count() === 4);

// --- lightbox ------------------------------------------------------------
await p.locator('[data-lightbox]').first().click();
t('lightbox opens', await p.locator('#lightbox').isVisible());
t('lightbox src set', (await p.locator('#lightboxImg').getAttribute('src')).includes('gate-anthracite'));
await p.locator('#lightboxNext').click();
t('lightbox next advances', (await p.locator('#lightboxImg').getAttribute('src')).includes('fence-wood'));
t('lightbox spans every visible photo', (await p.locator('[data-lightbox]').count()) === 5);
await p.keyboard.press('ArrowLeft');
t('lightbox arrow key goes back', (await p.locator('#lightboxImg').getAttribute('src')).includes('gate-anthracite'));
t('body scroll locked', await p.evaluate(() => document.body.classList.contains('is-locked')));
await p.keyboard.press('Escape');
t('lightbox closes on Escape', await p.locator('#lightbox').isHidden());
t('body scroll unlocked', await p.evaluate(() => !document.body.classList.contains('is-locked')));

// --- compare slider ------------------------------------------------------
await p.locator('#compare').scrollIntoViewIfNeeded();
const box = await p.locator('#compare').boundingBox();
await p.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
await p.mouse.down();
await p.mouse.move(box.x + box.width * 0.82, box.y + box.height / 2, { steps: 8 });
await p.mouse.up();
const pos = await p.locator('#compare').evaluate(el => el.style.getPropertyValue('--pos'));
t('compare drag moves handle', parseFloat(pos) > 75 && parseFloat(pos) < 90, pos);
await p.locator('#compareHandle').focus();
await p.keyboard.press('Home');
t('compare Home key → 0%', (await p.locator('#compareHandle').getAttribute('aria-valuenow')) === '0');
await p.keyboard.press('ArrowRight');
t('compare ArrowRight steps', (await p.locator('#compareHandle').getAttribute('aria-valuenow')) === '2');

// --- anchors -------------------------------------------------------------
await p.getByRole('link', { name: 'Folyamat' }).click();
await p.waitForTimeout(700);
t('nav anchor scrolls to #folyamat',
  Math.abs((await p.locator('#folyamat').boundingBox()).y) < 120);

// --- contact block -------------------------------------------------------
await p.locator('#kapcsolat').scrollIntoViewIfNeeded();
t('tel: link present', (await p.locator('.contact a[href^="tel:"]').count()) === 1);
t('mailto: link present', (await p.locator('.contact a[href^="mailto:"]').count()) === 1);
t('no form remains', (await p.locator('form').count()) === 0);
await p.getByRole('link', { name: 'Kapcsolat' }).first().click();
await p.waitForTimeout(700);
t('nav anchor reaches #kapcsolat',
  Math.abs((await p.locator('#kapcsolat').boundingBox()).y) < 120);

t('no uncaught page errors', errs.length === 0, errs.join('; '));

await b.close();
console.log(ok.map(s => '  PASS ' + s).join('\n'));
if (bad.length) console.log('\n' + bad.map(s => '  FAIL ' + s).join('\n'));
console.log(`\n${ok.length} passed, ${bad.length} failed`);
process.exit(bad.length ? 1 : 0);
