/* eslint-disable */
/* global WebImporter */

/**
 * Shared import runtime for the section-landing family (import-section-landing.js,
 * import-story-article.js). Each import script embeds its own PAGE_TEMPLATE (generated from
 * page-templates.json by build-import-section-landing.mjs) and exports
 * createLandingImport(PAGE_TEMPLATE).
 *
 * Transformers, in order (both hooks): unimelb-landing-cleanup -> unimelb-landing-audience ->
 * unimelb-landing-fragments -> unimelb-landing-sections.
 *
 * Fragment routing (handshake in transformers/unimelb-landing-fragments.js):
 *   "<sourcePage>#excat-fragment=<slug>" imports the shared band <slug> as its own document:
 *   payload.excatFragment = <slug>; after afterTransform, document.excatFragmentMode.found decides:
 *     false -> return [] (nothing is written; reported as fragment-missing in the console);
 *     true  -> return main at document.excatFragmentMode.path, with no page metadata.
 *   A normal page URL is PAGE mode: matching bands become links to their fragment path.
 *
 * preprocess (before the importer's own preProcess, which turns data: images into blob: URLs and
 * strips comments with a regex):
 *   - comment nodes are removed from the DOM (the regex can delete real content);
 *   - pictogram SVGs in the holders (.section-alt__inner-svg-icon, .card--focus-box__icon,
 *     .card__icons__left) are identified by djb2 of their SVG text (tools/importer/pictogram-map.json,
 *     built by tools/importer/build-pictograms.mjs) and tagged data-excat-icon="<name>"; the
 *     parsers emit ":uom-<name>:".
 *
 * Page metadata: WebImporter.Blocks.getMetadata (title, description, image, as the importer's
 * createMetadata rule) plus document.excatPageMetadata (template.pageMetadata, read by the cleanup
 * transformer before chrome removal, e.g. story Tags) as extra rows; story-article pages (not their
 * fragments) also get "Template: story-article".
 *
 * Interactive tools: the on-demand video library (div.filter-category) is the Video library block
 * (parsers/video-library.js, data from template#excat-video-data, clean-up rules in
 * on-demand-cleanup.json, handed to every parser as options.onDemandCleanup); the widgets of
 * template.widgets become /widgets/<name>.html links (cleanup transformer).
 */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import heroSplitParser from './parsers/hero-split.js';
import heroSplitLightParser from './parsers/hero-split-light.js';
import heroAsideParser from './parsers/hero-aside.js';
import audienceSwitcherParser from './parsers/audience-switcher.js';
import keyFactsParser from './parsers/key-facts.js';
import noticeParser from './parsers/notice.js';
import columnsOverlapParser from './parsers/columns-overlap.js';
import columnsParser from './parsers/columns.js';
import columnsSplitParser from './parsers/columns-split.js';
import cardsPeopleParser from './parsers/cards-people.js';
import cardsTileParser from './parsers/cards-tile.js';
import cardsIconParser from './parsers/cards-icon.js';
import cardsParser from './parsers/cards.js';
import cardsStatParser from './parsers/cards-stat.js';
import cardsChipsParser from './parsers/cards-chips.js';
import cardsLinkListParser from './parsers/cards-link-list.js';
import videoParser from './parsers/video.js';
import videoShortsParser from './parsers/video-shorts.js';
import videoSplitParser from './parsers/video-split.js';
import videoLibraryParser from './parsers/video-library.js';
import quoteParser from './parsers/quote.js';
import accordionParser from './parsers/accordion.js';
import calloutPhotoParser from './parsers/callout-photo.js';
import searchParser from './parsers/search.js';
import tableParser from './parsers/table.js';
import timelineParser from './parsers/timeline.js';
import tabsParser from './parsers/tabs.js';

// TRANSFORMER IMPORTS
import landingCleanupTransformer from './transformers/unimelb-landing-cleanup.js';
import landingAudienceTransformer from './transformers/unimelb-landing-audience.js';
import landingFragmentsTransformer from './transformers/unimelb-landing-fragments.js';
import landingSectionsTransformer from './transformers/unimelb-landing-sections.js';

// Content images that cannot be loaded on the source (tools/importer/check-images.mjs).
import unloadableImages from './unloadable-images.js';
// Pictogram SVG hash -> icon name (tools/importer/build-pictograms.mjs).
import pictogramMap from './pictogram-map.js';
// On-demand video library clean-up rules (parsers/video-library.js).
import onDemandCleanup from './on-demand-cleanup.json';

