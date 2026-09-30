/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards (no option). Authored as "Cards".
 * Source: https://study.unimelb.edu.au (homepage template, section 9 feature panel).
 *
 * Output (blocks/cards/README.md): one row per card, 2 cells
 *   cell 1 = image only
 *   cell 2 = h3 + description p + text-link CTA p (decorator pins trailing CTA to the bottom)
 *
 * Source (verified in block-context/cards/source.html):
 *   div.grid.grid--3col > div.cell > div.card >
 *     div.card__thumb > div.card__thumb-img > img                                   (BD snapshot DOM)
 *     div.card__thumb > div.card__thumb-img[role=img][aria-label][style="background-image:url(/__data/...)"]
 *                                           (raw live DOM: URL resolved to https://study.unimelb.edu.au,
 *                                            alt from aria-label)
 *     div.card__inner > h3.card__title, p.card__meta
 *     div.card__footer > a.btn.btn--text (+ decorative arrow img, sr-only "about …" span)
 * Iteration is keyed on div.card (block wrapper), falling back to div.cell.
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

/** URL from an inline `background-image: url(...)` style (or data-bg attribute). */
function backgroundUrl(el) {
  if (!el) return '';
  const attr = el.getAttribute('data-bg') || el.getAttribute('data-background-image');
  if (attr) return absolute(attr.trim());
  const m = (el.getAttribute('style') || '').match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
  return m && m[2] && !m[2].startsWith('data:') ? absolute(m[2].trim()) : '';
}

function pickImage(card, document) {
  const out = document.createElement('img');
  // Snapshot DOM: background already materialised as <img>
  const img = card.querySelector('.card__thumb img, .card__thumb-img img, .card__image img');
  if (img) {
    let src = img.getAttribute('src') || '';
    const dataSrc = img.getAttribute('data-src');
    if ((!src || src.startsWith('data:') || src.startsWith('blob:')) && dataSrc) src = dataSrc;
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      out.src = src;
      const labelled = img.closest('[aria-label]');
      out.alt = img.getAttribute('alt') || (labelled && card.contains(labelled) ? labelled.getAttribute('aria-label') : '') || '';
      return out;
    }
  }
  // Raw live DOM: div.card__thumb-img[role=img][aria-label][style="background-image:url(/__data/...)"]
  const thumbs = [...card.querySelectorAll('.card__thumb-img, .card__thumb, .card__image, [role="img"][style*="background"]')];
  const thumb = thumbs.find((el) => backgroundUrl(el));
  if (!thumb) return null;
  out.src = backgroundUrl(thumb);
  out.alt = thumb.getAttribute('aria-label') || '';
  return out;
}

export default function parse(element, { document }) {
  let cards = [...element.querySelectorAll('.card')];
  if (!cards.length) cards = [...element.querySelectorAll(':scope > .cell, :scope > div')];

  const cells = [];
  cards.forEach((card) => {
    const body = [];
    const heading = card.querySelector('h2, h3, h4, .card__title');
    if (heading && clean(heading)) {
      const h = document.createElement(/^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : 'h3');
      h.textContent = clean(heading);
      body.push(h);
    }
    card.querySelectorAll('.card__inner p, .card__meta').forEach((p, i, all) => {
      if ([...all].indexOf(p) !== i || !clean(p)) return;
      const para = document.createElement('p');
      para.textContent = clean(p);
      body.push(para);
    });
    const cta = card.querySelector('.card__footer a[href], a.btn[href]');
    if (cta) {
      cta.querySelectorAll('.screenreaders-only, .sr-only').forEach((s) => s.remove());
      const link = document.createElement('a');
      link.href = cta.getAttribute('href').trim();
      link.textContent = clean(cta);
      const p = document.createElement('p');
      p.append(link);
      body.push(p);
    }
    if (!body.length) return;
    const image = pickImage(card, document);
    cells.push([image ? [image] : '', body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(block);
}
