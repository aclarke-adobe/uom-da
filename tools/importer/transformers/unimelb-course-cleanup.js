/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au course-detail cleanup (chrome removal + link fixes).
 *
 * Course pages only. The homepage keeps using unimelb-cleanup.js.
 * The spec is migration-work/course-detail/mapping-notes.md, "Chrome and cleanup" and
 * "Link rewrites and fixes". Every selector was checked against the raw BD snapshots in
 * tools/importer/bd-snapshots/study.unimelb.edu.au/find/courses/** (BA fees / how-to-apply /
 * structure, MMA how-to-apply / structure / entry-requirements).
 *
 * Run order (see the import script): unimelb-course-cleanup -> unimelb-course-audience ->
 * unimelb-course-sections, in both hooks.
 *
 * The international / options template parts (template#excat-international,
 * template#excat-options) are cleaned in place here too (their .content fragments), so the
 * audience transformer imports already-cleaned copies and the tabs parser reads clean
 * option roots. The file is self-contained (no imports / named exports) because the
 * transformer validator injects it as a classic script.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Removed in beforeTransform, before sections and parsers. Also applied to the template parts
// (template#excat-international / #excat-options .content).
const COURSE_CHROME_SELECTORS = [
  // Sticky CTA bar + tab sub-nav (#main > div > div.stickyPanel)
  '#main > div > div.stickyPanel',
  'div.stickyPanel',
  // Prev/next pager. On UG it is a child of B; on graduate ER/HTA it is a sibling of B.
  // In the international body part it sits inside [data-excat-part=body].
  "#main nav.bg-alt[aria-label='pagination links']",
  '[data-excat-part=body] nav.bg-alt',
  // "How can we help?" band
  '#main > div > div.slimline-cta',
  'div.slimline-cta',
  // Observer sentinel
  '#observerSensor',
  // Live-agent chat placeholder (bulk sweep)
  '#liveagent',
  // Breadcrumbs, saved courses
  "div.breadcrumbs-bar[data-test='breadcrumbs-bar']",
  'dash-cart',
  // Header / mega menu / skip links / font loader
  '#__nuxt header',
  'uom-ds-mega-menu',
  '.screen-reader-jump-to',
  'uom-ds-font-loader-component',
  // Footer (holds the only social/share icons on course pages)
  'footer.uom-page-footer',
  // Consent UI
  '#__tealiumGDPRecModal',
  '.tealium_privacy_prompt',
  '#teleports',
  // Optimizely client-storage iframe
  "iframe[src*='optimizely']",
  // Fees subtitle "(showing fees for domestic students - change)"
  "#fees span.header-icon__subtitle[data-test='fees-overview-subtitle']",
  "span.header-icon__subtitle[data-test='fees-overview-subtitle']",
  // UG entry-requirements qualification / start-year selects
  "#admission-requirements .user-profile__select:has(select[data-test='profile-qualification'])",
  "#admission-requirements .user-profile__select:has(select[data-test='profile-year'])",
  // Graduate residency "Change" link and the fees "change" link
  'a.btn--toggle[data-test=profile-toggle]',
  'a.btn--toggle[data-test=profile-toggle-fees]',
  // Key-facts "Save" widget
  'div.key-facts .key-facts-cta .cell:has(> dash-save-button)',
  'dash-save-button',
  // Decorative
  '#available-subjects .loading-overlay',
  'span.togglerow__chevron',
  "button[data-test='alumni-button']",
  '.date-entry__icon',
  "a[data-test='callout-panel-button'] .push-icon",
  '.push-icon img',
  '#main .uom-link__icon',
  '.uom-link__icon',
  'span.screenreaders-only',
  "img[src^='data:image/svg+xml']",
  // Non-authorable elements
  'script',
  'noscript',
  'style',
  'link',
];

// Removed in afterTransform only: parsers read these first (tabs parser reads the dropdown
// option labels; residency-notice parser reads the entry-point radio labels).
const AFTER_PARSE_SELECTORS = [
  '#sample-plans .sample-plan__dropdown',
  '#sample-plans .sample-plan-controls', // "Collapse all" / "Expand all"
  '.sample-plan-controls',
  '#available-subjects .subject-programs__dropdown',
  '#program-select-radio-group input[type=radio]',
  '#available-subjects .loading-overlay',
  'template#excat-international',
  'template#excat-options',
  'template[id^="excat-"]',
];

const STUDY_HOST = /^https?:\/\/study\.unimelb\.edu\.au(?=[/?#]|$)/i;

// In-page anchors -> slug of the target section's heading text.
const ANCHOR_REWRITES = {
  '#explained': '#your-fees-explained',
  '#available-subjects': '#explore-this-course',
  '#available-pathways': '#graduate-pathways',
  '#sample-plans': '#sample-course-plan',
};

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    let nodes = [];
    try {
      nodes = root.querySelectorAll(sel);
    } catch (e) {
      nodes = [];
    }
    nodes.forEach((n) => { if (n.isConnected || n.parentNode) n.remove(); });
  });
}

function removeComments(root) {
  const doc = root.ownerDocument || root;
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());
}

/**
 * Link fixes. Idempotent; runs in both hooks and on the template parts.
 */
