import { decorateIcons } from '../../scripts/aem.js';
import { decorateNestedBlocks } from '../../scripts/nested-blocks.js';

const OPTION_CLASSES = ['split', 'overlap', 'text-column'];
const HEADINGS = 'h1, h2, h3, h4, h5, h6';

const BLOCK_LEVEL = /^(P|DIV|UL|OL|H[1-6]|TABLE|PICTURE|BLOCKQUOTE|PRE|HR)$/;

/**
 * A single-cell nested block (e.g. a notice) whose cell is one paragraph arrives unwrapped
 * (inline content only); block decorators read element children, so the run goes back in a <p>.
 * @param {Element} cell
 */
function wrapInlineCells(cell) {
  cell.querySelectorAll(':scope table').forEach((table) => {
    const tds = table.querySelectorAll('td');
    if (tds.length !== 1) return;
    const [td] = tds;
    const nodes = [...td.childNodes];
    const hasBlock = nodes.some((n) => n.nodeType === 1 && BLOCK_LEVEL.test(n.tagName));
    if (!td.textContent.trim() || hasBlock) return;
    const p = document.createElement('p');
    p.append(...nodes);
    td.append(p);
  });
}

/**
 * Text column: row 1 = heading column | content column; every later row's cells are cards
 * (pictogram or image, title, text, link) laid out as a two-up grid at the end of the content
 * column. Cells missing from row 1 are added so the grid always has a content column.
 * @param {Element} block
 */
function decorateTextColumn(block) {
  const [first, ...rest] = [...block.children];
  if (!first) return;
  while (first.children.length < 2) first.append(document.createElement('div'));
  const content = first.children[1];
  const cards = rest.flatMap((row) => [...row.children])
    .filter((cell) => cell.textContent.trim() || cell.querySelector('picture, img, table'));
  if (cards.length) {
    const grid = document.createElement('div');
    grid.className = 'columns-text-column-cards';
    cards.forEach((cell) => {
      cell.className = 'columns-text-column-card';
      // `:uom-name:` left as text (unprocessed HTML, e.g. imported content previewed locally)
      cell.querySelectorAll(':scope > p').forEach((p) => {
        const m = p.textContent.trim().match(/^:([a-z0-9-]+):$/);
        if (!m || p.children.length) return;
        const span = document.createElement('span');
        span.className = `icon icon-${m[1]}`;
        p.replaceChildren(span);
      });
      decorateIcons(cell);
      cell.querySelectorAll(':scope > p:has(> .icon:only-child)').forEach((p) => p.classList.add('columns-text-column-icon'));
      grid.append(cell);
    });
    content.append(grid);
  }
  rest.forEach((row) => row.remove());
  [...first.children].forEach((cell) => {
    if (!cell.children.length && !cell.textContent.trim()) cell.classList.add('columns-text-column-empty');
  });
  // a paragraph holding only a plain link is a text link (source btn--text: arrow + link)
  block.querySelectorAll('p').forEach((p) => {
    if (p.closest('.block') !== block) return;
    const links = p.querySelectorAll(':scope > a');
    if (links.length === 1 && p.children.length === 1 && !p.classList.contains('button-wrapper')
      && p.textContent.trim() === links[0].textContent.trim()) p.classList.add('columns-text-link');
  });
}

/**
 * A list whose every item is one link followed by a bracketed type, e.g.
 * "<a>Effective Negotiation</a> (Micro-credential)", becomes a row of course cards:
 * the type moves into the link as a label under the name.
 * @param {HTMLUListElement} list
 * @returns {boolean} whether the list was converted
 */
function decorateCourseList(list) {
  const items = [...list.children];
  const parsed = items.map((li) => {
    const links = li.querySelectorAll('a');
    if (links.length !== 1 || li.children.length !== 1) return null;
    const [link] = links;
    const rest = li.textContent.replace(link.textContent, '').trim();
    const match = rest.match(/^\(([^()]+)\)$/);
    if (!match || !li.textContent.trim().startsWith(link.textContent.trim())) return null;
    return { li, link, type: match[1].trim() };
  });
  if (!items.length || parsed.some((p) => !p)) return false;

  list.classList.add('columns-course-list');
  parsed.forEach(({ li, link, type }) => {
    const name = document.createElement('span');
    name.className = 'columns-course-name';
    name.append(...link.childNodes);
    const label = document.createElement('span');
    label.className = 'columns-course-type';
    label.textContent = type;
    link.replaceChildren(name, label);
    li.replaceChildren(link);
  });
  return true;
}

