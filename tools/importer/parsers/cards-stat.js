/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-stat. Base: cards (option: stat). Authored as "Cards (stat)".
 * Source: course-detail template, UG entry-requirements (#admission-requirements ul.entry-reqs__list;
 * one domestic + one international copy). The graduate English test-score tiles use the same
 * card markup but are nested in the accordion (emitted by the accordion parser, same logic).
 *
 * Output follows the PROJECT cards block (blocks/cards/README.md, cards.js `stat` option), not the
 * generic library image|text card: one row per card, 2 TEXT cells
 *   cell 1 (figure + label) = <p>{title}</p><p><strong>{value}</strong></p>[<p>{label}</p>]
 *   cell 2 (description)    = description paragraph(s), inline links kept
 * Values such as "N/A" are kept; the label paragraph only when it has text.
 *
 * Source (verified in block-context/cards-stat/source.html + instances/01-international.html):
 *   ul.entry-reqs__list > li.entry-reqs__list-item > div.info-card >
 *     p.info-card__title, p.info-card__value, strong.info-card__label, hr, div.info-card__desc
 * Domestic has 2 cards, international 1 (the digest's "tag:p" unit is the p's inside the single
 * card): iteration is keyed on div.info-card (block wrapper), falling back to the li items, and the
 * row count follows the card count. Every part of a card is optional.
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function para(text, document) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

/** Description: keep inline markup; a bare-text div becomes one <p>, block children stay. */
function descParas(desc, document) {
  if (!desc || (!cleanText(desc) && !desc.querySelector('img'))) return [];
  const blocks = [...desc.children].filter((c) => /^(P|UL|OL|H[1-6]|TABLE)$/.test(c.tagName));
  if (blocks.length) {
    const out = [];
    let loose = document.createElement('p');
    [...desc.childNodes].forEach((n) => {
      if (n.nodeType === 1 && blocks.includes(n)) {
        if (cleanText(loose)) out.push(loose);
        loose = document.createElement('p');
        out.push(n);
      } else if (n.nodeType !== 8) {
        loose.append(n);
      }
    });
    if (cleanText(loose)) out.push(loose);
    return out;
  }
  const p = document.createElement('p');
  p.innerHTML = desc.innerHTML.trim();
  return [p];
}

function statRows(container, document) {
  let cards = [...container.querySelectorAll('.info-card')];
  if (!cards.length) cards = [...container.querySelectorAll(':scope > li')];
  const rows = [];
  cards.forEach((card) => {
    const title = cleanText(card.querySelector('.info-card__title, [data-test="info-card-title"]'));
    const value = cleanText(card.querySelector('.info-card__value, [data-test="info-card-value"]'));
    const label = cleanText(card.querySelector('.info-card__label, [data-test="info-card-label"]'));
    const desc = card.querySelector('.info-card__desc, [data-test="info-card-description"]');
    if (!title && !value) return;
    const stat = [];
    if (title) stat.push(para(title, document));
    if (value) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(strong);
      stat.push(p);
    }
    if (label) stat.push(para(label, document));
    const description = descParas(desc, document);
    rows.push(description.length ? [stat, description] : [stat, '']);
  });
  return rows;
}

/**
 * Section-landing stats and rankings (div.ct-statsrankings ul.uom-stats-and-rankings__stats), verified in
 * block-context/cards-stat/instances/section-landing-*.html:
 *   li.uom-stats-and-rankings__stat > .uom-stat > .uom-stat__icon-inline (decorative svg),
 *     .uom-stat__content > .uom-stat__title (figure) + .uom-stat__text (caption)
 * Row (1 cell): <p><strong>{figure}</strong></p><p>{caption}</p>. The citation
 * (.uom-stats-and-rankings__citation) sits outside the instance and stays default content.
 */
function landingStatRows(container, document) {
  const rows = [];
  container.querySelectorAll('.uom-stat').forEach((stat) => {
    const figure = cleanText(stat.querySelector('.uom-stat__title'));
    const caption = cleanText(stat.querySelector('.uom-stat__text'));
    if (!figure && !caption) return;
    const cell = [];
    if (figure) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = figure;
      p.append(strong);
      cell.push(p);
    }
    if (caption) cell.push(para(caption, document));
    rows.push([cell]);
  });
  return rows;
}

export default function parse(element, { document }) {
  if (element.querySelector('.uom-stat')) {
    const rows = landingStatRows(element, document);
    if (!rows.length) { element.replaceWith(...element.childNodes); return; }
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['stat'], cells: rows }));
    return;
  }
  const cells = statRows(element, document);
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  // `variants` keeps the option out of computeBlockName (header renders as "Cards (stat)").
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['stat'], cells });
  element.replaceWith(block);
}