function fixCourseLinks(root) {
  root.querySelectorAll('a').forEach((a) => {
    ['target', 'rel'].forEach((attr) => a.removeAttribute(attr));
    if (a.getAttribute('tabindex') === '-1') a.removeAttribute('tabindex');
    // Outlook paste attributes
    [...a.attributes].forEach((attr) => {
      if (/^(originalsrc|shash|data-auth|data-linkindex|data-ogsc|data-ogab)$/i.test(attr.name)) {
        a.removeAttribute(attr.name);
      }
    });

    if (!a.hasAttribute('href')) return;
    let href = a.getAttribute('href').trim();

    // Protocol-relative -> https
    if (href.startsWith('//')) href = `https:${href}`;

    // In-page anchors
    if (ANCHOR_REWRITES[href]) href = ANCHOR_REWRITES[href];

    // Absolute study.unimelb.edu.au -> root-relative (handbook and other hosts stay absolute)
    if (STUDY_HOST.test(href)) {
      href = href.replace(STUDY_HOST, '') || '/';
      // Drop the "#nav" suffix on tab links
      href = href.replace(/#nav$/, '');
      // Truncated "/entry-requirement" -> "/entry-requirements" (defensive)
      href = href.replace(/\/entry-requirement(?=[/?#]|$)/, '/entry-requirements');
      // EDS paths have no trailing slash
      href = href.replace(/^(\/[^?#]*?)\/+(?=[?#]|$)/, '$1');
      if (/[?&]fac=undefined/.test(href)) {
        // Source bug on the HTA Application Portal href: kept as-is, logged.
        console.warn(`[course-cleanup] source href with fac=undefined kept: ${href}`);
      }
    }

    if (href !== a.getAttribute('href')) a.setAttribute('href', href);
  });
}

/**
 * Chrome cleanup. Used on the live page (beforeTransform) and on imported template parts.
 */
function cleanCourseChrome(root) {
  removeAll(root, COURSE_CHROME_SELECTORS);

  // Inline SVG icons and data:/blob: icon images cannot be authored (the importer's
  // preProcess has already rewritten data: <img> sources to blob: URLs on the live page).
  root.querySelectorAll('svg').forEach((svg) => { if (svg.parentNode) svg.remove(); });
  root.querySelectorAll('img').forEach((img) => {
    const src = (img.getAttribute('src') || '').trim();
    if (/^(?:data:image\/svg\+xml|blob:)/i.test(src)) img.remove();
  });

  // Empty tables (BA #table42041, empty key-dates tables on graduate HTA)
  root.querySelectorAll('table').forEach((t) => {
    if (!t.querySelector('td, th')) t.remove();
  });

  // Empty facts card (a populated one holds the cards-icon grid)
  root.querySelectorAll('.course-content > div.ct-factscard-border').forEach((card) => {
    if (!card.querySelector('img, p, h1, h2, h3, h4, h5, h6, li, a')) card.remove();
  });

  removeComments(root);
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    cleanCourseChrome(element);
    fixCourseLinks(element);

    // Template parts are inert (<template>.content is a separate fragment that querySelectorAll
    // on the page never reaches), so clean them explicitly with the same rules.
    const doc = element.ownerDocument || document;
    doc.querySelectorAll('template[id^="excat-"]').forEach((tpl) => {
      const frag = tpl.content && tpl.content.childNodes.length ? tpl.content : tpl;
      cleanCourseChrome(frag);
      fixCourseLinks(frag);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    removeAll(element, AFTER_PARSE_SELECTORS);
    removeAll(element, COURSE_CHROME_SELECTORS);
    fixCourseLinks(element);
    removeComments(element);

    // Import scaffolding attributes (sections transformer uses its own marker on <hr>)
    element
      .querySelectorAll('[data-excat-audience], [data-excat-section-start], [data-excat-section-skip], [data-excat-hero-codes], [data-excat-residency], [data-excat-part]')
      .forEach((el) => {
        ['data-excat-audience', 'data-excat-section-start', 'data-excat-section-skip', 'data-excat-hero-codes', 'data-excat-residency', 'data-excat-part']
          .forEach((attr) => el.removeAttribute(attr));
      });
  }
}
