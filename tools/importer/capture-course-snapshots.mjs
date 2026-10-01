#!/usr/bin/env node
/* eslint-disable no-console, no-await-in-loop */
/**
 * Capture raw HTML snapshots of study.unimelb.edu.au course pages (Cloudflare-protected)
 * through the Bright Data browser, for the offline bulk importer.
 *
 * Each snapshot is written to the exact path run-bulk-import.js reads
 * (resolveSavedHtmlPath: <out>/<host>/<document-path>.html) and contains:
 *   - the full DOMESTIC rendered document (default audience), and
 *   - when the page has the audience switcher (#user-profile-audience-switcher), the
 *     INTERNATIONAL re-render of the variable regions, appended just before </body> as
 *       <template id="excat-international" data-captured-at="ISO">
 *         <div data-excat-part="body">        #main div[data-test$='-page']  </div>
 *         <div data-excat-part="key-facts">   div.key-facts                  </div>
 *         <div data-excat-part="hero-codes">  ul.course-header__codes        </div>
 *         <div data-excat-part="page-title">  #page-title (only if outside body) </div>
 *       </template>
 *   <html data-excat-audiences="domestic,international"> (or "domestic" when no switcher).
 *
 * Like the analysis scrape (excat-scrape-webpage bd-scrape.js) the snapshot has
 * <script>/<noscript> stripped (so it is inert under page.setContent) and the same
 * image normalisation (background-image -> <img>, <picture> fallback, absolute <img src>,
 * inline <svg> -> data: <img>) — applied to a CLONE so the live Vue app can still
 * re-render when the audience is switched.
 *
 * Usage:
 *   node tools/importer/capture-course-snapshots.mjs --urls <file> \
 *     [--concurrency 4] [--force] [--limit N] [--out tools/importer/bd-snapshots] \
 *     [--report tools/importer/reports/capture-course-snapshots.json]
 *
 * Requires BD_ENDPOINT (credential-less CDP URL of the local Bright Data forwarder).
 */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, statSync, openSync, readSync, closeSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN = process.env.EXCAT_PLUGIN_DIR || '/home/node/.excat-marketplaces/excat-marketplace';
const IMPORT_SCRIPTS = join(PLUGIN, 'excat/skills/excat-content-import/scripts');
const SCRAPE_SCRIPTS = join(PLUGIN, 'excat/skills/excat-scrape-webpage/scripts');

