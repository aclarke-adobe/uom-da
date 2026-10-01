/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-people. Base: cards (option: people). Authored as "Cards (people)".
 * Source: course-detail template, student experience showcase profiles
 * (https://study.unimelb.edu.au/find/courses/graduate/master-of-management-accounting/student-experience).
 *
 * Output (library 2-column card = PROJECT cards block `people` option, blocks/cards/README.md):
 * one row per person
 *   cell 1 = portrait image only
 *   cell 2 = <h5>{name}</h5> [+ <p>{role}</p>] + bio paragraph(s) (inline links kept)
 * When the portrait is on the 403 list the row is text-only (mapping-notes 403 rule: never author an
 * empty image cell). h5 because the card sits under the section h4 (the source uses h6).
 *
 * Source (verified in block-context/cards-people/source.html):
 *   div > div.cell > div.cell > div.card.card--showcase-profile > div.card__inner >
 *     div.card__thumb (img, or background-image), h6.card__title, p.card__sub-title, p…, div.card__dash
 *   A trailing empty div.card--showcase-profile placeholder is skipped.
 * Iteration is keyed on div.card--showcase-profile (block wrapper).
 */

// Image availability is decided at import time from tools/importer/unloadable-images.json (generated
// by tools/importer/check-images.mjs through Bright Data): the course cleanup transformer drops those
// images before parsing. The assets once listed here as "403" load fine on the source (only curl and
// cross-site hotlinking are refused) and are localised to /media-da/ via the snapshot sidecars.
const BLOCKED_IMAGES = [];

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function portrait(card, name, document) {
  const thumb = card.querySelector('.card__thumb, .card__image, [aria-label="Profile Image"]');
  const img = (thumb || card).querySelector('img');
  let src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
  if ((!src || /^(data|blob):/.test(src)) && thumb) {
    const m = (thumb.getAttribute('style') || '').match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    src = m ? m[2].trim() : '';
  }
  if (!src || /^(data|blob):/.test(src)) return null;
  if (BLOCKED_IMAGES.some((frag) => src.includes(frag))) {
    console.warn(`[cards-people] image dropped (403): ${src}`);
    return null;
  }
  const out = document.createElement('img');
  out.src = src;
  out.alt = (img && img.getAttribute('alt')) || name || '';
  return out;
}

export default function parse(element, { document }) {
  let cards = [...element.querySelectorAll('.card--showcase-profile')];
  if (!cards.length) cards = [...element.querySelectorAll('.card')];

  const cells = [];
  cards.forEach((card) => {
    const inner = card.querySelector('.card__inner') || card;
    const titleEl = inner.querySelector('.card__title, h1, h2, h3, h4, h5, h6');
    const name = cleanText(titleEl);
    const body = [];
    if (name) {
      const h = document.createElement('h5');
      h.textContent = name;
      body.push(h);
    }
    [...inner.querySelectorAll('p, ul, ol')].forEach((el) => {
      if (el.closest('.card__thumb') || !cleanText(el)) return;
      if (el.parentElement && el.parentElement.closest('p, ul, ol') && inner.contains(el.parentElement)) return;
      body.push(el);
    });
    if (!body.length) return; // empty placeholder card
    const image = portrait(card, name, document);
    cells.push(image ? [[image], body] : [body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // On some pages the instance is a wrapper section (div.section.ct-textwithfigures) holding a
  // heading ("Student experience") before the card grid: keep that default content around the block.
  const before = [];
  const after = [];
  let seenCards = false;
  [...element.children].forEach((child) => {
    const hasCard = child.matches('.card--showcase-profile') || child.querySelector('.card--showcase-profile');
    if (hasCard) { seenCards = true; return; }
    if (!child.textContent.trim() && !child.querySelector('img, iframe')) return;
    (seenCards ? after : before).push(child);
  });

  // `variants` keeps the option out of computeBlockName (header renders as "Cards (people)").
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['people'], cells });
  element.replaceWith(...before, block, ...after);
}
