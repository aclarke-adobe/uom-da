/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-overlap. Base: columns (option: overlap). Authored as "Columns (overlap)".
 * Source: section-landing template, "What you will learn" on short courses / micro-credentials
 * (#main > section#what-you-will-learn) and Matrix ct-textcolumnlayout overlap panels
 * (div.ct-textcolumnlayout:has(.section-alt__img-wrapper) > section.section-alt).
 *
 * Output (blocks/columns/README.md + columns.js `overlap`; 2 columns per row):
 *   row 1 = the banner image | '' (decorator: columns-overlap-media); omitted when there is none
 *   row 2 = .section-alt__left (heading, text, CTA) | .section-alt__right (content panel)
 * Panel content rules (mapping-notes "columns-overlap", components analysis):
 *   - a populated .card-flat-list is flattened into the right cell: per card h3 + paragraphs + link;
 *   - "<br><br>" in a paragraph splits it into paragraphs; a run of "1. … 2. … 3. …" lines becomes <ol>;
 *   - a YouTube / Vimeo iframe becomes a link paragraph;
 *   - a.btn -> <p><strong><a>, a.btn--secondary -> <p><em><a>, a.btn--text -> <p><a> (text link);
 *   - the "^empty:" alt prefix and U+200B characters are stripped.
 *
 * Source (verified in block-context/columns-overlap/source.html + instances/section-landing-01.html):
 *   section.section-alt > .section-alt__img-wrapper img[alt][src]
 *     .section-alt__inner > .section-alt__row > .section-alt__left (h2, p, a.btn…) | .section-alt__right
 */

function clean(t) {
  return (t || '').replace(/​/g, '').replace(/\s+/g, ' ').trim();
}

function text(el) {
  return clean(el ? el.textContent : '');
}

function stripAttrs(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    if (!el.attributes) return;
    [...el.attributes].forEach((a) => {
      if (/^(style|class|id|tabindex|role|loading|data-.*|aria-(?!label$).*)$/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
  return root;
}

function ctaParagraph(a, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = text(a);
  const p = document.createElement('p');
  const cls = a.className || '';
  if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) {
    p.append(link);
  } else {
    const wrap = document.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
    wrap.append(link);
    p.append(wrap);
  }
  return p;
}

function videoLink(iframe, document) {
  const src = iframe.getAttribute('src') || '';
  const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/"]+)/);
  const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/);
  const href = yt ? `https://www.youtube.com/watch?v=${yt[1]}` : (vm ? `https://vimeo.com/${vm[1]}` : src);
  if (!href) return null;
  const a = document.createElement('a');
  a.href = href;
  a.textContent = clean(iframe.getAttribute('title')) || href;
  const p = document.createElement('p');
  p.append(a);
  return p;
}

/**
 * Split a paragraph's inline content at <br><br> into paragraphs; consecutive "N. text" lines
 * (separated by single <br>) become one <ol>.
 */
function splitParagraph(p, document) {
  const lines = [[]];
  [...p.childNodes].forEach((n) => {
    if (n.nodeName === 'BR') lines.push([]);
    else lines[lines.length - 1].push(n);
  });
  const out = [];
  let para = null;
  let list = null;
  const lineText = (l) => clean(l.map((x) => x.textContent).join(''));
  lines.forEach((line) => {
    const t = lineText(line);
    if (!t) { para = null; list = null; return; }
    if (/^\d+\.\s+/.test(t)) {
      if (!list) { list = document.createElement('ol'); out.push(list); }
      para = null;
      const li = document.createElement('li');
      line.forEach((x) => li.append(x));
      const first = [...li.childNodes].find((x) => x.nodeType === 3 && x.textContent.trim());
      if (first) first.textContent = first.textContent.replace(/^\s*\d+\.\s+/, '');
      list.append(li);
      return;
    }
    list = null;
    if (!para) { para = document.createElement('p'); out.push(para); } else para.append(document.createElement('br'));
    line.forEach((x) => para.append(x));
  });
  out.forEach((el) => {
    const f = el.firstChild;
    if (f && f.nodeType === 3) f.textContent = f.textContent.replace(/^\s+/, '');
    const l = el.lastChild;
    if (l && l.nodeType === 3) l.textContent = l.textContent.replace(/\s+$/, '');
  });
  return out.length ? out : [p];
}

/** Panel content -> cell elements. */
function panel(root, document) {
  const out = [];
  [...root.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      if (clean(n.textContent)) { const p = document.createElement('p'); p.textContent = clean(n.textContent); out.push(p); }
      return;
    }
    if (n.nodeType !== 1) return;
    if (n.tagName === 'IFRAME') { const v = videoLink(n, document); if (v) out.push(v); return; }
    if (n.matches('a.btn, a[class*="btn--"]')) { if (text(n)) out.push(ctaParagraph(n, document)); return; }
    if (!text(n) && !n.querySelector('img, iframe')) return;
    if (/^H[1-6]$/.test(n.tagName)) {
      const h = document.createElement(n.tagName.toLowerCase());
      h.textContent = text(n);
      out.push(h);
      return;
    }
    if (n.tagName === 'P') {
      if (n.querySelector(':scope > iframe')) {
        n.querySelectorAll('iframe').forEach((f) => { const v = videoLink(f, document); if (v) out.push(v); f.remove(); });
        if (!text(n)) return;
      }
      const btn = n.querySelector(':scope > a.btn, :scope > a[class*="btn--"]');
      if (btn && text(n) === text(btn)) { out.push(ctaParagraph(btn, document)); return; }
      stripAttrs(n);
      if (n.querySelector('br')) out.push(...splitParagraph(n, document));
      else out.push(n);
      return;
    }
    if (/^(UL|OL|TABLE|BLOCKQUOTE)$/.test(n.tagName)) { out.push(stripAttrs(n)); return; }
    // wrappers: card-flat-list, cells, card-flat, shim divs
    out.push(...panel(n, document));
  });
  return out;
}

