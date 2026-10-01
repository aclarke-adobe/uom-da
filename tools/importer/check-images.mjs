#!/usr/bin/env node
/**
 * check-images.mjs: find content images that cannot be loaded on the source (login-restricted,
 * 403, 404, not an image) so the import can drop them instead of authoring broken images.
 *
 * 1. Collects every unique content image URL referenced by the captured snapshots
 *    (tools/importer/bd-snapshots/study.unimelb.edu.au/**\/*.html, template parts included):
 *    <img src|data-src|srcset>, inline `background-image: url(...)`, og:image / twitter:image
 *    `content=`. Only matrix-cms.unimelb.edu.au / study.unimelb.edu.au `/__data/assets/...` images.
 * 2. Tests each URL through the Bright Data browser (process.env.BD_ENDPOINT, the local CDP
 *    forwarder) by navigating a tab to the image URL itself and reading the main response:
 *      ok          2xx with an image/* content type
 *      unloadable  redirect to the university SSO (login-restricted Matrix asset; Bright Data then
 *                  refuses the sso.unimelb.edu.au hop under robots.txt), 401/403/404/410, or a 2xx
 *                  that is not an image (e.g. a login page)
 *      unknown     timeouts / Bright Data session errors: re-tested on the next run
 *    Why navigation: an in-page `new Image()` probe is not reliable here. matrix-cms answers
 *    cross-site image loads from automation with a Cross-Origin-Resource-Policy block
 *    (net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin) even for public assets, which made every image
 *    look broken. A top-level navigation is not subject to CORP and gives the real status.
 *    Every failure is re-tested in 2 more fresh sessions (any success wins): Bright Data sometimes
 *    reports the SSO hop for public assets.
 * 3. Writes (after every URL batch, so the run is resumable and cached):
 *      tools/importer/unloadable-images.json  { generatedAt, method, counts, unloadable: [url…],
 *        results: { url: { status, http, contentType, reason, checkedAt, attempts, pages, example } } }
 *      tools/importer/unloadable-images.js    `export default [url…]` (bundled by the course import
 *        script and handed to the cleanup transformer, which drops those images before parsing)
 *
 * Usage (low concurrency: a background capture run may be using Bright Data sessions too):
 *   BD_ENDPOINT=… node tools/importer/check-images.mjs [--sessions 1] [--limit N] [--recheck]
 *     [--recheck-unloadable] [--recheck-unknown] [--collect-only]
 *     [--download] (localise loadable images into content/media-da + snapshot sidecars)
 *     [--pages tools/importer/urls-course-pilot.txt] (only images referenced by these pages)
 */
import {
  readFileSync, writeFileSync, existsSync, readdirSync, statSync, renameSync, mkdirSync,
} from 'fs';
import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN = process.env.EXCAT_PLUGIN_DIR || '/home/node/.excat-marketplaces/excat-marketplace';
const IMPORT_SCRIPTS = join(PLUGIN, 'excat/skills/excat-content-import/scripts');

const SNAP_ROOT = join(__dirname, 'bd-snapshots', 'study.unimelb.edu.au');
const OUT_JSON = join(__dirname, 'unloadable-images.json');
const OUT_JS = join(__dirname, 'unloadable-images.js');
const ORIGIN = 'https://study.unimelb.edu.au/';
const METHOD = 'bd-navigate-v1';
const NAV_TIMEOUT = 60000;
const SAVE_EVERY = 10;
const CONFIRMATIONS = 2; // extra fresh-session attempts before a failure is recorded as unloadable

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const has = (name) => args.includes(name);
const SESSIONS = Math.max(1, parseInt(opt('--sessions', '1'), 10));
const LIMIT = parseInt(opt('--limit', '0'), 10);
// --download: also localise loadable images (the same mechanism as bd-scrape for on-host images):
// save the bytes to content/media-da/<md5(url)>.<ext> and add `url -> /media-da/<file>` to the
// `<snapshot>.images.json` sidecar of every snapshot that references the image; run-bulk-import
// rewrites the origin URLs from that sidecar. Needed because matrix-cms refuses cross-site
// (hotlinked) image loads, so origin URLs render broken on localhost / aem.page even when public.
const DOWNLOAD = has('--download');
const MEDIA_DIR = join(__dirname, '..', '..', 'content', 'media-da');

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif' };

/** Save image bytes as content/media-da/<md5(url)>.<ext>; returns the /media-da/ path. */
function saveLocal(url, contentType, body) {
  const ext = EXT[(contentType || '').split(';')[0].trim().toLowerCase()]
    || (new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i) || [])[1] || 'bin';
  const name = `${createHash('md5').update(url).digest('hex')}.${ext.toLowerCase().replace('jpeg', 'jpg')}`;
  mkdirSync(MEDIA_DIR, { recursive: true });
  writeFileSync(join(MEDIA_DIR, name), body);
  return `/media-da/${name}`;
}

