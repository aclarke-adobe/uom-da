/* eslint-disable */
/* global WebImporter */
/**
 * Parser for notice. Base: notice (no options). Authored as "Notice".
 * Source: course-detail template, fees (fee panels, one domestic + one international copy) and
 * graduate overview/structure notices (.course-content > div.notice).
 *
 * Output (blocks/notice/README.md + notice.js): 1 row, 1 cell
 *   fee panel: <h4>:check: {title}</h4> when [data-test=has-csp], otherwise <h4>:dollar: {title}</h4>;
 *              then the panel text: lead / overview paragraphs, international year groups as
 *              <h5>{2026 fees}</h5><ul><li>{fee title} <strong>{price}</strong>[ {desc}]</li></ul>,
 *              notes (div.notice) and the disclaimer paragraphs.
 *   div.notice: its content as-is (heading, paragraphs, lists); no icon.
 *
 * Source (verified in block-context/notice/source.html + instances/01-international.html, and the
 * bulk fees snapshots):
 *   div.fee-info-panel[data-test=has-csp]? > img (icon, removed by cleanup) > .fee-info-panel__inner >
 *     .toggleblock > trigger .fee-info-panel__title > h4
 *                    panel .fee-info-panel__text > div >
 *                      p.fee-info-panel__text--lead, p.fee-info-panel__overview,
 *                      .fee-info-panel__fees > .fee-info-panel__year > h4.fee-info-panel__year-title +
 *                        ul.fee-list > li.fee-item > span.fee-item__title, span.fee-item__price, [.fee-item__desc]
 *                      div.notice (notes), #fee-disclaimer .fee-info-panel__overview > p…
 *   div.notice[.notice--default|--info|--success] > h4? p… ul…
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function stripAttrs(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    if (!el.attributes) return;
    [...el.attributes].forEach((a) => {
      if (/^(style|class|id|tabindex|role|data-.*|aria-.*|_ms.*)$/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
  return root;
}

function feeYear(year, document) {
  const out = [];
  const title = cleanText(year.querySelector('.fee-info-panel__year-title, h4, h5'));
  if (title) {
    const h5 = document.createElement('h5');
    h5.textContent = title;
    out.push(h5);
  }
  const ul = document.createElement('ul');
  year.querySelectorAll('li.fee-item, .fee-list > li').forEach((item, i, all) => {
    if ([...all].indexOf(item) !== i) return;
    const li = document.createElement('li');
    const t = cleanText(item.querySelector('.fee-item__title'));
    const price = cleanText(item.querySelector('.fee-item__price'));
    const desc = cleanText(item.querySelector('.fee-item__desc'));
    if (t) li.append(t);
    if (price) {
      if (t) li.append(' ');
      const strong = document.createElement('strong');
      strong.textContent = price;
      li.append(strong);
    }
    if (desc) li.append(` ${desc}`);
    if (!t && !price && !desc) li.textContent = cleanText(item);
    if (cleanText(li)) ul.append(li);
  });
  if (ul.children.length) out.push(ul);
  // anything else in the year group (notes)
  [...year.children].forEach((c) => {
    if (c.matches('.fee-info-panel__year-title, h4, h5, ul.fee-list, .fee-list') || !cleanText(c)) return;
    out.push(...content(c, document));
  });
  return out;
}

/** Generic panel content: headings demoted below the notice h4, wrappers recursed. */
function content(root, document) {
  const out = [];
  [...root.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      if (cleanText(n)) { const p = document.createElement('p'); p.textContent = cleanText(n); out.push(p); }
      return;
    }
    if (n.nodeType !== 1) return;
    if (n.matches('.fee-info-panel__fees')) {
      // year groups, plus notes (div.notice "The indicative total course fee is based on…") in between
      [...n.children].forEach((c) => {
        if (c.matches('.fee-info-panel__year')) out.push(...feeYear(c, document));
        else if (cleanText(c)) out.push(...content(c.matches('.notice') ? c : { childNodes: [c] }, document));
      });
      return;
    }
    if (n.matches('.fee-info-panel__year')) { out.push(...feeYear(n, document)); return; }
    if (!cleanText(n) && !n.querySelector('img')) return;
    if (/^(DIV|SECTION|SPAN)$/.test(n.tagName) && n.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6, .fee-info-panel__year')) {
      out.push(...content(n, document));
      return;
    }
    if (/^(DIV|SPAN)$/.test(n.tagName)) {
      const p = document.createElement('p');
      p.innerHTML = n.innerHTML.trim();
      out.push(stripAttrs(p));
      return;
    }
    out.push(stripAttrs(n));
  });
  return out;
}

export default function parse(element, { document }) {
  const cell = [];

  if (element.matches('.fee-info-panel') || element.querySelector('.fee-info-panel__inner')) {
    const panel = element.matches('.fee-info-panel') ? element : element.querySelector('.fee-info-panel');
    const icon = panel.matches('[data-test="has-csp"]') ? 'check' : 'dollar';
    const title = cleanText(panel.querySelector('.fee-info-panel__title h4, .fee-info-panel__title, [data-test="fee-panel-title"]'));
    const h4 = document.createElement('h4');
    h4.textContent = title ? `:${icon}: ${title}` : `:${icon}:`;
    cell.push(h4);
    const text = panel.querySelector('.fee-info-panel__text, [data-test="fee-info-panel-text"]');
    if (text) cell.push(...content(text, document));
  } else {
    const root = element.matches('.notice') ? element : (element.querySelector('.notice') || element);
    cell.push(...content(root, document));
  }

  if (!cell.length || !cell.some((el) => cleanText(el))) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Notice', cells: [[cell]] });
  element.replaceWith(block);
}
