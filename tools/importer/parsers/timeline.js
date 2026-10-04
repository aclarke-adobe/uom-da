/* eslint-disable */
/* global WebImporter */
/**
 * Parser for timeline. Base: timeline (no options). Authored as "Timeline".
 * Source: section-landing / story-article content blocks, dl.timeline (30 audition pages, the
 * Kwong Lee Dow, Extension, Access Melbourne, Narrm and Hansen program pages).
 *
 * Output (blocks/timeline/README.md + timeline.js, default variant): one row per dt/dd pair,
 *   cell 1 = date: one <p> per line of the dt (e.g. <p>Monday</p><p>20 July 2026</p>, label +
 *            date); an EMPTY cell when the dt is empty (the row continues the previous date);
 *   cell 2 = description: the dd content (h6 heading, paragraphs, lists, links) kept as authored.
 *
 * Source (verified on the snapshots, UI kit v17.11):
 *   dl.timeline > (dt.timeline__header > text [<br>] [<strong>date</strong>] , dd.timeline__body > h6?, p*)+
 *   e.g. kwong-lee: <dt> Monday<br><strong>20 July 2026</strong></dt>; auditions:
 *   <dt> 3 August 2026<br></dt> and <dt><br></dt> (no date: same date as the row above).
 * A dd without a preceding dt, or a dt without a dd, still gets its row (the other cell empty).
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function stripAttrs(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    if (!el.attributes) return;
    [...el.attributes].forEach((a) => {
      if (/^(style|class|id|tabindex|role|draggable|data-.*|aria-.*|paraid|paraeid)$/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
  return root;
}

/** dt -> its lines, split at <br> (one <p> each; inline markup flattened to text). */
function dateLines(dt, document) {
  const lines = [];
  let cur = '';
  const flush = () => { const t = cur.replace(/\s+/g, ' ').trim(); if (t) lines.push(t); cur = ''; };
  const walk = (node) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) cur += n.textContent;
      else if (n.nodeType === 1 && n.tagName === 'BR') flush();
      else if (n.nodeType === 1) walk(n);
    });
  };
  walk(dt);
  flush();
  return lines.map((t) => { const p = document.createElement('p'); p.textContent = t; return p; });
}

/** dd -> block children (bare text / inline runs wrapped in <p>). */
function description(dd, document) {
  const out = [];
  let loose = null;
  [...dd.childNodes].forEach((n) => {
    if (n.nodeType === 1 && /^(P|UL|OL|H[1-6]|TABLE|BLOCKQUOTE|DIV)$/.test(n.tagName)) {
      loose = null;
      if (!cleanText(n) && !n.querySelector('img')) return;
      if (n.tagName === 'DIV') { const p = document.createElement('p'); p.innerHTML = n.innerHTML.trim(); out.push(stripAttrs(p)); return; }
      out.push(stripAttrs(n));
      return;
    }
    if (n.nodeType === 3 && !n.textContent.trim()) { if (loose) loose.append(n); return; }
    if (!loose) { loose = document.createElement('p'); out.push(loose); }
    loose.append(n);
  });
  return out.filter((el) => cleanText(el) || el.querySelector('img'));
}

export default function parse(element, { document }) {
  const rows = [];
  let pending = null; // dt waiting for its dd
  [...element.children].forEach((c) => {
    if (c.tagName === 'DT') {
      if (pending) rows.push([pending, '']);
      const lines = dateLines(c, document);
      pending = lines.length ? lines : '';
      return;
    }
    if (c.tagName === 'DD') {
      const body = description(c, document);
      rows.push([pending === null ? '' : pending, body.length ? body : '']);
      pending = null;
    }
  });
  if (pending) rows.push([pending, '']);
  const cells = rows.filter(([d, b]) => d || b);
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Timeline', cells }));
}
