/* eslint-disable */
/* global WebImporter */

/**
 * Import script: study.unimelb.edu.au story-article template (228 URLs, 226 snapshots: Inside
 * Melbourne stories, student takeovers, STEM podcast, languages, auditions and other how-to-apply
 * pages, graduate articles and degree packages, events).
 *
 * Spec: migration-work/story-article/analysis.md and templates[story-article] in
 * tools/importer/page-templates.json (the section-landing entry plus the story deltas; embedded
 * below by build-import-section-landing.mjs, without the urls and the per-fragment page lists).
 *
 * Same runtime as import-section-landing.js (tools/importer/landing-import.js): the landing
 * transformers and parsers (which treat story-article as a landing-family template), fragment
 * routing ("<sourcePage>#excat-fragment=<slug>" imports /fragments/story-article/<slug>; the two
 * reused section-landing fragments are only linked), plus the story contracts read by the cleanup
 * transformer: template.unwrap (wrapper divs), the share-bar Tags (template.pageMetadata) and the
 * extra chrome.
 *
 * Story-only rules keyed on the template name (section-landing output unchanged): page Metadata
 * "Template: story-article" (landing-import.js, pages only); lead paragraphs start a `lead` /
 * `lead-center` section, centred h2 sections get `centered`, h2.title--md / .uom-title-3 count as
 * heading-sans titles (unimelb-landing-sections.js); default-content a.btn -> <strong>/<em> button
 * paragraphs (unimelb-landing-cleanup.js); campaign banners -> Hero (overlay[, dark]) (hero.js);
 * full-width news list -> Cards (list) and linked event tags emitted once (cards.js); sublink box
 * icon kept (cards-link-list.js). Section entries imagelisting-grey and menu-navy exist in this
 * template only.
 */