function bannerImage(element, document) {
  const holder = element.querySelector(':scope > .section-alt__img-wrapper, .section-alt__img-wrapper');
  if (!holder) return null;
  const img = holder.querySelector('img');
  let src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
  if (!src || /^(data|blob):/.test(src)) {
    const bg = holder.querySelector('[data-excat-bg]') || (holder.hasAttribute('data-excat-bg') ? holder : null);
    src = bg ? bg.getAttribute('data-excat-bg') : '';
  }
  if (!src || /^(data|blob):/.test(src)) return null;
  const out = document.createElement('img');
  out.src = src.trim();
  out.alt = clean((img && img.getAttribute('alt')) || '').replace(/\^?empty:(banner image)?$/i, '').replace(/^\^?empty:/i, '').replace(/^banner image$/i, '');
  return out;
}

/* ---- text column (ct-textcolumnlayout without a banner) -> Columns (text-column) ----
 * Same source component as the overlap panel, without the image: heading column | content column.
 * Output (blocks/columns/README.md "Text column"; 2 columns per row):
 *   row 1     = .section-alt__left | .section-alt__right (intro content);
 *   rows 2..n = the populated .card-flat-list items, two per row (the decorator lays them out as a
 *               two-up grid under the right column's intro); each item: pictogram ":uom-<name>:" or
 *               image, h3/h4 title, text, list, link.
 * Nested blocks inside a cell (authored as tables in the cell; scripts/nested-blocks.js):
 *   div.notice / p.notice -> Notice; table -> Table; YouTube / Vimeo iframe -> Video (link + poster).
 * a.btn -> <p><strong><a>, a.btn--secondary -> <p><em><a>, a.btn--text -> <p><a>.
 */

const ICON_HOLDERS = '.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left';

function dashLists(cell, document) {
  const out = [];
  let ul = null;
  cell.forEach((el) => {
    const isDash = el.tagName === 'P' && /^\s*[-–•]\s+/.test(el.textContent);
    if (!isDash) { ul = null; out.push(el); return; }
    if (!ul) { ul = document.createElement('ul'); out.push(ul); }
    const li = document.createElement('li');
    li.innerHTML = el.innerHTML.replace(/^\s*[-–•]\s+/, '');
    ul.append(li);
  });
  return out;
}

function noticeBlock(el, document) {
  let cell;
  if (el.tagName === 'P') {
    const p = document.createElement('p');
    [...el.childNodes].forEach((n) => p.append(n));
    stripAttrs(p);
    cell = p.querySelector('br') ? splitParagraph(p, document) : [p];
  } else {
    // eslint-disable-next-line no-use-before-define
    cell = dashLists(textPanel(el, document, null), document);
  }
  if (!cell.some((c) => text(c))) return null;
  return WebImporter.Blocks.createBlock(document, { name: 'Notice', cells: [[cell]] });
}