/** Merge localised URLs into each referencing snapshot's sidecar; drop unloadable ones from it. */
function writeSidecars(urls, cache, scope) {
  const perFile = new Map();
  urls.forEach((info, url) => {
    if (scope && !scope.has(url)) return;
    const r = cache.results[url];
    if (!r) return;
    info.files.forEach((f) => {
      if (!perFile.has(f)) perFile.set(f, []);
      perFile.get(f).push([url, r]);
    });
  });
  let written = 0;
  perFile.forEach((entries, file) => {
    const sidecar = file.replace(/\.html$/, '.images.json');
    let map = {};
    if (existsSync(sidecar)) { try { map = JSON.parse(readFileSync(sidecar, 'utf8')); } catch (e) { map = {}; } }
    const before = JSON.stringify(map);
    entries.forEach(([url, r]) => {
      if (r.status === 'ok' && r.local && existsSync(join(MEDIA_DIR, r.local.replace(/^\/media-da\//, '')))) map[url] = r.local;
      else if (r.status === 'unloadable') delete map[url];
    });
    if (JSON.stringify(map) !== before) {
      writeFileSync(sidecar, JSON.stringify(map, null, 2));
      written += 1;
    }
  });
  return written;
}

// ------------------------------------------------------------------ collect
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const IMAGE_PATH = /\/__data\/assets\/(?:image|git_bridge)\/|\.(?:jpe?g|png|gif|webp|svg|avif)(?:$|\?)/i;

/** Normalise a raw attribute value to an absolute asset URL, or null when it is not a content image. */
export function normaliseImageUrl(raw) {
  if (!raw) return null;
  let v = raw.trim().replace(/&amp;/g, '&').replace(/^['"]|['"]$/g, '');
  if (!v || v.startsWith('data:') || v.startsWith('blob:')) return null;
  if (v.startsWith('//')) v = `https:${v}`;
  let u;
  try { u = new URL(v, ORIGIN); } catch (e) { return null; }
  if (!/^(matrix-cms|study)\.unimelb\.edu\.au$/i.test(u.hostname)) return null;
  if (!u.pathname.startsWith('/__data/assets/') || !IMAGE_PATH.test(u.pathname)) return null;
  u.hash = '';
  return u.href;
}

function collect() {
  const files = walk(SNAP_ROOT);
  const seen = new Map(); // url -> { pages, example }
  const patterns = [
    /\s(?:src|data-src|data-lazy-src|content)="([^"]+)"/gi,
    /\ssrcset="([^"]+)"/gi,
    /url\(\s*(?:&quot;|['"])?([^)'"&]+?)(?:&quot;|['"])?\s*\)/gi,
  ];
  files.forEach((file) => {
    const html = readFileSync(file, 'utf8');
    const page = file.slice(SNAP_ROOT.length).replace(/\.html$/, '') || '/';
    const found = new Set();
    patterns.forEach((re, i) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(html))) {
        const vals = i === 1 ? m[1].split(',').map((s) => s.trim().split(/\s+/)[0]) : [m[1]];
        vals.forEach((val) => { const url = normaliseImageUrl(val); if (url) found.add(url); });
      }
    });
    found.forEach((url) => {
      const e = seen.get(url) || { pages: 0, example: page };
      e.pages += 1;
      (e.files = e.files || []).push(file);
      seen.set(url, e);
    });
  });
  return { files: files.length, urls: seen };
}

// ------------------------------------------------------------------ cache
function loadCache() {
  if (!existsSync(OUT_JSON)) return { results: {} };
  try {
    const j = JSON.parse(readFileSync(OUT_JSON, 'utf8'));
    // results from an older probe method are not trusted: re-test them
    if (j.method !== METHOD) return { results: {} };
    return j;
  } catch (e) { return { results: {} }; }
}

function writeOut(cache) {
  const results = cache.results || {};
  const unloadable = Object.keys(results).filter((u) => results[u].status === 'unloadable').sort();
  const counts = { total: Object.keys(results).length, ok: 0, unloadable: unloadable.length, unknown: 0, pending: 0 };
  Object.values(results).forEach((r) => {
    if (r.status === 'ok') counts.ok += 1;
    else if (r.status === 'unknown' || r.status === 'retry') counts.unknown += 1;
    else if (!r.status) counts.pending += 1;
  });
  const json = { generatedAt: new Date().toISOString(), method: METHOD, counts, unloadable, results };
  writeFileSync(`${OUT_JSON}.tmp`, JSON.stringify(json, null, 1));
  renameSync(`${OUT_JSON}.tmp`, OUT_JSON);
  const js = `/* eslint-disable */\n// Generated by tools/importer/check-images.mjs (${METHOD}) on ${json.generatedAt}. Do not edit.\n`
    + '// Content images that cannot be loaded on the source: dropped by the course cleanup transformer.\n'
    + `export default ${JSON.stringify(unloadable, null, 1)};\n`;
  writeFileSync(`${OUT_JS}.tmp`, js);
  renameSync(`${OUT_JS}.tmp`, OUT_JS);
  return counts;
}

