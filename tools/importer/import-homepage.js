/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroSplitParser from './parsers/hero-split.js';
import searchParser from './parsers/search.js';
import cardsTileParser from './parsers/cards-tile.js';
import cardsCourseLinkParser from './parsers/cards-course-link.js';
import columnsSplitParser from './parsers/columns-split.js';
import cardsParser from './parsers/cards.js';
import cardsIconParser from './parsers/cards-icon.js';
import quoteParser from './parsers/quote.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/unimelb-cleanup.js';
import sectionsTransformer from './transformers/unimelb-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-split': heroSplitParser,
  'search': searchParser,
  'cards-tile': cardsTileParser,
  'cards-course-link': cardsCourseLinkParser,
  'columns-split': columnsSplitParser,
  'cards': cardsParser,
  'cards-icon': cardsIconParser,
  'quote': quoteParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "homepage",
  "description": "Site homepage with search hero, tabbed course finder, feature sections and testimonial quote",
  "urls": [
    "https://study.unimelb.edu.au",
    "https://study.unimelb.edu.au/home"
  ],
  "blocks": [
    {
      "name": "hero-split",
      "instances": [
        "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner .page-header-study",
        "span.optimizely_experiment__block:first-of-type > section.ct-searchbanner .card-article-large"
      ]
    },
    {
      "name": "search",
      "instances": [
        "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner form.inline-search"
      ]
    },
    {
      "name": "cards-tile",
      "instances": [
        "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner .pathfinder-today",
        "span.optimizely_experiment__block:first-of-type > section.ct-searchbanner .article-card-list",
        "span.optimizely_experiment__block:first-of-type > .pathfinder-today"
      ]
    },
    {
      "name": "cards-course-link",
      "instances": [
        "span.optimizely_experiment__block:first-of-type > .slimline-quicklinks .uom-link-list__list"
      ]
    },
    {
      "name": "columns-split",
      "instances": [
        "span.optimizely_experiment__block:first-of-type > div.tile-split-section section.split-section"
      ]
    },
    {
      "name": "cards",
      "instances": [
        "span.optimizely_experiment__block:first-of-type > .ct-featurespanel.bg-alt .grid.grid--3col"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        "span.optimizely_experiment__block:first-of-type:has(> .pathfinder-today) .ct-featurespanel .grid.grid--3col"
      ]
    },
    {
      "name": "quote",
      "instances": [
        "span.optimizely_experiment__block:first-of-type > .ct-testimonial .section-alt__right blockquote"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Hero with course search and study-level pathfinder",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner"
      ],
      "style": "navy",
      "blocks": [
        "hero-split",
        "search",
        "cards-tile"
      ],
      "defaultContent": [
        "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner .page-header-study [aria-label=\"Popular searches\"]",
        "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner .page-header-study__content-inner > div.text-small"
      ]
    },
    {
      "id": "section-2",
      "name": "Quick links bar",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > .slimline-quicklinks"
      ],
      "style": "grey",
      "blocks": [
        "cards-course-link"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Intro statement",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > .content-block"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "span.optimizely_experiment__block:first-of-type > .content-block h2",
        "span.optimizely_experiment__block:first-of-type > .content-block p"
      ]
    },
    {
      "id": "section-4",
      "name": "Access Melbourne feature",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > section.ct-searchbanner"
      ],
      "style": "navy",
      "blocks": [
        "hero-split",
        "cards-tile"
      ],
      "defaultContent": []
    },
    {
      "id": "section-5",
      "name": "Split tile - Flexible and focused degrees",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > div.tile-split-section:nth-of-type(1)"
      ],
      "style": "grey",
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "section-6",
      "name": "Split tile - Ranked #1 in graduate employability",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > div.tile-split-section:nth-of-type(2)"
      ],
      "style": null,
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "section-7",
      "name": "Split tile - Get financial support",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > div.tile-split-section:nth-of-type(3)"
      ],
      "style": "grey",
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "section-8",
      "name": "Split tile - Connect with your community",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > div.tile-split-section:nth-of-type(4)"
      ],
      "style": null,
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "section-9",
      "name": "What's happening at Melbourne",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > .ct-featurespanel.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        "span.optimizely_experiment__block:first-of-type > .ct-featurespanel.bg-alt h2",
        "span.optimizely_experiment__block:first-of-type > .ct-featurespanel.bg-alt h2 + p"
      ]
    },
    {
      "id": "section-10",
      "name": "Looking for more information?",
      "selector": [
        "span.optimizely_experiment__block:first-of-type:has(> .pathfinder-today)"
      ],
      "style": "centered",
      "blocks": [
        "cards-icon",
        "cards-tile"
      ],
      "defaultContent": [
        "span.optimizely_experiment__block:first-of-type:has(> .pathfinder-today) .ct-featurespanel h2"
      ]
    },
    {
      "id": "section-11",
      "name": "Meet our students",
      "selector": [
        "span.optimizely_experiment__block:first-of-type > .ct-testimonial"
      ],
      "style": "grey",
      "blocks": [
        "quote"
      ],
      "defaultContent": [
        "span.optimizely_experiment__block:first-of-type > .ct-testimonial .section-alt__left"
      ]
    }
  ]
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document
 * @param {Object} template
 * @returns {Array} block instances in document order
 */
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
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  // Parse in document order so earlier content is handled first
  pageBlocks.sort((a, b) => {
    if (a.element === b.element) return 0;
    return a.element.compareDocumentPosition(b.element) & 4 ? -1 : 1;
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse blocks (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Path (the site root maps to the index document)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
