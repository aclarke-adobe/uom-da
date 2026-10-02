/* eslint-disable */
/* global WebImporter */
/**
 * Parser for callout-photo. Base: callout (option: photo). Authored as "Callout (photo)".
 * Source: section-landing template, ct-sectionfocus bands (5 pages, e.g. student-life/cost-of-living,
 * accommodation "Got a question?").
 *
 * Output (blocks/callout/README.md + callout.js `photo`): 1 row, 2 cells
 *   cell 1 = background image only (the full-bleed photo)
 *   cell 2 = the white panel: heading, text, CTA (a.btn -> <p><strong><a>, a.btn--secondary ->
 *            <p><em><a>, a.btn--text -> <p><a>)
 * Image: the direct child <img> (BD snapshot), else data-excat-bg / the inline background-image.
 * Without an image the row is the panel only (never an empty image cell).
 *
 * Source (verified in block-context/callout-photo/instances/section-landing-01.html):
 *   div.section.section--image.ct-sectionfocus > img, .section__inner > .card-focus > h2, p, a.btn.btn--secondary
 */

function clean(t) {
  return (t || '').replace(/​/g, '').replace(/\s+/g, ' ').trim();
}

function text(el) {
  return clean(el ? el.textContent : '');
}

function ctaParagraph(a, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = text(a);
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

function backgroundImage(element, document) {
  const img = element.querySelector(':scope > img') || element.querySelector(':scope > picture img');
  let src = img ? (img.getAttribute('src') || '') : '';
  let alt = img ? (img.getAttribute('alt') || '') : '';
  if (!src || /^(data|blob):/.test(src)) {
    const bg = element.hasAttribute('data-excat-bg') ? element : element.querySelector(':scope > [data-excat-bg]');
    if (bg) { src = bg.getAttribute('data-excat-bg'); alt = bg.getAttribute('aria-label') || alt; }
  }
  if (!src || /^(data|blob):/.test(src)) {
    const m = (element.getAttribute('style') || '').match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    src = m ? m[2] : '';
  }
  if (!src || /^(data|blob):/.test(src) || /^none$/i.test(src)) return null;
  const out = document.createElement('img');
  out.src = src.trim();
  out.alt = clean(alt);
  return out;
}

export default function parse(element, { document }) {
  const card = element.querySelector('.card-focus') || element.querySelector('.section__inner') || element;
  const panel = [];
  [...card.children].forEach((el) => {
    if (el.matches('a[href]')) { if (text(el)) panel.push(ctaParagraph(el, document)); return; }
    if (!text(el)) return;
    if (/^H[1-6]$/.test(el.tagName)) {
      const h = document.createElement(el.tagName.toLowerCase());
      h.textContent = text(el);
      panel.push(h);
      return;
    }
    const btns = [...el.querySelectorAll('a.btn, a[class*="btn--"]')];
    if (btns.length && text(el) === btns.map(text).join(' ')) { btns.forEach((b) => panel.push(ctaParagraph(b, document))); return; }
    [...el.attributes].forEach((a) => el.removeAttribute(a.name));
    panel.push(el);
  });

  if (!panel.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const image = backgroundImage(element, document);
  const cells = [image ? [[image], panel] : [panel]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Callout', variants: ['photo'], cells });
  element.replaceWith(block);
}