import { createLandingImport } from './landing-import.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (urls and fragment page lists omitted)
const PAGE_TEMPLATE = {
  "name": "story-article",
  "description": "Article/story page with split title-and-image hero, pull quote, rich text body with embedded media, share bar, tag, study-option links and 'keep reading' card row",
  "coverageGaps": [],
  "blocks": [
    {
      "name": "hero-split",
      "instances": [
        "#main > div.page-header-alt",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner > div.page-header-alt",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.split-section.ct-section-image:has(h1)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-searchbanner > div.page-header-study"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block p.notice",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block p.notice"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:not(:has(h1)).split-section",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section section.split-section",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu:not(:has(.ql-menu))"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-documentlisting ul.document-list",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-imagelisting div.grid:has(.card--image-focus)"
      ]
    },
    {
      "name": "cards",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel div.grid:has(.card--features-panel)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-profilelist div.grid:has(.card--stafflist)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-pagelisting div.grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting div.grid.ctnews",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-eventslisting ul.grid:has(li.event)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section:not([class*=\"ct-\"]):has(.card--generic) div.grid",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block div.grid:has(> .cell > .card--generic)",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:has(.filtered-results__items) div.filtered-results__items"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursecards ul.course-list",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section:not(.ct-coursecards):has(> .section__inner > ul.course-list) ul.course-list"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block :is(div, p):has(> iframe[src*=\"youtube.com/embed\"], > iframe[src*=\"vimeo.com\"])"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section .card-focus",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block .content-block__inner > blockquote"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursesearch .section-alt__row",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursesearch > div.content-block > .content-block__inner",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-searchbanner form.inline-search"
      ]
    },
    {
      "name": "table",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block table:not(.uom-accordion table)"
      ]
    },
    {
      "name": "timeline",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block dl.timeline"
      ]
    },
    {
      "name": "tabs",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.app-tabs"
      ]
    },
    {
      "name": "hero-aside",
      "instances": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu:has(.ql-menu)"
      ]
    }
  ],
  "sections": [
    {
      "id": "story-hero",
      "name": "Story title | image (split-section with h1)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.split-section.ct-section-image:has(h1)"
      ],
      "style": null,
      "blocks": [
        "hero-split"
      ],
      "defaultContent": []
    },
    {
      "id": "title-band",
      "name": "Navy page title band (content-block.bg-inverted with h1): default content",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block.bg-inverted:has(h1)"
      ],
      "style": "navy",
      "blocks": [
        "table",
        "notice",
        "video",
        "timeline",
        "quote",
        "cards"
      ],
      "defaultContent": [
        ":scope > .content-block__inner > *"
      ]
    },
    {
      "id": "title-band-section",
      "name": "Navy title band in a wrapper (div.section.bg-inverted, h1/h2 + intro)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section.bg-inverted:not([class*=\"ct-\"]):has(> .section__inner > :is(h1, h2))"
      ],
      "style": "navy",
      "blocks": [],
      "defaultContent": [
        ":scope > .section__inner > *"
      ]
    },
    {
      "id": "ql-menu-header",
      "name": "Page title | link panel (ct-menu ql-menu)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu:has(.ql-menu)"
      ],
      "style": null,
      "blocks": [
        "hero-aside"
      ],
      "defaultContent": []
    },
    {
      "id": "search-banner-study",
      "name": "Graduate research header + course search (div.ct-searchbanner page-header-study)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-searchbanner"
      ],
      "style": null,
      "blocks": [
        "hero-split",
        "search"
      ],
      "defaultContent": []
    },
    {
      "id": "study-options",
      "name": "Study options (course chips)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section:not(.ct-coursecards):has(> .section__inner > ul.course-list)"
      ],
      "style": "centered",
      "blocks": [
        "cards-chips"
      ],
      "defaultContent": [
        ":scope > .section__inner > h2"
      ]
    },
    {
      "id": "keep-reading",
      "name": "Keep reading (related story cards)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section:not([class*=\"ct-\"]):has(.card--generic)"
      ],
      "style": "centered",
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope > .section__inner > h2"
      ]
    },
    {
      "id": "app-tabs",
      "name": "Applicant-type tabs (app-tabs with nested accordion / text)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.app-tabs"
      ],
      "style": null,
      "blocks": [
        "tabs"
      ],
      "defaultContent": []
    },
    {
      "id": "video-split-grey",
      "name": "Intro | video on grey (ct-video.section-alt.bg-alt)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section-alt.bg-alt"
      ],
      "style": "grey",
      "blocks": [
        "video-split"
      ],
      "defaultContent": []
    },
    {
      "id": "statsrankings-grey",
      "name": "Stats and rankings on grey",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-statsrankings.bg-alt"
      ],
      "style": "grey",
      "blocks": [
        "cards-stat"
      ],
      "defaultContent": [
        ":scope .uom-stats-and-rankings__citation",
        ":scope > .section__inner > :is(h2, h3, p)"
      ]
    },
    {
      "id": "events-filter",
      "name": "Events listing (static copy of the Funnelback feed; filter UI dropped)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:has(.filtered-results__items)"
      ],
      "style": null,
      "blocks": [
        "cards"
      ],
      "defaultContent": [
        ":scope .filter-box > p.notice"
      ]
    },
    {
      "id": "atar-calculator",
      "name": "Explore courses by ATAR (Vue app -> widget link)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div#atar-calc-app"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block:not(.bg-alt):not(.bg-inverted):not(.nopadtop)"
      ],
      "style": null,
      "blocks": [
        "table",
        "notice",
        "video",
        "timeline",
        "quote",
        "cards"
      ],
      "defaultContent": [
        ":scope > .content-block__inner > *"
      ]
    },
    {
      "id": "content-grey",
      "name": "Rich text on grey (content-block.bg-alt)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block.bg-alt:not(.nopadtop)"
      ],
      "style": "grey",
      "blocks": [
        "table",
        "notice",
        "video",
        "timeline",
        "quote",
        "cards"
      ],
      "defaultContent": [
        ":scope > .content-block__inner > *"
      ]
    },
    {
      "id": "content-navy",
      "name": "Rich text on navy (content-block.bg-inverted)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block.bg-inverted:not(.nopadtop):not(:has(h1))"
      ],
      "style": "navy",
      "blocks": [
        "table",
        "notice",
        "video",
        "timeline",
        "quote",
        "cards"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-imagelisting:not(.bg-alt)"
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
      "id": "imagelisting-grey",
      "name": "Logo wall (ct-imagelisting) (grey)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-imagelisting.bg-alt"
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
        ":scope > .section__inner > :is(h2, h3, h4, p)"
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
        ":scope > .section__inner > :is(h2, h3, h4, p)"
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
        ":scope > .section__inner > :is(h2, h3)",
        ":scope .uom-stats-and-rankings > a"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:not(:has(h1)):is(.bg-inverted, .bg-inverted-dark)"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:not(:has(h1)).bg-alt"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:not(:has(h1)):not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
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
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu:not(:has(.ql-menu)):not(.bg-inverted):not(.bg-inverted-dark)"
      ],
      "style": "grey",
      "blocks": [
        "columns-split"
      ],
      "defaultContent": []
    },
    {
      "id": "menu-navy",
      "name": "Image | link panel (ct-menu) (navy)",
      "selector": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu:not(:has(.ql-menu)):is(.bg-inverted, .bg-inverted-dark)"
      ],
      "style": "navy",
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
      "defaultContent": [
        ":scope > div.content-block > .content-block__inner > :is(h2, h3, p)"
      ]
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
    "template#excat-organisations",
    ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.content-block:has(ul.social-list)",
    ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section:has(> .section__inner p.alert-warning)",
    ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section:not([class*=\"ct-\"]):not([class*=\"bg-\"]):has(> .section__inner.section__inner--short > h2.heading-section):not(:has(ul, a, img, table))",
    "#main h2.screenreaders-only",
    ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:has(.filtered-results__items) .section-alt__left > :not(.filter-box)",
    ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:has(.filtered-results__items) .filter-box > :not(p.notice)",
    ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:has(.filtered-results__items) h4.filtered-results__title",
    ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting .text-center > a[href=\"#\"]"
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
    },
    {
      "section": "atar-calculator",
      "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div#atar-calc-app",
      "widget": "/widgets/atar-course-explorer.html",
      "note": "Vue ATAR course explorer (#atar-calc-app, /study-with-us/undergraduate-courses/explore-courses-by-atar); no authorable content. The region becomes a <p><a href=\"/widgets/atar-course-explorer.html\"> link (widget block). The widget is built separately."
    }
  ],
  "fragmentContract": {
    "rule": "A region whose section is listed here becomes a fragment include when its identity matches: after the cleanup transformer, clone the region element, drop svg/script/style, then text = textContent with whitespace collapsed and trimmed; links = every a[href] trimmed, origin https://study.unimelb.edu.au and trailing slash removed, joined with \"|\"; media = every img[src] not starting with data:, joined with \"|\". Hash each string with djb2-xor (h = 5381; for each UTF-16 code unit c: h = ((h * 33) ^ c) >>> 0; result h.toString(36)). All three hashes must equal the fragment identity. Match: replace the region with a section holding only <p><a href=\"{path}\">{path}</a></p> and NO Section Metadata (style lives in the fragment). No match: import the region inline as usual (that page keeps its own copy).",
    "fragmentDocument": "Each fragment is imported once, from sourcePage, as its own document at {path} using the same section mapping (blocks, default content, Section Metadata style). scripts.js buildAutoBlocks loads every a[href*=\"/fragments/\"] link and replaces its paragraph with the fragment content.",
    "threshold": "text+links+media identical on 3 or more story pages, or identical to an existing section-landing fragment (reused by identity).",
    "fragments": [
      {
        "slug": "stay-in-touch",
        "name": "Stay in touch (sign-up callout, ct-sectionfocus)",
        "path": "/fragments/story-article/stay-in-touch",
        "section": "sectionfocus",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-sectionfocus"
        ],
        "identity": {
          "text": "1yvemde",
          "links": "bhez7s",
          "media": "n4zi4u",
          "chars": 54,
          "startsWith": "Stay in touchReceive updates from MelbourneSign up now"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/student-life/inside-melbourne/agriculture-can-be-climate-neutral-by-2030",
        "pageCount": 35
      },
      {
        "slug": "stem-careers-and-employability",
        "name": "STEM podcast episodes: Careers and Employability split",
        "path": "/fragments/story-article/stem-careers-and-employability",
        "section": "split-grey",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:not(:has(h1)).bg-alt"
        ],
        "identity": {
          "text": "125jbkz",
          "links": "k4zr6y",
          "media": "1v9rheb",
          "chars": 234,
          "startsWith": "Careers and Employability"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/student-life/inside-melbourne/stem/episode-1-where-can-stem-take-me",
        "pageCount": 8
      },
      {
        "slug": "inclusivity-and-accessibility-interview",
        "name": "Auditions and interviews: Inclusivity and accessibility (interview booking)",
        "path": "/fragments/story-article/inclusivity-and-accessibility-interview",
        "section": "content-grey",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block.bg-alt:not(.nopadtop)"
        ],
        "identity": {
          "text": "r5fc49",
          "links": "45h",
          "media": "45h",
          "chars": 390,
          "startsWith": "Inclusivity and accessibility"
        },
        "byteIdentical": false,
        "sourcePage": "https://study.unimelb.edu.au/how-to-apply/auditions-and-interviews/bachelor-of-fine-arts-animation-auditions-and-interviews",
        "pageCount": 12
      },
      {
        "slug": "inclusivity-and-accessibility-audition",
        "name": "Auditions and interviews: Inclusivity and accessibility (audition booking)",
        "path": "/fragments/story-article/inclusivity-and-accessibility-audition",
        "section": "content-grey",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block.bg-alt:not(.nopadtop)"
        ],
        "identity": {
          "text": "1vf9dh5",
          "links": "45h",
          "media": "45h",
          "chars": 388,
          "startsWith": "Inclusivity and accessibility"
        },
        "byteIdentical": false,
        "sourcePage": "https://study.unimelb.edu.au/how-to-apply/auditions-and-interviews/bachelor-of-fine-arts-acting-auditions-and-interviews",
        "pageCount": 7
      },
      {
        "slug": "inclusivity-and-accessibility-contact",
        "name": "Auditions and interviews: Inclusivity and accessibility (contact the faculty)",
        "path": "/fragments/story-article/inclusivity-and-accessibility-contact",
        "section": "content-grey",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section, article).content-block.bg-alt:not(.nopadtop)"
        ],
        "identity": {
          "text": "6cdppd",
          "links": "1foucui",
          "media": "45h",
          "chars": 316,
          "startsWith": "Inclusivity and accessibility"
        },
        "byteIdentical": true,
        "sourcePage": "https://study.unimelb.edu.au/how-to-apply/auditions-and-interviews/bachelor-of-music-composition-auditions-and-interviews",
        "pageCount": 6
      },
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
        "pageCount": 4,
        "reusedFrom": "section-landing",
        "note": "Shared with section-landing: matched by the same identity, linked to the existing landing fragment. The story importer never imports it (sourcePage is a landing page)."
      },
      {
        "slug": "discuss-your-organisations-needs",
        "path": "/fragments/section-landing/discuss-your-organisations-needs",
        "section": "split-navy",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:not(:has(h1)):is(.bg-inverted, .bg-inverted-dark)"
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
        "pageCount": 1,
        "reusedFrom": "section-landing",
        "note": "Shared with section-landing: matched by the same identity, linked to the existing landing fragment. The story importer never imports it (sourcePage is a landing page)."
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
      },
      {
        "section": "events-filter",
        "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:has(.filtered-results__items) div.filtered-results__items",
        "block": "cards",
        "note": "/student-life/events: static copy of the 26 events in the snapshot (3 Oct 2026 onwards; title link, date line, tags, \"View event\"). The Funnelback filter UI (search form, filter links, \"26 events found\", \"Clear search\") is chrome; the AEDT note is kept as default content. The copy goes stale: refresh by re-import or replace with a feed."
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
    "https://study.unimelb.edu.au/student-life/inside-melbourne/acknowledging-country-with-tiriki-onus",
    "https://study.unimelb.edu.au/student-life/inside-melbourne/10-reasons-to-doubt-the-united-states-of-america-is-in-political-decline",
    "https://study.unimelb.edu.au/student-life/student-takeovers/meet-chris-juris-doctor-student",
    "https://study.unimelb.edu.au/student-life/inside-melbourne/how-student-accommodation-can-help-you-make-new-friends",
    "https://study.unimelb.edu.au/student-life/inside-melbourne/stem",
    "https://study.unimelb.edu.au/student-life/inside-melbourne/languages/arabic",
    "https://study.unimelb.edu.au/how-to-apply/auditions-and-interviews/bachelor-of-fine-arts-acting-auditions-and-interviews",
    "https://study.unimelb.edu.au/how-to-apply/equity-entry-schemes",
    "https://study.unimelb.edu.au/how-to-apply/english-language-requirements/undergraduate-english-language-requirements",
    "https://study.unimelb.edu.au/study-with-us/guaranteed-undergraduate-to-graduate-study-pathways/graduate-degree-packages/abpd",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/pg-articles/how-to-fund-your-masters-degree",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses"
  ],
  "unwrap": [
    ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div:not([class]):not([id]):has(> div.section.bg-inverted)"
  ],
  "unwrapRule": "beforeTransform (cleanup, after the Optimizely unwrap and before the anchor rewrite / chrome): every element matching an unwrap selector is replaced by its children, so the wrapped title band and app-tabs become #main regions of their own.",
  "pageMetadata": {
    "Tags": {
      "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.content-block:has(ul.social-list) .tags__link",
      "rule": "Read in beforeTransform before the share bar is removed as chrome: the link texts, trimmed, de-duplicated, joined with \", \" -> page Metadata row \"Tags\". Pages without a share bar get no Tags row."
    }
  },
  "mappingNotes": "migration-work/story-article/analysis.md (spec, section 4 deltas) and migration-work/section-landing/mapping-notes.md (landing model this entry is built from)."
};

export default createLandingImport(PAGE_TEMPLATE);
