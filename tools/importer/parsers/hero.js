/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero. Base: hero (no option: solid band, image as background). Authored as "Hero".
 * Source: section-landing template, page banners (div.ct-campaignbanner):
 *   A. div.campaign-banner-alt (international country pages, cost-of-living, …):
 *      picture.campaign-banner-alt__img > img, .campaign-banner-alt__content > h1, p.heading-sm, a.btn
 *   B. div.ct-campaignbanner:has(> div[class*='page-header__darken']) (4 pages):
 *      div.page-header__darken--o25|o50 > img + header.page-header h1 / h2 (subtitle). On the 3
 *      career-pathway pages the header is empty: the hero is an image only.
 *
 * Output (blocks/hero/README.md + hero.js default): 1 row
 *   cell 1 = image only (when present)
 *   cell 2 = h1 (or h2 on a later banner, mapping-notes "banner h1 -> h2 for second banners"),
 *            subtitle paragraph(s), CTA (a.btn -> <p><strong><a>, btn--secondary -> <em>, btn--text -> plain)
 * A banner is "later" when an h1 already precedes it in the document; its h1 is demoted to h2 so the
 * page keeps one h1.
 * story-article: B banners are "Hero (overlay)" (o25) / "Hero (overlay, dark)" (o50), see
 * storyOverlayVariants; A banners and every other template keep "Hero".
 *
 * Source (verified in block-context/hero/instances/section-landing-01..04.html).
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

function imageOf(element, document) {
  const img = element.querySelector('picture img, img');
  let src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
  let alt = img ? (img.getAttribute('alt') || '') : '';
  if (!src || /^(data|blob):/.test(src)) {
    const bg = element.hasAttribute('data-excat-bg') ? element : element.querySelector('[data-excat-bg]');
    if (bg) { src = bg.getAttribute('data-excat-bg'); alt = bg.getAttribute('aria-label') || alt; }
  }
  if (!src || /^(data|blob):/.test(src)) return null;
  const out = document.createElement('img');
  out.src = src.trim();
  out.alt = clean(alt);
  return out;
}

/** True when an h1 outside element precedes it in document order. */
function isLaterBanner(element, document) {
  return [...document.querySelectorAll('h1')].some((h) => !element.contains(h)
    && (h.compareDocumentPosition(element) & 4 /* FOLLOWING */));
}

/**
 * story-article campaign banners (B, 37 story pages): the photo with a black scrim under a centred
 * title is the Overlay option, `dark` for the 50% scrim (page-header__darken--o50) -> "Hero (overlay)"
 * / "Hero (overlay, dark)". Every other template keeps the plain "Hero" (section-landing's 4 B
 * banners included).
 */
function storyOverlayVariants(element, template) {
  if (template !== 'story-article') return null;
  const darken = element.querySelector(':scope > [class*="page-header__darken--o"]');
  if (!darken) return null;
  if (darken.matches('.page-header__darken--o50')) return ['overlay', 'dark'];
  if (darken.matches('.page-header__darken--o25')) return ['overlay'];
  return null;
}

export default function parse(element, { document, template }) {
  const later = isLaterBanner(element, document);
  const content = element.querySelector('.campaign-banner-alt__content, header.page-header, .page-header') || element;
  const textCell = [];
  let headingDone = false;
  content.querySelectorAll('h1, h2, h3, p, a.btn, a[class*="btn--"]').forEach((el) => {
    if (el.matches('a')) { if (text(el)) textCell.push(ctaParagraph(el, document)); return; }
    if (el.closest('a') || !text(el)) return;
    if (/^H[1-3]$/.test(el.tagName) && !headingDone) {
      const level = el.tagName === 'H1' && later ? 'h2' : (el.tagName === 'H1' ? 'h1' : 'h2');
      const h = document.createElement(level);
      h.textContent = text(el);
      textCell.push(h);
      headingDone = true;
      return;
    }
    // subtitle (p.heading-sm, h2.heading-card) and any other text: paragraphs
    const p = document.createElement('p');
    p.textContent = text(el);
    textCell.push(p);
  });

  const image = imageOf(element, document);
  if (!textCell.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const row = [];
  if (image) row.push([image]);
  if (textCell.length) row.push(textCell);
  const variants = storyOverlayVariants(element, template);
  const block = WebImporter.Blocks.createBlock(document, variants
    ? { name: 'Hero', variants, cells: [row] }
    : { name: 'Hero', cells: [row] });
  element.replaceWith(block);
}