// PARSER REGISTRY (a template only uses the names in its blocks[])
const parsers = {
  'hero-split': heroSplitParser,
  'hero': heroParser,
  'hero-split-light': heroSplitLightParser,
  'hero-aside': heroAsideParser,
  'audience-switcher': audienceSwitcherParser,
  'key-facts': keyFactsParser,
  'notice': noticeParser,
  'columns-overlap': columnsOverlapParser,
  // ct-textcolumnlayout without a banner: the same parser emits Columns (text-column)
  'columns-text-column': columnsOverlapParser,
  'columns': columnsParser,
  'columns-split': columnsSplitParser,
  'cards-people': cardsPeopleParser,
  'cards-tile': cardsTileParser,
  'cards-icon': cardsIconParser,
  'cards': cardsParser,
  'cards-stat': cardsStatParser,
  'cards-chips': cardsChipsParser,
  'cards-link-list': cardsLinkListParser,
  'video': videoParser,
  'video-shorts': videoShortsParser,
  'video-split': videoSplitParser,
  'video-library': videoLibraryParser,
  'quote': quoteParser,
  'accordion': accordionParser,
  'callout-photo': calloutPhotoParser,
  'search': searchParser,
  'table': tableParser,
  'timeline': timelineParser,
  'tabs': tabsParser,
};

// TRANSFORMER REGISTRY - order matters (see the header)
const transformers = [
  landingCleanupTransformer,
  landingAudienceTransformer,
  landingFragmentsTransformer,
  landingSectionsTransformer,
];

const PICTOGRAM_HOLDERS = '.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left';

// Templates whose pages get a page Metadata row "Template: <name>" (not section-landing).
const TEMPLATE_METADATA = new Set(['story-article']);

