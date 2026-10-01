/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion. Base: accordion (no options). Authored as "Accordion".
 * Source: course-detail template, entry requirements (UG admission criteria / additional
 * information; graduate English test-score toggle).
 *
 * Output (library 2-column accordion = blocks/accordion/README.md + accordion.js): one row per item
 *   cell 1 = label (span.accordion__title text)
 *   cell 2 = answer: the panel content as default content, with nested blocks emitted inside the
 *            cell (the decorator decorates `.accordion-item-body > div[class]` children):
 *              table.table                     -> nested "Table" block (th cells bold so the table
 *                                                 decorator detects the header row; highlighted
 *                                                 total rows tr.table__row--info bold)
 *              .entry-reqs--language-reqs      -> nested "Cards (stat)" block
 *                                                 (<p>{title}</p><p><strong>{value}</strong></p>[<p>{label}</p>] | desc;
 *                                                 N/A values kept; label only when it has text)
 *              ul.toggleblock (nested toggle)  -> nested "Accordion" block
 *              <small> footnote                -> <p>
 * No intro row (never a 1-cell first row).
 *
 * Source (verified in block-context/accordion/source.html + instances/01.html, 02.html):
 *   UG:   the instance is a div > ul.toggleblock.togglerow (one per item) >
 *           li[data-testid=toggleblock-trigger] .tr > span.accordion__title (+ chevron, removed by cleanup)
 *           li[data-testid=toggleblock-panel] > div.tr > div.bg-alt-darker > div.criteria__content.course-content
 *   Grad: the instance IS the single ul.toggleblock (its repeating unit is the trigger/panel li pair);
 *         its panel holds div.course-section__main--info-card > p.entry-reqs--prompt,
 *           div.entry-reqs--language-reqs > div.info-card (p.info-card__title, p.info-card__value,
 *           strong.info-card__label, div.info-card__desc), small (footnote)
 * Both shapes are handled: the item list is [element] when the element is a ul.toggleblock, otherwise
 * its ul.toggleblock children (fallback: any descendant ul.toggleblock not nested in another one).
 * Iteration is keyed on ul.toggleblock (one per item), never on anchors.
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function stripAttrs(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    if (!el.attributes) return;
    [...el.attributes].forEach((a) => {
      if (/^(style|class|id|tabindex|role|headers|data-.*|aria-.*|paraid|paraeid)$/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
}

// ---- nested Table ----
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

function tableBlock(table, document) {
  const rows = [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr')];
  const cells = [];
  rows.forEach((tr) => {
    const highlighted = /table__row--info/.test(tr.className);
    const row = [];
    [...tr.children].filter((c) => /^(TD|TH)$/.test(c.tagName)).forEach((c) => {
      row.push(cellContent(c, document, c.tagName === 'TH' || highlighted));
      // colspan expanded with empty cells (same rule as the top-level table parser)
      const span = parseInt(c.getAttribute('colspan') || '1', 10);
      for (let i = 1; i < span && i < 20; i += 1) row.push('');
    });
    if (row.some((c) => c && (c.length ? true : false))) cells.push(row);
  });
  if (!cells.length) return null;
  const width = Math.max(...cells.map((r) => r.length));
  cells.forEach((r) => { while (r.length < width) r.push(''); });
  return WebImporter.Blocks.createBlock(document, { name: 'Table', cells });
}

// ---- nested Cards (stat) ----
function statBlock(container, document) {
  const cards = [...container.querySelectorAll('.info-card')];
  const cells = [];
  cards.forEach((card) => {
    const title = cleanText(card.querySelector('.info-card__title'));
    const value = cleanText(card.querySelector('.info-card__value'));
    const label = cleanText(card.querySelector('.info-card__label'));
    const desc = card.querySelector('.info-card__desc');
    if (!title && !value) return;
    const stat = [];
    if (title) { const p = document.createElement('p'); p.textContent = title; stat.push(p); }
    if (value) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(strong);
      stat.push(p);
    }
    if (label) { const p = document.createElement('p'); p.textContent = label; stat.push(p); }
    let description = '';
    if (desc && cleanText(desc)) {
      const p = document.createElement('p');
      p.innerHTML = desc.innerHTML.trim();
      stripAttrs(p);
      description = [p];
    }
    cells.push([stat, description]);
  });
  if (!cells.length) return null;
  return WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['stat'], cells });
}

/** The innermost wrapper of an item panel (skips div.tr / div.bg-alt-darker layers). */
function panelRoot(panel) {
  // unwrap single-child div chains (li > div.tr > div.bg-alt-darker > div.criteria__content); stop at
  // the first level with several children, so siblings such as the graduate info-card wrapper + a
  // div.well note ("Please note that the listed English language requirements…") are all kept.
  let root = panel;
  while (root.children.length === 1 && root.firstElementChild.tagName === 'DIV'
    && !cleanText({ textContent: [...root.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('') })) {
    root = root.firstElementChild;
  }
  return root;
}

/** Convert a panel's children into answer-cell content (default content + nested blocks). */
function answerContent(root, document) {
  const out = [];
  [...root.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      if (cleanText(node)) { const p = document.createElement('p'); p.textContent = cleanText(node); out.push(p); }
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node;
    if (el.matches('table')) {
      const t = tableBlock(el, document);
      if (t) out.push(t);
      return;
    }
    if (el.matches('.entry-reqs--language-reqs')) {
      const s = statBlock(el, document);
      if (s) out.push(s);
      return;
    }
    if (el.matches('ul.toggleblock')) {
      const a = accordionBlock([el], document);
      if (a) out.push(a);
      return;
    }
    if (el.matches('small')) {
      if (!cleanText(el)) return;
      const p = document.createElement('p');
      p.innerHTML = el.innerHTML.trim();
      stripAttrs(p);
      out.push(p);
      return;
    }
    if (el.tagName === 'DIV') {
      // wrappers (wells, tables wrappers, Word-paste fragments): recurse
      if (el.querySelector('table, .entry-reqs--language-reqs, ul.toggleblock, p, ul, ol, h1, h2, h3, h4, h5, h6')) {
        out.push(...answerContent(el, document));
      } else if (cleanText(el)) {
        const p = document.createElement('p');
        p.innerHTML = el.innerHTML.trim();
        stripAttrs(p);
        out.push(p);
      }
      return;
    }
    if (!cleanText(el) && !el.querySelector('img, iframe')) return;
    if (el.querySelector('table, ul.toggleblock')) {
      out.push(...answerContent(el, document));
      return;
    }
    stripAttrs(el);
    out.push(el);
  });
  return out;
}

function accordionBlock(uls, document) {
  const cells = [];
  uls.forEach((ul) => {
    const trigger = ul.querySelector(':scope > [data-testid="toggleblock-trigger"], :scope > .toggleblock__default');
    const panel = ul.querySelector(':scope > [data-testid="toggleblock-panel"], :scope > .toggleblock__hidden');
    const label = cleanText((trigger && trigger.querySelector('.accordion__title')) || trigger);
    if (!label) return;
    const answer = panel ? answerContent(panelRoot(panel), document) : [];
    cells.push([label, answer.length ? answer : '']);
  });
  if (!cells.length) return null;
  return WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
}

export default function parse(element, { document }) {
  const uls = element.matches('ul.toggleblock')
    ? [element]
    : [...element.querySelectorAll(':scope > ul.toggleblock')];
  if (!uls.length) uls.push(...element.querySelectorAll('ul.toggleblock'));

  // default content sitting beside the toggles inside the instance wrapper is kept around the block
  const before = [];
  const after = [];
  if (!element.matches('ul.toggleblock')) {
    let seen = false;
    [...element.children].forEach((child) => {
      if (uls.includes(child)) { seen = true; return; }
      if (!cleanText(child) && !child.querySelector('img, iframe')) return;
      (seen ? after : before).push(child);
    });
  }

  const block = accordionBlock(uls.filter((u) => !u.parentElement.closest('ul.toggleblock')), document);
  if (!block) {
    element.replaceWith(...element.childNodes);
    return;
  }
  element.replaceWith(...before, block, ...after);
}