export default async function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  if (active.includes('text-column')) {
    // blocks authored inside a cell (a notice, table or video), loaded before the cards move
    if (block.querySelector('table')) {
      const cells = [...block.querySelectorAll(':scope > div > div')];
      cells.forEach(wrapInlineCells);
      await Promise.all(cells.map((cell) => decorateNestedBlocks(cell)));
    }
    decorateTextColumn(block);
    block.classList.add('columns-2-cols');
    return;
  }
  const rows = [...block.children];

  // overlap: a leading single-image row becomes the banner the content panel overlaps
  if (active.includes('overlap')) {
    const first = rows[0];
    if (first && rows.length > 1 && first.querySelector('picture') && first.textContent.trim() === '') {
      first.className = 'columns-overlap-media';
      const pics = first.querySelectorAll('picture');
      first.replaceChildren(pics[0]);
      rows[1].classList.add('columns-overlap-panel');
    }
  }

  const contentRows = rows.filter((row) => !row.classList.contains('columns-overlap-media'));
  const cols = Math.max(1, ...contentRows.map((row) => row.children.length));
  block.classList.add(`columns-${cols}-cols`);

  // setup image columns
  contentRows.forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
    if (!row.querySelector('.columns-img-col')) row.classList.add('columns-text-row');
  });

  // course cards: link + "(type)" list items; link list: every item is just one link
  block.querySelectorAll(':scope > div > div > ul').forEach((list) => {
    if (decorateCourseList(list)) return;
    const items = [...list.children];
    const isLinkList = items.length && items.every((li) => {
      const links = li.querySelectorAll('a');
      return links.length === 1 && li.children.length === 1
        && li.textContent.trim() === links[0].textContent.trim();
    });
    if (isLinkList) list.classList.add('columns-link-list');
  });

  // eyebrow: short link-free paragraph(s) opening a cell, right before its first heading
  if (!active.includes('overlap')) {
    block.querySelectorAll(':scope > div > div').forEach((cell) => {
      const heading = cell.querySelector(`:scope > :is(${HEADINGS})`);
      if (!heading || !heading.matches('h1, h2')) return;
      const before = [];
      let prev = heading.previousElementSibling;
      while (prev) {
        before.push(prev);
        prev = prev.previousElementSibling;
      }
      const isEyebrow = (el) => el.tagName === 'P' && !el.querySelector('a, picture')
        && el.textContent.trim().length <= 60;
      if (before.length && before.every(isEyebrow)) {
        before.forEach((p) => p.classList.add('columns-eyebrow'));
      }
    });
  }

  if (active.includes('split')) {
    // split shapes: link list beside a photo = menu; photo + text without an eyebrow =
    // full-bleed band; with an eyebrow it stays an inset photo tile (homepage)
    if (block.querySelector('.columns-link-list')) {
      block.classList.add('columns-menu');
    } else if (block.querySelector('.columns-img-col') && !block.querySelector('.columns-eyebrow')) {
      block.classList.add('columns-bleed');
    }
  } else if (!active.length) {
    // heading | text + call to action: a heading-only first cell and a closing button
    contentRows.forEach((row) => {
      const [first, last] = [row.firstElementChild, row.lastElementChild];
      if (row.children.length !== 2 || !row.classList.contains('columns-text-row')) return;
      const headingOnly = first.children.length === 1 && first.firstElementChild.matches(HEADINGS)
        && first.textContent.trim() === first.firstElementChild.textContent.trim();
      const endsWithButton = last.lastElementChild?.matches('.button-wrapper');
      if (headingOnly && endsWithButton) row.classList.add('columns-cta-row');
    });
  }
}
