/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-tile. Base: cards (option: tile). Authored as "Cards (tile)".
 * Source: https://study.unimelb.edu.au (homepage template).
 *
 * Output (blocks/cards/README.md): one row per card, 1 body cell (text-only tiles).
 *
 * Handles two source shapes (verified in block-context/cards-tile/source.html + instances/0*.html):
 *  A. .pathfinder-today (dark, 4 items with description; light, 6 link-only items)
 *     li.pathfinder-today__list-item > div.pathfinder-today__link >
 *       a[href] > span.pathfinder-today__link-title   (+ decorative span.pathfinder-today__link-icon)
 *       span.pathfinder-today__link-description        (optional)
 *     -> <p><strong><a>Title</a></strong></p> [<p>Description</p>]
 *  B. .article-card-list (3 items)
 *     div.article-card > div.article-card__inner > h3.article-card__title > a.btn > span.push-icon
 *                                                  p.article-card__category (eyebrow, after h3 in source)
 *     -> <p>EYEBROW</p><h3><a>Title</a></h3>
 * Iteration is keyed on the block-level inner wrappers (div.pathfinder-today__link /
 * div.article-card__inner), never on the <a> elements.
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function makeLink(a, text, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = text;
  return link;
}

// ---------------------------------------------------------------- section-landing shapes
// (mapping-notes "cards-tile shapes"; verified in block-context/cards-tile/instances/section-landing-*.html)
//   fee tiers        #fees .grid > .cell (h3 + text; a.btn--text -> plain link)
//   todolist         .todo-list__button-cards > a.btn-card > .btn-card__inner > .btn-card__label
//   pathfinder       .grid > .cell > a.card (card--image: thumb + h4 + p; card--link: thumb + .card__header)
//   textthreecolumn  .grid > .section__flex-items (h3 + p + a.btn--secondary / btn--text)
//   focusbox path.   .card--pathfinder > .card__inner > a.btn + p
// None of these classes occur on the homepage, whose two shapes (pathfinder-today, article cards) follow.

function landingCta(a, document) {
  const link = makeLink(a, cleanText(a) || cleanText({ textContent: a.getAttribute('aria-label') || '' }), document);
  const p = document.createElement('p');
  const cls = a.className || '';
  if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
  else {
    const wrap = document.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
    wrap.append(link);
    p.append(wrap);
  }
  return p;
}

function stripAll(el) {
  [el, ...el.querySelectorAll('*')].forEach((n) => [...n.attributes].forEach((a) => { if (!/^(href|src|alt)$/.test(a.name)) n.removeAttribute(a.name); }));
  return el;
}

/** Generic tile body: headings (as h3), paragraphs, lists, CTA links, in source order. */
function tileBody(root, document, titleLink) {
  const body = [];
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) { if (cleanText(n)) { const p = document.createElement('p'); p.textContent = cleanText(n); body.push(p); } return; }
      if (n.nodeType !== 1) return;
      if (n.matches('.card__thumb, img, picture, svg')) return;
      if (n.matches('a.btn, a[class*="btn--"]')) { if (cleanText(n)) body.push(landingCta(n, document)); return; }
      if (!cleanText(n)) return;
      if (/^H[1-6]$/.test(n.tagName) || n.matches('.card__header, .btn-card__label')) {
        // "57.41%<br>based on ATAR…": the figure stays the heading, the rest becomes a paragraph
        const parts = n.querySelector('br')
          ? n.innerHTML.split(/<br\s*\/?>/i).map((s) => cleanText({ textContent: s.replace(/<[^>]+>/g, ' ') })).filter(Boolean)
          : [cleanText(n)];
        const h = document.createElement('h3');
        if (titleLink && !body.some((b) => b.tagName === 'H3')) h.append(makeLink(titleLink, parts[0], document));
        else h.textContent = parts[0];
        body.push(h);
        parts.slice(1).forEach((t) => { const p = document.createElement('p'); p.textContent = t; body.push(p); });
        return;
      }
      if (/^(P|UL|OL)$/.test(n.tagName)) {
        const only = n.querySelector(':scope > a.btn, :scope > a[class*="btn--"]');
        if (only && cleanText(only) === cleanText(n)) { body.push(landingCta(only, document)); return; }
        body.push(stripAll(n));
        return;
      }
      walk(n);
    });
  };
  walk(root);
  // link tiles whose only text is a paragraph (a.card--image > .card__inner > p, e.g. vietnam
  // "Entry requirements" tiles): keep the paragraph and link it to the tile href (a plain link,
  // as on the source), so the link is not lost
  if (titleLink && !body.some((b) => b.tagName === 'H3' || (b.querySelector && b.querySelector('a')))) {
    const first = body[0];
    if (first && first.tagName === 'P' && cleanText(first)) {
      const p = document.createElement('p');
      p.append(makeLink(titleLink, cleanText(first), document));
      body[0] = p;
    }
  }
  return body;
}

