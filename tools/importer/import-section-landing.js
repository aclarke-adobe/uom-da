/* eslint-disable */
/* global WebImporter */

/**
 * Import script: study.unimelb.edu.au section-landing template (258 pages: short courses,
 * micro-credentials, graduate study areas, professional development, international, student life …).
 *
 * Spec: migration-work/section-landing/mapping-notes.md and templates[section-landing] in
 * tools/importer/page-templates.json (embedded below by build-import-section-landing.mjs, without
 * the 258 urls and the per-fragment page lists).
 *
 * The runtime (parsers, transformers, fragment routing, page metadata) is shared with the other
 * landing-family importers: tools/importer/landing-import.js.
 */
import { createLandingImport } from './landing-import.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (urls and fragment page lists omitted)
const PAGE_TEMPLATE = {
  "name": "section-landing",
  "description": "Long landing page with image hero, intro text with media, feature card grids, data table, promo banners, blog teaser cards and closing CTA panels",
  "coverageGaps": [],
  "blocks": [
    {
      "name": "hero-split",
      "instances": [
        "#main > div.page-header-alt",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner > div.page-header-alt"
      ]
    },
    {
      "name": "hero",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner > div.campaign-banner-alt",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner:has(> div[class*='page-header__darken'])"
      ]
    },
    {
      "name": "hero-split-light",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-searchbanner .card-article-large"
      ]
    },
    {
      "name": "audience-switcher",
      "instances": [
        "#main > div#page-short-course-audience-switcher"
      ]
    },
    {
      "name": "key-facts",
      "instances": [
        "#main > div.key-facts"
      ]
    },
    {
      "name": "notice",
      "instances": [
        "#main > div.section > .section__inner > div.notice",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.content-block div.notice",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block p.notice"
      ]
    },
    {
      "name": "columns-overlap",
      "instances": [
        "#main > section#what-you-will-learn",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:has(.section-alt__img-wrapper) > section.section-alt"
      ]
    },
    {
      "name": "columns-text-column",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:not(:has(.section-alt__img-wrapper)) > section.section-alt"
      ]
    },
    {
      "name": "columns",
      "instances": [
        "#main > section#dates .section-alt__row",
        "#main > section.section-alt:not([id]):has(ul.page-short-course__course-list) .section-alt__row",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-texttwocolumn > .section__inner > div.grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textwithfigures > .section__inner",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:not([id]):not(.ct-searchbanner):has(ul.card-course-list) .section-alt__row"
      ]
    },
    {
      "name": "columns-split",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image.split-section",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section section.split-section",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu"
      ]
    },
    {
      "name": "cards-people",
      "instances": [
        "#main > section#who-you-will-learn-from .section-alt__right"
      ]
    },
    {
      "name": "cards-tile",
      "instances": [
        "#main > section#fees .grid.grid--lg",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-todolist .todo-list__button-cards",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-pathfinder .grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn.section .grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusboxpathfinder .grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(section.ct-searchbanner, section.section-alt.hardcode) .article-card-list",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.pathfinder-today ul.pathfinder-today__list",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.bg-inverted > div.pathfinder-today ul.pathfinder-today__list"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        "#main > section#overview .grid.grid--lg",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-factscard div.grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-imagelisting div.logo-listing",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn.section-alt .grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusbox .grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-documentlisting ul.document-list"
      ]
    },
    {
      "name": "cards",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel div.grid:has(.card--features-panel)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-profilelist div.grid:has(.card--stafflist)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-pagelisting div.grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting div.grid.ctnews",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-eventslisting ul.grid:has(li.event)"
      ]
    },
    {
      "name": "cards-stat",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-statsrankings ul.uom-stats-and-rankings__stats"
      ]
    },
    {
      "name": "cards-chips",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursecards ul.course-list"
      ]
    },
    {
      "name": "cards-link-list",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section__inner:has(> div.grid .sublink-menu) > div.grid"
      ]
    },
    {
      "name": "video",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section :is(div.embed, div.uom-video, div.video)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div.content-block, section.content-block) :is(div, p):has(> iframe[src*=\"youtube.com/embed\"], > iframe[src*=\"vimeo.com\"])"
      ]
    },
    {
      "name": "video-shorts",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section-alt .section-alt__right div.testimonials-alt--video"
      ]
    },
    {
      "name": "video-split",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section-alt .section-alt__row:has(.uom-video, .video, iframe)"
      ]
    },
    {
      "name": "video-library",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.filter-category"
      ]
    },
    {
      "name": "quote",
      "instances": [
        "#main > section#hear-from-students .section-alt__right blockquote.testimonials-alt",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section-alt .section-alt__right blockquote.testimonials-alt",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section .card-focus"
      ]
    },
    {
      "name": "accordion",
      "instances": [
        "#main > section#course-specifics .section-alt__row:has(.uom-accordion)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion.section-alt .section-alt__row:has(.uom-accordion)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion.section .uom-accordion"
      ]
    },
    {
      "name": "callout-photo",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-sectionfocus"
      ]
    },
    {
      "name": "search",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursesearch .section-alt__row"
      ]
    },
    {
      "name": "table",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.content-block table:not(.uom-accordion table)"
      ]
    },
    {
      "name": "timeline",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block dl.timeline"
      ]
    }
  ],
  "sections": [
    {
      "id": "sc-hero",
      "name": "Course hero (page-header-alt)",
      "selector": [
        "#main > div.page-header-alt"
      ],
      "style": null,
      "blocks": [
        "hero-split"
      ],
      "defaultContent": []
    },
    {
      "id": "sc-audience-switcher",
      "name": "Information for: Individuals | Organisations",
      "selector": [
        "#main > div#page-short-course-audience-switcher"
      ],
      "style": null,
      "blocks": [
        "audience-switcher"
      ],
      "defaultContent": []
    },
    {
      "id": "sc-b2b-notice",
      "name": "Organisations-only notice",
      "selector": [
        "#main > div.section:has(> .section__inner > div.notice)"
      ],
      "style": null,
      "blocks": [
        "notice"
      ],
      "defaultContent": []
    },
    {
      "id": "sc-key-facts",
      "name": "Key facts",
      "selector": [
        "#main > div.key-facts"
      ],
      "style": "grey",
      "blocks": [
        "key-facts"
      ],
      "defaultContent": []
    },
    {
      "id": "sc-overview",
      "name": "Level up with micro-credentials (benefits band)",
      "selector": [
        "#main > section#overview"
      ],
      "style": null,
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        "#overview > .section-alt__inner > h2"
      ]
    },
    {
      "id": "sc-what-you-will-learn",
      "name": "What you will learn (overlap banner)",
      "selector": [
        "#main > section#what-you-will-learn"
      ],
      "style": null,
      "blocks": [
        "columns-overlap"
      ],
      "defaultContent": []
    },
    {
      "id": "sc-who",
      "name": "Who you will learn from",
      "selector": [
        "#main > section#who-you-will-learn-from"
      ],
      "style": "grey",
      "blocks": [
        "cards-people"
      ],
      "defaultContent": [
        "#who-you-will-learn-from .section-alt__left > *"
      ]
    },
    {
      "id": "sc-hear",
      "name": "What people are saying",
      "selector": [
        "#main > section#hear-from-students"
      ],
      "style": null,
      "blocks": [
        "quote"
      ],
      "defaultContent": [
        "#hear-from-students .section-alt__left > *"
      ]
    },
    {
      "id": "sc-series",
      "name": "More from this series",
      "selector": [
        "#main > section.section-alt:not([id]):has(ul.page-short-course__course-list)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "sc-fees",
      "name": "Fees",
      "selector": [
        "#main > section#fees"
      ],
      "style": null,
      "blocks": [
        "cards-tile"
      ],
      "defaultContent": [
        "#fees .section-alt__inner > h2"
      ]
    },
    {
      "id": "sc-dates",
      "name": "Dates",
      "selector": [
        "#main > section#dates"
      ],
      "style": "grey",
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "sc-course-details",
      "name": "Course details",
      "selector": [
        "#main > section#course-specifics"
      ],
      "style": null,
      "blocks": [
        "accordion"
      ],
      "defaultContent": [
        "#course-specifics .section-alt__left > *"
      ]
    },
    {
      "id": "banner-hero",
      "name": "Page banner (first ct-campaignbanner)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner:not(:is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner ~ div.ct-campaignbanner, #main > .optimizely_experiment:has(> span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner) ~ div.ct-campaignbanner, #main > div.ct-campaignbanner ~ .optimizely_experiment > span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner, #main > .optimizely_experiment:has(> span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner) ~ .optimizely_experiment > span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner)"
      ],
      "style": null,
      "blocks": [
        "hero-split",
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "banner-feature",
      "name": "Later banner (in-content navy feature)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner ~ div.ct-campaignbanner",
        "#main > .optimizely_experiment:has(> span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner) ~ div.ct-campaignbanner",
        "#main > div.ct-campaignbanner ~ .optimizely_experiment > span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner",
        "#main > .optimizely_experiment:has(> span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner) ~ .optimizely_experiment > span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner"
      ],
      "style": "navy",
      "blocks": [
        "hero-split",
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "search-banner",
      "name": "Feature + link tiles (ct-searchbanner)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-searchbanner"
      ],
      "style": null,
      "blocks": [
        "hero-split-light",
        "cards-tile"
      ],
      "defaultContent": []
    },
    {
      "id": "content-white",
      "name": "Rich text (content-block)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block:not(.bg-alt):not(.bg-inverted):not(.nopadtop)"
      ],
      "style": null,
      "blocks": [
        "table",
        "notice",
        "video",
        "timeline"
      ],
      "defaultContent": [
        ":scope > .content-block__inner > *"
      ]
    },
    {
      "id": "content-grey",
      "name": "Rich text on grey (content-block.bg-alt)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-alt:not(.nopadtop)"
      ],
      "style": "grey",
      "blocks": [
        "table",
        "notice",
        "video",
        "timeline"
      ],
      "defaultContent": [
        ":scope > .content-block__inner > *"
      ]
    },
    {
      "id": "content-navy",
      "name": "Rich text on navy (content-block.bg-inverted)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-inverted:not(.nopadtop)"
      ],
      "style": "navy",
      "blocks": [
        "table",
        "notice",
        "video",
        "timeline"
      ],
      "defaultContent": [
        ":scope > .content-block__inner > *"
      ]
    },
    {
      "id": "text-column-white",
      "name": "Heading | text (ct-textcolumnlayout, no banner)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:not(:has(.section-alt__img-wrapper)):not(:has(> section.bg-alt))"
      ],
      "style": null,
      "blocks": [
        "columns-text-column"
      ],
      "defaultContent": []
    },
    {
      "id": "text-column-grey",
      "name": "Heading | text on grey (ct-textcolumnlayout.bg-alt, no banner)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:not(:has(.section-alt__img-wrapper)):has(> section.bg-alt)"
      ],
      "style": "grey",
      "blocks": [
        "columns-text-column"
      ],
      "defaultContent": []
    },
    {
      "id": "text-column-overlap",
      "name": "Banner + overlap panel (ct-textcolumnlayout)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:has(.section-alt__img-wrapper)"
      ],
      "style": null,
      "blocks": [
        "columns-overlap"
      ],
      "defaultContent": []
    },
    {
      "id": "crest-navy",
      "name": "Centred call to action on navy (ct-section-crest)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-crest:is(.bg-inverted, .bg-inverted-dark)"
      ],
      "style": "navy, centered",
      "blocks": [],
      "defaultContent": [
        ":scope > .section__inner > *"
      ]
    },
    {
      "id": "crest-grey",
      "name": "Centred call to action on grey (ct-section-crest)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-crest.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [],
      "defaultContent": [
        ":scope > .section__inner > *"
      ]
    },
    {
      "id": "quicklinks",
      "name": "Subscribe / quick links strip",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.slimline-quicklinks"
      ],
      "style": "grey, centered",
      "blocks": [],
      "defaultContent": [
        ":scope .uom-link-list a"
      ]
    },
    {
      "id": "in-page-nav",
      "name": "On this page (ct-inpagenav)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-inpagenav"
      ],
      "style": "grey",
      "blocks": [],
      "defaultContent": [
        ":scope section .section-alt__left > *",
        ":scope section ul.in-page-navigation-v2__list"
      ]
    },
    {
      "id": "image-full-width",
      "name": "Full-width image",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-imagefullwidth",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.full-width-image"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ":scope > div.full-width-image",
        ":scope > img"
      ]
    },
    {
      "id": "plain-div",
      "name": "Untyped text wrapper",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div:not([class]):has(> div > :is(h2, h3, p))"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ":scope > div > *"
      ]
    },
    {
      "id": "features-white",
      "name": "Feature cards (ct-featurespanel)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "features-grey",
      "name": "Feature cards on grey",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "features-navy",
      "name": "Feature cards on navy",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel:is(.bg-inverted, .bg-inverted-dark)"
      ],
      "style": "navy, centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "todolist",
      "name": "Looking for personalised advice? (ct-section-todolist)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-todolist"
      ],
      "style": "grey",
      "blocks": [
        "cards-tile"
      ],
      "defaultContent": [
        ":scope > .content-block > .content-block__inner > *",
        ":scope .todo-list__inner"
      ]
    },
    {
      "id": "pathfinder-white",
      "name": "Link tiles (ct-pathfinder)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-pathfinder:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "centered",
      "blocks": [
        "cards-tile"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p, div:not(.grid))"
      ]
    },
    {
      "id": "pathfinder-grey",
      "name": "Link tiles on grey (ct-pathfinder)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-pathfinder.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards-tile"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p, div:not(.grid))"
      ]
    },
    {
      "id": "pathfinder-today",
      "name": "Link list tiles (pathfinder-today)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.pathfinder-today"
      ],
      "style": null,
      "blocks": [
        "cards-tile"
      ],
      "defaultContent": [
        ":scope [role=navigation] > :is(h2, h3)"
      ]
    },
    {
      "id": "pathfinder-today-navy",
      "name": "Link tiles on navy (PD category)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.bg-inverted:has(> div.pathfinder-today)"
      ],
      "style": "navy",
      "blocks": [
        "cards-tile"
      ],
      "defaultContent": [
        ":scope .pathfinder-today > div > div > :is(h2, h3, p)"
      ]
    },
    {
      "id": "sublink-menu",
      "name": "Browse other areas (sublink menus)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section__inner:has(> div.grid .sublink-menu)"
      ],
      "style": null,
      "blocks": [
        "cards-link-list"
      ],
      "defaultContent": [
        ":scope > :is(h2, h3, p)"
      ]
    },
    {
      "id": "three-col-white",
      "name": "Three columns (ct-textthreecolumn)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "centered",
      "blocks": [
        "cards-icon",
        "cards-tile"
      ],
      "defaultContent": [
        ":scope > div > :is(h2, h3, p)"
      ]
    },
    {
      "id": "three-col-grey",
      "name": "Three columns on grey (ct-textthreecolumn)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards-icon",
        "cards-tile"
      ],
      "defaultContent": [
        ":scope > div > :is(h2, h3, p)"
      ]
    },
    {
      "id": "focusbox",
      "name": "Why study with us? (ct-focusbox)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusbox"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, p)"
      ]
    },
    {
      "id": "factscard",
      "name": "Facts / stat tiles (ct-factscard)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-factscard"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "imagelisting",
      "name": "Logo wall (ct-imagelisting)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-imagelisting"
      ],
      "style": "centered",
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "documentlisting",
      "name": "Resources + brochures (ct-documentlisting)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-documentlisting"
      ],
      "style": "grey",
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, div, h5)"
      ]
    },
    {
      "id": "profilelist-white",
      "name": "Experts (ct-profilelist)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-profilelist:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "profilelist-grey",
      "name": "Experts on grey (ct-profilelist)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-profilelist.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "pagelisting-white",
      "name": "Page cards (ct-pagelisting)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-pagelisting:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "pagelisting-grey",
      "name": "Page cards on grey (ct-pagelisting)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-pagelisting.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "newslisting",
      "name": "News cards (ct-newslisting)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "eventslisting",
      "name": "Upcoming events (ct-eventslisting, static copy)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-eventslisting"
      ],
      "style": "centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "coursecards-white",
      "name": "Course cards (ct-coursecards)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursecards:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "centered",
      "blocks": [
        "cards-chips"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, p)"
      ]
    },
    {
      "id": "coursecards-grey",
      "name": "Course cards on grey (ct-coursecards)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursecards.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "cards-chips"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, p)"
      ]
    },
    {
      "id": "statsrankings-navy",
      "name": "Stats and rankings on navy",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-statsrankings:is(.bg-inverted, .bg-inverted-dark)"
      ],
      "style": "navy",
      "blocks": [
        "cards-stat"
      ],
      "defaultContent": [
        ":scope .uom-stats-and-rankings__citation",
        ":scope > .section__inner > :is(h2, h3)"
      ]
    },
    {
      "id": "statsrankings-white",
      "name": "Stats and rankings",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-statsrankings:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": null,
      "blocks": [
        "cards-stat"
      ],
      "defaultContent": [
        ":scope .uom-stats-and-rankings__citation",
        ":scope > .section__inner > :is(h2, h3)"
      ]
    },
    {
      "id": "article-cards",
      "name": "You might also be interested in (article cards)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt.hardcode"
      ],
      "style": "grey",
      "blocks": [
        "cards-tile"
      ],
      "defaultContent": [
        ":scope > .section-alt__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "study-area-chips",
      "name": "Browse by study / skill area (heading | chips)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:not([id]):not(.ct-searchbanner):has(ul.card-course-list)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "split-navy",
      "name": "Image | text split on navy (ct-section-image)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:is(.bg-inverted, .bg-inverted-dark)"
      ],
      "style": "navy",
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "split-grey",
      "name": "Image | text split on grey (ct-section-image)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image.bg-alt"
      ],
      "style": "grey",
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "split-white",
      "name": "Image | text split (ct-section-image)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": null,
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "tile-split-navy",
      "name": "Split tile on navy (tile-split-section)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section:has(> div.bg-inverted)"
      ],
      "style": "navy",
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "tile-split-grey",
      "name": "Split tile on grey (tile-split-section)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section.bg-alt"
      ],
      "style": "grey",
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "tile-split-white",
      "name": "Split tile (tile-split-section)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section:not(.bg-alt):not(:has(> div.bg-inverted))"
      ],
      "style": null,
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "menu",
      "name": "Image | link panel (ct-menu)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu"
      ],
      "style": "grey",
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "texttwocolumn-white",
      "name": "Heading | text (ct-section-texttwocolumn)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-texttwocolumn:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "texttwocolumn-grey",
      "name": "Heading | text on grey (ct-section-texttwocolumn)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-texttwocolumn.bg-alt"
      ],
      "style": "grey",
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "textwithfigures-white",
      "name": "Text with inset figure",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textwithfigures:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": null,
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "textwithfigures-grey",
      "name": "Text with inset figure on grey",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textwithfigures.bg-alt"
      ],
      "style": "grey",
      "blocks": [
        "columns"
      ],
      "defaultContent": []
    },
    {
      "id": "video-split-white",
      "name": "Intro | video (ct-video.section-alt)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section-alt:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": null,
      "blocks": [
        "video-split"
      ],
      "defaultContent": []
    },
    {
      "id": "video-split-navy",
      "name": "Intro | video on navy (ct-video.section-alt)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section-alt:is(.bg-inverted, .bg-inverted-dark)"
      ],
      "style": "navy",
      "blocks": [
        "video-split"
      ],
      "defaultContent": []
    },
    {
      "id": "video-white",
      "name": "Centred video (ct-video.section)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "centered",
      "blocks": [
        "video"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "video-grey",
      "name": "Centred video on grey (ct-video.section)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "video"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "testimonial-cols-white",
      "name": "Heading | testimonials (ct-testimonial.section-alt)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section-alt:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": null,
      "blocks": [
        "quote",
        "video-shorts"
      ],
      "defaultContent": [
        ":scope .section-alt__left > *"
      ]
    },
    {
      "id": "testimonial-cols-grey",
      "name": "Heading | testimonials on grey",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section-alt.bg-alt"
      ],
      "style": "grey",
      "blocks": [
        "quote",
        "video-shorts"
      ],
      "defaultContent": [
        ":scope .section-alt__left > *"
      ]
    },
    {
      "id": "testimonial-focus-white",
      "name": "Testimonial (ct-testimonial card-focus)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "centered",
      "blocks": [
        "quote"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "testimonial-focus-grey",
      "name": "Testimonial on grey (ct-testimonial card-focus)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section.bg-alt"
      ],
      "style": "grey, centered",
      "blocks": [
        "quote"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "accordion-white",
      "name": "Intro | accordion (ct-accordion)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": null,
      "blocks": [
        "accordion"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "accordion-grey",
      "name": "Intro | accordion on grey (ct-accordion)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion.bg-alt"
      ],
      "style": "grey",
      "blocks": [
        "accordion"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "accordion-navy",
      "name": "Intro | accordion on navy (ct-accordion)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion:is(.bg-inverted, .bg-inverted-dark)"
      ],
      "style": "navy",
      "blocks": [
        "accordion"
      ],
      "defaultContent": [
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "sectionfocus",
      "name": "Photo + centred panel (ct-sectionfocus)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-sectionfocus"
      ],
      "style": null,
      "blocks": [
        "callout-photo"
      ],
      "defaultContent": []
    },
    {
      "id": "focusboxpathfinder",
      "name": "Two navy link panels (ct-focusboxpathfinder)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusboxpathfinder"
      ],
      "style": "navy",
      "blocks": [
        "cards-tile"
      ],
      "defaultContent": []
    },
    {
      "id": "coursesearch",
      "name": "Course search (ct-coursesearch)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursesearch"
      ],
      "style": "grey",
      "blocks": [
        "search"
      ],
      "defaultContent": []
    },
    {
      "id": "course-listing",
      "name": "Online course browser (widget)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.CourseListing"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ":scope > .content-block.bg-inverted > .content-block__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "conversion-tool",
      "name": "Grade conversion calculator (widget)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section:has(#conversion-tool-app)"
      ],
      "style": "grey",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "on-demand-library",
      "name": "On-demand video library (Video library block)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.filter-category"
      ],
      "style": "navy",
      "blocks": [
        "video-library"
      ],
      "defaultContent": []
    }
  ],
  "sectionMatching": {
    "mode": "all",
    "rule": "Unlike course-detail (first match), each section selector is applied with querySelectorAll: EVERY matching element starts a section with that entry's style. Selectors are mutually exclusive by construction (bg-alt / bg-inverted / plain variants, :not(X ~ X) for first banners). Elements matching joinWithPrevious never start a section.",
    "root": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type)",
    "joinWithPrevious": [
      ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.content-block.nopadtop",
      ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting + div.content-block",
      ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn + div.ct-textthreecolumn:not(:has(> div > :is(h2, h3)))"
    ]
  },
  "audienceContract": {
    "key": "Audience",
    "values": [
      "individuals",
      "organisations"
    ],
    "defaultAudience": "individuals",
    "switcher": {
      "block": "audience-switcher",
      "rows": [
        [
          "Information for"
        ],
        [
          "Individuals",
          "individuals"
        ],
        [
          "Organisations",
          "organisations"
        ]
      ],
      "sourceValues": {
        "b2c": "individuals",
        "b2b": "organisations"
      }
    },
    "template": "template#excat-organisations",
    "pagesFlag": "html[data-excat-views=\"individuals,organisations\"]",
    "parts": [
      "body (main#main of the organisations view)",
      "hero (div.page-header-alt)",
      "key-facts (div.key-facts)"
    ],
    "sections": {
      "sc-hero": {
        "audience": "individuals",
        "part": "hero",
        "selector": [
          "div.page-header-alt"
        ]
      },
      "sc-key-facts": {
        "audience": "individuals",
        "part": "key-facts",
        "selector": [
          "div.key-facts"
        ]
      },
      "sc-fees": {
        "audience": "individuals",
        "part": "body",
        "selector": [
          "#main > section#fees"
        ],
        "whenMissing": "individuals-only"
      },
      "sc-dates": {
        "audience": "individuals",
        "part": "body",
        "selector": [
          "#main > section#dates"
        ],
        "whenMissing": "individuals-only"
      }
    },
    "compareRule": "Every other section is compared with its body-part counterpart (same selector inside the part). Identical text (after cleanup; svg/img/script/style removed) and hrefs = no split. Different = split (individuals copy + organisations clone). Present in the part but absent in the live DOM = organisations-only: insert the clone after the nearest preceding section that exists in both views and key it Audience=organisations.",
    "whenMissing": {
      "individuals-only": "Template present, counterpart absent in the organisations body part: key the live element Audience=individuals, insert no clone.",
      "organisations-only": "Element only in the organisations part: insert the clone (see compareRule), key it Audience=organisations.",
      "no-template": "No template#excat-organisations (227 of 258 pages, incl. the 11 b2b-only and 16 b2c-only micro-credentials): single view, no Audience keys, no switcher."
    }
  },
  "chrome": [
    ".screen-reader-jump-to",
    "uom-ds-mega-menu",
    "uom-ds-font-loader-component",
    "#__nuxt header",
    "#ui > header",
    "#ui > nav.uom-breadcrumbs",
    "div.breadcrumbs-bar[data-test=\"breadcrumbs-bar\"]",
    "footer.uom-page-footer",
    "#__tealiumGDPRecModal",
    ".tealium_privacy_prompt",
    "#teleports",
    "iframe[src*=\"optimizely\"]",
    ":is(#ui, #main) > section.uom-link-list-section",
    "dash-cart",
    "#main > div.stickyPanel",
    "#main div.in-page-nav-today",
    "#observerSensor",
    "#liveagent",
    "#main > .optimizely_experiment > span.optimizely_experiment__block:not(:first-of-type)",
    "div.ct-inpagenav nav.in-page-navigation-v2__collapsed",
    "#main > link",
    "#main > meta",
    "#main style",
    "#main script",
    "#main div[id]:not([class]):empty",
    "#main > div:not([class]):not([id]):empty",
    "#main > p[id]:empty",
    "div.ct-eventslisting:not(:has(li.event)):not(:has(table))",
    "img[src^=\"data:image/svg+xml\"]:not(:is(.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left) img)",
    ".uom-link__icon",
    ".uom-icon",
    "span.screenreaders-only",
    ".sr-only",
    "span.togglerow__chevron",
    ".uom-video-controls",
    "#who-you-will-learn-from .page-short-course__profile-content > :empty",
    ".ct-textcolumnlayout .card-flat-list:not(:has(a, img, p, h3))",
    "template#excat-organisations"
  ],
  "drops": [
    {
      "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusboxpathfinder > img",
      "reason": "ct-focusboxpathfinder background photo: Cards (tile) on navy keeps the two panels, not the photo (components analysis M.1)"
    }
  ],
  "widgets": [
    {
      "section": "conversion-tool",
      "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section:has(#conversion-tool-app)",
      "widget": "/widgets/grade-conversion-calculator.html",
      "note": "Vue eligibility calculator (#conversion-tool-app); no authorable content. The region becomes a <p><a href=\"/widgets/grade-conversion-calculator.html\"> link, which scripts.js turns into a widget block."
    },
    {
      "section": "course-listing",
      "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.CourseListing",
      "widget": "/widgets/online-course-listing.html",
      "keep": ":scope > .content-block.bg-inverted",
      "note": "JS course browser (study area / duration filters, Load more). Keep the intro h3 + p as default content, replace the form and results with a <p><a href=\"/widgets/online-course-listing.html\"> link (widget block); the ct-coursesearch Search block above already links to /find."
    }
  ],
  "fragmentContract": {
    "rule": "A region whose section is listed here becomes a fragment include when its identity matches: after the cleanup transformer, clone the region element, drop svg/script/style, then text = textContent with whitespace collapsed and trimmed; links = every a[href] trimmed, origin https://study.unimelb.edu.au and trailing slash removed, joined with \"|\"; media = every img[src] not starting with data:, joined with \"|\". Hash each string with djb2-xor (h = 5381; for each UTF-16 code unit c: h = ((h * 33) ^ c) >>> 0; result h.toString(36)). All three hashes must equal the fragment identity. Match: replace the region with a section holding only <p><a href=\"{path}\">{path}</a></p> and NO Section Metadata (style lives in the fragment). No match: import the region inline as usual (that page keeps its own copy).",
    "fragmentDocument": "Each fragment is imported once, from sourcePage, as its own document at {path} using the same section mapping (blocks, default content, Section Metadata style). scripts.js buildAutoBlocks loads every a[href*=\"/fragments/\"] link and replaces its paragraph with the fragment content.",
    "threshold": "text+links+media identical on 3 or more pages. 2-page pairs stay inline (listed in mapping-notes).",
    "fragments": [
      {
        "slug": "personalised-advice",
        "path": "/fragments/section-landing/personalised-advice",
        "section": "todolist",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-todolist"
        ],
        "identity": {
          "text": "70ye8e",
          "links": "1jg5mz3",
          "media": "1y7ueht",
          "chars": 324,
          "startsWith": "Looking for personalised advice?Find out more about our grad"
        },
        "byteIdentical": false,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/career-pathways",
        "pageCount": 43
      },
      {
        "slug": "micro-credential-benefits",
        "path": "/fragments/section-landing/micro-credential-benefits",
        "section": "sc-overview",
        "selector": [
          "#main > section#overview"
        ],
        "identity": {
          "text": "353719",
          "links": "1r6hvfb",
          "media": "yv48qt",
          "chars": 447,
          "startsWith": "Level up with micro-credentialsIndustry-ready skillsDevelop "
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/acknowledgement-of-country",
        "pageCount": 33
      },
      {
        "slug": "organisations-only-notice",
        "path": "/fragments/section-landing/organisations-only-notice",
        "section": "sc-b2b-notice",
        "selector": [
          "#main > div.section:has(> .section__inner > div.notice)"
        ],
        "identity": {
          "text": "iuew8n",
          "links": "1nqhheo",
          "media": "45h",
          "chars": 81,
          "startsWith": "This course is available for organisations only. Explore ind"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/acknowledgement-of-country",
        "pageCount": 14
      },
      {
        "slug": "who-you-will-learn-from-belinda-allen",
        "path": "/fragments/section-landing/who-you-will-learn-from-belinda-allen",
        "section": "sc-who",
        "selector": [
          "#main > section#who-you-will-learn-from"
        ],
        "identity": {
          "text": "xqfy9z",
          "links": "45h",
          "media": "3j2zx4",
          "chars": 705,
          "startsWith": "Who you will learn fromLearn from skilled academics and prof"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/effective-leadership-communication",
        "pageCount": 5
      },
      {
        "slug": "who-you-will-learn-from-joseph-west",
        "path": "/fragments/section-landing/who-you-will-learn-from-joseph-west",
        "section": "sc-who",
        "selector": [
          "#main > section#who-you-will-learn-from"
        ],
        "identity": {
          "text": "1fhb4rr",
          "links": "45h",
          "media": "5j6h55",
          "chars": 669,
          "startsWith": "Who you will learn fromLearn from skilled academics and prof"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/build-custom-ai-tools-for-healthcare",
        "pageCount": 4
      },
      {
        "slug": "who-you-will-learn-from-matthew-campbell",
        "path": "/fragments/section-landing/who-you-will-learn-from-matthew-campbell",
        "section": "sc-who",
        "selector": [
          "#main > section#who-you-will-learn-from"
        ],
        "identity": {
          "text": "tabmvl",
          "links": "45h",
          "media": "ew4o4t",
          "chars": 315,
          "startsWith": "Who you will learn fromLearn from skilled academics and prof"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/indigenous-and-other-sovereignties",
        "pageCount": 4
      },
      {
        "slug": "executive-learning-insights-subscribe",
        "path": "/fragments/section-landing/executive-learning-insights-subscribe",
        "section": "quicklinks",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.slimline-quicklinks"
        ],
        "identity": {
          "text": "pnjcjb",
          "links": "o61hgn",
          "media": "45h",
          "chars": 40,
          "startsWith": "Subscribe to Executive Learning Insights"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations",
        "pageCount": 4
      },
      {
        "slug": "micro-credential-learning-features",
        "path": "/fragments/section-landing/micro-credential-learning-features",
        "section": "pathfinder-today-navy",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.bg-inverted:has(> div.pathfinder-today)"
        ],
        "identity": {
          "text": "1ehh6s3",
          "links": "11hxdh",
          "media": "45h",
          "chars": 376,
          "startsWith": "The freedom to choose when and how you learn Guided and self"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/creative-media",
        "pageCount": 4
      },
      {
        "slug": "international-students-resources",
        "path": "/fragments/section-landing/international-students-resources",
        "section": "sectionfocus",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-sectionfocus"
        ],
        "identity": {
          "text": "q5izlw",
          "links": "1l8ylxm",
          "media": "1nw80mp",
          "chars": 149,
          "startsWith": "Resources for international studentsExplore support, advice "
        },
        "byteIdentical": false,
        "sourcePage": "https://study.unimelb.edu.au/student-life/cost-of-living",
        "pageCount": 3
      },
      {
        "slug": "discuss-your-organisations-needs",
        "path": "/fragments/section-landing/discuss-your-organisations-needs",
        "section": "split-navy",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:is(.bg-inverted, .bg-inverted-dark)"
        ],
        "identity": {
          "text": "yrsbc8",
          "links": "qccicr",
          "media": "17efb2o",
          "chars": 139,
          "startsWith": "Discuss your organisation's needsWhether you're looking for "
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations",
        "pageCount": 3
      },
      {
        "slug": "pdo-featured-courses",
        "path": "/fragments/section-landing/pdo-featured-courses",
        "section": "content-grey",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-alt:not(.nopadtop)"
        ],
        "identity": {
          "text": "1i71131",
          "links": "45h",
          "media": "45h",
          "chars": 177,
          "startsWith": "Featured coursesBrowse a selection of our courses. We offer "
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/ai-cyber-and-digital",
        "pageCount": 3
      },
      {
        "slug": "pdo-learning-formats",
        "path": "/fragments/section-landing/pdo-learning-formats",
        "section": "features-white",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "identity": {
          "text": "5oehut",
          "links": "45h",
          "media": "45h",
          "chars": 483,
          "startsWith": "Choose the learning format that fits your needsChoose a sing"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/ai-cyber-and-digital",
        "pageCount": 3
      },
      {
        "slug": "pdo-how-we-partner",
        "path": "/fragments/section-landing/pdo-how-we-partner",
        "section": "factscard",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-factscard"
        ],
        "identity": {
          "text": "gzlc1x",
          "links": "45h",
          "media": "45h",
          "chars": 456,
          "startsWith": "How we partner with you1. Clarify your goalsWe listen, sharp"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/ai-cyber-and-digital",
        "pageCount": 3
      },
      {
        "slug": "pdo-newsroom",
        "path": "/fragments/section-landing/pdo-newsroom",
        "section": "newslisting",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting"
        ],
        "identity": {
          "text": "uwiluh",
          "links": "1g4f4s9",
          "media": "1w4n86o",
          "chars": 728,
          "startsWith": "Professional development newsroomNew leadership immersion pr"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/ai-cyber-and-digital",
        "pageCount": 3
      },
      {
        "slug": "why-micro-credentials",
        "path": "/fragments/section-landing/why-micro-credentials",
        "section": "content-navy",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-inverted:not(.nopadtop)"
        ],
        "identity": {
          "text": "5tukqq",
          "links": "45h",
          "media": "1g3wgyz",
          "chars": 294,
          "startsWith": "Why micro-credentials?Micro-credentials are innovative onlin"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/creative-media",
        "pageCount": 3
      },
      {
        "slug": "micro-credentials-and-short-courses",
        "path": "/fragments/section-landing/micro-credentials-and-short-courses",
        "section": "content-navy",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-inverted:not(.nopadtop)"
        ],
        "identity": {
          "text": "uihhei",
          "links": "11hxdh",
          "media": "45h",
          "chars": 608,
          "startsWith": "Micro-credentialsShort coursesAdvance your knowledge, skills"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/data-and-digital-transformation",
        "pageCount": 3
      }
    ]
  },
  "anchorRewrite": {
    "rule": "Run before cleanup (cleanup removes the empty anchor divs). For every a[href] in #main content whose fragment targets this page (href=\"#x\", or an absolute/relative URL to the same path with #x): resolve the target by decoded id (also try without the \"navigation-\" prefix); target heading = the element itself if h1-h6, else its first descendant heading, else the first heading after it in document order (empty anchor divs such as div#benefits). New href = \"#\" + EDS slug of that heading text (lower-case, NFD accents stripped, non [0-9a-z] -> \"-\", collapse and trim \"-\"). Unresolved targets keep the source href and are logged.",
    "survey": "145 in-page links on 110 pages: 101 self-URL links into a section whose first heading slug already equals the id (rewritten to bare #id), 27 heading-id rewrites (#navigation-… Matrix ids), 11 anchor-div rewrites (#apply -> #how-to-apply), 4+2 self-URL rewrites, 2 unresolved (vietnam #trinity, high-school-guide #navigation-<h3>need-help-or-advice-</h3>)."
  },
  "liveFeeds": {
    "rule": "Import a static copy (user decision c).",
    "feeds": [
      {
        "section": "eventslisting",
        "selector": "div.ct-eventslisting:has(li.event)",
        "block": "cards",
        "note": "UMEP: 2 events (20 Oct and 17 Nov 2026); flag \"expires 17 Nov 2026\" in the import report. Empty listings (study-business, Instructional-Leadership-Spotlight-Series) are removed by cleanup."
      },
      {
        "section": "newslisting",
        "selector": "div.ct-newslisting",
        "block": "cards",
        "note": "Latest-news grids (7 pages): static copy of the visible cards; .cell.news.hidden (\"load more\") items are not imported. The PD newsroom grid is also a fragment (pdo-newsroom), so it is refreshed in one place."
      }
    ]
  },
  "snapshotContracts": {
    "organisationsView": "template#excat-organisations (8 micro-credential pages; html[data-excat-views=\"individuals,organisations\"]): parts body (main#main of the organisations view), hero (div.page-header-alt), key-facts (div.key-facts). See audienceContract.",
    "clickToPlayVideo": "[data-excat-video-src] on the click-to-play root (div.uom-video in ct-video, div.video.video--portrait in video testimonials; 37 roots on 30 pages): the captured embed URL. Video parsers take the id from it and emit https://www.youtube.com/watch?v=<id>; poster from the root img; caption from the overlay title / duration. Never emit a video row without a link: if the attribute is missing, log video-url-missing and keep the poster as default content.",
    "lazyBackground": "[data-excat-bg] on elements whose image is a CSS background (full-width-image, ct-section-imagefullwidth, alumni__img, testimonials__img; 23 on 17 pages): the trimmed absolute image URL. Parsers/transformers turn it into an <img> (alt from aria-label) instead of parsing style=\"background-image\".",
    "optimizely": "5 pages contain .optimizely_experiment; only the first span.optimizely_experiment__block is the default variant. All region selectors use the ROOT form, so they match whether or not the cleanup unwraps or keeps that span; the other spans are removed by cleanup.",
    "videoData": "template#excat-video-data (/study-with-us/on-demand; capture-course-snapshots.mjs): the full :data JSON array of the <cards-filter-category> component (the rendered region holds only 12 cards and no video URLs), as text (& < > escaped), data-source=\"cards-filter-category:data\". parsers/video-library.js reads it and applies tools/importer/on-demand-cleanup.json."
  },
  "representativeUrls": [
    "https://study.unimelb.edu.au/find/short-courses/applied-learning-health-system",
    "https://study.unimelb.edu.au/find/microcredentials/leading-teams",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/study-education/positive-psychology-and-wellbeing-courses",
    "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations",
    "https://study.unimelb.edu.au/connect-with-us/international/vietnam"
  ]
};

export default createLandingImport(PAGE_TEMPLATE);
