#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Scan saved Bright Data snapshots for capture gaps, so they can be re-captured with
 * capture-course-snapshots.mjs once a bulk run has finished:
 *   - switcherWithoutInternational: page has the audience switcher but no
 *     <template id="excat-international">
 *   - structureWithoutOptions: /structure page whose sample-plan / subject-program dropdown
 *     has more than one option but no <template id="excat-options">
 *
 * Usage:
 *   node tools/importer/scan-snapshot-gaps.mjs [--dir tools/importer/bd-snapshots]
 *     [--out tools/importer/reports/snapshot-gaps.json]
 *
 * Besides the JSON, writes one-URL-per-line lists next to it (snapshot-gaps-international.txt,
 * snapshot-gaps-options.txt) that can be passed straight to
 *   capture-course-snapshots.mjs --urls <list> --force
 */

import {
  readdirSync, readFileSync, writeFileSync, mkdirSync,
} from 'fs';
import {
  dirname, join, relative, resolve, sep,
} from 'path';
import { fileURLToPath } from 'url';
import {
  snapshotSelectRegions, hasAudienceSwitcher, hasTemplate, isStructureUrl,
} from './snapshot-inspect.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const opts = {
    dir: join(__dirname, 'bd-snapshots'),
    out: join(__dirname, 'reports', 'snapshot-gaps.json'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dir') opts.dir = resolve(argv[(i += 1)]);
    else if (argv[i] === '--out') opts.out = resolve(argv[(i += 1)]);
    else {
      console.error('Usage: node tools/importer/scan-snapshot-gaps.mjs [--dir DIR] [--out FILE]');
      process.exit(1);
    }
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

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const started = Date.now();
  const switcherWithoutInternational = [];
  const structureWithoutOptions = [];
  const counts = {
    scanned: 0,
    withSwitcher: 0,
    withInternationalTemplate: 0,
    structurePages: 0,
    structureWithMultiOptionSelects: 0,
    structureWithOptionsTemplate: 0,
    unreadable: 0,
  };

  for (const file of walk(opts.dir)) {
    counts.scanned += 1;
    let html;
    try {
      html = readFileSync(file, 'utf-8');
    } catch {
      counts.unreadable += 1;
      continue;
    }
    const url = urlForSnapshot(opts.dir, file);
    const rel = relative(process.cwd(), file);
    const switcher = hasAudienceSwitcher(html);
    const intl = hasTemplate(html, 'excat-international');
    if (switcher) counts.withSwitcher += 1;
    if (intl) counts.withInternationalTemplate += 1;
    if (switcher && !intl) switcherWithoutInternational.push({ url, file: rel });

    if (isStructureUrl(url)) {
      counts.structurePages += 1;
      const selects = snapshotSelectRegions(html);
      const multi = Object.fromEntries(Object.entries(selects).filter(([, n]) => n > 1));
      const hasOpts = hasTemplate(html, 'excat-options');
      if (hasOpts) counts.structureWithOptionsTemplate += 1;
      if (Object.keys(multi).length) {
        counts.structureWithMultiOptionSelects += 1;
        if (!hasOpts) structureWithoutOptions.push({ url, file: rel, selects: multi });
      }
    }
  }

  const byUrl = (a, b) => a.url.localeCompare(b.url);
  switcherWithoutInternational.sort(byUrl);
  structureWithoutOptions.sort(byUrl);
  const report = {
    generatedAt: new Date().toISOString(),
    dir: opts.dir,
    counts: {
      ...counts,
      switcherWithoutInternational: switcherWithoutInternational.length,
      structureWithoutOptions: structureWithoutOptions.length,
    },
    switcherWithoutInternational,
    structureWithoutOptions,
  };
  mkdirSync(dirname(opts.out), { recursive: true });
  writeFileSync(opts.out, JSON.stringify(report, null, 2), 'utf-8');
  const base = opts.out.replace(/\.json$/, '');
  const listIntl = `${base}-international.txt`;
  const listOpts = `${base}-options.txt`;
  writeFileSync(listIntl, switcherWithoutInternational.map((x) => `${x.url}\n`).join(''), 'utf-8');
  writeFileSync(listOpts, structureWithoutOptions.map((x) => `${x.url}\n`).join(''), 'utf-8');

  console.log(`[scan] ${counts.scanned} snapshot(s) in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`[scan] switcher without template#excat-international: ${switcherWithoutInternational.length}`
    + ` (of ${counts.withSwitcher} with a switcher) -> ${relative(process.cwd(), listIntl)}`);
  console.log(`[scan] structure with multi-option selects without template#excat-options: ${structureWithoutOptions.length}`
    + ` (of ${counts.structureWithMultiOptionSelects}; ${counts.structurePages} structure pages) -> ${relative(process.cwd(), listOpts)}`);
  console.log(`[scan] report: ${relative(process.cwd(), opts.out)}`);
}

main();
