/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au section-landing cleanup (chrome removal, anchor rewrites,
 * link fixes, snapshot-extras follow-up).
 *
 * section-landing pages only (258 pages, UI kit v17.11 BD snapshots). The homepage keeps
 * unimelb-cleanup.js, course pages keep unimelb-course-cleanup.js.
 * Spec: migration-work/section-landing/mapping-notes.md ("Chrome and cleanup", "In-page anchor
 * rewrites", "Snapshot contracts") and templates[section-landing].{chrome, drops, widgets,
 * anchorRewrite, snapshotContracts} in tools/importer/page-templates.json. Every selector below
 * is from that list, which was verified on the raw snapshots
 * tools/importer/bd-snapshots/study.unimelb.edu.au/<path>.html.
 *
 * Run order (both hooks): unimelb-landing-cleanup -> unimelb-landing-audience ->
 * unimelb-landing-fragments -> unimelb-landing-sections.
 *
 * beforeTransform, on the live page AND on the template#excat-organisations parts:
 *   1. remove the hidden Optimizely variants, unwrap the default variant span in place (an <hr>
 *      inside an inline <span> would not survive html2md; every region selector uses the ROOT
 *      form, so it matches with or without the span);
 *   2. in-page anchor rewrite (anchorRewrite; must run before the empty anchor divs go);
 *   3. chrome list (template.chrome, minus template#excat-organisations, which the audience
 *      transformer still needs), drops, tracking pixels / consent beacons, comments;
 *   4. data:/blob: SVG images, except the pictogram holders the cards-icon parser maps
 *      (.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left);
 *   5. unwrap <u>, wrap loose <sub>/<sup> runs; link fixes (trim, protocol-relative -> https,
 *      study.unimelb.edu.au -> root-relative except files, no trailing slash on root-relative).
 * afterTransform (parsers have run and read data-excat-video-src / data-excat-bg):
 *   - widgets: region -> /widgets/<name>.html link (course-listing keeps its intro);
 *   - leftover [data-excat-bg] (default content, e.g. full-width-image) -> <img alt=aria-label>;
 *     leftover [data-excat-video-src] outside a block -> link paragraph;
 *   - remove every <template>, the chrome list again, trackers; link fixes again;
 *   - strip all data-excat-* attributes EXCEPT data-excat-landing-* (the sections transformer's
 *     own <hr> markers, removed by that transformer's afterTransform, which runs after this one).
 *
 * The file is self-contained (no imports / named exports): the save-time validator loads it as a
 * classic script.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };
