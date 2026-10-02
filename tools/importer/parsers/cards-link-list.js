/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-link-list. Base: cards (option: link-list). Authored as "Cards (link-list)".
 * Source: section-landing template, professional-development category sublink menus
 * (div.section__inner:has(> div.grid .sublink-menu) > div.grid; 8 PD category pages + cost-of-living).
 *
 * Output (blocks/cards/README.md, cards.js `link-list`): one row per link, 1 cell:
 *   <p><a href="…">{label}</a></p>
 * The per-box colour (sublink-menu--blue/green/red) is not authorable and is lost (mapping-notes).
 *
 * Source (verified in block-context/cards-link-list/instances/section-landing-01.html):
 *   div.grid > .cell > .sublink-menu > nav > .sublink-menu__item > a.sublink-menu__link > div (label) + img (arrow)
 * Iteration is keyed on .sublink-menu__item (block wrapper), not on the anchors.
 */

function clean(t) {
  return (t || '').replace(/​/g, '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('.sublink-menu__item')];
  if (!items.length) items = [...element.querySelectorAll('li')];
  const cells = [];
  items.forEach((item) => {
    const a = item.querySelector('a[href]');
    const label = clean((item.querySelector('a > div, a > span') || a || item).textContent);
    if (!label) return;
    const p = document.createElement('p');
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href').trim();
      link.textContent = label;
      p.append(link);
    } else {
      p.textContent = label;
    }
    cells.push([p]);
  });
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['link-list'], cells });
  element.replaceWith(block);
}
