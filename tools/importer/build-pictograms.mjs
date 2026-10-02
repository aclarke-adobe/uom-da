#!/usr/bin/env node
/**
 * build-pictograms.mjs: turn the section-landing pictograms (data-URI SVG <img> in the holders
 * .section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left) into EDS icons.
 *
 * - Collects every distinct SVG across the section-landing snapshots
 *   (tools/importer/urls-section-landing.txt -> bd-snapshots/study.unimelb.edu.au/<path>.html).
 * - Key = djb2-xor hash of the SVG text with whitespace collapsed (same function the import script's
 *   preprocess uses in the browser: h = 5381; h = ((h * 33) ^ c) >>> 0; base 36).
 * - Writes icons/uom-<name>.svg (fill currentColor -> explicit navy #000f46, because an <img> icon
 *   cannot inherit currentColor and would render black), each < 40KB.
 * - Reuses existing icons whose path data matches (uom-access-melbourne, …): no new file.
 * - Writes tools/importer/pictogram-map.json { "<hash>": "<name>" } (+ pictogram-map.js, the same map
 *   as an ES module the import script bundles).
 *
 * Usage: node tools/importer/build-pictograms.mjs [--check]
 */
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = join(__dirname, '..', '..');
const { chromium } = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/package.json')('playwright');
const HOLDERS = '.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left';
const NAVY = '#000f46';

// Descriptive names by content (reviewed on a rendered contact sheet). Keys are djb2 hashes.
// Filled in from NAMES_BY_SHA below on first run; the djb2 key is what the importer uses.
const NAMES_BY_SHA = {
  '292a5e6bca12': 'community-group',
  bd690c07e354: 'access-melbourne', // existing icons/uom-access-melbourne.svg
  '142165d1aa1c': 'employment',
  '1f99a5743d12': 'verified-badge',
  '3b70be7f7a0f': 'presentation',
  '55c6a0281799': 'graduation-milestone',
  c3bccf79dc4e: 'health-cross',
  ad3aaa842298: 'handshake',
  '43f55783d157': 'online-learning',
  '6ff48398d19f': 'network',
  '97771ca4defa': 'award-ribbon',
  '7d73ffb17c42': 'lightbulb',
  '672f45209da4': 'australia-map',
  '36aacec57c03': 'accommodation',
  '312c368120b5': 'people-group',
  b790c6cafa3a: 'globe',
  abb367aec650: 'briefcase',
  e44842d7e67d: 'financial-support',
  '169826fd95bf': 'university-building',
  d1e516a1b5dd: 'city-skyline',
  '638ec310c017': 'level-up',
  '48dcccc5b7d4': 'indigenous-meeting-place',
  '404c0f0590e5': 'online-graduate',
  '505ba107c46c': 'parkland',
  '16a3b6bcde8f': 'globe-grid',
  '4819373b8b02': 'coaching',
  '1a6d8aca5391': 'chat',
  '67f1b56f04de': 'global-connections',
  c43c8539f8dd: 'graduate-degree-packages', // existing
  de9ac9f0911e: 'teamwork',
  f01404a49340: 'number-one',
  '59d73ff1faba': 'equivalence-cycle',
  '30342329c30b': 'video-player',
  '41241dee7820': 'mobile-phone',
  '6d846da00a67': 'devices',
  dd3f921778ec: 'celebration',
  '332f63d2d18d': 'timetable',
  '32cb33d4f3d2': 'indigenous-gathering',
  '49c12049b651': 'undergraduate-entry-pathways', // existing
  '90881a9eb77c': 'flight',
  '01ca641f18da': 'airport-transfer',
};

