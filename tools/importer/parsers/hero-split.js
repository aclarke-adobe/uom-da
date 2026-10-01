/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-split. Base: hero (option: split). Authored as "Hero (split)".
 * Source: https://study.unimelb.edu.au (homepage template) + course-detail template (div.course-header).
 * The course shape is detected first (parseCourseHeader); the homepage shapes below are unchanged.
 *
 * Output (blocks/hero/README.md): 1 row, 2 cells
 *   cell 1 = main text: [eyebrow p] + heading (h1/h2) + intro paragraph(s) + CTA link(s)
 *   cell 2 = image only (media; the decorator detects image-only cells regardless of order)
 *
 * Handles two source shapes (selectors verified in block-context/hero-split/source.html + instances/01.html):
 *  1. div.page-header-study — h1.page-header-study__title, p intro, img in .page-header-study__img.
 *     It also contains form.inline-search and the "Or browse all:" div.text-small. Those are mapped
 *     separately (search block + default content), so they are MOVED out of the hero and placed
 *     directly after the hero table (same parent, so the search selector
 *     `div.ct-searchbanner form.inline-search` still matches and the node reference stays valid).
 *  2. div.card-article-large — h2.title, p.card-article-large__category (eyebrow, placed after the h2
 *     in source; moved before the heading per the hero README), p.content-max-width (two paragraphs
 *     separated by <br><br>, split into two <p>), a.btn CTA, img in .card-article-large__img.
 */

function imageFrom(container, document) {
  if (!container) return null;
  const img = container.querySelector('img');
  if (!img) return null;
  const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
  const src = img.getAttribute('src') || '';
  // data: placeholders are already blob: URLs by the time parsers run (importer preProcess)
  const inline = (s) => !s || s.startsWith('data:') || s.startsWith('blob:');
  if (inline(src) && dataSrc) img.setAttribute('src', dataSrc);
  if (inline(img.getAttribute('src'))) return null;
  const clean = document.createElement('img');
  clean.src = img.getAttribute('src');
  clean.alt = img.getAttribute('alt') || '';
  return clean;
}

/** Split a paragraph on <br><br> into separate paragraphs. */
function splitParagraph(p, document) {
  const out = [];
  let current = document.createElement('p');
  const nodes = [...p.childNodes];
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node.nodeName === 'BR') {
      // look ahead (ignoring whitespace) for a second <br>
      let j = i + 1;
      while (j < nodes.length && nodes[j].nodeType === 3 && !nodes[j].textContent.trim()) j += 1;
      if (j < nodes.length && nodes[j].nodeName === 'BR') {
        if (current.textContent.trim()) out.push(current);
        current = document.createElement('p');
        i = j;
        continue;
      }
    }
    current.append(node);
  }
  if (current.textContent.trim()) out.push(current);
  out.forEach((para) => {
    // trim leading/trailing whitespace text
    if (para.firstChild && para.firstChild.nodeType === 3) para.firstChild.textContent = para.firstChild.textContent.replace(/^\s+/, '');
    if (para.lastChild && para.lastChild.nodeType === 3) para.lastChild.textContent = para.lastChild.textContent.replace(/\s+$/, '');
  });
  return out.length ? out : [p];
}

function ctaFrom(a, document) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
  const p = document.createElement('p');
  // EDS buttons: <strong> = primary (cyan), <em> = secondary (sage, e.g. "Learn more").
  // Source .btn--secondary maps to secondary; any other .btn to primary.
  const wrap = document.createElement(/btn--secondary/.test(a.className) ? 'em' : 'strong');
  wrap.append(link);
  p.append(wrap);
  return p;
}

// Course-detail assets known to 403 (mapping-notes "Images (403 rule)"): never emit, log instead.
// Image availability is decided at import time from tools/importer/unloadable-images.json (generated
// by tools/importer/check-images.mjs through Bright Data): the course cleanup transformer drops those
// images before parsing. The assets once listed here as "403" load fine on the source (only curl and
// cross-site hotlinking are refused) and are localised to /media-da/ via the snapshot sidecars.
const BLOCKED_IMAGES = [];

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

/** Course header image: <img> first (BD snapshot), then the inline background-image (live DOM). */
function courseImage(element, document) {
  const holder = element.querySelector('.course-header__img, [data-test="course-header-img"]');
  if (!holder) return null;
  const img = holder.querySelector('img');
  let src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
  if (!src || /^(data|blob):/.test(src)) {
    const m = (holder.getAttribute('style') || '').match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    src = m ? m[2].trim() : '';
  }
  if (!src || /^(data|blob):/.test(src)) return null;
  if (BLOCKED_IMAGES.some((frag) => src.includes(frag))) {
    console.warn(`[hero-split] image dropped (403): ${src}`);
    return null;
  }
  const out = document.createElement('img');
  out.src = src;
  out.alt = (img && img.getAttribute('alt')) || holder.getAttribute('aria-label') || '';
  return out;
}

/**
 * Course-detail shape (div.course-header), verified in
 * block-context/hero-split/instances/course-detail-01..04.html:
 *   p.course-header__type (eyebrow: <a> on courses, plain text on majors), h1.course-header__title,
 *   ul.course-header__statistics > li > a.course-header__stat-link > span.uom-link__text > span,
 *   div.course-header__btns (empty today), ul.course-header__codes > li.course-header__code
 *   (absent on majors), div.course-header__img > img (or background-image).
 * Output cell 1: eyebrow p + h1 + ul of stat links + <p>Course code: <strong>X</strong></p>
 * (only "Course code"; the other codes become key-facts rows) + optional CTAs. Cell 2: image.
 */
