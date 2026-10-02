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

/* ---- section-landing (template 'section-landing'; verified in
 * block-context/columns/instances/section-landing-*.html) ----
 *   #main > section#dates .section-alt__row, section.section-alt:has(ul.page-short-course__course-list),
 *   section.section-alt:has(ul.card-course-list): .section-alt__left | .section-alt__right
 *   div.ct-section-texttwocolumn div.grid: .cell (heading) | .cell (text + a.btn)
 *   div.ct-textwithfigures .section__inner: figure.figure--inset-right|left + text -> text | image
 *     (image cell first for an inset-left figure)
 * Course chips (a.card-course > .card-course__type + .card-course__name) become
 * <li><a>{name}</a> ({type})</li>; a.btn -> <p><strong><a>, a.btn--secondary -> <p><em><a>;
 * every attribute except href/src/alt is dropped (Word-paste paraid/paraeid included).
 */
function landingStrip(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    [...el.attributes].forEach((a) => { if (!['href', 'src', 'alt', 'colspan', 'rowspan'].includes(a.name)) el.removeAttribute(a.name); });
  });
  root.querySelectorAll('span').forEach((sp) => sp.replaceWith(...sp.childNodes));
  root.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', a.getAttribute('href').trim()));
  return root;
}

function landingCta(a, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = cleanText(a);
  const cls = a.className || '';
  const p = document.createElement('p');
  if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) { p.append(link); return p; }
  const wrap = document.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
  wrap.append(link);
  p.append(wrap);
  return p;
}

function landingCourseList(list, document) {
  const ul = document.createElement('ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const a = li.querySelector('a[href]');
    const name = cleanText(li.querySelector('.card-course__name') || a || li);
    if (!name) return;
    const item = document.createElement('li');
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href').trim();
      link.textContent = name;
      item.append(link);
    } else item.textContent = name;
    const type = cleanText(li.querySelector('.card-course__type'));
    if (type) item.append(` (${type})`);
    ul.append(item);
  });
  return ul.children.length ? ul : null;
}

function landingImage(fig, document) {
  const img = fig.matches('img') ? fig : fig.querySelector('img');
  if (!img) return [];
  const src = (img.getAttribute('src') || img.getAttribute('data-src') || '').trim();
  if (!src || /^(data|blob):/.test(src)) return [];
  const out = document.createElement('img');
  out.src = src;
  out.alt = (img.getAttribute('alt') || '').trim();
  const p = document.createElement('p');
  p.append(out);
  const res = [p];
  const cap = fig.querySelector && fig.querySelector('figcaption');
  if (cap && cleanText(cap)) { const c = document.createElement('p'); c.innerHTML = cap.innerHTML.trim(); res.push(landingStrip(c)); }
  return res;
}

function landingSide(side, document, figures) {
  const out = [];
  if (!side) return out;
  [...side.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      if (cleanText(n)) { const p = document.createElement('p'); p.textContent = cleanText(n); out.push(p); }
      return;
    }
    if (n.nodeType !== 1 || (!cleanText(n) && !n.querySelector('img') && !n.matches('img'))) return;
    if (n.matches('figure') && figures) { figures.push(n); return; }
    if (n.matches('figure, img')) { out.push(...landingImage(n, document)); return; }
    if (n.matches('ul.card-course-list, ul.page-short-course__course-list')) {
      const ul = landingCourseList(n, document);
      if (ul) out.push(ul);
      return;
    }
    if (n.matches('a')) { if (cleanText(n)) out.push(landingCta(n, document)); return; }
    if (/^H[1-6]$/.test(n.tagName)) {
      const h = document.createElement(n.tagName.toLowerCase());
      h.textContent = cleanText(n);
      out.push(h);
      return;
    }
    if (n.tagName === 'P' && n.querySelector('a.btn, a[class*="btn--"]') && cleanText(n) === cleanText(n.querySelector('a'))) {
      out.push(landingCta(n.querySelector('a'), document));
      return;
    }
    if (/^(DIV|SECTION|ARTICLE)$/.test(n.tagName)) { out.push(...landingSide(n, document, figures)); return; }
    out.push(landingStrip(n));
  });
  return out;
}

function parseLanding(element, document) {
  let sides = [...element.querySelectorAll(':scope > .section-alt__left, :scope > .section-alt__right')];
  let row;
  if (sides.length) {
    row = sides.map((s) => landingSide(s, document)).filter((c) => c.length);
  } else if (element.matches('.grid') || element.querySelector(':scope > .cell')) {
    sides = [...element.querySelectorAll(':scope > .cell')];
    row = sides.map((s) => landingSide(s, document)).filter((c) => c.length);
  } else {
    // text with inset figure(s): text | image(s)
    const figures = [];
    const text = landingSide(element, document, figures);
    const images = figures.flatMap((f) => landingImage(f, document));
    const left = figures.some((f) => /figure--inset-left/.test(f.className));
    row = [text, images].filter((c) => c.length);
    if (left) row.reverse();
  }
  if (!row.length) { element.replaceWith(...element.childNodes); return; }
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Columns', cells: [row] }));
}

export default function parse(element, { document, template }) {
  if (template === 'section-landing') {
    parseLanding(element, document);
    return;
  }
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
