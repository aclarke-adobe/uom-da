#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Scan saved Bright Data snapshots for capture gaps, so they can be re-captured with
 * capture-course-snapshots.mjs:
 *   - switcherWithoutInternational: page has the audience switcher but no
 *     <template id="excat-international">
 *   - structureWithoutOptions: /structure page whose sample-plan / subject-program dropdown
 *     has more than one option but no <template id="excat-options">
 *   - viewsWithoutOrganisations: Individuals/Organisations (b2c/b2b) switcher but no
 *     <template id="excat-organisations">
 *   - videosWithoutSrc: click-to-play players (button.video__btn) not all carrying
 *     data-excat-video-src
 *   - fullWidthImagesWithoutBg: div.full-width-image elements without data-excat-bg
 *   - missingSnapshots (only with --urls): listed URLs that have no snapshot file yet
 *
 * Usage:
 *   node tools/importer/scan-snapshot-gaps.mjs [--urls FILE] [--dir tools/importer/bd-snapshots]
 *     [--out tools/importer/reports/snapshot-gaps.json]
 *
 *   --urls FILE  scan only the snapshots of these URLs (one per line, e.g.
 *                tools/importer/urls-section-landing.txt) instead of every file under --dir
 *
 * Besides the JSON, writes one-URL-per-line lists next to it — <out>-international.txt,
 * -options.txt, -views.txt, -videos.txt, -backgrounds.txt, -all.txt (union of all gaps) and,
 * with --urls, -missing.txt — that can be passed straight to
 *   capture-course-snapshots.mjs --urls <list> --force
 */

import {
  readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'fs';
import {
  dirname, join, relative, resolve, sep,
} from 'path';
import { fileURLToPath } from 'url';
import {
  snapshotSelectRegions, hasAudienceSwitcher, hasB2bSwitcher, hasTemplate, isStructureUrl,
  videoPlayerStats, fullWidthImageStats,
} from './snapshot-inspect.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMPORT_SCRIPTS = join(
  process.env.EXCAT_PLUGIN_DIR || '/home/node/.excat-marketplaces/excat-marketplace',
  'excat/skills/excat-content-import/scripts',
);

function usage() {
  console.error('Usage: node tools/importer/scan-snapshot-gaps.mjs [--urls FILE] [--dir DIR] [--out FILE]');
  process.exit(1);
}

function parseArgs(argv) {
  const opts = {
    dir: join(__dirname, 'bd-snapshots'),
    out: join(__dirname, 'reports', 'snapshot-gaps.json'),
    urls: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const v = argv[i + 1];
    if (['--dir', '--out', '--urls'].includes(argv[i]) && (!v || v.startsWith('--'))) usage();
    if (argv[i] === '--dir') opts.dir = resolve(argv[(i += 1)]);
    else if (argv[i] === '--out') opts.out = resolve(argv[(i += 1)]);
    else if (argv[i] === '--urls') opts.urls = resolve(argv[(i += 1)]);
    else usage();
  }
  if (opts.urls && !existsSync(opts.urls)) {
    console.error(`URL file not found: ${opts.urls}`);
    process.exit(1);
  }
  return opts;
}

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.endsWith('.html')) yield p; // ignores in-flight *.html.tmp
  }
}

/** Inverse of resolveSavedHtmlPath: <dir>/<host>/<doc-path>.html -> https://<host>/<doc-path> */
function urlForSnapshot(dir, file) {
  const [host, ...rest] = relative(dir, file).split(sep);
  const docPath = rest.join('/').replace(/\.html$/, '');
  return `https://${host}${docPath === 'index' ? '' : `/${docPath}`}`;
}

