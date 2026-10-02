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

export default function parse(element, { document }) {
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
