/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns. Base: columns (no options). Authored as "Columns".
 * Source: course-detail template, "Related study areas" row (#what-can-i-study; overview + majors).
 *
 * Output (library columns = blocks/columns/README.md + columns.js): 1 row, 2 text cells (narrow
 * heading column + wide content column; columns follow the source's left/right grouping):
 *   cell 1 = <h2>{left heading}</h2> (+ any other left-side text)
 *   cell 2 = <ul><li><a href="/find/study-areas/<slug>/">Name</a></li>…</ul> (DOM order, relative
 *            paths kept) + any other right-side content
 *
 * Source (verified in block-context/columns/source.html + instances/01.html):
 *   div.section-alt__row > div.section-alt__left > h2.title
 *                          div.section-alt__right > div > ul.card-course-list > li.card-course-list__item >
 *                            a.card-course[href] > span.card-course__name
 * Iteration is keyed on the li items, never on the anchors.
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function stripAttrs(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (/^(style|class|id|tabindex|role|data-.*|aria-.*)$/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
  return root;
}

function linkList(list, document) {
  const ul = document.createElement('ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const a = li.querySelector('a[href]');
    const text = cleanText(li.querySelector('.card-course__name') || a || li);
    if (!text) return;
    const item = document.createElement('li');
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href').trim();
      link.textContent = text;
      item.append(link);
    } else {
      item.textContent = text;
    }
    ul.append(item);
  });
  return ul.children.length ? ul : null;
}

function sideContent(side, document) {
  const out = [];
  if (!side) return out;
  [...side.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      if (cleanText(n)) { const p = document.createElement('p'); p.textContent = cleanText(n); out.push(p); }
      return;
    }
    if (n.nodeType !== 1 || (!cleanText(n) && !n.querySelector('img'))) return;
    if (n.matches('ul.card-course-list, ul')) {
      const ul = n.matches('.card-course-list') ? linkList(n, document) : stripAttrs(n);
      if (ul) out.push(ul);
      return;
    }
    if (/^H[1-6]$/.test(n.tagName)) {
      const h = document.createElement(n.tagName.toLowerCase());
      h.textContent = cleanText(n);
      out.push(h);
      return;
    }
    if (n.tagName === 'DIV' || n.tagName === 'SECTION') { out.push(...sideContent(n, document)); return; }
    out.push(stripAttrs(n));
  });
  return out;
}

export default function parse(element, { document }) {
  let sides = [...element.querySelectorAll(':scope > .section-alt__left, :scope > .section-alt__right')];
  if (!sides.length) sides = [...element.children];
  const row = sides.map((s) => sideContent(s, document)).filter((c) => c.length);

  if (!row.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [row] });
  element.replaceWith(block);
}
