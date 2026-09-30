/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-tile. Base: cards (option: tile). Authored as "Cards (tile)".
 * Source: https://study.unimelb.edu.au (homepage template).
 *
 * Output (blocks/cards/README.md): one row per card, 1 body cell (text-only tiles).
 *
 * Handles two source shapes (verified in block-context/cards-tile/source.html + instances/0*.html):
 *  A. .pathfinder-today (dark, 4 items with description; light, 6 link-only items)
 *     li.pathfinder-today__list-item > div.pathfinder-today__link >
 *       a[href] > span.pathfinder-today__link-title   (+ decorative span.pathfinder-today__link-icon)
 *       span.pathfinder-today__link-description        (optional)
 *     -> <p><strong><a>Title</a></strong></p> [<p>Description</p>]
 *  B. .article-card-list (3 items)
 *     div.article-card > div.article-card__inner > h3.article-card__title > a.btn > span.push-icon
 *                                                  p.article-card__category (eyebrow, after h3 in source)
 *     -> <p>EYEBROW</p><h3><a>Title</a></h3>
 * Iteration is keyed on the block-level inner wrappers (div.pathfinder-today__link /
 * div.article-card__inner), never on the <a> elements.
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function makeLink(a, text, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = text;
  return link;
}

export default function parse(element, { document }) {
  const cells = [];

  // Shape A: pathfinder tiles
  let items = [...element.querySelectorAll('.pathfinder-today__link')];
  if (!items.length) items = [...element.querySelectorAll('.pathfinder-today__list-item')];
  items.forEach((item) => {
    const a = item.querySelector('a[href]');
    const titleEl = item.querySelector('.pathfinder-today__link-title') || a;
    const title = cleanText(titleEl);
    if (!a || !title) return;
    const body = [];
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.append(makeLink(a, title, document));
    p.append(strong);
    body.push(p);
    const desc = cleanText(item.querySelector('.pathfinder-today__link-description, [class*="description"]'));
    if (desc) {
      const dp = document.createElement('p');
      dp.textContent = desc;
      body.push(dp);
    }
    cells.push([body]);
  });

  // Shape B: article card list
  if (!cells.length) {
    let cards = [...element.querySelectorAll('.article-card__inner')];
    if (!cards.length) cards = [...element.querySelectorAll('.article-card')];
    cards.forEach((card) => {
      const heading = card.querySelector('h2, h3, h4, .article-card__title');
      const a = (heading && heading.querySelector('a[href]')) || card.querySelector('a[href]');
      const title = cleanText((a && a.querySelector('.push-icon')) || a || heading);
      if (!title) return;
      const body = [];
      const eyebrow = cleanText(card.querySelector('.article-card__category, [class*="category"], [class*="eyebrow"]'));
      if (eyebrow) {
        const ep = document.createElement('p');
        ep.textContent = eyebrow;
        body.push(ep);
      }
      const h = document.createElement(heading && /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : 'h3');
      if (a) h.append(makeLink(a, title, document));
      else h.textContent = title;
      body.push(h);
      cells.push([body]);
    });
  }

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (tile)', cells });
  element.replaceWith(block);
}
