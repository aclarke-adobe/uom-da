/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-split. Base: columns (option: split). Authored as "Columns (split)".
 * Source: https://study.unimelb.edu.au (homepage template, 4 section.split-section tiles).
 *
 * Output (blocks/columns/README.md): 1 row, 2 cells in source order (text | image or image | text).
 *   text cell  = eyebrow p + h2 (inline links kept) + paragraph(s) + CTA
 *   image cell = image only (decorator marks it .columns-img-col)
 *
 * Source (verified in block-context/columns-split/source.html + instances/0*.html):
 *   section.split-section > div.split-section__side (x2, order varies)
 *     text side:  .split-section__inner > p.uom-title-overline, h2.heading-section, p, div > a.btn > span.push-icon
 *     image side: div.split-section__side--with-image > img                        (BD snapshot DOM)
 *                 div.split-section__side--with-image[style="background-image:url(/__data/...)"]
 *                                                                                  (raw live DOM, no <img>)
 * The background URL is resolved against https://study.unimelb.edu.au and emitted as an <img>,
 * keeping the source side order. Iteration is keyed on div.split-section__side (block wrappers).
 */

function clean(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

const SOURCE_ORIGIN = 'https://study.unimelb.edu.au';

/** Absolute URL for a (possibly root-relative) source image path. */
function absolute(src) {
  try {
    return new URL(src, `${SOURCE_ORIGIN}/`).href;
  } catch (e) {
    return src;
  }
}

/**
 * First CSS background-image URL on the element or a descendant (raw live DOM:
 * div.split-section__side--with-image[style="background-image: url(/__data/...)"]).
 */
function backgroundUrl(side) {
  const els = [side, ...side.querySelectorAll('[style*="background"], [data-bg], [data-background-image]')];
  for (const el of els) {
    const attr = el.getAttribute('data-bg') || el.getAttribute('data-background-image');
    if (attr) return absolute(attr.trim());
    const m = (el.getAttribute('style') || '').match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    if (m && m[2] && !m[2].startsWith('data:')) return absolute(m[2].trim());
  }
  return '';
}

function imageCell(side, document) {
  const out = document.createElement('img');
  // Snapshot DOM: the background was already materialised as an <img>
  const img = side.querySelector('img');
  let src = '';
  if (img) {
    src = img.getAttribute('src') || '';
    const dataSrc = img.getAttribute('data-src');
    if ((!src || src.startsWith('data:') || src.startsWith('blob:')) && dataSrc) src = dataSrc;
    if (src.startsWith('data:') || src.startsWith('blob:')) src = '';
    out.alt = img.getAttribute('alt') || '';
  }
  // Raw live DOM: inline CSS background-image on the side itself
  if (!src) {
    src = backgroundUrl(side);
    const label = side.getAttribute('aria-label') || (side.querySelector('[aria-label]') || { getAttribute: () => '' }).getAttribute('aria-label');
    out.alt = label || out.alt || '';
  }
  if (!src) return '';
  out.src = src;
  return [out];
}

function textCell(side, document) {
  const root = side.querySelector('.split-section__inner') || side;
  const content = [];
  [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, a.btn')].forEach((el) => {
    if (el.matches('a.btn')) {
      const href = (el.getAttribute('href') || '').trim();
      const text = clean(el);
      if (!href || !text) return;
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      // EDS buttons: <em> = secondary (source .btn--secondary), <strong> = primary
      const wrap = document.createElement(/btn--secondary/.test(el.className) ? 'em' : 'strong');
      wrap.append(link);
      const p = document.createElement('p');
      p.append(wrap);
      content.push(p);
      return;
    }
    if (el.closest('a.btn') || !clean(el)) return;
    if (el.parentElement && el.parentElement.closest('ul, ol, p') && root.contains(el.parentElement.closest('ul, ol, p'))) return; // nested in a kept list
    if (el.matches('.uom-title-overline, [class*="overline"], [class*="eyebrow"]')) {
      const p = document.createElement('p');
      p.textContent = clean(el);
      content.push(p);
      return;
    }
    // headings/paragraphs kept as-is (preserves inline links such as "#1" in the h2)
    el.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', a.getAttribute('href').trim()));
    content.push(el);
  });
  return content;
}

export default function parse(element, { document }) {
  let sides = [...element.querySelectorAll(':scope > .split-section__side, :scope > div')];
  if (!sides.length) sides = [...element.children];

  const row = [];
  sides.forEach((side) => {
    const isImage = side.matches('[class*="--with-image"]')
      || (side.querySelector('img') && !clean(side));
    if (isImage) {
      const cell = imageCell(side, document);
      if (cell) row.push(cell);
    } else {
      const cell = textCell(side, document);
      if (cell.length) row.push(cell);
    }
  });

  if (!row.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (split)', cells: [row] });
  element.replaceWith(block);
}
