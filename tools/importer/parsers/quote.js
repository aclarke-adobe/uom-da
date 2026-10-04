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

/* section-landing ct-testimonial .card-focus (verified in block-context/quote/instances/section-landing-*.html):
 *   .testimonials: blockquote > p (quote) + cite (name) + .block-quotation__sub-cite (course line);
 *                  .testimonials__img[data-excat-bg][aria-label] (portrait, often absent)
 *   .alumni: p.alumni__title (role), h3.alumni__name, p.alumni__short-text (quote), .alumni__img[data-excat-bg]
 * Row: quote paragraph(s) + "— {name}" + course/role line | portrait (only when there is one); the
 * portrait cell comes first when the source portrait precedes the text. `.alumni` cards are authored
 * as "Quote (alumni)" (role line links kept); `.testimonials` cards as plain "Quote". */
function bgPortrait(holder, document) {
  if (!holder) return null;
  const img = holder.querySelector('img');
  let src = (holder.getAttribute('data-excat-bg') || '').trim();
  if (!src && img) src = (img.getAttribute('src') || '').trim();
  if (!src || /^(data|blob):/.test(src)) return null;
  const out = document.createElement('img');
  out.src = src;
  out.alt = (holder.getAttribute('aria-label') || (img && img.getAttribute('alt')) || '').trim();
  return out;
}

/** Role line keeping its links (e.g. "Explore Edward's Melbourne journey"), other markup flattened. */
function inlinePara(el, document) {
  const p = document.createElement('p');
  [...el.childNodes].forEach((n) => {
    if (n.nodeType === 1 && n.matches('a[href]') && clean(n)) {
      const a = document.createElement('a');
      a.href = (n.getAttribute('href') || '').trim();
      a.textContent = clean(n);
      p.append(a);
    } else if (n.nodeType === 1 && n.querySelector('a[href]')) {
      p.append(...inlinePara(n, document).childNodes);
    } else {
      p.append(document.createTextNode((n.textContent || '').replace(/\s+/g, ' ')));
    }
  });
  // trim edge whitespace
  if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, '');
  if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
  return p;
}

function parseCardFocus(element, document) {
  const para = (t) => { const p = document.createElement('p'); p.textContent = t; return p; };
  const text = [];
  let holder = null;
  let textEl = null;
  const alumni = element.querySelector('.alumni');
  if (alumni) {
    const q = clean(alumni.querySelector('.alumni__short-text'));
    if (q) text.push(para(q));
    const name = clean(alumni.querySelector('.alumni__name'));
    if (name) text.push(para(`— ${name}`));
    const roleEl = alumni.querySelector('.alumni__title');
    if (clean(roleEl)) text.push(inlinePara(roleEl, document));
    holder = alumni.querySelector('.alumni__img');
    textEl = alumni.querySelector('.alumni__info');
  } else {
    const bq = element.querySelector('blockquote') || element;
    bq.querySelectorAll('p').forEach((p) => { if (!p.closest('cite') && clean(p)) text.push(para(clean(p))); });
    const name = clean(bq.querySelector('cite'));
    if (name) text.push(para(`— ${name.replace(/^[—–-]\s*/, '')}`));
    const sub = clean(bq.querySelector('.block-quotation__sub-cite'));
    if (sub) text.push(para(sub));
    holder = element.querySelector('.testimonials__img');
    textEl = element.querySelector('.testimonials__info') || bq;
  }
  if (!text.length) { element.replaceWith(...element.childNodes); return; }
  const image = bgPortrait(holder, document);
  // the portrait keeps its source side: a portrait before the text (.alumni__img /
  // .testimonials__img preceding the info) is the first cell, otherwise the last
  // eslint-disable-next-line no-bitwise
  const imageFirst = !!(image && textEl && (holder.compareDocumentPosition(textEl) & 4));
  let row = [text];
  if (image) row = imageFirst ? [[image], text] : [text, [image]];
  // alumni profile cards (.alumni: role, name, rule, plain text) vs student testimonials
  element.replaceWith(WebImporter.Blocks.createBlock(document, alumni
    ? { name: 'Quote', variants: ['alumni'], cells: [row] }
    : { name: 'Quote', cells: [row] }));
}

export default function parse(element, { document }) {
  if (element.matches('.card-focus') && element.querySelector('.testimonials, .alumni')) {
    parseCardFocus(element, document);
    return;
  }
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
  // Bare pull quote in a landing-family content block (story-article, 3 stories:
  // .content-block__inner > blockquote > p, verified on the snapshots). A heading right after it
  // that starts with a dash ("<h3>- Tiriki Onus</h3>") is the attribution: folded in and removed.
  if (!attribution && element.matches('blockquote') && element.parentElement
    && element.parentElement.matches('.content-block__inner')) {
    const next = element.nextElementSibling;
    if (next && /^H[1-6]$/.test(next.tagName) && /^\s*[-–—]\s*\S/.test(next.textContent) && clean(next).length <= 120) {
      attribution = document.createElement('p');
      attribution.textContent = `— ${clean(next).replace(/^[—–-]\s*/, '')}`;
      next.remove();
    }
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
