/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table. Base: table (no options). Authored as "Table".
 * Source: course-detail template, data tables outside accordions (graduate how-to-apply rounds /
 * closing dates, key dates, scholarships, ER wells, structure overview).
 * (Tables inside accordion answers are emitted by the accordion parser as nested Table blocks with
 * the same logic.) The project table block (blocks/table/table.js) has no striped/bordered/no-header
 * options and detects the header row itself, so the library variants are not used.
 *
 * Output (blocks/table/README.md + table.js): rows and cells 1:1.
 *   - th cells are authored bold (<p><strong>…</strong></p>) so the decorator detects the header row
 *     even when the header text is longer than 60 characters;
 *   - highlighted total rows (tr.table__row--info) are bold;
 *   - colspan is expanded with empty cells so every row has the same number of cells
 *     (rowspan is not expanded: none in the snapshots);
 *   - a <caption> becomes a paragraph before the block;
 *   - cell content keeps inline markup and block children (p, ul, ol).
 *
 * Source (verified on the bulk raw snapshots, e.g. graduate/doctoral-program-in-accounting/structure):
 *   table.table[.table--striped] > thead > tr.table__row--inverted > th[colspan]?, tbody > tr > td
 * Empty tables are removed by the course cleanup transformer before parsing.
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function stripAttrs(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    if (!el.attributes) return;
    [...el.attributes].forEach((a) => {
      if (/^(style|class|id|tabindex|role|headers|width|height|valign|align|data-.*|aria-.*)$/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
  return root;
}

function cellContent(cell, document, bold) {
  const hasBlocks = [...cell.children].some((c) => /^(P|UL|OL|DIV|H[1-6]|TABLE)$/.test(c.tagName));
  if (hasBlocks) {
    stripAttrs(cell);
    return [...cell.childNodes].filter((n) => n.nodeType === 1 || cleanText(n));
  }
  const p = document.createElement('p');
  p.innerHTML = cell.innerHTML.replace(/\s+/g, ' ').trim();
  stripAttrs(p);
  if (!cleanText(p) && !p.querySelector('img')) return '';
  if (bold && !(p.children.length === 1 && /^(STRONG|B)$/.test(p.firstElementChild.tagName)
    && cleanText(p) === cleanText(p.firstElementChild))) {
    const strong = document.createElement('strong');
    strong.append(...p.childNodes);
    p.append(strong);
  }
  return [p];
}

export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const rows = [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr')];
  const cells = [];
  rows.forEach((tr) => {
    const highlighted = /table__row--info/.test(tr.className);
    const row = [];
    [...tr.children].filter((c) => /^(TD|TH)$/.test(c.tagName)).forEach((c) => {
      row.push(cellContent(c, document, c.tagName === 'TH' || highlighted));
      const span = parseInt(c.getAttribute('colspan') || '1', 10);
      for (let i = 1; i < span && i < 20; i += 1) row.push('');
    });
    if (row.some((c) => c && c.length)) cells.push(row);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const width = Math.max(...cells.map((r) => r.length));
  cells.forEach((r) => { while (r.length < width) r.push(''); });

  const before = [];
  const caption = table.querySelector(':scope > caption');
  if (caption && cleanText(caption)) {
    const p = document.createElement('p');
    p.textContent = cleanText(caption);
    before.push(p);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Table', cells });
  element.replaceWith(...before, block);
}
