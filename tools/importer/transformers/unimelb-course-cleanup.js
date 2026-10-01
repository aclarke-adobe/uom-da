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
      if (/[?&]fac=undefined/.test(href)) {
        // Source bug on the HTA Application Portal href: kept as-is, logged.
        console.warn(`[course-cleanup] source href with fac=undefined kept: ${href}`);
      }
    }

    // EDS paths have no trailing slash (root-relative site links, incl. ones authored relative)
    if (href.startsWith('/') && !href.startsWith('//')) {
      href = href.replace(/^(\/[^?#]*?)\/+(?=[?#]|$)/, '$1');
    }

    if (href !== a.getAttribute('href')) a.setAttribute('href', href);
  });
}

/**
 * Chrome cleanup. Used on the live page (beforeTransform) and on imported template parts.
 */
function cleanCourseChrome(root) {
  removeAll(root, COURSE_CHROME_SELECTORS);
  removeTrackers(root);

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

  // Data tables authored without the `table` class (e.g. table#careers_ "Industries | Companies |
  // Job roles" on engineering career outcomes, table#table74347 majors list on bachelor-of-science
  // structure) are not matched by the table block instance (`table.table`), and a raw <table> left
  // in default content is read by html2md as a block table whose first row is the block name, so
  // its header row was lost. Give every remaining content table the class so the table parser runs.
  root.querySelectorAll('table:not(.table)').forEach((t) => t.classList.add('table'));

  // Empty facts card (a populated one holds the cards-icon grid)
  root.querySelectorAll('.course-content > div.ct-factscard-border').forEach((card) => {
    if (!card.querySelector('img, p, h1, h2, h3, h4, h5, h6, li, a')) card.remove();
  });

  removeComments(root);
  normalizeInlineFormats(root);
}

/**
 * html2md maps <u>, <sub>, <sup> to custom mdast nodes (underline / subscript / superscript) that
 * mdast-util-phrasing does not know. When one of them sits as a loose inline child of a block
 * container (e.g. a bare-text <div>, as Outlook pastes produce:
 *   <div>… submit an <u><a href="…">application</a></u>.</div>)
 * hast-to-mdast lifts the node out to the document root, and the markdown root handler then
 * serialises the WHOLE page as phrasing: every block table runs into the next with no blank lines
 * and md2da turns the page into one paragraph.
 * The importer's own preProcess unwraps `u > a`, but it runs on the page before the transform, so
 * it never sees the template#excat-international copies inserted by the audience transformer
 * (BA how-to-apply). Fix both cases here, on the live page and on the template parts:
 *   - <u> is unwrapped (underline is not authored; mapping-notes "unwrap <small>/<u>");
 *   - loose inline runs that contain <sub>/<sup> inside a block container are wrapped in <p>.
 */
const INLINE_TAGS = /^(A|ABBR|B|BDI|BDO|BR|CITE|CODE|DATA|DFN|EM|I|IMG|KBD|MARK|Q|S|SAMP|SMALL|SPAN|STRONG|SUB|SUP|TIME|U|VAR|WBR|DEL|INS)$/;

function normalizeInlineFormats(root) {
  root.querySelectorAll('u').forEach((u) => {
    if (u.parentNode) u.replaceWith(...u.childNodes);
  });
  const doc = root.ownerDocument || root;
  const containers = new Set();
  root.querySelectorAll('sub, sup').forEach((el) => {
    const parent = el.parentElement;
    if (parent && /^(DIV|SECTION|ARTICLE|ASIDE|MAIN|TD|TH|LI|BLOCKQUOTE|FIGURE|BODY)$/.test(parent.tagName)
      && [...parent.children].some((c) => !INLINE_TAGS.test(c.tagName))) {
      containers.add(parent);
    }
  });
  containers.forEach((parent) => {
    let run = [];
    const flush = (before) => {
      if (run.some((n) => (n.nodeType === 3 ? n.textContent.trim() : true))) {
        const p = doc.createElement('p');
        parent.insertBefore(p, before);
        run.forEach((n) => p.append(n));
      }
      run = [];
    };
    [...parent.childNodes].forEach((n) => {
      if (n.nodeType === 3 || (n.nodeType === 1 && INLINE_TAGS.test(n.tagName))) run.push(n);
      else if (n.nodeType === 1) flush(n);
    });
    flush(null);
  });
}

