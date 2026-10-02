/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-split-light. Base: hero (option: split-light). Authored as "Hero (split-light)".
 * Source: section-landing template, ct-searchbanner feature card
 * (section.ct-searchbanner .card-article-large; connect-with-us/information-for-schools/Australia-and-New-Zealand).
 *
 * Output (blocks/hero/README.md + hero.js `split-light`): 1 row, 2 cells
 *   cell 1 = eyebrow <p> (p.card-article-large__category, moved before the heading) + h2 (h1 when no
 *            h1 precedes it) + intro paragraph(s) + CTA links (a.btn--text -> plain <p><a>,
 *            a.btn -> <strong>, a.btn--secondary -> <em>)
 *   cell 2 = image only
 * The article cards under it (.article-card-list) are a separate cards-tile instance.
 *
 * Source (verified in block-context/hero-split-light/source.html):
 *   .card-article-large > .card-article-large__inner > .card-article-large__content >
 *     h2.title, p.card-article-large__category, p.content-max-width, div > a.btn--text…
 *   .card-article-large__img img
 */

function clean(t) {
  return (t || '').replace(/​/g, '').replace(/\s+/g, ' ').trim();
}

function text(el) {
  return clean(el ? el.textContent : '');
}

function ctaParagraph(a, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim().replace(/^mailto:\s+/i, 'mailto:');
  link.textContent = text(a) || clean(a.getAttribute('aria-label'));
  const p = document.createElement('p');
  const cls = a.className || '';
  if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
  else {
    const wrap = document.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
    wrap.append(link);
    p.append(wrap);
  }
  return p;
}

export default function parse(element, { document }) {
  const content = element.querySelector('.card-article-large__content') || element;
  const heading = content.querySelector('h1, h2, h3');
  const eyebrow = content.querySelector('.card-article-large__category, [class*="__category"]');
  const hasEarlierH1 = [...document.querySelectorAll('h1')].some((h) => !element.contains(h) && (h.compareDocumentPosition(element) & 4));
  const cell = [];
  if (eyebrow && text(eyebrow)) { const p = document.createElement('p'); p.textContent = text(eyebrow); cell.push(p); }
  if (heading) {
    const h = document.createElement(heading.tagName === 'H1' && !hasEarlierH1 ? 'h1' : 'h2');
    h.textContent = text(heading);
    cell.push(h);
  }
  content.querySelectorAll('p, a[href]').forEach((el) => {
    if (el === eyebrow || el.closest('.card-article-large__img')) return;
    if (el.matches('a')) { if (text(el)) cell.push(ctaParagraph(el, document)); return; }
    if (el.querySelector('a.btn, a[class*="btn--"]') || !text(el)) return;
    const p = document.createElement('p');
    p.innerHTML = el.innerHTML.trim();
    p.querySelectorAll('*').forEach((c) => [...c.attributes].forEach((a) => { if (a.name !== 'href') c.removeAttribute(a.name); }));
    cell.push(p);
  });
  const img = element.querySelector('.card-article-large__img img, img');
  let image = null;
  const src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
  if (src && !/^(data|blob):/.test(src)) {
    image = document.createElement('img');
    image.src = src;
    image.alt = clean(img.getAttribute('alt'));
  }
  if (!cell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const row = image ? [cell, [image]] : [cell];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', variants: ['split-light'], cells: [row] });
  element.replaceWith(block);
}