// ------------------------------------------------------------------ probe
/** Navigate a fresh tab to the image; classify the main response. */
async function probe(context, url, wantBody) {
  const page = await context.newPage();
  try {
    // Restricted Matrix assets first answer 200 + image/* and then hop to the university SSO, so the
    // status alone is not enough: always wait for load and read the body. Reading the body of a
    // restricted asset fails with "Requested URL (https://sso.unimelb.edu.au/…)".
    const res = await page.goto(url, { timeout: NAV_TIMEOUT, waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const http = res ? res.status() : 0;
    const contentType = (res && res.headers()['content-type']) || '';
    const finalUrl = page.url();
    if (/sso\.unimelb\.edu\.au|okta/i.test(finalUrl)) return { status: 'unloadable', http, contentType, reason: 'redirect-to-sso' };
    if (http >= 200 && http < 300) {
      if (!/^image\//i.test(contentType)) return { status: 'unloadable', http, contentType, reason: 'not-an-image' };
      let body = null;
      let bodyError = '';
      try { body = await res.body(); } catch (e) { body = null; bodyError = e.message.split('\n')[0]; }
      if (body && body.length) return { status: 'ok', http, contentType, body };
      // CDP could not hand over the body. Its error can name the SSO URL even for PUBLIC assets
      // (seen on the MMA banner / portraits, which download fine), so it is not proof on its own:
      // re-fetch same-origin from the tab (it is on the image's own origin now) and decide on that.
      let f = null;
      try {
        f = await page.evaluate(async () => {
          const r = await fetch(window.location.href, { cache: 'no-store' });
          const type = r.headers.get('content-type') || '';
          const buf = new Uint8Array(await r.arrayBuffer());
          let s = '';
          for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          return { status: r.status, type, url: r.url, redirected: r.redirected, b64: btoa(s) };
        });
      } catch (e) {
        f = { error: e.message.split('\n')[0] };
      }
      if (f && !f.error) {
        if (/sso\.unimelb\.edu\.au|okta/i.test(f.url || '')) return { status: 'unloadable', http, contentType, reason: 'redirect-to-sso' };
        if ([401, 403, 404, 410].includes(f.status)) return { status: 'retry', http: f.status, contentType, reason: `http-${f.status}` };
        if (f.status >= 200 && f.status < 300 && /^image\//i.test(f.type)) {
          body = Buffer.from(f.b64, 'base64');
          if (body.length) return { status: 'ok', http, contentType, body };
        }
        if (f.status >= 200 && f.status < 300 && !/^image\//i.test(f.type)) return { status: 'unloadable', http: f.status, contentType: f.type, reason: 'not-an-image' };
        return { status: 'unknown', http, contentType, reason: `refetch ${f.status} ${f.type}` };
      }
      // a fetch that throws (cross-origin redirect to the SSO login) while CDP also reports the SSO hop
      if (/sso\.unimelb\.edu\.au|okta/i.test(bodyError)) {
        return { status: 'unloadable', http, contentType, reason: 'redirect-to-sso', sessionLost: true };
      }
      return { status: 'unknown', http, contentType, reason: `empty-body ${(f && f.error) || bodyError}`.slice(0, 200) };
    }
    if ([401, 403, 404, 410].includes(http)) return { status: 'retry', http, contentType, reason: `http-${http}` };
    return { status: 'unknown', http, contentType, reason: `http-${http}` };
  } catch (err) {
    const msg = err.message.split('\n')[0];
    if (/sso\.unimelb\.edu\.au/i.test(msg)) return { status: 'unloadable', reason: 'redirect-to-sso', sessionLost: true };
    return { status: 'unknown', reason: msg.slice(0, 200), sessionLost: /closed|brob|Target|disconnected/i.test(msg) };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const { chromium } = createRequire(join(IMPORT_SCRIPTS, 'package.json'))('playwright');
  const { files, urls } = collect();
  console.log(`[check-images] ${files} snapshots, ${urls.size} unique content image URLs`);
  const cache = loadCache();
  cache.results = cache.results || {};
  urls.forEach((info, url) => {
    cache.results[url] = { ...(cache.results[url] || {}), pages: info.pages, example: info.example };
  });

  // --pages <file>: restrict testing / localisation to images referenced by these pages
  // (URLs or site paths, one per line), e.g. tools/importer/urls-course-pilot.txt
  let scope = null;
  if (opt('--pages')) {
    const wanted = new Set(readFileSync(opt('--pages'), 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
      .map((l) => join(SNAP_ROOT, `${new URL(l, ORIGIN).pathname.replace(/\/$/, '') || '/index'}.html`)));
    scope = new Set([...urls.entries()].filter(([, info]) => info.files.some((f) => wanted.has(f))).map(([u]) => u));
    console.log(`[check-images] --pages: ${wanted.size} pages, ${scope.size} images in scope`);
  }

  let todo = [...urls.keys()].filter((u) => {
    const r = cache.results[u];
    if (scope && !scope.has(u)) return false;
    if (DOWNLOAD && r.status === 'ok' && !(r.local && existsSync(join(MEDIA_DIR, r.local.replace(/^\/media-da\//, ''))))) return true;
    if (has('--recheck')) return true;
    if (has('--recheck-unloadable') && r.status === 'unloadable') return true;
    if (has('--recheck-unknown') && r.status === 'unknown') return true;
    return !r.status || r.status === 'retry' || (r.status === 'unknown' && !has('--skip-unknown'));
  });
  if (LIMIT) todo = todo.slice(0, LIMIT);
  console.log(`[check-images] to test: ${todo.length}`);
  if (has('--collect-only') || !todo.length) {
    console.log('[check-images] counts', writeOut(cache));
    if (DOWNLOAD) console.log(`[check-images] sidecars updated: ${writeSidecars(urls, cache, scope)}`);
    return;
  }
  const endpoint = process.env.BD_ENDPOINT;
  if (!endpoint) {
    console.error('BD_ENDPOINT is not set (Bright Data CDP forwarder URL)');
    process.exit(1);
  }

  async function worker(id, list) {
    let browser = null;
    let context = null;
    const connect = async () => {
      if (browser) await browser.close().catch(() => {});
      browser = await chromium.connectOverCDP(endpoint, { timeout: 60000 });
      context = browser.contexts()[0] || await browser.newContext();
    };
    const run = async (url, wantBody) => {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          if (!browser || !browser.isConnected()) await connect();
          const r = await probe(context, url, wantBody);
          if (r.sessionLost) browser = null; // Bright Data closes the session after a robots refusal
          return r;
        } catch (err) {
          browser = null;
          if (attempt === 2) return { status: 'unknown', reason: `session: ${err.message.split('\n')[0].slice(0, 160)}` };
        }
      }
      return { status: 'unknown', reason: 'session' };
    };
    try {
      for (let i = 0; i < list.length; i += 1) {
        const url = list[i];
        const prev = cache.results[url];
        let r = await run(url, DOWNLOAD);
        // A failure is not proof: Bright Data intermittently reports the SSO hop for public assets
        // (9 of 11 first-pass "redirect-to-sso" images loaded on a re-test). Confirm every
        // failure in CONFIRMATIONS more fresh sessions; any success wins.
        for (let k = 0; k < CONFIRMATIONS && (r.status === 'retry' || r.status === 'unloadable'); k += 1) {
          browser = null;
          const again = await run(url, DOWNLOAD);
          if (again.status === 'ok' || again.status === 'unknown') { r = again; break; }
          r = again;
        }
        if (r.status === 'retry') r = { ...r, status: 'unloadable' };
        delete r.sessionLost;
        if (r.body) {
          if (DOWNLOAD) r.local = saveLocal(url, r.contentType, r.body);
          r.bytes = r.body.length;
          delete r.body;
        }
        cache.results[url] = {
          ...prev, reason: undefined, ...r, checkedAt: new Date().toISOString(), attempts: (prev.attempts || 0) + 1,
        };
        if ((i + 1) % SAVE_EVERY === 0 || i === list.length - 1) {
          const c = writeOut(cache);
          console.log(`[check-images] session ${id}: ${i + 1}/${list.length} — ok ${c.ok}, unloadable ${c.unloadable}, unknown ${c.unknown}, pending ${c.pending}`);
        }
      }
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  const shards = Array.from({ length: SESSIONS }, (_, i) => todo.filter((_, k) => k % SESSIONS === i));
  await Promise.all(shards.map((list, i) => worker(i + 1, list)));
  console.log('[check-images] done', writeOut(cache));
  if (DOWNLOAD) console.log(`[check-images] sidecars updated: ${writeSidecars(urls, cache, scope)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
