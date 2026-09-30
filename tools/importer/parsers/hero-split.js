/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-split. Base: hero (option: split). Authored as "Hero (split)".
 * Source: https://study.unimelb.edu.au (homepage template).
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

export default function parse(element, { document }) {
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
