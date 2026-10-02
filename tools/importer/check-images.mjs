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

const IMAGE_EXT = /\.(?:jpe?g|png|gif|webp|svg|avif)(?:$|\?)/i;
// Content images may live on any university host (matrix-cms, study, arts, finearts-music,
// research, …) or on a known CMS bucket. Trackers, app placeholders (/_nuxt/) and YouTube
// posters are not assets to localise (posters stay on i.ytimg.com, which is embeddable).
const IMAGE_HOST = /(?:^|\.)(?:unimelb\.edu\.au|bespoke-production\.s3\.amazonaws\.com)$/i;
const SKIP_URL = /\/_nuxt\/|\/i\/adsct/i;
// Known external images: referenced by content but not fetchable at all; left as-is in the content.
// (pgm2.jpg, listed here before, is now downloaded through the in-page fetch below.)
export const KNOWN_EXTERNAL = [];

/**
 * Normalise a raw image reference to an absolute URL, or null when it is not a content image to
 * check. Relative references resolve against the page URL. `fromImg` marks values read from an
 * <img>/<source>/og:image (any path counts, e.g. Matrix `?a=<id>` asset URLs); CSS url() values
 * need an image-like path.
 */
export function normaliseImageUrl(raw, pageUrl = ORIGIN, fromImg = false) {
  if (!raw) return null;
  let v = raw.trim().replace(/&amp;/g, '&').replace(/^['"]|['"]$/g, '');
  if (!v || /^(data|blob|javascript|about):/i.test(v) || v.startsWith('#')) return null;
  if (v.startsWith('//')) v = `https:${v}`;
  let u;
  try { u = new URL(v, pageUrl); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol) || !IMAGE_HOST.test(u.hostname)) return null;
  if (/^findacourse\./i.test(u.hostname) || SKIP_URL.test(u.href)) return null;
  const imagey = IMAGE_EXT.test(u.pathname) || /\/__data\/assets\/(?:image|git_bridge)\//.test(u.pathname);
  if (!fromImg && !imagey) return null;
  u.hash = '';
  return u.href;
}

function collect() {
  const files = walk(SNAP_ROOT);
  const seen = new Map(); // url -> { pages, example, files }
  files.forEach((file) => {
    const html = readFileSync(file, 'utf8');
    const page = file.slice(SNAP_ROOT.length).replace(/\.html$/, '') || '/';
    const pageUrl = `https://study.unimelb.edu.au${page === '/index' ? '/' : page}`;
    const found = new Set();
    const add = (val, fromImg) => { const url = normaliseImageUrl(val, pageUrl, fromImg); if (url) found.add(url); };
    // <img>/<source>: src, data-src, data-lazy-src, srcset
    for (const m of html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
      const tag = m[0];
      for (const a of tag.matchAll(/\s(?:src|data-src|data-lazy-src)="([^"]*)"/gi)) add(a[1], true);
      for (const a of tag.matchAll(/\s(?:srcset|data-srcset)="([^"]*)"/gi)) {
        a[1].split(',').forEach((part) => add(part.trim().split(/\s+/)[0], true));
      }
    }
    // inline CSS backgrounds
    for (const m of html.matchAll(/url\(\s*(?:&quot;|['"])?([^)'"&]+?)(?:&quot;|['"])?\s*\)/gi)) add(m[1], false);
    // og:image / twitter:image
    for (const m of html.matchAll(/<meta\b[^>]*(?:property|name)="(?:og:image|twitter:image)[^"]*"[^>]*>/gi)) {
      const c = m[0].match(/\scontent="([^"]*)"/i);
      if (c) add(c[1], true);
    }
    found.forEach((url) => {
      const e = seen.get(url) || { pages: 0, example: page };
      e.pages += 1;
      (e.files = e.files || []).push(file);
      seen.set(url, e);
    });
  });
  KNOWN_EXTERNAL.forEach((u) => seen.delete(u));
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
  Object.values(cache.results).forEach((r) => { if (r.status === 'ok') r.everOk = true; });
  // drop stale entries that the collector no longer finds (older URL normalisation)
  Object.keys(cache.results).forEach((u) => { if (!urls.has(u)) delete cache.results[u]; });

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

  const untested = new Set();

  /** Record one probe result for url (confirmation, ever-ok protection, download). */
  const record = (url, r0) => {
    const prev = cache.results[url];
    let r = { ...r0 };
    if (r.status === 'retry') r = { ...r, status: 'unloadable' };
    // The SSO-hop failure is intermittent. An image that has ever loaded (status ok in an earlier
    // run, or a downloaded copy on disk) is not recorded as unloadable on a later failure: it
    // stays ok (and is retried for download), so a flaky run never drops a real image.
    const hasLocal = prev.local && existsSync(join(MEDIA_DIR, prev.local.replace(/^\/media-da\//, '')));
    if ((r.status === 'unloadable' || r.status === 'unknown') && (prev.everOk || hasLocal)) {
      r = { ...r, status: hasLocal ? 'ok' : 'unknown', reason: `transient: ${r.reason || r.status}` };
    }
    if (r.status === 'ok') r.everOk = true;
    delete r.sessionLost;
    if (r.body) {
      if (DOWNLOAD) r.local = saveLocal(url, r.contentType, r.body);
      r.bytes = r.body.length;
      delete r.body;
    }
    cache.results[url] = {
      ...prev, reason: undefined, ...r, checkedAt: new Date().toISOString(), attempts: (prev.attempts || 0) + 1,
    };
  };

  async function worker(id, list) {
    const session = new Session(chromium, endpoint, id);
    let done = 0;
    const progress = (n, force) => {
      const before = done;
      done += n;
      if (!force && Math.floor(before / SAVE_EVERY) === Math.floor(done / SAVE_EVERY) && done !== list.length) return;
      const c = writeOut(cache);
      console.log(`[check-images] session ${id}: ${done}/${list.length} — ok ${c.ok}, unloadable ${c.unloadable}, unknown ${c.unknown}, pending ${c.pending}, untested ${untested.size}`);
    };
    // 1. robots-restricted study.unimelb.edu.au assets: in-page same-origin fetch, in batches
    const inPage = list.filter((u) => IN_PAGE_HOST.test(new URL(u).hostname));
    const direct = list.filter((u) => !inPage.includes(u));
    try {
      for (let i = 0; i < inPage.length; i += FETCH_BATCH) {
        const batch = inPage.slice(i, i + FETCH_BATCH);
        let res = await session.inPage(batch);
        if (!res) { batch.forEach((u) => untested.add(u)); progress(batch.length); continue; }
        // a failure is confirmed once more after a fresh session (any success wins)
        const failed = batch.filter((u) => res[u].status !== 'ok');
        if (failed.length) {
          await session.reset();
          const again = await session.inPage(failed);
          if (again) failed.forEach((u) => { if (again[u].status === 'ok' || res[u].status === 'unknown') res[u] = again[u]; });
        }
        batch.forEach((u) => record(u, res[u]));
        progress(batch.length);
      }
      // 2. other hosts (matrix-cms, …): top-level navigation; in-page fetch from a study page when
      //    the navigation fails for any reason other than a confirmed SSO / HTTP refusal
      for (let i = 0; i < direct.length; i += 1) {
        const url = direct[i];
        let r = await session.navigate(url);
        if (!r) { untested.add(url); progress(1); continue; }
        // A failure is not proof: Bright Data intermittently reports the SSO hop for public assets.
        // Confirm every failure in CONFIRMATIONS more fresh sessions; any success wins.
        for (let k = 0; k < CONFIRMATIONS && (r.status === 'retry' || r.status === 'unloadable'); k += 1) {
          await session.reset();
          const again = await session.navigate(url);
          if (!again) break;
          if (again.status === 'ok' || again.status === 'unknown') { r = again; break; }
          r = again;
        }
        if (r.status !== 'ok') {
          const viaPage = await session.inPage([url]);
          if (viaPage && (viaPage[url].status === 'ok' || r.status === 'unknown')) {
            r = { ...viaPage[url], reason: viaPage[url].reason || `in-page after: ${r.reason || r.status}`.slice(0, 200) };
          }
        }
        record(url, r);
        progress(1);
      }
    } finally {
      await session.close();
    }
  }

  const shards = Array.from({ length: SESSIONS }, (_, i) => todo.filter((_, k) => k % SESSIONS === i));
  await Promise.all(shards.map((list, i) => worker(i + 1, list)));
  console.log('[check-images] done', writeOut(cache), `untested (Bright Data unreachable after retries): ${untested.size}`);
  if (DOWNLOAD) {
    const changed = writeSidecars(urls, cache, scope);
    console.log(`[check-images] sidecars updated: ${changed}`);
  }
}

// ------------------------------------------------------------------ Bright Data session
// Bright Data drops sessions (Target closed, `session limit reached` (1013), robots refusals close
// the session). Every operation reconnects with exponential backoff and is retried on the new
// session; a URL is never classified from a session error. Only after MAX_SESSION_TRIES failed
// reconnects is it left untested (its previous result is kept) for the next run.
const IN_PAGE_HOST = /^study\.unimelb\.edu\.au$/i;
const ANCHOR = 'https://study.unimelb.edu.au/study-with-us';
const FETCH_BATCH = 8;
const MAX_SESSION_TRIES = 8;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const SESSION_ERR = /closed|Target|disconnected|session|WebSocket|ECONN|socket hang up|1013|Execution context was destroyed|net::ERR_(?:CONNECTION|TUNNEL|PROXY|EMPTY_RESPONSE)/i;
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

class Session {
  constructor(chromium, endpoint, id) {
    Object.assign(this, { chromium, endpoint, id, browser: null, context: null, anchor: null });
  }

  async close() {
    const b = this.browser;
    this.browser = null;
    this.anchor = null;
    if (b) await Promise.race([b.close().catch(() => {}), sleep(10000)]);
  }

  async reset() { await this.close(); }

  async connect() {
    await this.close();
    this.browser = await this.chromium.connectOverCDP(this.endpoint, { timeout: 60000 });
    this.context = this.browser.contexts()[0] || await this.browser.newContext();
  }

  /** Run fn(context) with reconnect + backoff on session errors; null when it never got through. */
  async withSession(label, fn) {
    for (let attempt = 0; attempt < MAX_SESSION_TRIES; attempt += 1) {
      try {
        if (!this.browser || !this.browser.isConnected()) await this.connect();
        return await fn(this.context);
      } catch (err) {
        // probe() already turns URL-level failures into results, so anything thrown here is a
        // session / page-level failure (dropped CDP session, anchor page not loading): retry it
        const msg = err.message.split('\n').join(' ');
        await this.close();
        const limit = /session limit/i.test(msg);
        const wait = Math.min(120000, (limit ? 15000 : 5000) * 2 ** attempt) + Math.floor(Math.random() * 3000);
        console.log(`[check-images] session ${this.id}: ${label}: ${msg.slice(0, 120)} — reconnect in ${Math.round(wait / 1000)}s (${attempt + 1}/${MAX_SESSION_TRIES})`);
        await sleep(wait);
      }
    }
    return null;
  }

  /** Top-level navigation probe (probe() above); null when Bright Data stayed unreachable. */
  async navigate(url) {
    return this.withSession('navigate', async (context) => {
      const r = await probe(context, url, DOWNLOAD);
      if (r.status === 'unknown' && SESSION_ERR.test(r.reason || '') && !/restricted in accordance with robots/i.test(r.reason || '')) {
        throw new Error(`session: ${r.reason}`);
      }
      if (r.sessionLost) await this.close(); // Bright Data closes the session after a robots refusal
      delete r.sessionLost;
      return r;
    });
  }

  /**
   * Download urls from inside a normal study.unimelb.edu.au page: same-origin fetch for study
   * assets (robots.txt only stops Bright Data navigating to them), CORS fetch for matrix-cms.
   * Returns { url: result } or null when Bright Data stayed unreachable.
   */
  async inPage(urls) {
    return this.withSession('in-page', async (context) => {
      if (!this.anchor || this.anchor.isClosed()) {
        this.anchor = await context.newPage();
        await this.anchor.goto(ANCHOR, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
      }
      const raw = await this.anchor.evaluate(inPageFetch, { urls, max: MAX_IMAGE_BYTES });
      const out = {};
      raw.forEach((f) => { out[f.url] = classifyFetch(f); });
      return out;
    });
  }
}

/** Runs in the page: fetch each URL, verify, return base64 bytes (canvas fallback for PNG only). */
async function inPageFetch({ urls, max }) {
  const toB64 = (buf) => {
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const viaCanvas = (url) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve({ b64: c.toDataURL('image/png').split(',')[1], w: img.naturalWidth });
      } catch (e) { resolve({ error: String(e.message || e) }); }
    };
    img.onerror = () => resolve({ error: 'img load error' });
    img.src = url;
  });
  const out = [];
  for (const url of urls) {
    const sameOrigin = new URL(url).origin === window.location.origin;
    try {
      // manual first: a redirect (Matrix restricted asset -> SSO login) is visible as opaqueredirect
      const m = await fetch(url, { cache: 'no-store', redirect: 'manual', credentials: 'omit' });
      let r = m;
      let redirected = false;
      if (m.type === 'opaqueredirect') {
        redirected = true;
        try { r = await fetch(url, { cache: 'no-store', credentials: 'omit' }); } catch (e) {
          out.push({ url, redirected, error: `redirect then ${String(e.message || e)}` });
          continue;
        }
      }
      const type = r.headers.get('content-type') || '';
      const declared = parseInt(r.headers.get('content-length') || '0', 10);
      const buf = new Uint8Array(await r.arrayBuffer());
      const ok = r.status >= 200 && r.status < 300 && /^image\//i.test(type) && buf.length > 0 && buf.length <= max
        && (!declared || declared === buf.length || /gzip|br|deflate/i.test(r.headers.get('content-encoding') || ''));
      out.push({
        url, status: r.status, type, finalUrl: r.url, redirected: redirected || r.redirected, size: buf.length, declared, b64: ok ? toB64(buf) : '',
      });
    } catch (e) {
      const error = String(e.message || e);
      // fetch blocked: re-encode through a canvas only where that is lossless (PNG); other formats
      // are recorded with the reason instead of being re-compressed
      if (sameOrigin && /\.png(?:$|\?)/i.test(new URL(url).pathname)) {
        const c = await viaCanvas(url);
        if (c.b64) { out.push({ url, status: 200, type: 'image/png', canvas: true, size: Math.floor(c.b64.length * 0.75), b64: c.b64 }); continue; }
        out.push({ url, error: `${error}; canvas: ${c.error}` });
      } else {
        out.push({ url, error: `${error}${sameOrigin ? '; no lossless canvas fallback for this format' : ''}` });
      }
    }
  }
  return out;
}

