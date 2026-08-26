/* POST /api/contact — delivers an enquiry by email over Gmail SMTP.
 *
 * Environment variables (Vercel → Settings → Environment Variables):
 *   GMAIL_USER          required — the sending account, e.g. info.mkhwerk@gmail.com
 *   GMAIL_APP_PASSWORD  required — a 16-character Google App Password, NOT the
 *                       account password. Needs 2-Step Verification enabled:
 *                       https://myaccount.google.com/apppasswords
 *   MAIL_TO             optional — where enquiries land. Defaults to GMAIL_USER.
 *
 * Gmail only permits the authenticated account (or one of its verified aliases)
 * in the From header, so the customer's address goes in Reply-To instead.
 *
 * With no credentials configured the endpoint answers 503 and the browser falls
 * back to a prefilled mailto: link, so the form is never a dead end.
 */

import nodemailer from 'nodemailer';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 3.5e6;
const LIMIT_WINDOW_MS = 60_000;
const LIMIT_MAX = 5;

// Best-effort throttle. Serverless instances are recycled and not shared, so this
// blunts bursts from a single client rather than acting as a real rate limiter.
const hits = new Map();

function throttled(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 500) {
    for (const [key, stamps] of hits) {
      if (!stamps.some((t) => now - t < LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > LIMIT_MAX;
}

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

// Reused across invocations that land on a warm instance.
let transport;

function getTransport(user, pass) {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      // Keep well inside the function's execution budget.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000
    });
  }
  return transport;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (throttled(ip)) {
    return res.status(429).json({ error: 'Túl sok kérés. Próbálja újra egy perc múlva.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

  // Honeypot: a real visitor never sees this field, so anything in it is a bot.
  // Answer 200 so the bot believes it succeeded and does not retry.
  if (clean(body.company, 200)) return res.status(200).json({ ok: true });

  const nev = clean(body.nev, 120);
  const telefon = clean(body.telefon, 60);
  const email = clean(body.email, 160);
  const tipus = clean(body.tipus, 60) || 'Nincs megadva';
  const uzenet = clean(body.uzenet, 5000);

  if (!nev || telefon.replace(/\D/g, '').length < 6) {
    return res.status(400).json({ error: 'Hiányzó név vagy telefonszám.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Érvénytelen e-mail cím.' });
  }

  const attachments = [];
  let bytes = 0;
  for (const a of Array.isArray(body.attachments) ? body.attachments.slice(0, MAX_ATTACHMENTS) : []) {
    const content = String(a?.content || '');
    if (!content || !/^[A-Za-z0-9+/=\s]+$/.test(content)) continue;
    bytes += content.length * 0.75;
    if (bytes > MAX_ATTACHMENT_BYTES) break;
    attachments.push({
      filename: clean(a.filename, 100).replace(/[^\w.\- ]+/g, '_') || 'foto.jpg',
      content: content.replace(/\s+/g, ''),
      encoding: 'base64'
    });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.MAIL_TO || user;

  if (!user || !pass) {
    console.error('[contact] GMAIL_USER or GMAIL_APP_PASSWORD is not configured');
    return res.status(503).json({ error: 'Az e-mail küldés még nincs beállítva.' });
  }

  const rows = [
    ['Név', nev],
    ['Telefon', telefon],
    ['E-mail', email || '—'],
    ['Munka típusa', tipus],
    ['Csatolt képek', String(attachments.length)]
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 16px 8px 0;color:#8E8A7B;font:500 12px/1.4 system-ui;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${esc(
          k
        )}</td><td style="padding:8px 0;color:#12160E;font:400 16px/1.5 system-ui">${esc(v)}</td></tr>`
    )
    .join('');

  const html = `<div style="max-width:640px;margin:0 auto;padding:28px;font-family:system-ui,sans-serif">
  <div style="font:500 12px/1 system-ui;letter-spacing:.24em;text-transform:uppercase;color:#C6A15B">MKH Werk — új ajánlatkérés</div>
  <table style="border-collapse:collapse;margin-top:20px;width:100%">${rows}</table>
  ${
    uzenet
      ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #E4E0D4">
      <div style="font:500 12px/1 system-ui;letter-spacing:.14em;text-transform:uppercase;color:#8E8A7B;margin-bottom:10px">Üzenet</div>
      <div style="color:#12160E;font:400 16px/1.6 system-ui;white-space:pre-wrap">${esc(uzenet)}</div>
    </div>`
      : ''
  }
  <div style="margin-top:28px;padding-top:16px;border-top:1px solid #E4E0D4;color:#8E8A7B;font:400 13px/1.5 system-ui">
    Beérkezett: ${esc(new Date().toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' }))}
  </div>
</div>`;

  const text = [
    `Név: ${nev}`,
    `Telefon: ${telefon}`,
    `E-mail: ${email || '—'}`,
    `Munka típusa: ${tipus}`,
    `Csatolt képek: ${attachments.length}`,
    '',
    uzenet || '(nincs üzenet)'
  ].join('\n');

  try {
    await getTransport(user, pass).sendMail({
      // Gmail rewrites From to the authenticated account anyway; set it explicitly
      // so the display name is right.
      from: `MKH Werk <${user}>`,
      to,
      subject: `Ajánlatkérés — ${nev} (${tipus})`,
      text,
      html,
      // Replying in the mail client goes straight back to the customer.
      ...(email ? { replyTo: email } : {}),
      ...(attachments.length ? { attachments } : {})
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    // A rejected login should not poison every later request on this instance.
    transport = null;
    console.error('[contact]', err?.message || err);

    if (err?.responseCode === 535 || /invalid login|username and password/i.test(err?.message || '')) {
      return res.status(502).json({ error: 'Az e-mail fiók hitelesítése sikertelen.' });
    }
    return res.status(502).json({ error: 'Az e-mail küldés most nem sikerült.' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
