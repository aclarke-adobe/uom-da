/* eslint-disable */
/* global WebImporter */
/**
 * Parser for quote. Base: quote (no option). Authored as "Quote".
 * Source: https://study.unimelb.edu.au (homepage template, section 11 testimonials, 2 instances).
 *
 * Output (blocks/quote/README.md): 1 row, 2 cells
 *   cell 1 = quotation paragraph(s) + attribution paragraph starting with an em dash
 *   cell 2 = portrait image only
 *
 * Source (verified in block-context/quote/source.html + instances/01.html):
 *   blockquote.testimonials-alt >
 *     p.testimonials-alt__title (quote text), cite.testimonials-alt__name (attribution),
 *     div.testimonials-alt__img > .progressive-image-wrapper > img (portrait, alt kept)
 */

function clean(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const root = element.matches('blockquote') ? element : (element.querySelector('blockquote') || element);

  const quoteParas = [...root.querySelectorAll('p')]
    .filter((p) => !p.closest('cite') && clean(p))
    .map((p) => {
      const out = document.createElement('p');
      out.textContent = clean(p);
      return out;
    });

  const citeEl = root.querySelector('cite, .testimonials-alt__name, [class*="__name"]');
  let attribution = null;
  if (citeEl && clean(citeEl)) {
    attribution = document.createElement('p');
    attribution.textContent = `— ${clean(citeEl).replace(/^[—–-]\s*/, '')}`;
  }

  let image = null;
  const img = root.querySelector('.testimonials-alt__img img, .progressive-image img, img');
  if (img) {
    let src = img.getAttribute('src') || '';
    const dataSrc = img.getAttribute('data-src');
    // data: placeholders are already blob: URLs by the time parsers run (importer preProcess)
    const inline = (s) => !s || s.startsWith('data:') || s.startsWith('blob:');
    if (inline(src) && dataSrc) src = dataSrc;
    if (!inline(src)) {
      image = document.createElement('img');
      image.src = src;
      image.alt = img.getAttribute('alt') || '';
    }
  }

  if (!quoteParas.length && !attribution) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const text = [...quoteParas];
  if (attribution) text.push(attribution);
  const row = [text];
  if (image) row.push([image]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Quote', cells: [row] });
  element.replaceWith(block);
}