function executeTransformers(hookName, element, payload, template) {
  const enhancedPayload = { ...payload, template, unloadableImages };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/** All block instances, in document order (a nested match is skipped by the parse loop). */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  pageBlocks.sort((a, b) => {
    if (a.element === b.element) return 0;
    return a.element.compareDocumentPosition(b.element) & 4 ? -1 : 1;
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

/** Remove every comment node under root (including inside <template> content). */
function removeCommentNodes(root, doc) {
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());
  root.querySelectorAll('template').forEach((t) => { if (t.content) removeCommentNodes(t.content, doc); });
}

function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Decode a data:image/svg+xml URI to its SVG text (base64 or URL-encoded), or ''. */
function svgFromDataUri(src) {
  try {
    const b64 = /^data:image\/svg\+xml;base64,(.*)$/i.exec(src);
    if (b64) {
      const bin = atob(b64[1]);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    }
    const raw = /^data:image\/svg\+xml(?:;charset=[^,]*)?,(.*)$/i.exec(src);
    return raw ? decodeURIComponent(raw[1]) : '';
  } catch (e) {
    return '';
  }
}

/**
 * Events cards (ct-eventslisting li.event) carry their photo as an inline background on an empty
 * a.card__thumb, which the importer's own cleanup deletes before any parser runs. Copy it to the
 * card's data-excat-bg so parsers/cards.js can emit it.
 */
function tagCardThumbBackgrounds(document) {
  document.querySelectorAll('#main .card a.card__thumb[style*="background-image"]').forEach((a) => {
    const m = (a.getAttribute('style') || '').match(/url\(\s*["']?\s*([^"')]+?)\s*["']?\s*\)/);
    const card = a.closest('.card');
    if (m && !/^(none|data:|blob:)/i.test(m[1]) && card && !card.hasAttribute('data-excat-bg')) {
      card.setAttribute('data-excat-bg', m[1]);
    }
  });
}

/** Tag pictogram images with data-excat-icon (in the page and in <template> parts). */
function tagPictograms(root) {
  root.querySelectorAll(`:is(${PICTOGRAM_HOLDERS}) img[src^="data:image/svg+xml"]`).forEach((img) => {
    const svg = svgFromDataUri(img.getAttribute('src') || '');
    if (!svg) return;
    const key = djb2(svg.replace(/\s+/g, ' ').replace(/> </g, '><').trim());
    const name = pictogramMap[key];
    if (name) img.setAttribute('data-excat-icon', name);
    else console.warn(`[import] pictogram not in pictogram-map.json: ${key}`);
  });
  // decorative inline SVGs (arrows, chevrons, ticks) outside the pictogram holders: the cleanup
  // chrome rule keys on data:image/svg+xml, but html2md's preProcess turns data: into blob: before
  // any transformer runs, so they are removed here
  root.querySelectorAll(`img[src^="data:image/svg+xml"]:not(:is(${PICTOGRAM_HOLDERS}) img)`).forEach((img) => img.remove());
  root.querySelectorAll('template').forEach((t) => { if (t.content) tagPictograms(t.content); });
}

/**
 * Pictograms left in default content (e.g. ct-textcolumnlayout card-flat lists) become the icon
 * paragraph `:uom-<name>:`; any other inline (blob:/data:) image cannot be imported and is dropped.
 */
function finishInlineImages(main, document) {
  main.querySelectorAll('img[data-excat-icon]').forEach((img) => {
    const p = document.createElement('p');
    p.textContent = `:uom-${img.getAttribute('data-excat-icon')}:`;
    const holder = img.closest(PICTOGRAM_HOLDERS) || img;
    holder.replaceWith(p);
  });
  main.querySelectorAll('img[src^="blob:"], img[src^="data:"]').forEach((img) => {
    console.warn('[import] inline image dropped (no URL to import)');
    const holder = img.closest(PICTOGRAM_HOLDERS);
    (holder || img).remove();
  });
}

/** Fragment slug from "#excat-fragment=<slug>", or null. */
function fragmentSlugOf(url) {
  const m = /#excat-fragment=([a-z0-9-]+)$/i.exec(url || '');
  return m ? m[1] : null;
}

/** The importer object ({ preprocess, transform }) for one embedded template. */
export function createLandingImport(PAGE_TEMPLATE) {
  return {
    preprocess: ({ document }) => {
      removeCommentNodes(document.documentElement, document);
      tagPictograms(document.documentElement);
      tagCardThumbBackgrounds(document);
    },

    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      const slug = fragmentSlugOf(params.originalURL) || fragmentSlugOf(url);
      const tPayload = slug ? { ...payload, excatFragment: slug } : payload;

      // 1. beforeTransform (cleanup, audience split, fragments, section breaks)
      executeTransformers('beforeTransform', main, tPayload, PAGE_TEMPLATE);

      // 2. Find blocks, 3. parse them in document order (an element replaced by an earlier parser,
      //    or nested in one, is skipped)
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      const trace = (typeof window !== 'undefined' && window.__excatTrace) || null;
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode || !block.element.isConnected) return;
        const parser = parsers[block.name];
        if (!parser) {
          console.warn(`No parser found for block: ${block.name}`);
          return;
        }
        let start = null;
        let end = null;
        let srcHtml = '';
        if (trace) {
          srcHtml = block.element.outerHTML;
          start = document.createComment('excat-trace');
          end = document.createComment('excat-trace');
          block.element.before(start);
          block.element.after(end);
        }
        try {
          parser(block.element, {
            document, url, params, template: PAGE_TEMPLATE.name, onDemandCleanup,
          });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
        if (trace) {
          let out = '';
          for (let n = start.nextSibling; n && n !== end; n = n.nextSibling) out += n.outerHTML || n.textContent || '';
          trace.push({ name: block.name, selector: block.selector, src: srcHtml, out });
          start.remove();
          end.remove();
        }
      });

      // 4. afterTransform (widgets, leftovers, section metadata)
      finishInlineImages(main, document);
      executeTransformers('afterTransform', main, tPayload, PAGE_TEMPLATE);

      // 5. Fragment mode: the band only, at its fragment path, no page metadata
      const mode = document.excatFragmentMode;
      if (slug) {
        if (!mode || !mode.found) {
          console.warn(`[import] fragment-missing: ${slug} on ${params.originalURL}`);
          return [];
        }
        WebImporter.rules.transformBackgroundImages(main, document);
        WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
        return [{
          element: main,
          path: WebImporter.FileUtils.sanitizePath(mode.path),
          report: { title: `fragment ${slug}`, template: PAGE_TEMPLATE.name, fragment: slug, sourcePage: mode.sourcePage || params.originalURL },
        }];
      }

      // 6. Page mode: page Metadata (the importer's createMetadata rule + template.pageMetadata rows)
      const hr = document.createElement('hr');
      main.appendChild(hr);
      const meta = { ...WebImporter.Blocks.getMetadata(document), ...(document.excatPageMetadata || {}) };
      // story pages name their template (aem.js decorateTemplateAndTheme -> body.story-article);
      // fragments (returned above) and section-landing pages get no Template row
      if (TEMPLATE_METADATA.has(PAGE_TEMPLATE.name)) meta.Template = PAGE_TEMPLATE.name;
      if (Object.keys(meta).length > 0) main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
      const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name),
          fragments: (document.excatFragments || []).map((f) => f.slug).join(' '),
          droppedImages: (document.excatDroppedImages || []).join(' '),
          tags: (document.excatPageMetadata && document.excatPageMetadata.Tags) || '',
        },
      }];
    },
  };
}
