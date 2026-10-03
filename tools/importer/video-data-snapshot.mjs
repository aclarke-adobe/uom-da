#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Snapshot contract template#excat-video-data (section-landing /study-with-us/on-demand).
 *
 * The on-demand video library is a Vue component whose full video list lives only in the SERVER
 * HTML, as the `:data` attribute of <cards-filter-category :data='[...]'>; the rendered DOM holds
 * the first 12 cards and no video URLs. The snapshot therefore carries the raw array as JSON:
 *
 *   <template id="excat-video-data" data-source="cards-filter-category:data"
 *             data-captured-at="ISO" data-entries="N">[{...}, ...]</template>
 *
 * (text content, `&`, `<`, `>` escaped; the data is unmodified: the clean-up rules are applied by
 * tools/importer/parsers/video-library.js from tools/importer/on-demand-cleanup.json.)
 *
 * Used by capture-course-snapshots.mjs (re-captures write the template automatically), and as a CLI
 * to (re)write the template of an existing snapshot from a saved server HTML response:
 *   node tools/importer/video-data-snapshot.mjs --raw <server.html> --snapshot <snapshot.html> \
 *     [--captured-at ISO]
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    const name = e.toLowerCase();
    return Object.prototype.hasOwnProperty.call(ENTITIES, name) ? ENTITIES[name] : m;
  });
}

/**
 * The `:data` array of the first <cards-filter-category> in a server HTML document, or null.
 * The Matrix source writes JSON with invalid escapes (e.g. "On\-demand"); they are unescaped.
 * @param {string} html
 * @returns {object[]|null}
 */
export function extractVideoData(html) {
  const start = html.search(/<cards-filter-category\b/i);
  if (start < 0) return null;
  const end = html.indexOf('</cards-filter-category>', start);
  const tag = end > start ? html.slice(start, end) : html.slice(start);
  const m = tag.match(/\s:data\s*=\s*(?:'([\s\S]*?)'|"([\s\S]*?)")(?=\s*(?:[:@\w-]+(?:\s*=|\s|>)|\/?>))/);
  if (!m) return null;
  const raw = decodeEntities(m[1] !== undefined ? m[1] : m[2]);
  const json = raw.replace(/\\([^"\\/bfnrtu])/g, '$1');
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : null;
  } catch (e) {
    console.warn(`[video-data] :data is not valid JSON: ${e.message}`);
    return null;
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The template element (string) for the snapshot. */
export function videoDataTemplate(data, capturedAt = new Date().toISOString()) {
  return `<template id="excat-video-data" data-source="cards-filter-category:data" data-captured-at="${esc(capturedAt)}" `
    + `data-entries="${data.length}">${esc(JSON.stringify(data, null, 1))}</template>`;
}

/** Insert (or replace) the template just before </body>. */
export function withVideoData(snapshotHtml, data, capturedAt) {
  const tpl = videoDataTemplate(data, capturedAt);
  const cleaned = snapshotHtml.replace(/<template id="excat-video-data"[\s\S]*?<\/template>/, '');
  const at = cleaned.lastIndexOf('</body>');
  return at >= 0 ? `${cleaned.slice(0, at)}${tpl}${cleaned.slice(at)}` : `${cleaned}${tpl}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const rawFile = opt('--raw');
  const snapFile = opt('--snapshot');
  if (!rawFile || !snapFile) {
    console.error('Usage: node tools/importer/video-data-snapshot.mjs --raw <server.html> --snapshot <snapshot.html> [--captured-at ISO]');
    process.exit(1);
  }
  const data = extractVideoData(readFileSync(rawFile, 'utf8'));
  if (!data) {
    console.error(`[video-data] no <cards-filter-category :data> in ${rawFile}`);
    process.exit(1);
  }
  writeFileSync(snapFile, withVideoData(readFileSync(snapFile, 'utf8'), data, opt('--captured-at')));
  console.log(`[video-data] ${data.length} entries -> ${snapFile}`);
}