async function targets(opts) {
  if (!opts.urls) return [...walk(opts.dir)].map((file) => ({ url: urlForSnapshot(opts.dir, file), file }));
  // Same path rule as the importer / capture tool.
  const { resolveSavedHtmlPath } = await import(join(IMPORT_SCRIPTS, 'run-bulk-import.js'));
  const seen = new Set();
  return readFileSync(opts.urls, 'utf-8').split(/\r?\n/).map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !seen.has(l) && seen.add(l))
    .map((url) => ({ url, file: resolveSavedHtmlPath(url, opts.dir) }));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const started = Date.now();
  const gaps = {
    switcherWithoutInternational: [],
    structureWithoutOptions: [],
    viewsWithoutOrganisations: [],
    videosWithoutSrc: [],
    fullWidthImagesWithoutBg: [],
  };
  const missingSnapshots = [];
  const counts = {
    scanned: 0,
    unreadable: 0,
    withSwitcher: 0,
    withInternationalTemplate: 0,
    structurePages: 0,
    structureWithMultiOptionSelects: 0,
    structureWithOptionsTemplate: 0,
    withB2bSwitcher: 0,
    withOrganisationsTemplate: 0,
    withClickToPlayVideos: 0,
    videoPlayers: 0,
    videoPlayersResolved: 0,
    withFullWidthImages: 0,
    fullWidthImages: 0,
    fullWidthImagesMarked: 0,
  };

  for (const { url, file } of await targets(opts)) {
    if (!existsSync(file)) {
      missingSnapshots.push({ url, file: relative(process.cwd(), file) });
      continue;
    }
    counts.scanned += 1;
    let html;
    try {
      html = readFileSync(file, 'utf-8');
    } catch {
      counts.unreadable += 1;
      continue;
    }
    const rel = relative(process.cwd(), file);

    if (hasAudienceSwitcher(html)) {
      counts.withSwitcher += 1;
      if (hasTemplate(html, 'excat-international')) counts.withInternationalTemplate += 1;
      else gaps.switcherWithoutInternational.push({ url, file: rel });
    }

    if (isStructureUrl(url)) {
      counts.structurePages += 1;
      const multi = Object.fromEntries(Object.entries(snapshotSelectRegions(html)).filter(([, n]) => n > 1));
      const hasOpts = hasTemplate(html, 'excat-options');
      if (hasOpts) counts.structureWithOptionsTemplate += 1;
      if (Object.keys(multi).length) {
        counts.structureWithMultiOptionSelects += 1;
        if (!hasOpts) gaps.structureWithoutOptions.push({ url, file: rel, selects: multi });
      }
    }

    if (hasB2bSwitcher(html)) {
      counts.withB2bSwitcher += 1;
      if (hasTemplate(html, 'excat-organisations')) counts.withOrganisationsTemplate += 1;
      else gaps.viewsWithoutOrganisations.push({ url, file: rel });
    }

    const v = videoPlayerStats(html);
    if (v.buttons) {
      counts.withClickToPlayVideos += 1;
      counts.videoPlayers += v.buttons;
      counts.videoPlayersResolved += Math.min(v.resolved, v.buttons);
      if (v.resolved < v.buttons) gaps.videosWithoutSrc.push({ url, file: rel, players: v.buttons, resolved: v.resolved });
    }

    const fw = fullWidthImageStats(html);
    if (fw.total) {
      counts.withFullWidthImages += 1;
      counts.fullWidthImages += fw.total;
      counts.fullWidthImagesMarked += fw.marked;
      if (fw.marked < fw.total) gaps.fullWidthImagesWithoutBg.push({ url, file: rel, total: fw.total, marked: fw.marked });
    }
  }

  const byUrl = (a, b) => a.url.localeCompare(b.url);
  [...Object.values(gaps), missingSnapshots].forEach((l) => l.sort(byUrl));
  const allGaps = [...new Set(Object.values(gaps).flat().map((x) => x.url))].sort();
  const report = {
    generatedAt: new Date().toISOString(),
    dir: opts.dir,
    urls: opts.urls,
    counts: {
      ...counts,
      ...Object.fromEntries(Object.entries(gaps).map(([k, l]) => [k, l.length])),
      anyGap: allGaps.length,
      ...(opts.urls ? { listed: counts.scanned + missingSnapshots.length, missingSnapshots: missingSnapshots.length } : {}),
    },
    ...gaps,
    ...(opts.urls ? { missingSnapshots } : {}),
  };
  mkdirSync(dirname(opts.out), { recursive: true });
  writeFileSync(opts.out, JSON.stringify(report, null, 2), 'utf-8');

  const base = opts.out.replace(/\.json$/, '');
  const lists = {
    international: gaps.switcherWithoutInternational,
    options: gaps.structureWithoutOptions,
    views: gaps.viewsWithoutOrganisations,
    videos: gaps.videosWithoutSrc,
    backgrounds: gaps.fullWidthImagesWithoutBg,
    all: allGaps.map((url) => ({ url })),
    ...(opts.urls ? { missing: missingSnapshots } : {}),
  };
  for (const [k, l] of Object.entries(lists)) writeFileSync(`${base}-${k}.txt`, l.map((x) => `${x.url}\n`).join(''), 'utf-8');

  const r = (p) => relative(process.cwd(), p);
  const c = counts;
  console.log(`[scan] ${c.scanned} snapshot(s)${opts.urls ? ` of ${c.scanned + missingSnapshots.length} listed` : ''} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`[scan] audience switcher without template#excat-international: ${gaps.switcherWithoutInternational.length} (of ${c.withSwitcher})`);
  console.log(`[scan] structure with multi-option selects without template#excat-options: ${gaps.structureWithoutOptions.length}`
    + ` (of ${c.structureWithMultiOptionSelects}; ${c.structurePages} structure pages)`);
  console.log(`[scan] individuals/organisations switcher without template#excat-organisations: ${gaps.viewsWithoutOrganisations.length} (of ${c.withB2bSwitcher})`);
  console.log(`[scan] click-to-play videos without data-excat-video-src: ${gaps.videosWithoutSrc.length} page(s)`
    + ` (${c.videoPlayersResolved}/${c.videoPlayers} players resolved on ${c.withClickToPlayVideos} pages)`);
  console.log(`[scan] div.full-width-image without data-excat-bg: ${gaps.fullWidthImagesWithoutBg.length} page(s)`
    + ` (${c.fullWidthImagesMarked}/${c.fullWidthImages} marked on ${c.withFullWidthImages} pages)`);
  if (opts.urls) console.log(`[scan] listed URLs without a snapshot: ${missingSnapshots.length}`);
  console.log(`[scan] pages with any gap: ${allGaps.length} -> ${r(`${base}-all.txt`)} (per-gap lists: ${r(base)}-<kind>.txt)`);
  console.log(`[scan] report: ${r(opts.out)}`);
}

main();
