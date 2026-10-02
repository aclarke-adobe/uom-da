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

/* ---- section-landing (template 'section-landing'; verified in
 * block-context/columns-split/instances/section-landing-*.html) ----
 *   div.ct-section-image.split-section / div.tile-split-section section.split-section:
 *     .split-section__side(--with-image) > img | .split-section__side > .split-section__inner > h2, p, a.btn
 *   div.ct-menu.section-image: .section-image__img img (alt " Image for X}" repaired to "X") |
 *     .section-image__content > h2 + .uom-link-panel-list li > a.uom-link-panel > .uom-link-panel__text
 * Sides stay in source order. An a.btn nested in a <p> is emitted once (as the CTA paragraph);
 * `<br><br>` runs split a paragraph; class/style/data-* attributes are dropped.
 */
function landingCta(a, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = clean(a);
  const cls = a.className || '';
  const p = document.createElement('p');
  if (/btn--text/.test(cls)) { p.append(link); return p; }
  const wrap = document.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
  wrap.append(link);
  p.append(wrap);
  return p;
}

function stripAttrs(el) {
  [el, ...el.querySelectorAll('*')].forEach((c) => [...c.attributes].forEach((a) => {
    if (!['href', 'src', 'alt', 'colspan', 'rowspan'].includes(a.name)) c.removeAttribute(a.name);
  }));
  el.querySelectorAll('span').forEach((sp) => sp.replaceWith(...sp.childNodes));
  el.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', a.getAttribute('href').trim()));
  return el;
}

const BR_BR = /<br\s*\/?>\s*(?:&nbsp;|\s)*<br\s*\/?>/i;

function splitBrParagraph(p, document) {
  if (!BR_BR.test(p.innerHTML)) return [p];
  return p.innerHTML.split(BR_BR).map((h) => {
    const q = document.createElement('p');
    q.innerHTML = h.trim();
    return q;
  }).filter((q) => clean(q) || q.querySelector('img'));
}

function landingTextCell(side, document) {
  const root = side.querySelector('.split-section__inner, .section-image__content') || side;
  const content = [];
  [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, a.btn, a[class*="btn--"]')].forEach((el) => {
    if (el.matches('a')) {
      if (el.parentElement && el.parentElement.closest('ul, ol') && root.contains(el.parentElement)) return;
      if (clean(el) && el.getAttribute('href')) content.push(landingCta(el, document));
      return;
    }
    if (el.closest('a') || !clean(el)) return;
    if (el.parentElement && el.parentElement.closest('ul, ol, p') && root.contains(el.parentElement.closest('ul, ol, p'))) return;
    if (el.matches('ul.uom-link-panel-list__items, .uom-link-panel-list ul')) {
      const ul = document.createElement('ul');
      el.querySelectorAll('li').forEach((li) => {
        const a = li.querySelector('a[href]');
        const label = clean(li.querySelector('.uom-link-panel__text') || a || li);
        if (!label) return;
        const item = document.createElement('li');
        if (a) {
          const link = document.createElement('a');
          link.href = a.getAttribute('href').trim();
          link.textContent = label;
          item.append(link);
        } else item.textContent = label;
        ul.append(item);
      });
      if (ul.children.length) content.push(ul);
      return;
    }
    const copy = el.cloneNode(true);
    // CTA buttons inside the paragraph are emitted by the a.btn branch above
    copy.querySelectorAll('a.btn, a[class*="btn--"]').forEach((a) => a.remove());
    if (!clean(copy) && !copy.querySelector('img')) return;
    stripAttrs(copy);
    if (copy.tagName === 'P') content.push(...splitBrParagraph(copy, document));
    else content.push(copy);
  });
  return content;
}

function repairAlt(alt) {
  return (alt || '').replace(/^\s*Image for\s+/i, '').replace(/\}\s*$/, '').trim();
}

function parseLanding(element, document) {
  let sides;
  if (element.querySelector('.section-image__img')) {
    sides = [element.querySelector('.section-image__img'), element.querySelector('.section-image__content') || element.querySelector('.section-image__inner')];
  } else {
    sides = [...element.querySelectorAll(':scope > .split-section__side, :scope > div')];
    if (!sides.length) sides = [...element.children];
  }
  const row = [];
  sides.filter(Boolean).forEach((side) => {
    const isImage = side.matches('[class*="--with-image"], .section-image__img') || (side.querySelector('img') && !clean(side));
    if (isImage) {
      const cell = imageCell(side, document);
      if (cell) { cell[0].alt = repairAlt(cell[0].alt); row.push(cell); }
    } else {
      const cell = landingTextCell(side, document);
      if (cell.length) row.push(cell);
    }
  });
  if (!row.length) { element.replaceWith(...element.childNodes); return; }
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Columns (split)', cells: [row] }));
}

export default function parse(element, { document, template }) {
  if (template === 'section-landing') {
    parseLanding(element, document);
    return;
  }
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
