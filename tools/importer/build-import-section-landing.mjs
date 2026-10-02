#!/usr/bin/env node
/**
 * Regenerate the embedded PAGE_TEMPLATE in tools/importer/import-section-landing.js from
 * templates[section-landing] in page-templates.json (urls and per-fragment page lists omitted to
 * keep the bundle small). Run after editing the template, then re-bundle with aem-import-bundle.sh.
 */
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'import-section-landing.js');
const tpl = JSON.parse(fs.readFileSync(join(__dirname, 'page-templates.json'), 'utf8')).templates.find((t) => t.name === 'section-landing');
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
const j = src.indexOf('\n};\n', i);
if (i < 0) throw new Error('PAGE_TEMPLATE not found');
const end = src.indexOf('__PAGE_TEMPLATE__', i) === i + startMarker.length ? i + startMarker.length + '__PAGE_TEMPLATE__;'.length : j + 3;
src = `${src.slice(0, i)}${startMarker}${json};${src.slice(end)}`;
fs.writeFileSync(file, src);
console.log(`embedded section-landing template (${json.length} chars)`);