/** Absolute, normalised form of an image reference (same rules as check-images.mjs). */
function imageKey(raw) {
  if (!raw) return '';
  let v = String(raw).trim().replace(/&amp;/g, '&').replace(/^['"]|['"]$/g, '');
  if (!v || /^(data|blob):/.test(v)) return '';
  if (v.startsWith('//')) v = `https:${v}`;
  try {
    const u = new URL(v, 'https://study.unimelb.edu.au/');
    u.hash = '';
    return u.href;
  } catch (e) {
    return '';
  }
}

/**
 * Remove every reference to a blocked image under root: <img> (src / data-src / srcset; an
 * otherwise empty wrapper such as <picture> or <p> goes with it), inline background-image styles,
 * and <meta content> (og:image / twitter:image).
 */
// Generic placeholders served by the course app (e.g. findacourse.study.unimelb.edu.au/find/_nuxt/
// placeholder-new.<hash>.jpg on honours heroes): never content.
const NON_CONTENT_IMAGE = /\/_nuxt\/placeholder[^/?#]*\.(?:jpe?g|png|gif|webp|svg|avif)(?:[?#]|$)/i;

// Tracking pixels / beacons. Pages imported from a live render (Bright Data fallback) carry the
// <img>/<iframe> beacons that tag scripts inject at runtime (Twitter t.co/i/adsct, Facebook, …);
// snapshots strip scripts but not their output.
const TRACKER_HOST = /(?:^|\.)(?:t\.co|analytics\.twitter\.com|ads-twitter\.com|static\.ads-twitter\.com|facebook\.com|facebook\.net|connect\.facebook\.net|doubleclick\.net|google-analytics\.com|googletagmanager\.com|googleadservices\.com|googlesyndication\.com|bat\.bing\.com|clarity\.ms|px\.ads\.linkedin\.com|snap\.licdn\.com|analytics\.tiktok\.com|ct\.pinterest\.com|tealiumiq\.com|tiqcdn\.com|hotjar\.com|quantserve\.com|demdex\.net|omtrdc\.net|adnxs\.com|everesttech\.net|optimizely\.com)$/i;

function isTracker(raw) {
  if (!raw) return false;
  try {
    const u = new URL(String(raw).trim().replace(/&amp;/g, '&'), 'https://study.unimelb.edu.au/');
    if (TRACKER_HOST.test(u.hostname)) return true;
    return /\/i\/adsct|\/tr\/?\?id=|\/collect\?|\/pixel(?:\.gif)?(?:[?/]|$)/i.test(u.pathname + u.search);
  } catch (e) {
    return false;
  }
}

/** Remove tracking beacons: img/iframe/source/link/embed elements pointing at tracker endpoints. */
function removeTrackers(root) {
  root.querySelectorAll('img, iframe, source, link, embed, object').forEach((el) => {
    const refs = [el.getAttribute('src'), el.getAttribute('data-src'), el.getAttribute('href'), el.getAttribute('data'),
      ...(el.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0])];
    if (!refs.some(isTracker)) return;
    const wrap = el.parentElement && el.parentElement.tagName === 'PICTURE' ? el.parentElement : el;
    const parent = wrap.parentElement;
    wrap.remove();
    if (parent && /^(P|A|SPAN|NOSCRIPT)$/.test(parent.tagName) && !parent.textContent.trim()
      && !parent.querySelector('img, iframe, video')) parent.remove();
  });
  // 1x1 beacons with no tracker host still known (width/height attributes of 1 or 0)
  root.querySelectorAll('img[width="1"][height="1"], img[width="0"][height="0"]').forEach((img) => img.remove());
}

function dropUnloadableImages(root, blocked, dropped) {
  root.querySelectorAll('img').forEach((img) => {
    const refs = [img.getAttribute('src'), img.getAttribute('data-src'), img.getAttribute('data-lazy-src'),
      ...(img.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0])];
    const hit = refs.map(imageKey).find((k) => k && blocked.has(k));
    if (!hit) return;
    dropped.add(hit);
    let target = img;
    const picture = img.closest('picture');
    if (picture) target = picture;
    const parent = target.parentElement;
    target.remove();
    if (parent && /^(P|A|SPAN|FIGURE)$/.test(parent.tagName) && !parent.textContent.trim()
      && !parent.querySelector('img, iframe, video')) parent.remove();
  });
  root.querySelectorAll('[style*="url("]').forEach((el) => {
    const style = el.getAttribute('style');
    const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    const key = m && imageKey(m[2]);
    if (key && blocked.has(key)) {
      dropped.add(key);
      el.setAttribute('style', style.replace(/background(?:-image)?\s*:[^;]*url\([^)]*\)[^;]*;?/gi, ''));
    }
  });
  root.querySelectorAll('meta[content]').forEach((meta) => {
    const key = imageKey(meta.getAttribute('content'));
    if (key && blocked.has(key)) {
      dropped.add(key);
      meta.remove();
    }
  });
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

    // Images that cannot be loaded on the source (tools/importer/unloadable-images.json, passed in by
    // the import script) are dropped before any parser runs, on the page, in the template parts and
    // in the head (og:image feeds the Metadata block), so no block is left with an empty image cell.
    // Also always dropped: the generic hero placeholder (not content, not embeddable cross-origin).
    const list = new Set((payload && payload.unloadableImages) || []);
    const blocked = { has: (k) => list.has(k) || NON_CONTENT_IMAGE.test(k) };
    {
      const dropped = new Set(doc.excatDroppedImages || []);
      dropUnloadableImages(element, blocked, dropped);
      doc.querySelectorAll('template[id^="excat-"]').forEach((tpl) => {
        dropUnloadableImages(tpl.content && tpl.content.childNodes.length ? tpl.content : tpl, blocked, dropped);
      });
      if (doc.head) dropUnloadableImages(doc.head, blocked, dropped);
      doc.excatDroppedImages = [...dropped];
      dropped.forEach((u) => console.warn(`[course-cleanup] image dropped (cannot be loaded on the source): ${u}`));
    }
  }

  if (hookName === TransformHook.afterTransform) {
    removeAll(element, AFTER_PARSE_SELECTORS);
    removeAll(element, COURSE_CHROME_SELECTORS);
    removeTrackers(element);
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
