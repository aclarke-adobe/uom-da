/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-course-link. Base: cards (option: course-link). Authored as "Cards (course-link)".
 * Source: https://study.unimelb.edu.au (homepage template).
 *
 * Output (blocks/cards/README.md): one row per link, 1 cell: <p><a>Link text</a></p>
 * (single-link rows get .cards-card-link in the decorator).
 *
 * Source (verified in block-context/cards-course-link/source.html):
 *   ul.uom-link-list__list > li.uom-link-list__item > a.uom-link[href] > span.uom-link__text
 *   (+ div.uom-link__icon, removed by the cleanup transformer; ignored here either way)
 * Iteration is keyed on li.uom-link-list__item (block wrapper), not on the anchors.
 */
export default function parse(element, { document }) {
  let items = [...element.querySelectorAll(':scope > li, :scope > .uom-link-list__item')];
  if (!items.length) items = [...element.querySelectorAll('li')];

  const cells = [];
  items.forEach((li) => {
    const a = li.querySelector('a[href]');
    if (!a) return;
    const textEl = a.querySelector('.uom-link__text') || a;
    const text = textEl.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const link = document.createElement('a');
    link.href = a.getAttribute('href').trim();
    link.textContent = text;
    const p = document.createElement('p');
    p.append(link);
    cells.push([p]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // `variants` keeps the hyphen: a hyphen inside `name` is title-cased by computeBlockName
  // ("Cards (course Link)"). Header row renders as "Cards (course-link)".
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['course-link'], cells });
  element.replaceWith(block);
}