const crypto = await import('crypto');
const normSvg = (svg) => svg.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
export function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const pathsOf = (svg) => (svg.match(/\sd="[^"]+"/g) || []).join('|');

// existing icons that pictograms may reuse (not the files this script writes itself)
const GENERATED = new Set(Object.values(NAMES_BY_SHA).map((n) => `uom-${n}`));
const REUSED = new Set(['uom-access-melbourne', 'uom-graduate-degree-packages', 'uom-undergraduate-entry-pathways']);
const existing = {};
for (const f of fs.readdirSync(join(R, 'icons'))) {
  const name = f.replace(/\.svg$/, '');
  if (GENERATED.has(name) && !REUSED.has(name)) continue;
  existing[pathsOf(fs.readFileSync(join(R, 'icons', f), 'utf8'))] = name;
}

const urls = fs.readFileSync(join(R, 'tools/importer/urls-section-landing.txt'), 'utf8').split('\n').filter(Boolean);
const browser = await chromium.launch();
const page = await browser.newPage({ javaScriptEnabled: false });
const svgs = new Map(); // djb2 -> { svg, sha, count }
for (const url of urls) {
  const p = new URL(url).pathname.replace(/\/$/, '');
  const file = join(R, 'tools/importer/bd-snapshots/study.unimelb.edu.au', `${p}.html`);
  if (!fs.existsSync(file)) continue;
  await page.setContent(fs.readFileSync(file, 'utf8'));
  const srcs = await page.evaluate((h) => [...document.querySelectorAll(`:is(${h}) img[src^="data:image/svg+xml"]`)].map((i) => i.getAttribute('src')), HOLDERS);
  srcs.forEach((src) => {
    const b64 = src.match(/^data:image\/svg\+xml;base64,(.*)$/);
    const raw = src.match(/^data:image\/svg\+xml(?:;charset=[^,]*)?,(.*)$/);
    const svg = b64 ? Buffer.from(b64[1], 'base64').toString('utf8') : (raw ? decodeURIComponent(raw[1]) : null);
    if (!svg) return;
    const n = normSvg(svg);
    const key = djb2(n);
    const e = svgs.get(key) || { svg, sha: sha(n), count: 0 };
    e.count += 1;
    svgs.set(key, e);
  });
}
await browser.close();

const map = {};
const problems = [];
let written = 0;
for (const [key, e] of svgs) {
  const name = NAMES_BY_SHA[e.sha];
  if (!name) { problems.push(`unnamed pictogram ${e.sha} (${key}), ${e.count} uses`); continue; }
  map[key] = name;
  const reuse = existing[pathsOf(e.svg)];
  if (reuse) { if (reuse !== `uom-${name}`) problems.push(`${e.sha} matches ${reuse}, named ${name}`); continue; }
  let svg = e.svg.replace(/\s(?:aria-hidden|class|role|focusable)="[^"]*"/g, '');
  // also the source typo "currnentColor" (renders black)
  svg = svg.replace(/fill="curr\w*color"/gi, `fill="${NAVY}"`).replace(/stroke="curr\w*color"/gi, `stroke="${NAVY}"`);
  if (!/^<svg[^>]*\sfill=/.test(svg)) svg = svg.replace(/^<svg/, `<svg fill="${NAVY}"`);
  if (Buffer.byteLength(svg) >= 40 * 1024) problems.push(`${name} is ${Buffer.byteLength(svg)} bytes (>= 40KB)`);
  if (!process.argv.includes('--check')) fs.writeFileSync(join(R, 'icons', `uom-${name}.svg`), `${svg.trim()}\n`);
  written += 1;
}
const sorted = Object.fromEntries(Object.entries(map).sort((a, b) => a[1].localeCompare(b[1])));
if (!process.argv.includes('--check')) {
  fs.writeFileSync(join(__dirname, 'pictogram-map.json'), `${JSON.stringify(sorted, null, 2)}\n`);
  fs.writeFileSync(join(__dirname, 'pictogram-map.js'), `/* eslint-disable */\n// Generated by tools/importer/build-pictograms.mjs. djb2(svg) -> icon name (icons/uom-<name>.svg).\nexport default ${JSON.stringify(sorted, null, 2)};\n`);
}
console.log(`distinct ${svgs.size}, mapped ${Object.keys(map).length}, new icon files ${written}`);
problems.forEach((p) => console.log(`PROBLEM ${p}`));