function parseCourseHeader(element, document) {
  const textCell = [];
  const eyebrow = element.querySelector('.course-header__type, .course-header__tag');
  if (eyebrow && cleanText(eyebrow)) {
    const p = document.createElement('p');
    const a = eyebrow.querySelector('a[href]');
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href').trim();
      link.textContent = cleanText(a);
      p.append(link);
    } else {
      p.textContent = cleanText(eyebrow);
    }
    textCell.push(p);
  }

  const title = element.querySelector('h1, .course-header__title, h2');
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = cleanText(title);
    textCell.push(h1);
  }

  const stats = [...element.querySelectorAll('.course-header__statistics > li, .course-header__stat')]
    .filter((li, i, all) => all.indexOf(li) === i);
  if (stats.length) {
    const ul = document.createElement('ul');
    stats.forEach((li) => {
      li.querySelectorAll('.screenreaders-only, .sr-only').forEach((s) => s.remove());
      const a = li.querySelector('a[href]');
      const text = cleanText(li.querySelector('.uom-link__text') || a || li);
      if (!text) return;
      const item = document.createElement('li');
      if (a) {
        const link = document.createElement('a');
        link.href = a.getAttribute('href').trim();
        link.textContent = text;
        item.append(link);
      } else {
        item.textContent = text;
      }
      ul.append(item);
    });
    if (ul.children.length) textCell.push(ul);
  }

  // Only "Course code" stays in the hero (the audience transformer has copied the whole list into
  // key-facts, which emits the other codes).
  element.querySelectorAll('.course-header__codes > li, .course-header__code').forEach((li) => {
    // Read label / value from the text, not from child positions: the importer's preProcess unwraps
    // the attribute-less label <span> before parsing, leaving "Course code: " as a text node.
    const full = cleanText(li);
    const valueEl = li.querySelector('.text-bold, strong, b');
    const value = cleanText(valueEl) || full.split(':').slice(1).join(':').trim();
    const label = (full.includes(':') ? full.split(':')[0] : full.replace(value, '')).trim();
    if (!/^course code$/i.test(label)) return;
    if (!value) return;
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = value;
    p.append(`${label}: `, strong);
    textCell.push(p);
  });

  element.querySelectorAll('.course-header__btns a[href]').forEach((a) => {
    if (cleanText(a)) textCell.push(ctaFrom(a, document));
  });

  if (!textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // 403 rule: no image -> no image cell (never an empty one)
  const image = courseImage(element, document);
  const cells = [image ? [textCell, [image]] : [textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (split)', cells });
  element.replaceWith(block);
}

export default function parse(element, { document }) {
  // --- Course-detail page header (div.course-header) ---
  if (element.matches('.course-header') || element.querySelector(':scope > .course-header__inner')) {
    parseCourseHeader(element, document);
    return;
  }

  // --- Elements that belong to other blocks / default content: move out, never consume ---
  const preserved = [];
  const form = element.querySelector('form.inline-search, form[class*="search"]');
  if (form) preserved.push(form);
  // If the search parser already ran (parse order not guaranteed), its block table sits here instead.
  element.querySelectorAll('table').forEach((t) => { if (!t.parentElement.closest('table')) preserved.push(t); });
  const browse = element.querySelector('.page-header-study__content-inner > .text-small, .page-header-study__content .text-small');
  if (browse && !preserved.some((el) => el.contains(browse))) preserved.push(browse);
  preserved.forEach((el) => el.remove());

  // --- Heading ---
  const heading = element.querySelector('h1, h2, h3');
  if (heading) heading.textContent = heading.textContent.replace(/\s+/g, ' ').trim();

  // --- Eyebrow (shape 2) ---
  const eyebrow = element.querySelector('.card-article-large__category, [class*="__category"], [class*="eyebrow"]');

  // --- Intro paragraphs (anything in the content column that is not the eyebrow) ---
  const contentRoot = element.querySelector(
    '.page-header-study__content-inner, .card-article-large__content, [class*="__content"]',
  ) || element;
  const paragraphs = [];
  [...contentRoot.querySelectorAll('p')].forEach((p) => {
    if (p === eyebrow || !p.textContent.trim()) return;
    if (p.closest('a, .btn')) return;
    paragraphs.push(...splitParagraph(p, document));
  });

  // --- CTAs ---
  const ctas = [...contentRoot.querySelectorAll('a.btn, a[class*="btn--"], a.button')]
    .filter((a, i, all) => all.indexOf(a) === i && a.getAttribute('href'))
    .map((a) => ctaFrom(a, document));

  // --- Image ---
  const image = imageFrom(
    element.querySelector('.page-header-study__img, .card-article-large__img, [class*="__img"]') || element,
    document,
  );

  if (!heading && !paragraphs.length) {
    element.replaceWith(...element.childNodes, ...preserved);
    return;
  }

  const textCell = [];
  if (eyebrow && eyebrow.textContent.trim()) {
    const ep = document.createElement('p');
    ep.textContent = eyebrow.textContent.replace(/\s+/g, ' ').trim();
    textCell.push(ep);
  }
  if (heading) textCell.push(heading);
  textCell.push(...paragraphs, ...ctas);

  const cells = [[textCell, image ? [image] : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (split)', cells });
  element.replaceWith(block);
  // search form + "Or browse all" links follow the hero as separate content
  if (preserved.length) block.after(...preserved);
}