// Reuse the importer's / scraper's helpers so the snapshot path, block detection,
// script stripping and lazy-load scroll can't drift from what the importer expects.
const { chromium } = createRequire(join(IMPORT_SCRIPTS, 'package.json'))('playwright');
const { resolveSavedHtmlPath } = await import(join(IMPORT_SCRIPTS, 'run-bulk-import.js'));
const { detectBlocked } = await import(join(SCRAPE_SCRIPTS, 'bot-detection.js'));
const { stripScripts } = await import(join(SCRAPE_SCRIPTS, 'strip-scripts.js'));
const { trackMainFrameDocumentStatus } = await import(join(SCRAPE_SCRIPTS, 'bd-scrape.js'));
const { scrollToTriggerLazyLoad } = await import(
  join(PLUGIN, 'edge-delivery-services/skills/scrape-webpage/scripts/analyze-webpage.js')
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const NAV_TIMEOUT = 90000; // BD adds round-trip latency
const CHALLENGE_TIMEOUT = 45000; // BD solves Cloudflare/Turnstile async (10-30s)
const CHALLENGE_TITLE_RE = /just a moment|checking your browser|attention required|verifying you are human/i;
const RENDER_TIMEOUT = 45000;
const MAX_ATTEMPTS = 3; // 1 try + 2 retries
const BACKOFF_MS = [5000, 15000];
const MIN_SNAPSHOT_BYTES = 20000;

const SEL = {
  body: "#main div[data-test$='-page']",
  switcher: '#user-profile-audience-switcher',
  intlLabel: 'label[for=user-profile-audience-switcher-international]',
  domLabel: 'label[for=user-profile-audience-switcher-domestic]',
  checked: 'input[name=audience]:checked',
  keyFacts: 'div.key-facts',
  heroCodes: 'ul.course-header__codes',
  pageTitle: '#page-title',
  fees: '#fees',
  feePanel: '#fees .fee-panel',
};
// The site persists the chosen audience in this (non-HttpOnly) cookie as JSON
// {"profile":{..."residency":"international"...}}; left in place it makes the next page in
// the same BD session open as international. It is deleted via document.cookie after each
// capture: context.clearCookies({name}) is NOT usable on Bright Data (it re-adds the other
// cookies via Storage.setCookies, which BD forbids). The domestic guard in capture() is the
// fallback if the delete ever fails.
const AUDIENCE_COOKIE = 'fac-profile';

async function deleteAudienceCookie(page) {
  await page.evaluate((name) => {
    const past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `${name}=; expires=${past}; path=/`;
    const parts = location.hostname.split('.');
    for (let i = 0; i < parts.length - 1; i += 1) {
      document.cookie = `${name}=; expires=${past}; path=/; domain=.${parts.slice(i).join('.')}`;
    }
  }, AUDIENCE_COOKIE).catch(() => {});
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function usage(msg) {
  if (msg) console.error(`Error: ${msg}\n`);
  console.error(`Usage: node tools/importer/capture-course-snapshots.mjs --urls <file>
  --urls FILE        one URL per line (# comments / blank lines ignored)
  --concurrency N    parallel Bright Data sessions (default 4)
  --force            overwrite existing snapshots (default: skip existing — resumable)
  --limit N          only process the first N URLs of the list
  --out DIR          snapshot root (default tools/importer/bd-snapshots)
  --report FILE      JSON report (default tools/importer/reports/capture-course-snapshots.json)`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = {
    concurrency: 4,
    force: false,
    limit: 0,
    out: join(__dirname, 'bd-snapshots'),
    report: join(__dirname, 'reports', 'capture-course-snapshots.json'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) usage(`${a} needs a value`);
      i += 1;
      return v;
    };
    if (a === '--urls') opts.urls = resolve(next());
    else if (a === '--concurrency') opts.concurrency = parseInt(next(), 10);
    else if (a === '--force') opts.force = true;
    else if (a === '--limit') opts.limit = parseInt(next(), 10);
    else if (a === '--out') opts.out = resolve(next());
    else if (a === '--report') opts.report = resolve(next());
    else if (a === '--help' || a === '-h') usage();
    else usage(`unknown argument ${a}`);
  }
  if (!opts.urls) usage('--urls is required');
  if (!existsSync(opts.urls)) usage(`URL file not found: ${opts.urls}`);
  if (!(opts.concurrency >= 1)) usage('--concurrency must be >= 1');
  if (Number.isNaN(opts.limit) || opts.limit < 0) usage('--limit must be >= 0');
  return opts;
}

function readUrls(file) {
  const seen = new Set();
  return readFileSync(file, 'utf-8').split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .filter((l) => {
      try { new URL(l); } catch { console.warn(`  ignoring invalid URL: ${l}`); return false; }
      if (seen.has(l)) return false;
      seen.add(l);
      return true;
    });
}

// ---------------------------------------------------------------------------
// In-page helpers
// ---------------------------------------------------------------------------

/**
 * Serialise `selector` (or the whole document when selector is null) from a CLONE,
 * applying bd-scrape.js fixImagesInDom's normalisation to the clone only. Background
 * images are read from the LIVE elements (computed style needs layout) via a parallel
 * walk — cloneNode(true) preserves element order. Returns null if selector misses.
 */
function serializeFixed({ selector, sourceUrl, audiences }) {
  const BG_SEL = 'div, section, article, header, footer, aside, main, figure';
  const liveRoot = selector ? document.querySelector(selector) : document.documentElement;
  if (!liveRoot) return null;
  const clone = liveRoot.cloneNode(true);
  // Radio/checkbox state lives in the `checked` PROPERTY; mirror it to the attribute so the
  // serialised snapshot shows which audience it holds.
  const INPUT_SEL = 'input[type=radio], input[type=checkbox]';
  const cloneInputs = clone.querySelectorAll(INPUT_SEL);
  liveRoot.querySelectorAll(INPUT_SEL).forEach((el, i) => {
    const c = cloneInputs[i];
    if (!c) return;
    if (el.checked) c.setAttribute('checked', ''); else c.removeAttribute('checked');
  });
  const liveScope = selector ? liveRoot : document.body;
  const cloneScope = selector ? clone : clone.querySelector('body');

  const bgUrl = (el) => {
    let bg = null;
    const inline = el.getAttribute('style');
    if (inline) {
      for (const part of inline.split(';')) {
        const [prop, ...rest] = part.split(':');
        if (prop?.trim() === 'background-image') { bg = rest.join(':').trim(); break; }
      }
    }
    if (!bg) {
      const c = window.getComputedStyle(el)?.getPropertyValue('background-image');
      if (c && c !== 'none' && c.includes('url(')) bg = c;
    }
    if (!bg || bg.toLowerCase() === 'none') return null;
    const m = bg.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    return m ? m[1] : null;
  };
  const pictureSrc = (picture) => {
    const sources = picture.querySelectorAll('source');
    if (!sources.length) return null;
    let best = null;
    let bestW = -1;
    for (const s of sources) {
      const mq = s.getAttribute('media');
      if (!mq) { best = s; break; }
      const m = mq.match(/max-width:\s*(\d+)px/);
      if (m && parseInt(m[1], 10) > bestW) { bestW = parseInt(m[1], 10); best = s; }
    }
    if (!best) best = sources[sources.length - 1];
    const srcset = best?.getAttribute('srcset');
    return srcset ? srcset.split(',')[0].trim().split(/\s+/)[0] : null;
  };

  if (cloneScope) {
    const liveEls = [...(liveScope.matches?.(BG_SEL) ? [liveScope] : []), ...liveScope.querySelectorAll(BG_SEL)];
    const cloneEls = [...(cloneScope.matches?.(BG_SEL) ? [cloneScope] : []), ...cloneScope.querySelectorAll(BG_SEL)];
    if (liveEls.length === cloneEls.length) {
      liveEls.forEach((el, i) => {
        const src = bgUrl(el);
        if (src) {
          const img = document.createElement('img');
          img.src = src;
          cloneEls[i].prepend(img);
          cloneEls[i].style.backgroundImage = 'none';
        }
      });
    }
    cloneScope.querySelectorAll('picture').forEach((picture) => {
      const img = picture.querySelector('img');
      if (!img || !img.getAttribute('src')) {
        const src = pictureSrc(picture);
        if (src) {
          const n = document.createElement('img');
          n.src = src;
          if (img) img.replaceWith(n); else picture.appendChild(n);
        }
      }
    });
    cloneScope.querySelectorAll('img').forEach((img) => {
      let src = img.getAttribute('src');
      const srcset = img.getAttribute('srcset')?.split(' ')[0];
      if (!src && srcset) img.setAttribute('src', srcset);
      src = img.getAttribute('src');
      if (src) {
        try { new URL(src); } catch {
          try { img.src = new URL(src.startsWith('/') ? src : `./${src}`, sourceUrl).toString(); } catch { /* keep */ }
        }
      }
    });
    cloneScope.querySelectorAll('svg').forEach((svg) => {
      if (svg.parentElement?.closest('svg')) return; // nested svg: handled by its outer svg
      let s = '<svg';
      for (const attr of svg.attributes) s += ` ${attr.name}="${attr.value}"`;
      s += `>${svg.innerHTML}</svg>`;
      const img = document.createElement('img');
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(s)))}`;
      svg.replaceWith(img);
    });
  }

  if (selector) return clone.outerHTML;
  if (audiences) clone.setAttribute('data-excat-audiences', audiences);
  const dt = document.doctype;
  const doctype = dt ? `<!DOCTYPE ${dt.name}${dt.publicId ? ` PUBLIC "${dt.publicId}"` : ''}${dt.systemId ? ` "${dt.systemId}"` : ''}>` : '';
  return doctype + clone.outerHTML;
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

/** Poll until the text length of `selector` is unchanged for `quietPolls` polls. */
async function waitForStableText(page, selector, { timeout = 20000, interval = 500, quietPolls = 3, minLen = 200 } = {}) {
  const end = Date.now() + timeout;
  let last = -1;
  let same = 0;
  while (Date.now() < end) {
    const len = await page.evaluate((s) => document.querySelector(s)?.innerText.length ?? -1, selector);
    if (len === last && len >= minLen) {
      same += 1;
      if (same >= quietPolls) return len;
    } else {
      same = 0;
    }
    last = len;
    await sleep(interval);
  }
  return last;
}

async function waitForBodyRender(page) {
  await page.waitForSelector(SEL.body, { state: 'attached', timeout: RENDER_TIMEOUT });
  await waitForStableText(page, SEL.body);
  if (await page.$(SEL.fees)) {
    await page.waitForSelector(SEL.feePanel, { state: 'attached', timeout: 15000 }).catch(() => {});
  }
}

/**
 * Click an audience label and wait for the client-side re-render: the radio becomes
 * checked, #main mutates (or the body text changes), then #main is quiet for 1.5s.
 * There is no `residency` attribute on the live DOM, so mutation-quiet is the signal.
 */
async function switchAudience(page, audience) {
  const before = await page.evaluate((s) => document.querySelector(s)?.innerText || '', SEL.body);
  await page.evaluate(() => {
    const main = document.querySelector('#main') || document.body;
    window.__excatMut = { n: 0, last: performance.now() };
    window.__excatObs?.disconnect();
    window.__excatObs = new MutationObserver(() => {
      window.__excatMut.n += 1;
      window.__excatMut.last = performance.now();
    });
    window.__excatObs.observe(main, {
      subtree: true, childList: true, characterData: true, attributes: true,
    });
  });
  await page.click(audience === 'international' ? SEL.intlLabel : SEL.domLabel, { timeout: 10000 });
  await page.waitForFunction(
    ([s, v]) => document.querySelector(s)?.value === v,
    [SEL.checked, audience],
    { timeout: 10000 },
  );
  // Re-render started (first mutation or changed text); identical-content pages just time out.
  await page.waitForFunction(
    ([s, prev]) => window.__excatMut.n > 0 || (document.querySelector(s)?.innerText || '') !== prev,
    [SEL.body, before],
    { timeout: 10000, polling: 250 },
  ).catch(() => {});
  // ... and settled.
  await page.waitForFunction(
    () => performance.now() - window.__excatMut.last > 1500,
    null,
    { timeout: 20000, polling: 250 },
  ).catch(() => {});
  if (await page.$(SEL.fees)) {
    await page.waitForSelector(SEL.feePanel, { state: 'attached', timeout: 15000 }).catch(() => {});
  }
  await waitForStableText(page, SEL.body, { timeout: 10000, quietPolls: 2 });
  await sleep(500);
  await page.evaluate(() => window.__excatObs?.disconnect());
  const after = await page.evaluate((s) => document.querySelector(s)?.innerText || '', SEL.body);
  return { changed: after !== before };
}

// ---------------------------------------------------------------------------
// Capture one URL
// ---------------------------------------------------------------------------
class CaptureError extends Error {
  constructor(message, { retryable = true } = {}) {
    super(message);
    this.retryable = retryable;
  }
}

const partTexts = (page) => page.evaluate((sels) => Object.fromEntries(
  Object.entries(sels).map(([k, s]) => [k, (document.querySelector(s)?.innerText || '').replace(/\s+/g, ' ')]),
), { body: SEL.body, 'key-facts': SEL.keyFacts, 'hero-codes': SEL.heroCodes });

async function capture(context, url) {
  const t0 = Date.now();
  const phases = {};
  let tp = t0;
  const mark = (k) => { const n = Date.now(); phases[k] = n - tp; tp = n; };
  const page = await context.newPage();
  try {
    const getNavStatus = trackMainFrameDocumentStatus(page);
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    } catch (err) {
      throw new CaptureError(`navigation failed: ${err.message.split('\n')[0]}`);
    }
    mark('goto');
    // Wait for a Cloudflare challenge to auto-solve (as run-bulk-import / bd-scrape do).
    await page.waitForFunction(
      (reSrc) => {
        const t = (document.title || '').toLowerCase();
        return t.length > 0 && !new RegExp(reSrc, 'i').test(t);
      },
      CHALLENGE_TITLE_RE.source,
      { timeout: CHALLENGE_TIMEOUT, polling: 1000 },
    ).catch(() => {});
    mark('challenge');

    const status = () => getNavStatus() ?? response?.status() ?? null;
    const early = await detectBlocked(page, { status });
    if (early.isBotProtection) throw new CaptureError(`BLOCKED_PAGE: ${early.type} — ${early.detected}`);
    const st = status();
    if (st && [403, 429, 503].includes(st)) throw new CaptureError(`BLOCKED_PAGE: HTTP_${st}`);
    if (st && st >= 400) throw new CaptureError(`HTTP ${st}`, { retryable: st >= 500 });

    try {
      await waitForBodyRender(page);
    } catch (err) {
      const late = await detectBlocked(page, { status }).catch(() => ({}));
      if (late.isError) throw new CaptureError(`BLOCKED_PAGE: ${late.type} — ${late.detected}`, { retryable: late.isBotProtection });
      throw new CaptureError(`body did not render (${SEL.body}): ${err.message.split('\n')[0]}`);
    }
    mark('render');

    await scrollToTriggerLazyLoad(page);
    await sleep(1000);
    await waitForStableText(page, SEL.body, { timeout: 10000, quietPolls: 2 });
    mark('scroll');

    const hasSwitcher = Boolean(await page.$(SEL.switcher));
    let domesticReset = false;
    if (hasSwitcher) {
      const current = await page.evaluate((s) => document.querySelector(s)?.value, SEL.checked);
      if (current && current !== 'domestic') {
        await switchAudience(page, 'domestic');
        domesticReset = true;
      }
    }
    const audiences = hasSwitcher ? 'domestic,international' : 'domestic';
    let html = await page.evaluate(serializeFixed, { selector: null, sourceUrl: url, audiences });
    if (!html) throw new CaptureError('could not serialise document');
    mark('domestic');

    let intl = null;
    if (hasSwitcher) {
      const domTexts = await partTexts(page);
      await switchAudience(page, 'international');
      mark('switch');
      const intlTexts = await partTexts(page);
      const differs = Object.fromEntries(Object.keys(domTexts).map((k) => [k, domTexts[k] !== intlTexts[k]]));
      const parts = [];
      const add = async (name, selector) => {
        const part = await page.evaluate(serializeFixed, { selector, sourceUrl: url });
        if (part) parts.push({ name, html: part });
      };
      await add('body', SEL.body);
      await add('key-facts', SEL.keyFacts);
      await add('hero-codes', SEL.heroCodes);
      const titleOutside = await page.evaluate(
        ([b, t]) => { const tt = document.querySelector(t); return Boolean(tt && !document.querySelector(b)?.contains(tt)); },
        [SEL.body, SEL.pageTitle],
      );
      if (titleOutside) await add('page-title', SEL.pageTitle);
      if (!parts.some((p) => p.name === 'body')) throw new CaptureError('international body missing after switch');
      const capturedAt = new Date().toISOString();
      const tpl = `<template id="excat-international" data-captured-at="${capturedAt}">${
        parts.map((p) => `<div data-excat-part="${p.name}">${p.html}</div>`).join('')}</template>`;
      const at = html.lastIndexOf('</body>');
      html = at >= 0 ? `${html.slice(0, at)}${tpl}${html.slice(at)}` : `${html}${tpl}`;
      intl = { parts: parts.map((p) => p.name), differs };
      await deleteAudienceCookie(page);
      mark('international');
    }

    html = stripScripts(html);
    const bytes = Buffer.byteLength(html, 'utf-8');
    if (bytes < MIN_SNAPSHOT_BYTES) throw new CaptureError(`snapshot suspiciously small (${bytes} bytes)`);
    return {
      html, bytes, audiences, intl, domesticReset, phases,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Report / resumability helpers
// ---------------------------------------------------------------------------
function readAudiencesFromFile(file) {
  try {
    const fd = openSync(file, 'r');
    const buf = Buffer.alloc(4096);
    readSync(fd, buf, 0, 4096, 0);
    closeSync(fd);
    const m = buf.toString('utf-8').match(/<html[^>]*\bdata-excat-audiences="([^"]*)"/i);
    return m ? m[1] : null;
  } catch { return null; }
}

function loadReport(file) {
  try { return JSON.parse(readFileSync(file, 'utf-8')); } catch { return null; }
}

function writeJsonAtomic(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tmp, file);
}

const isDisconnect = (err) => /Target (page, context or browser )?closed|Browser has been closed|browser has disconnected|WebSocket|ECONNRESET|socket hang up/i
  .test(err?.message || '');

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const endpoint = process.env.BD_ENDPOINT;
  if (!endpoint) usage('BD_ENDPOINT is not set (Bright Data CDP forwarder URL)');

  let urls = readUrls(opts.urls);
  if (opts.limit) urls = urls.slice(0, opts.limit);
  const total = urls.length;
  const { concurrency } = opts;
  console.log(`[capture] ${total} URL(s), concurrency ${concurrency}, force=${opts.force}, out=${opts.out}`);

  const prev = loadReport(opts.report);
  const results = new Map((prev?.results || []).map((r) => [r.url, r]));
  const runStarted = Date.now();
  const counts = { ok: 0, skipped: 0, failed: 0 };
  let done = 0;
  let dirty = 0;
  const flush = () => {
    writeJsonAtomic(opts.report, {
      generatedAt: new Date().toISOString(),
      urlsFile: opts.urls,
      concurrency,
      lastRun: { total, ...counts, wallSeconds: +((Date.now() - runStarted) / 1000).toFixed(1) },
      results: [...results.values()],
    });
    dirty = 0;
  };
  const record = (r) => {
    results.set(r.url, r);
    done += 1;
    dirty += 1;
    if (dirty >= 10) flush();
  };

  const queue = urls.map((url, i) => ({ url, index: i + 1 }));
  const label = (i) => `[${String(i).padStart(String(total).length)}/${total}]`;

  // Skip existing snapshots up front (resumable) so workers only see real work.
  const work = [];
  for (const item of queue) {
    const file = resolveSavedHtmlPath(item.url, opts.out);
    if (!opts.force && existsSync(file)) {
      counts.skipped += 1;
      const old = results.get(item.url) || {};
      record({
        ...old,
        url: item.url,
        status: 'skipped',
        file,
        audiences: readAudiencesFromFile(file) ?? old.audiences ?? null,
        bytes: statSync(file).size,
        ms: 0,
        error: null,
      });
      console.log(`${label(item.index)} skipped  ${item.url} (exists)`);
    } else {
      work.push({ ...item, file });
    }
  }

  let stopping = false;
  process.on('SIGINT', () => {
    if (stopping) process.exit(130);
    stopping = true;
    console.log('\n[capture] SIGINT — finishing in-flight pages, then writing report (Ctrl-C again to abort)');
  });

  const okTimes = [];
  async function worker(id) {
    let browser = null;
    let context = null;
    const connect = async () => {
      if (browser) await browser.close().catch(() => {});
      browser = await chromium.connectOverCDP(endpoint, { timeout: 60000 });
      context = browser.contexts()[0] || await browser.newContext();
    };
    try {
      while (work.length && !stopping) {
        const item = work.shift();
        const t0 = Date.now();
        let lastErr = null;
        let res = null;
        let attempts = 0;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS && !stopping; attempt += 1) {
          attempts = attempt;
          try {
            if (!browser || !browser.isConnected()) await connect();
            res = await capture(context, item.url);
            break;
          } catch (err) {
            lastErr = err;
            if (isDisconnect(err) || !browser?.isConnected()) {
              browser = null; // force reconnect on next attempt
            }
            const retryable = err.retryable !== false;
            if (!retryable || attempt === MAX_ATTEMPTS) break;
            const wait = BACKOFF_MS[attempt - 1] + Math.floor(Math.random() * 2000);
            console.log(`${label(item.index)} retry    ${item.url} (attempt ${attempt} failed: ${err.message.split('\n')[0]}; waiting ${Math.round(wait / 1000)}s)`);
            await sleep(wait);
          }
        }
        const ms = Date.now() - t0;
        if (res) {
          mkdirSync(dirname(item.file), { recursive: true });
          const tmp = `${item.file}.tmp`;
          writeFileSync(tmp, res.html, 'utf-8');
          renameSync(tmp, item.file);
          counts.ok += 1;
          okTimes.push(ms);
          record({
            url: item.url,
            status: 'ok',
            file: item.file,
            audiences: res.audiences,
            parts: res.intl?.parts ?? [],
            intlDiffers: res.intl ? res.intl.differs : null,
            domesticReset: res.domesticReset,
            phases: res.phases,
            bytes: res.bytes,
            ms,
            attempts,
            worker: id,
            capturedAt: new Date().toISOString(),
            error: null,
          });
          const diff = res.intl ? Object.entries(res.intl.differs).filter(([, v]) => v).map(([k]) => k) : [];
          const note = res.intl ? ` intl-differs=${diff.join(',') || 'none'}` : '';
          console.log(`${label(item.index)} ok       ${item.url} audiences=${res.audiences} bytes=${res.bytes}${note} ${(ms / 1000).toFixed(1)}s`);
        } else if (lastErr && !stopping) {
          counts.failed += 1;
          const reason = lastErr.message.split('\n')[0];
          record({
            url: item.url, status: 'failed', file: item.file, audiences: null, bytes: 0, ms, attempts, worker: id, error: reason,
          });
          console.log(`${label(item.index)} failed   ${item.url} after ${attempts} attempt(s): ${reason}`);
        } else {
          work.unshift(item); // interrupted before any attempt — leave for next run
        }
        if (work.length && !stopping) await sleep(500 + Math.floor(Math.random() * 1000));
      }
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(work.length, 1)) }, (_, i) => worker(i + 1)));
  flush();

  const wall = (Date.now() - runStarted) / 1000;
  const avg = okTimes.length ? okTimes.reduce((a, b) => a + b, 0) / okTimes.length / 1000 : 0;
  const captured = counts.ok + counts.failed;
  console.log(`[capture] done: ok=${counts.ok} skipped=${counts.skipped} failed=${counts.failed} `
    + `not-run=${total - done} wall=${wall.toFixed(1)}s avg-page=${avg.toFixed(1)}s `
    + `throughput=${captured ? (wall / captured).toFixed(1) : '-'}s/page (at concurrency ${concurrency})`);
  console.log(`[capture] report: ${opts.report}`);
  process.exitCode = counts.failed > 0 || done < total ? 1 : 0;
}

main().catch((err) => {
  console.error('[capture] fatal:', err);
  process.exit(1);
});
