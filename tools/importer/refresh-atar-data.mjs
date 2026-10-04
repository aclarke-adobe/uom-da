// Builds widgets/atar-course-explorer.data.json from the source ATAR feed.
//
//   node tools/importer/refresh-atar-data.mjs            use the last captured feed in tools/importer/atar-feed/{data,filter}.json
//   node tools/importer/refresh-atar-data.mjs --fetch    fetch a fresh copy first through Bright Data (BD_ENDPOINT, one session)
//
// The source (study.unimelb.edu.au/study-with-us/undergraduate-courses/explore-courses-by-atar) loads
// two static files: /web_services/atar/data-2024/data.json (courses, scores, flags, area codes) and
// /web_services/atar/data-2024/filter.json (area code -> label). They sit behind a Cloudflare managed
// challenge and send no Access-Control-Allow-Origin header, so the widget cannot read them live.
//
// Transform: rows are kept in the source shape (the widget applies the source's own filtering rules
// to them), minus "spacing": null and unused pathway descriptions; links to course pages that exist in
// the repo's content/ tree become same-site paths, every other link stays absolute.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const REPO = process.env.REPO || '/backups/aclarke-adobe/uom-da/repo';
const CACHE = process.env.ATAR_CACHE || path.join(REPO, 'tools/importer/atar-feed');
const ORIGIN = 'https://study.unimelb.edu.au';
const DATA_URL = `${ORIGIN}/web_services/atar/data-2024/data.json`;
const FILTER_URL = `${ORIGIN}/web_services/atar/data-2024/filter.json`;
const PAGE_URL = `${ORIGIN}/study-with-us/undergraduate-courses/explore-courses-by-atar`;
const OUT = path.join(REPO, 'widgets/atar-course-explorer.data.json');

async function fetchFresh() {
  const require = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json');
  const { chromium } = require('playwright');
  const browser = await chromium.connectOverCDP(process.env.BD_ENDPOINT);
  try {
    const ctx = browser.contexts()[0] || await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);
    const [data, filter] = await page.evaluate(async (urls) => Promise.all(urls.map(async (u) => {
      const r = await fetch(u, { cache: 'no-store' });
      if (!r.ok) throw new Error(`${u}: HTTP ${r.status}`);
      return r.text();
    })), [DATA_URL, FILTER_URL]);
    JSON.parse(data);
    JSON.parse(filter);
    fs.writeFileSync(path.join(CACHE, 'data.json'), data);
    fs.writeFileSync(path.join(CACHE, 'filter.json'), filter);
    await page.close();
  } finally {
    await browser.close();
  }
}

/** Same-site path for a migrated page, else the absolute source URL. */
function resolveLink(url) {
  if (!url) return url;
  const clean = String(url).trim();
  let u;
  try {
    u = new URL(clean, ORIGIN);
  } catch (e) {
    return clean;
  }
  if (u.origin !== ORIGIN) return clean;
  const p = u.pathname.replace(/\/+$/, '');
  const exists = [`${p}.plain.html`, `${p}.html`, `${p}/index.plain.html`].some((f) => fs.existsSync(path.join(REPO, 'content', f)));
  if (!exists) return u.href;
  return `${p}${u.search}${u.hash}`;
}

if (process.argv.includes('--fetch')) await fetchFresh();

const rows = JSON.parse(fs.readFileSync(path.join(CACHE, 'data.json'), 'utf8'));
const areas = JSON.parse(fs.readFileSync(path.join(CACHE, 'filter.json'), 'utf8'));
const stats = { sameSite: new Set(), external: new Set() };

const courses = rows.map((row) => {
  const out = { ...row };
  const score = {};
  Object.entries(row.score || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object' && value.url) {
      const href = resolveLink(value.url);
      (href.startsWith('/') ? stats.sameSite : stats.external).add(href);
      score[key] = { ...value, url: href };
    } else score[key] = value;
  });
  out.score = score;
  ['ugUrl', 'gradUrl'].forEach((k) => {
    if (!out[k]) return;
    out[k] = resolveLink(out[k]);
    (out[k].startsWith('/') ? stats.sameSite : stats.external).add(out[k]);
  });
  // pathway descriptions are never displayed (the source renders pathways as title links)
  if (out.isPathways) delete out.desc;
  Object.keys(out).forEach((k) => { if (typeof out[k] === 'string') out[k] = out[k].trim(); });
  return out;
});

const doc = {
  source: PAGE_URL,
  data: DATA_URL,
  filter: FILTER_URL,
  captured: new Date().toISOString().slice(0, 10),
  areas: areas.map(({ value, label }) => ({ value: String(value).trim(), label: String(label).trim() })),
  courses,
};
fs.writeFileSync(OUT, `${JSON.stringify(doc)}\n`);
console.log(`wrote ${OUT}: ${courses.length} rows, ${doc.areas.length} areas, ${fs.statSync(OUT).size} bytes`);
console.log(`same-site links: ${stats.sameSite.size}, external: ${stats.external.size}`);
