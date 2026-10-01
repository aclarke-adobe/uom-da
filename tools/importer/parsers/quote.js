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

/**
 * Course-detail blockquotes (B .course-section__main > .course-content > blockquote; bulk snapshots,
 * e.g. graduate/doctoral-program-in-actuarial-studies, master-of-architecture-master-of-property/
 * career-outcomes). Shapes: p.block-quotation__content + cite.block-quotation__author;
 * <p>text <cite>name</cite></p>; bare <em>"text"</em><cite>…</cite> (no <p>). Inline markup (em,
 * links) is kept, the cite becomes the "— …" attribution (its links kept). No image.
 */
function parseCourseQuote(root, document) {
  const cites = [...root.querySelectorAll('cite')];
  cites.forEach((c) => c.remove());
  const paras = [];
  let loose = document.createElement('p');
  const flush = () => { if (clean(loose)) paras.push(loose); loose = document.createElement('p'); };
  [...root.childNodes].forEach((n) => {
    if (n.nodeType === 8) return;
    if (n.nodeType === 1 && /^(P|DIV|UL|OL)$/.test(n.tagName)) {
      flush();
      if (!clean(n)) return;
      if (n.tagName === 'DIV') { const p = document.createElement('p'); p.innerHTML = n.innerHTML.trim(); paras.push(p); return; }
      [...n.attributes].forEach((a) => n.removeAttribute(a.name));
      paras.push(n);
      return;
    }
    if (n.nodeName === 'BR') return;
    loose.append(n);
  });
  flush();
  const text = [...paras];
  cites.forEach((c) => {
    if (!clean(c)) return;
    const p = document.createElement('p');
    c.querySelectorAll('br').forEach((b) => b.remove());
    p.append(...c.childNodes);
    const first = p.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s*[—–-]?\s*/, '');
    p.prepend('— ');
    text.push(p);
  });
  return text;
}

export default function parse(element, { document }) {
  const root = element.matches('blockquote') ? element : (element.querySelector('blockquote') || element);

  if (element.closest('.course-content, .course-section__main, [data-test$="-page"]')) {
    const text = parseCourseQuote(root, document);
    if (!text.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: 'Quote', cells: [[text]] });
    element.replaceWith(block);
    return;
  }

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
