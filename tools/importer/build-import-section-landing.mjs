#!/usr/bin/env node
/**
 * Regenerate the embedded PAGE_TEMPLATE in the landing-family import scripts from
 * page-templates.json (urls and per-fragment page lists omitted to keep the bundles small):
 *   templates[section-landing] -> import-section-landing.js
 *   templates[story-article]   -> import-story-article.js
 * Usage: node build-import-section-landing.mjs [template-name …]   (default: both)
 * Run after editing the template, then re-bundle with aem-import-bundle.sh.
 */
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/* eslint-disable no-console */
const HERE = dirname(fileURLToPath(import.meta.url));
const TARGETS = {
  'section-landing': 'import-section-landing.js',
  'story-article': 'import-story-article.js',
};
const { templates } = JSON.parse(fs.readFileSync(join(HERE, 'page-templates.json'), 'utf8'));
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TARGETS);

names.forEach((name) => {
  if (!TARGETS[name]) throw new Error(`unknown template ${name}`);
  const file = join(HERE, TARGETS[name]);
  const tpl = templates.find((t) => t.name === name);
  if (!tpl) throw new Error(`templates[${name}] not found`);
  const { urls, ...rest } = tpl;
  if (rest.fragmentContract && rest.fragmentContract.fragments) {
    rest.fragmentContract = {
      ...rest.fragmentContract,
      fragments: rest.fragmentContract.fragments.map(({ pages, ...f }) => f),
    };
  }
  const json = JSON.stringify(rest, null, 2);
  let src = fs.readFileSync(file, 'utf8');
  const startMarker = 'const PAGE_TEMPLATE = ';
  const i = src.indexOf(startMarker);
  if (i < 0) throw new Error(`PAGE_TEMPLATE not found in ${TARGETS[name]}`);
  const j = src.indexOf('\n};\n', i);
  const end = src.indexOf('__PAGE_TEMPLATE__', i) === i + startMarker.length ? i + startMarker.length + '__PAGE_TEMPLATE__;'.length : j + 3;
  src = `${src.slice(0, i)}${startMarker}${json};${src.slice(end)}`;
  fs.writeFileSync(file, src);
  console.log(`embedded ${name} template in ${TARGETS[name]} (${json.length} chars)`);
});
