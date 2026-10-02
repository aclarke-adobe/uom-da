/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-chips. Base: cards (option: chips). Authored as "Cards (chips)".
 * Source: course-detail template, career outcomes "Graduate pathways" (#available-pathways).
 *
 * Output follows the PROJECT cards block (blocks/cards/README.md, cards.js `chips` option = the
 * library's 1-column "no images" shape): one row per pathway, 1 cell:
 *   <p><a href="/find/pathways/...">Name</a></p>   (DOM order; relative site paths kept)
 *
 * Source (verified in block-context/cards-chips/source.html):
 *   ul.card-course-list.course-list--inline > li.card-course-list__item >
 *     a.card-course[href] > span.card-course__name
 * Iteration is keyed on the li items (block wrappers), never on the anchors.
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

/* section-landing (ct-coursecards ul.course-list > li > a.card-course > span.card-course__type +
 * span.card-course__name, verified in block-context/cards-chips/instances/section-landing-*.html):
 * row = <p><a>{name}</a></p><p>{type}</p>; cards.js colours the chip from the type
 * (Coursework / Micro-credential / Short course). */
function landingChip(li, document) {
  const a = li.querySelector('a[href]');
  const name = cleanText(li.querySelector('.card-course__name') || a || li);
  if (!name) return null;
  const p = document.createElement('p');
  if (a) {
    const link = document.createElement('a');
    link.href = a.getAttribute('href').trim();
    link.textContent = name;
    p.append(link);
  } else p.textContent = name;
  const cell = [p];
  const type = cleanText(li.querySelector('.card-course__type'));
  if (type) { const t = document.createElement('p'); t.textContent = type; cell.push(t); }
  return [cell];
}

export default function parse(element, { document, template }) {
  if (template === 'section-landing') {
    let lis = [...element.querySelectorAll(':scope > li')];
    if (!lis.length) lis = [...element.querySelectorAll('li')];
    const rows = lis.map((li) => landingChip(li, document)).filter(Boolean);
    if (!rows.length) { element.replaceWith(...element.childNodes); return; }
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['chips'], cells: rows }));
    return;
  }
  let items = [...element.querySelectorAll(':scope > li')];
  if (!items.length) items = [...element.querySelectorAll('.card-course-list__item, li')];

  const cells = [];
  items.forEach((li) => {
    const a = li.querySelector('a[href]');
    const text = cleanText(li.querySelector('.card-course__name') || a || li);
    if (!text) return;
    const p = document.createElement('p');
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href').trim();
      link.textContent = text;
      p.append(link);
    } else {
      p.textContent = text;
    }
    cells.push([p]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // `variants` keeps the option out of computeBlockName (header renders as "Cards (chips)").
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['chips'], cells });
  element.replaceWith(block);
}