/** Map an in-page fetch result to a check result. */
function classifyFetch(f) {
  const sso = /sso\.unimelb\.edu\.au|okta|login/i;
  if (f.error) {
    if (f.redirected) return { status: 'unloadable', reason: `redirect-cross-origin (login): ${f.error}`.slice(0, 200), method: 'in-page-fetch' };
    return { status: 'unknown', reason: `in-page fetch failed: ${f.error}`.slice(0, 200), method: 'in-page-fetch' };
  }
  const base = { http: f.status, contentType: f.type, method: f.canvas ? 'in-page-canvas-png' : 'in-page-fetch' };
  if (sso.test(f.finalUrl || '')) return { ...base, status: 'unloadable', reason: 'redirect-to-sso' };
  if ([401, 403, 404, 410].includes(f.status)) return { ...base, status: 'retry', reason: `http-${f.status}` };
  if (f.status >= 200 && f.status < 300) {
    if (!/^image\//i.test(f.type)) return { ...base, status: 'unloadable', reason: 'not-an-image' };
    if (!f.b64) return { ...base, status: 'unknown', reason: `bad body (size ${f.size}, content-length ${f.declared})` };
    return { ...base, status: 'ok', body: Buffer.from(f.b64, 'base64') };
  }
  return { ...base, status: 'unknown', reason: `http-${f.status}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // explicit exit: lingering Bright Data CDP sockets otherwise keep the process (and its
  // sessions) alive after the run, which starves the next run with "session limit reached"
  main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
}