function tileImage(card, document) {
  const holder = card.querySelector('.card__thumb');
  if (!holder) return null;
  const img = holder.querySelector('img');
  let src = img ? (img.getAttribute('src') || '') : '';
  if ((!src || /^(data|blob):/.test(src)) && holder.hasAttribute('data-excat-bg')) src = holder.getAttribute('data-excat-bg');
  if (!src || /^(data|blob):/.test(src)) return null;
  const out = document.createElement('img');
  out.src = src.trim();
  out.alt = holder.getAttribute('aria-label') || (img && img.getAttribute('alt')) || '';
  return out;
}

function landingTiles(element, document) {
  const cells = [];
  // todolist button cards: iterate the inner wrappers (adjacent <a> siblings can merge in html2md)
  const btnCards = [...element.querySelectorAll('.btn-card__inner')];
  if (btnCards.length) {
    btnCards.forEach((inner) => {
      const a = inner.closest('a[href]');
      const label = cleanText(inner.querySelector('.btn-card__label') || inner);
      if (!label) return;
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      if (a) strong.append(makeLink(a, label, document)); else strong.textContent = label;
      p.append(strong);
      const rest = [...inner.children].filter((c) => !c.matches('.btn-card__label') && cleanText(c)).map((c) => { const q = document.createElement('p'); q.textContent = cleanText(c); return q; });
      cells.push([[p, ...rest]]);
    });
    return cells;
  }
  // focusbox pathfinder: CTA button + description
  const pathfinders = [...element.querySelectorAll('.card--pathfinder')];
  if (pathfinders.length) {
    pathfinders.forEach((card) => {
      const body = [];
      const inner = card.querySelector('.card__inner') || card;
      [...inner.children].forEach((c) => {
        if (c.matches('a[href]')) {
          const p = document.createElement('p');
          const strong = document.createElement('strong');
          strong.append(makeLink(c, cleanText(c), document));
          p.append(strong);
          body.push(p);
        } else if (cleanText(c)) body.push(stripAll(c));
      });
      if (body.length) cells.push([body]);
    });
    return cells;
  }
  // pathfinder link tiles: .cell > a.card (keyed on the cell wrapper)
  const linkCards = [...element.querySelectorAll(':scope > .cell')].map((c) => c.querySelector(':scope > a.card[href]')).filter(Boolean);
  if (linkCards.length) {
    linkCards.forEach((card) => {
      const body = tileBody(card, document, card);
      if (!body.length) return;
      const image = tileImage(card, document);
      cells.push(image ? [[image], body] : [body]);
    });
    return cells;
  }
  // text columns (ct-textthreecolumn) and fee tiers (#fees .grid > .cell)
  let cols = [...element.querySelectorAll(':scope > .section__flex-items')];
  if (!cols.length && element.closest('#fees')) cols = [...element.querySelectorAll(':scope > .cell')];
  if (cols.length) {
    cols.forEach((col) => {
      const body = tileBody(col, document, null);
      if (body.length) cells.push([body]);
    });
    return cells;
  }
  return cells;
}

export default function parse(element, { document }) {
  const landingCells = landingTiles(element, document);
  if (landingCells.length) {
    const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (tile)', cells: landingCells });
    element.replaceWith(block);
    return;
  }

  const cells = [];

  // Shape A: pathfinder tiles
  let items = [...element.querySelectorAll('.pathfinder-today__link')];
  if (!items.length) items = [...element.querySelectorAll('.pathfinder-today__list-item')];
  items.forEach((item) => {
    const a = item.querySelector('a[href]');
    const titleEl = item.querySelector('.pathfinder-today__link-title') || a;
    const title = cleanText(titleEl);
    if (!title) return;
    const body = [];
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    // section-landing PD tiles (div.bg-inverted > div.pathfinder-today) are not links: bold title only
    if (a) strong.append(makeLink(a, title, document)); else strong.textContent = title;
    p.append(strong);
    body.push(p);
    const desc = cleanText(item.querySelector('.pathfinder-today__link-description, [class*="description"]'));
    if (desc) {
      const dp = document.createElement('p');
      dp.textContent = desc;
      body.push(dp);
    }
    cells.push([body]);
  });

  // Shape B: article card list
  if (!cells.length) {
    let cards = [...element.querySelectorAll('.article-card__inner')];
    if (!cards.length) cards = [...element.querySelectorAll('.article-card')];
    cards.forEach((card) => {
      const heading = card.querySelector('h2, h3, h4, .article-card__title');
      const a = (heading && heading.querySelector('a[href]')) || card.querySelector('a[href]');
      const title = cleanText((a && a.querySelector('.push-icon')) || a || heading);
      if (!title) return;
      const body = [];
      const eyebrow = cleanText(card.querySelector('.article-card__category, [class*="category"], [class*="eyebrow"]'));
      if (eyebrow) {
        const ep = document.createElement('p');
        ep.textContent = eyebrow;
        body.push(ep);
      }
      const h = document.createElement(heading && /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : 'h3');
      if (a) h.append(makeLink(a, title, document));
      else h.textContent = title;
      body.push(h);
      cells.push([body]);
    });
  }

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (tile)', cells });
  element.replaceWith(block);
}