function tableCell(cell, document, bold) {
  const hasBlocks = [...cell.children].some((c) => /^(P|UL|OL|DIV|H[1-6]|TABLE)$/.test(c.tagName));
  if (hasBlocks) {
    stripAttrs(cell);
    cell.querySelectorAll('[headers]').forEach((c) => c.removeAttribute('headers'));
    const kids = [...cell.childNodes].filter((n) => n.nodeType === 1 || clean(n.textContent));
    if (bold) {
      kids.filter((k) => k.tagName === 'P' && !(k.children.length === 1 && /^(STRONG|B)$/.test(k.firstElementChild.tagName))).forEach((k) => {
        const strong = document.createElement('strong');
        strong.append(...k.childNodes);
        k.append(strong);
      });
    }
    return kids;
  }
  const p = document.createElement('p');
  p.innerHTML = cell.innerHTML.replace(/\s+/g, ' ').trim();
  stripAttrs(p);
  if (!text(p) && !p.querySelector('img')) return '';
  if (bold) {
    const strong = document.createElement('strong');
    strong.append(...p.childNodes);
    p.append(strong);
  }
  return [p];
}

/** Nested Table: same rules as the top-level table parser (th bold, colspan expanded). */
function tableBlock(table, document) {
  const rows = [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr')];
  const cells = [];
  rows.forEach((tr) => {
    const highlighted = /table__row--info/.test(tr.className);
    const row = [];
    [...tr.children].filter((c) => /^(TD|TH)$/.test(c.tagName)).forEach((c) => {
      row.push(tableCell(c, document, c.tagName === 'TH' || highlighted));
      const span = parseInt(c.getAttribute('colspan') || '1', 10);
      for (let i = 1; i < span && i < 20; i += 1) row.push('');
    });
    if (row.some((c) => c && c.length)) cells.push(row);
  });
  if (!cells.length) return null;
  const width = Math.max(...cells.map((r) => r.length));
  cells.forEach((r) => { while (r.length < width) r.push(''); });
  return WebImporter.Blocks.createBlock(document, { name: 'Table', cells });
}

/** Nested Video: watch link + i.ytimg poster (same output as the top-level video parser). */
function videoBlock(iframe, document) {
  const src = (iframe.getAttribute('src') || iframe.getAttribute('data-src') || '').trim();
  const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
  const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (!yt && !vm) return null;
  const href = yt ? `https://www.youtube.com/watch?v=${yt[1]}` : `https://vimeo.com/${vm[1]}`;
  const a = document.createElement('a');
  a.href = href;
  a.textContent = clean(iframe.getAttribute('title')) || href;
  const p = document.createElement('p');
  p.append(a);
  const row = [[p]];
  if (yt) {
    const img = document.createElement('img');
    img.src = `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
    img.alt = clean(iframe.getAttribute('title'));
    row.push([img]);
  }
  return WebImporter.Blocks.createBlock(document, { name: 'Video', cells: [row] });
}

function imageParagraph(img, document) {
  const src = (img.getAttribute('src') || img.getAttribute('data-src') || '').trim();
  if (!src || /^(data|blob):/.test(src)) return null;
  const out = document.createElement('img');
  out.src = src;
  out.alt = clean(img.getAttribute('alt')).replace(/^\^?empty:.*$/i, '');
  const p = document.createElement('p');
  p.append(out);
  return p;
}

/** A loose <li> (not in a list, e.g. accommodation): inline content -> li, block children after the list. */
function looseItem(li, document) {
  const item = document.createElement('li');
  const rest = [];
  let inline = true;
  [...li.childNodes].forEach((n) => {
    if (inline && n.nodeType === 1 && /^(P|DIV|UL|OL|H[1-6]|TABLE)$/.test(n.tagName)) inline = false;
    if (inline) item.append(n);
    else rest.push(n);
  });
  while (item.lastChild && (item.lastChild.nodeName === 'BR' || (item.lastChild.nodeType === 3 && !clean(item.lastChild.textContent)))) item.lastChild.remove();
  if (item.firstChild && item.firstChild.nodeType === 3) item.firstChild.textContent = item.firstChild.textContent.replace(/^\s+/, '');
  if (item.lastChild && item.lastChild.nodeType === 3) item.lastChild.textContent = item.lastChild.textContent.replace(/\s+$/, '');
  stripAttrs(item);
  const holder = document.createElement('div');
  rest.forEach((n) => holder.append(n));
  return { item: text(item) ? item : null, holder };
}

/**
 * Text-column cell content. `items` (array) collects the card-flat list items (each an array of
 * cell elements); null means card lists are flattened in place.
 */
function textPanel(root, document, items) {
  const out = [];
  let looseList = null;
  [...root.childNodes].forEach((n) => {
    if (n.nodeType === 1 && n.tagName === 'LI') {
      const { item, holder } = looseItem(n, document);
      if (item) {
        if (!looseList) { looseList = document.createElement('ul'); out.push(looseList); }
        looseList.append(item);
      }
      const after = textPanel(holder, document, items);
      if (after.length) { looseList = null; out.push(...after); }
      return;
    }
    if (n.nodeType === 1 || clean(n.textContent)) looseList = null;
    if (n.nodeType === 3) {
      if (clean(n.textContent)) { const p = document.createElement('p'); p.textContent = clean(n.textContent); out.push(p); }
      return;
    }
    if (n.nodeType !== 1) return;
    if (n.matches(ICON_HOLDERS)) {
      const img = n.querySelector('img[data-excat-icon]');
      if (img) { const p = document.createElement('p'); p.textContent = `:uom-${img.getAttribute('data-excat-icon')}:`; out.push(p); }
      return;
    }
    if (n.matches('img')) { const p = imageParagraph(n, document); if (p) out.push(p); return; }
    if (n.matches('.notice')) { const b = noticeBlock(n, document); if (b) out.push(b); return; }
    if (n.tagName === 'TABLE') { const b = tableBlock(n, document); if (b) out.push(b); return; }
    if (n.tagName === 'IFRAME') { const b = videoBlock(n, document); if (b) out.push(b); return; }
    if (items && n.matches('.card-flat-list')) {
      n.querySelectorAll(':scope > .card-flat-list__item, :scope > .cell').forEach((cell) => {
        const content = textPanel(cell, document, null);
        if (content.some((c) => text(c) || (c.querySelector && c.querySelector('img')) || c.tagName === 'TABLE')) items.push(content);
      });
      return;
    }
    if (n.matches('a.btn, a[class*="btn--"]')) { if (text(n)) out.push(ctaParagraph(n, document)); return; }
    if (n.matches('a')) {
      if (text(n)) { const p = document.createElement('p'); p.append(stripAttrs(n)); out.push(p); }
      return;
    }
    if (!text(n) && !n.querySelector('img, iframe, table')) return;
    if (/^H[1-6]$/.test(n.tagName)) {
      const h = document.createElement(n.tagName.toLowerCase());
      h.textContent = text(n);
      out.push(h);
      return;
    }
    if (n.tagName === 'P') {
      if (n.querySelector('iframe')) {
        n.querySelectorAll('iframe').forEach((f) => { const b = videoBlock(f, document); if (b) out.push(b); f.remove(); });
        if (!text(n)) return;
      }
      const btn = n.querySelector(':scope > a.btn, :scope > a[class*="btn--"]');
      if (btn && text(n) === text(btn)) { out.push(ctaParagraph(btn, document)); return; }
      stripAttrs(n);
      ['paraid', 'paraeid'].forEach((a) => n.querySelectorAll(`[${a}]`).forEach((x) => x.removeAttribute(a)));
      n.removeAttribute('paraid');
      n.removeAttribute('paraeid');
      if (n.querySelector('br')) out.push(...splitParagraph(n, document));
      else out.push(n);
      return;
    }
    if (/^(UL|OL|BLOCKQUOTE)$/.test(n.tagName)) { out.push(stripAttrs(n)); return; }
    // wrappers: cells, card-flat, card-flat__img, shim divs
    out.push(...textPanel(n, document, items));
  });
  return out;
}

function parseTextColumn(element, document) {
  const row = element.querySelector('.section-alt__row') || element;
  const left = row.querySelector(':scope > .section-alt__left');
  const right = row.querySelector(':scope > .section-alt__right');
  const items = [];
  const leftCell = left ? textPanel(left, document, items) : [];
  const rightCell = right ? textPanel(right, document, items) : [];
  if (!leftCell.length && !rightCell.length && !items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const cells = [[leftCell.length ? leftCell : '', rightCell.length ? rightCell : '']];
  for (let i = 0; i < items.length; i += 2) cells.push(items.slice(i, i + 2));
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', variants: ['text-column'], cells });
  element.replaceWith(block);
}

export default function parse(element, { document }) {
  if (!element.querySelector('.section-alt__img-wrapper') && element.closest('.ct-textcolumnlayout')) {
    parseTextColumn(element, document);
    return;
  }
  const row = element.querySelector('.section-alt__row') || element;
  const left = row.querySelector(':scope > .section-alt__left');
  const right = row.querySelector(':scope > .section-alt__right');
  const leftCell = left ? panel(left, document) : [];
  const rightCell = right ? panel(right, document) : (left ? [] : panel(row, document));

  if (!leftCell.length && !rightCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const image = bannerImage(element, document);
  if (image) cells.push([[image], '']);
  cells.push([leftCell.length ? leftCell : '', rightCell.length ? rightCell : '']);

  // `variants` keeps the option out of computeBlockName (header renders as "Columns (overlap)").
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', variants: ['overlap'], cells });
  element.replaceWith(block);
}