const LOG = '[landing-cleanup]';
const STUDY_ORIGIN = 'https://study.unimelb.edu.au';
const STUDY_HOST = /^https?:\/\/study\.unimelb\.edu\.au(?=[/?#]|$)/i;
// Files on study.unimelb.edu.au stay absolute (mapping-notes "PDFs stay absolute").
const FILE_HREF = /(?:\.(?:pdf|docx?|xlsx?|pptx?|zip)(?:[?#]|$))|\/__data\/assets\/(?:pdf_file|file|word_doc|excel_doc|powerpoint_doc)\//i;

const ROOT = ':is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type)';
const PICTOGRAM_HOLDERS = '.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left';
const HIDDEN_VARIANTS = '#main > .optimizely_experiment > span.optimizely_experiment__block:not(:first-of-type)';

// templates[section-landing].chrome (page-templates.json), embedded so the transformer also works
// when the payload template carries no chrome list. template#excat-organisations is NOT here: it
// is removed in afterTransform, after the audience transformer has consumed it.
const DEFAULT_CHROME = [
  '.screen-reader-jump-to',
  'uom-ds-mega-menu',
  'uom-ds-font-loader-component',
  '#__nuxt header',
  '#ui > header',
  '#ui > nav.uom-breadcrumbs',
  'div.breadcrumbs-bar[data-test="breadcrumbs-bar"]',
  'footer.uom-page-footer',
  '#__tealiumGDPRecModal',
  '.tealium_privacy_prompt',
  '#teleports',
  'iframe[src*="optimizely"]',
  // "How can we help?": in #ui on 137 pages, in #main on 121
  ':is(#ui, #main) > section.uom-link-list-section',
  'dash-cart',
  '#main > div.stickyPanel',
  '#main div.in-page-nav-today',
  '#observerSensor',
  '#liveagent',
  HIDDEN_VARIANTS,
  'div.ct-inpagenav nav.in-page-navigation-v2__collapsed',
  '#main > link',
  '#main > meta',
  '#main style',
  '#main script',
  // empty anchor divs (after the anchor rewrite)
  '#main div[id]:not([class]):empty',
  '#main > div:not([class]):not([id]):empty',
  '#main > p[id]:empty',
  // empty live-feed listings (study-business, Instructional-Leadership-Spotlight-Series)
  // (the list is re-applied in afterTransform, when a parsed listing holds a block table instead)
  'div.ct-eventslisting:not(:has(li.event)):not(:has(table))',
  // decorative
  'img[src^="data:image/svg+xml"]:not(:is(.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left) img)',
  '.uom-link__icon',
  '.uom-icon',
  'span.screenreaders-only',
  '.sr-only',
  'span.togglerow__chevron',
  '.uom-video-controls',
  '#who-you-will-learn-from .page-short-course__profile-content > :empty',
  '.ct-textcolumnlayout .card-flat-list:not(:has(a, img, p, h3))',
  // non-authorable elements anywhere
  'script',
  'noscript',
  'style',
  'link',
];

// templates[section-landing].drops
const DEFAULT_DROPS = [`${ROOT} > div.ct-focusboxpathfinder > img`];

// templates[section-landing].widgets
const DEFAULT_WIDGETS = [
  { section: 'conversion-tool', selector: `${ROOT} > div.section:has(#conversion-tool-app)`, widget: '/widgets/grade-conversion-calculator.html' },
  { section: 'course-listing', selector: `${ROOT} > div.CourseListing`, widget: '/widgets/online-course-listing.html', keep: ':scope > .content-block.bg-inverted' },
  { section: 'on-demand-library', selector: `${ROOT} > div.filter-category`, widget: '/widgets/on-demand-video-library.html' },
];

// Headings inside these never become anchor targets (they are chrome, removed right after).
const ANCHOR_SKIP = '#main > div.stickyPanel, #main div.in-page-nav-today, section.uom-link-list-section, dash-cart, #liveagent, nav.in-page-navigation-v2__collapsed';

function toList(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    let nodes = [];
    try {
      nodes = root.querySelectorAll(sel);
    } catch (e) {
      nodes = [];
    }
    nodes.forEach((n) => { if (n.parentNode) n.remove(); });
  });
}

function chromeList(template) {
  const fromTemplate = toList(template && template.chrome).filter((s) => !/^template\b/.test(s));
  return [...new Set([...DEFAULT_CHROME, ...fromTemplate])];
}

function removeComments(root) {
  const doc = root.ownerDocument || root;
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());
}

/* ---------- Optimizely ---------- */

function unwrapOptimizely(root) {
  removeAll(root, [HIDDEN_VARIANTS]);
  root.querySelectorAll('#main > .optimizely_experiment').forEach((exp) => {
    const span = exp.querySelector(':scope > span.optimizely_experiment__block');
    if (span) exp.replaceWith(...span.childNodes);
    else if (!exp.textContent.trim() && !exp.querySelector('img, iframe')) exp.remove();
  });
}

/* ---------- In-page anchor rewrite ---------- */

// EDS heading-id slug: lower-case, NFD accents stripped, non [0-9a-z] -> "-", collapsed, trimmed.
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^0-9a-z]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function headingText(h) {
  const c = h.cloneNode(true);
  c.querySelectorAll('span.screenreaders-only, .sr-only, .uom-icon, svg, img').forEach((n) => n.remove());
  return c.textContent.replace(/\s+/g, ' ').trim();
}

function pagePathOf(doc, payload) {
  const candidates = [
    payload && payload.params && payload.params.originalURL,
    (doc.querySelector('link[rel="canonical"]') || {}).href ? doc.querySelector('link[rel="canonical"]').getAttribute('href') : null,
    doc.querySelector('meta[property="og:url"]') ? doc.querySelector('meta[property="og:url"]').getAttribute('content') : null,
    payload && payload.url,
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    try {
      const u = new URL(String(raw).trim(), `${STUDY_ORIGIN}/`);
      if (/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && raw === (payload && payload.url) && candidates.some((c) => c && c !== raw)) continue;
      return u.pathname.replace(/\/+$/, '') || '/';
    } catch (e) { /* next */ }
  }
  return null;
}

// Target of an in-page id. Matrix pages sometimes carry the id twice (an empty anchor div AND the
// heading, e.g. graduate-degree-packages #eligibility): a heading with the id wins.
function findById(scope, doc, id) {
  if (!id) return null;
  const sel = `[id="${String(id).replace(/["\\]/g, '\\$&')}"]`;
  const pick = (root, s) => {
    let list = [];
    try {
      list = [...root.querySelectorAll(s)];
    } catch (e) {
      list = [];
    }
    return list.find((e) => /^H[1-6]$/.test(e.tagName) && headingText(e)) || list[0] || null;
  };
  let el = pick(scope, sel);
  if (!el && scope !== doc && doc) el = pick(doc, `#main ${sel}`);
  return el;
}

function targetHeading(target, mainRoot) {
  if (/^H[1-6]$/.test(target.tagName) && headingText(target)) return target;
  const inner = [...target.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => headingText(h));
  if (inner) return inner;
  // first non-empty heading after the target (empty anchor divs such as div#apply)
  const all = [...mainRoot.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => !h.closest(ANCHOR_SKIP) && headingText(h));
  return all.find((h) => target.compareDocumentPosition(h) & 4 /* FOLLOWING */) || null;
}

/**
 * anchorRewrite: every #main content link whose fragment targets this page gets
 * href="#<slug of the target heading>". Unresolved targets keep the source href (logged).
 */
function rewriteAnchors(root, doc, path) {
  const mainRoot = (root.matches && root.matches('#main')) ? root : (root.querySelector('#main') || root);
  const stats = { rewritten: 0, unresolved: 0 };
  mainRoot.querySelectorAll('a[href]').forEach((a) => {
    if (a.closest(ANCHOR_SKIP) && !a.closest('div.ct-inpagenav')) return;
    const href = a.getAttribute('href').trim();
    let frag = null;
    if (href.startsWith('#')) {
      frag = href.slice(1);
    } else if (path) {
      try {
        const u = new URL(href.startsWith('//') ? `https:${href}` : href, `${STUDY_ORIGIN}${path}`);
        if (u.origin === STUDY_ORIGIN && (u.pathname.replace(/\/+$/, '') || '/') === path && u.hash) frag = u.hash.slice(1);
      } catch (e) {
        frag = null;
      }
    }
    if (!frag) return;
    let id = frag;
    try {
      id = decodeURIComponent(frag);
    } catch (e) { /* keep raw */ }
    const target = findById(mainRoot, doc, id) || findById(mainRoot, doc, id.replace(/^navigation-/, ''));
    const heading = target ? targetHeading(target, mainRoot) : null;
    const slug = heading ? slugify(headingText(heading)) : '';
    if (!slug) {
      stats.unresolved += 1;
      console.warn(`${LOG} anchor unresolved, source href kept: ${href}`);
      return;
    }
    if (href !== `#${slug}`) {
      a.setAttribute('href', `#${slug}`);
      stats.rewritten += 1;
    }
  });
  return stats;
}

/* ---------- Links ---------- */

function fixLinks(root) {
  root.querySelectorAll('a').forEach((a) => {
    ['target', 'rel'].forEach((attr) => a.removeAttribute(attr));
    if (a.getAttribute('tabindex') === '-1') a.removeAttribute('tabindex');
    if (!a.hasAttribute('href')) return;
    const raw = a.getAttribute('href');
    let href = raw.trim();
    if (href.startsWith('//')) href = `https:${href}`;
    if (STUDY_HOST.test(href) && !FILE_HREF.test(href)) {
      href = href.replace(STUDY_HOST, '') || '/';
    } else if (/^http:\/\/study\.unimelb\.edu\.au/i.test(href)) {
      href = href.replace(/^http:/i, 'https:');
    }
    // EDS paths have no trailing slash
    if (href.startsWith('/') && !href.startsWith('//')) {
      href = href.replace(/^(\/[^?#]*?)\/+(?=[?#]|$)/, '$1');
    }
    if (href !== raw) a.setAttribute('href', href);
  });
}

/* ---------- Inline formats ---------- */

const INLINE_TAGS = /^(A|ABBR|B|BDI|BDO|BR|CITE|CODE|DATA|DFN|EM|I|IMG|KBD|MARK|Q|S|SAMP|SMALL|SPAN|STRONG|SUB|SUP|TIME|U|VAR|WBR|DEL|INS)$/;

// <u> is not authored (and html2md's underline node breaks phrasing); loose inline runs holding
// <sub>/<sup> inside a block container are wrapped in <p> (same fix as the course cleanup).
function normalizeInlineFormats(root) {
  root.querySelectorAll('u').forEach((u) => { if (u.parentNode) u.replaceWith(...u.childNodes); });
  const doc = root.ownerDocument || root;
  const containers = new Set();
  root.querySelectorAll('sub, sup').forEach((el) => {
    const parent = el.parentElement;
    if (parent && /^(DIV|SECTION|ARTICLE|ASIDE|MAIN|TD|TH|LI|BLOCKQUOTE|FIGURE|BODY)$/.test(parent.tagName)
      && [...parent.children].some((c) => !INLINE_TAGS.test(c.tagName))) containers.add(parent);
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

/* ---------- Images: decorative, trackers, unloadable ---------- */

function removeDecorativeImages(root) {
  root.querySelectorAll('img').forEach((img) => {
    const src = (img.getAttribute('src') || '').trim();
    // the importer's preProcess rewrites data: <img> sources to blob: on the live page
    if (/^(?:data:image\/svg\+xml|blob:)/i.test(src) && !img.closest(PICTOGRAM_HOLDERS)) img.remove();
  });
  // inline SVG outside the pictogram holders is icon chrome
  root.querySelectorAll('svg').forEach((svg) => { if (svg.parentNode && !svg.closest(PICTOGRAM_HOLDERS)) svg.remove(); });
}

const TRACKER_HOST = /(?:^|\.)(?:t\.co|analytics\.twitter\.com|ads-twitter\.com|static\.ads-twitter\.com|facebook\.com|facebook\.net|connect\.facebook\.net|doubleclick\.net|google-analytics\.com|googletagmanager\.com|googleadservices\.com|googlesyndication\.com|bat\.bing\.com|clarity\.ms|px\.ads\.linkedin\.com|snap\.licdn\.com|analytics\.tiktok\.com|ct\.pinterest\.com|tealiumiq\.com|tiqcdn\.com|hotjar\.com|quantserve\.com|demdex\.net|omtrdc\.net|adnxs\.com|everesttech\.net|optimizely\.com)$/i;

function isTracker(raw) {
  if (!raw) return false;
  try {
    const u = new URL(String(raw).trim().replace(/&amp;/g, '&'), `${STUDY_ORIGIN}/`);
    if (TRACKER_HOST.test(u.hostname)) return true;
    return /\/i\/adsct|\/tr\/?\?id=|\/collect\?|\/pixel(?:\.gif)?(?:[?/]|$)/i.test(u.pathname + u.search);
  } catch (e) {
    return false;
  }
}

// Tracking pixels / consent beacons (img/iframe/source/embed pointing at tracker endpoints, 1x1 images).
function removeTrackers(root) {
  root.querySelectorAll('img, iframe, source, embed, object').forEach((el) => {
    // a tracker host inside a content <a href> is not a beacon; only the element's own refs count
    const refs = [el.getAttribute('src'), el.getAttribute('data-src'), el.getAttribute('data'),
      ...(el.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0])];
    if (!refs.some(isTracker)) return;
    const wrap = el.parentElement && el.parentElement.tagName === 'PICTURE' ? el.parentElement : el;
    const parent = wrap.parentElement;
    wrap.remove();
    if (parent && /^(P|A|SPAN)$/.test(parent.tagName) && !parent.textContent.trim()
      && !parent.querySelector('img, iframe, video')) parent.remove();
  });
  root.querySelectorAll('img[width="1"][height="1"], img[width="0"][height="0"]').forEach((img) => img.remove());
}

function imageKey(raw) {
  if (!raw) return '';
  let v = String(raw).trim().replace(/&amp;/g, '&').replace(/^['"]|['"]$/g, '');
  if (!v || /^(data|blob):/.test(v)) return '';
  if (v.startsWith('//')) v = `https:${v}`;
  try {
    const u = new URL(v, `${STUDY_ORIGIN}/`);
    u.hash = '';
    return u.href;
  } catch (e) {
    return '';
  }
}

// Optional: payload.unloadableImages (as the course import passes) -> dropped before parsing.
function dropUnloadableImages(root, blocked, dropped) {
  root.querySelectorAll('img').forEach((img) => {
    const refs = [img.getAttribute('src'), img.getAttribute('data-src'),
      ...(img.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0])];
    const hit = refs.map(imageKey).find((k) => k && blocked.has(k));
    if (!hit) return;
    dropped.add(hit);
    const target = img.closest('picture') || img;
    const parent = target.parentElement;
    target.remove();
    if (parent && /^(P|A|SPAN|FIGURE)$/.test(parent.tagName) && !parent.textContent.trim()
      && !parent.querySelector('img, iframe, video')) parent.remove();
  });
  root.querySelectorAll('[data-excat-bg]').forEach((el) => {
    const key = imageKey(el.getAttribute('data-excat-bg'));
    if (key && blocked.has(key)) {
      dropped.add(key);
      el.removeAttribute('data-excat-bg');
    }
  });
}

/* ---------- Template parts ---------- */

function templateRoots(doc) {
  return [...doc.querySelectorAll('template[id^="excat-"]')]
    .map((tpl) => (tpl.content && tpl.content.childNodes.length ? tpl.content : tpl));
}

function cleanRoot(root, doc, template, path) {
  unwrapOptimizely(root);
  const anchors = rewriteAnchors(root, doc, path);
  removeAll(root, chromeList(template));
  removeAll(root, toList(template && template.drops).map((d) => (typeof d === 'string' ? d : d.selector)).concat(DEFAULT_DROPS));
  removeTrackers(root);
  removeDecorativeImages(root);
  removeSourceRulesAndEmptyHeadings(root);
  removeComments(root);
  normalizeInlineFormats(root);
  fixLinks(root);
  normalizeHeadings(root);
  markCrestButtons(root);
  return anchors;
}

/* ---------- Headings ---------- */

function regionOf(el) {
  let top = el;
  while (top.parentElement && !top.parentElement.matches('#main, span.optimizely_experiment__block')) top = top.parentElement;
  return top.parentElement ? top : null;
}

function retag(el, tag) {
  const doc = el.ownerDocument;
  const h = doc.createElement(tag);
  [...el.attributes].forEach((a) => h.setAttribute(a.name, a.value));
  h.append(...el.childNodes);
  el.replaceWith(h);
  return h;
}

/**
 * - A heading wrapped in another heading (Matrix paste, e.g. for-organisations
 *   <h3 class="heading-section"><center><h2>…</h2></center></h3>, hansen <h2><center><h2>…</h2></center></h2>)
 *   becomes the inner heading alone: html2md would write the inner one as a literal "## " inside the
 *   outer. The inner heading is the one the source renders (plain h2: serif), so it is kept as is.
 * - h3.heading-section that opens its region (ct-section-crest, ct-newslisting, ct-profilelist,
 *   ct-imagelisting) is the section title, the same role and style as h2.heading-section: h2.
 */
function normalizeHeadings(root) {
  root.querySelectorAll(':is(h1, h2, h3, h4, h5, h6):has(:is(h1, h2, h3, h4, h5, h6))').forEach((outer) => {
    if (!outer.isConnected && !outer.parentNode) return;
    const inner = outer.querySelector('h1, h2, h3, h4, h5, h6');
    if (!inner || outer.textContent.replace(/\s+/g, '') !== inner.textContent.replace(/\s+/g, '')) return;
    outer.replaceWith(inner);
  });
  root.querySelectorAll('h3.heading-section').forEach((h) => {
    const region = regionOf(h);
    if (!region || region.querySelector('h1, h2, h3, h4, h5, h6') !== h) return;
    retag(h, 'h2');
  });
}

/* ---------- Buttons ---------- */

/**
 * ct-section-crest call to action (div > a.btn[--secondary]): the site's button convention,
 * <p><strong><a> (btn, cyan) / <p><em><a> (btn--secondary, sage); btn--text stays a text link.
 */
function markCrestButtons(root) {
  const doc = root.ownerDocument || root;
  root.querySelectorAll('.ct-section-crest a.btn, .ct-section-crest a[class*="btn--"]').forEach((a) => {
    const cls = a.className || '';
    if (/btn--text/.test(cls) || a.closest('strong, em')) return;
    const link = doc.createElement('a');
    link.setAttribute('href', (a.getAttribute('href') || '').trim());
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    if (!link.textContent) return;
    const wrap = doc.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
    wrap.append(link);
    const p = doc.createElement('p');
    p.append(wrap);
    const parent = a.parentElement;
    if (parent && /^(DIV|P)$/.test(parent.tagName) && parent.textContent.trim() === a.textContent.trim()
      && !parent.matches('.section__inner')) parent.replaceWith(p);
    else a.replaceWith(wrap);
  });
}

// Source <hr> (decorative hr.alumni__line in ct-testimonial alumni cards, bare <hr> dividers in a
// few short-course / health bodies) would become section breaks in EDS: only the sections
// transformer's breaks may exist. Empty Matrix headings (e.g. <h2 id="navigation-<hid-2-…>"></h2>
// on graduate-degree-packages) are not content either.
function removeSourceRulesAndEmptyHeadings(root) {
  root.querySelectorAll('hr:not([data-excat-landing-section])').forEach((hr) => hr.remove());
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (!h.textContent.trim() && !h.querySelector('img, picture, iframe')) h.remove();
  });
}

/* ---------- afterTransform helpers ---------- */

// Interactive apps have no authorable content and no EDS widget yet: link to the live tool
// on the source page instead of a /widgets/ path that would fail to load.
const WIDGET_LABELS = {
  'conversion-tool': 'grade conversion calculator',
  'course-listing': 'online course browser',
  'on-demand-library': 'on-demand video library',
};

function replaceWidgets(element, template, pageUrl) {
  const doc = element.ownerDocument;
  let liveUrl = '';
  try {
    liveUrl = `https://study.unimelb.edu.au${new URL(pageUrl).pathname.replace(/\/$/, '')}`;
  } catch (e) { /* no page url */ }
  const widgets = toList(template && template.widgets).length ? template.widgets : DEFAULT_WIDGETS;
  widgets.forEach((w) => {
    let nodes = [];
    try {
      nodes = element.querySelectorAll(w.selector);
    } catch (e) {
      nodes = [];
    }
    nodes.forEach((region) => {
      const wrap = doc.createElement('div');
      if (w.keep) {
        try {
          region.querySelectorAll(w.keep).forEach((k) => wrap.append(k));
        } catch (e) { /* no keep */ }
      }
      const p = doc.createElement('p');
      const a = doc.createElement('a');
      const href = liveUrl || w.widget;
      a.setAttribute('href', href);
      a.textContent = liveUrl ? `Open the ${WIDGET_LABELS[w.section] || 'interactive tool'}` : w.widget;
      p.append(a);
      wrap.append(p);
      region.replaceWith(wrap);
      console.log(`${LOG} widget ${w.section || ''} -> ${href}`);
    });
  });
}

// data-excat-bg not consumed by a parser (default content: full-width-image,
// ct-section-imagefullwidth) -> a real <img>; alt from aria-label.
function materializeBackgrounds(element) {
  const doc = element.ownerDocument;
  element.querySelectorAll('[data-excat-bg]').forEach((el) => {
    const src = (el.getAttribute('data-excat-bg') || '').trim();
    // the captured URL replaces the inline CSS background: left in place, the importer's
    // transformBackgroundImages rule would emit the same image a second time (without its alt),
    // e.g. the international country pages' full-width image
    if (src && el.style && el.style.backgroundImage) el.style.removeProperty('background-image');
    if (!src || el.querySelector('img')) return;
    const img = doc.createElement('img');
    img.setAttribute('src', src);
    const alt = (el.getAttribute('aria-label') || '').replace(/^[\s“”"']+|[\s“”"']+$/g, '');
    img.setAttribute('alt', alt);
    if (el.tagName === 'TD' || el.closest('table')) el.prepend(img);
    else {
      const p = doc.createElement('p');
      p.append(img);
      el.prepend(p);
    }
  });
}

// data-excat-video-src left outside any block (no video parser ran) -> link paragraph, so the
// captured URL is never lost.
function materializeVideos(element) {
  const doc = element.ownerDocument;
  element.querySelectorAll('[data-excat-video-src]').forEach((el) => {
    if (el.closest('table')) return;
    const src = (el.getAttribute('data-excat-video-src') || '').trim();
    if (!src) return;
    const m = src.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    const href = m ? `https://www.youtube.com/watch?v=${m[1]}` : src;
    if ([...el.querySelectorAll('a[href]')].some((a) => a.getAttribute('href') === href)) return;
    const p = doc.createElement('p');
    const a = doc.createElement('a');
    a.setAttribute('href', href);
    a.textContent = href;
    p.append(a);
    el.append(p);
  });
}

function stripExcatAttributes(element) {
  element.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (/^data-excat-/.test(attr.name) && !/^data-excat-landing-/.test(attr.name)) el.removeAttribute(attr.name);
    });
  });
}

export default function transform(hookName, element, payload) {
  const template = (payload && payload.template) || {};
  const doc = element.ownerDocument || document;

  if (hookName === TransformHook.beforeTransform) {
    const path = pagePathOf(doc, payload);
    const stats = cleanRoot(element, doc, template, path);
    if (stats.rewritten || stats.unresolved) console.log(`${LOG} anchors rewritten ${stats.rewritten}, unresolved ${stats.unresolved}`);

    // Template parts are inert (<template>.content is a separate fragment), so clean them
    // explicitly with the same rules; the audience transformer then imports clean copies.
    templateRoots(doc).forEach((frag) => cleanRoot(frag, doc, template, path));

    const list = new Set((payload && payload.unloadableImages) || []);
    if (list.size) {
      const dropped = new Set(doc.excatDroppedImages || []);
      dropUnloadableImages(element, list, dropped);
      templateRoots(doc).forEach((frag) => dropUnloadableImages(frag, list, dropped));
      if (doc.head) dropUnloadableImages(doc.head, list, dropped);
      doc.excatDroppedImages = [...dropped];
      dropped.forEach((u) => console.warn(`${LOG} image dropped (cannot be loaded on the source): ${u}`));
    }
  }

  if (hookName === TransformHook.afterTransform) {
    replaceWidgets(element, template, (payload && payload.params && payload.params.originalURL) || '');
    materializeBackgrounds(element);
    materializeVideos(element);
    // import scaffolding must never leak into the content
    doc.querySelectorAll('template[id^="excat-"]').forEach((t) => t.remove());
    element.querySelectorAll('template').forEach((t) => t.remove());
    removeAll(element, chromeList(template));
    removeTrackers(element);
    removeComments(element);
    normalizeInlineFormats(element);
    fixLinks(element);
    stripExcatAttributes(element);
  }
}
