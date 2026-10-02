/*
 * Notice block
 * Single cell: optional heading (optionally starting with an :icon:), body text and optional CTA.
 *
 * - Without an icon: an information notice (tinted panel with an info marker).
 * - With an icon (e.g. course fee panels, `:check:` / `:dollar:`): a plain panel with the
 *   icon in a left column. Fee lists inside it (lists whose items hold a <strong> price) are
 *   laid out as label / price rows; an h5 directly before a fee list becomes its year title.
 *   Below 769px the panel collapses to its heading, with a toggle.
 */

import { decorateIcons } from '../../scripts/aem.js';

// `:icon-name:` left as text (unprocessed HTML, e.g. imported content previewed locally)
const ICON_NOTATION = /^\s*:([a-z0-9-]+):\s*/i;
const HEADING = /^H[1-6]$/;
const COLLAPSE_QUERY = '(width < 769px)';
const YEAR_ACCENTS = 4;

let idCounter = 0;

/**
 * Turns a leading `:icon-name:` text token inside an element into icon markup.
 * @param {Element} el
 */
function resolveIconNotation(el) {
  if (!el || el.querySelector('.icon')) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent.trim()) node = walker.nextNode();
  const match = node && node.textContent.match(ICON_NOTATION);
  if (!match) return;
  node.textContent = node.textContent.slice(match[0].length);
  const span = document.createElement('span');
  span.className = `icon icon-${match[1].toLowerCase()}`;
  node.before(span);
  decorateIcons(el);
}

/**
 * A fee list: every item holds a <strong> (the price).
 * @param {Element} el
 * @returns {boolean}
 */
function isFeeList(el) {
  if (!el || el.tagName !== 'UL') return false;
  const items = [...el.children];
  return items.length > 0 && items.every((li) => li.querySelector(':scope > strong'));
}

/**
 * Splits a fee item into label, price (the first <strong>) and an optional description.
 * @param {HTMLLIElement} li
 */
function decorateFeeItem(li) {
  const price = li.querySelector(':scope > strong');
  const label = document.createElement('span');
  label.className = 'notice-fee-label';
  const desc = document.createElement('span');
  desc.className = 'notice-fee-desc';
  let target = label;
  [...li.childNodes].forEach((node) => {
    if (node === price) {
      target = desc;
      return;
    }
    target.append(node);
  });
  price.classList.add('notice-fee-price');
  li.replaceChildren();
  if (label.textContent.trim()) li.append(label);
  li.append(price);
  if (desc.textContent.trim()) li.append(desc);
}

/**
 * Groups fee lists (and the h5 year titles before them) into a `.notice-fees` container.
 * @param {Element} body
 */
function decorateFees(body) {
  let fees = null;
  let yearIndex = 0;
  [...body.children].forEach((el) => {
    const yearList = el.tagName === 'H5' && isFeeList(el.nextElementSibling);
    if (!yearList && !isFeeList(el)) {
      fees = null;
      return;
    }
    if (yearList || !el.previousElementSibling || el.previousElementSibling.tagName !== 'H5') {
      if (!fees) {
        fees = document.createElement('div');
        fees.className = 'notice-fees';
        el.before(fees);
      }
    }
    if (yearList) {
      const year = document.createElement('div');
      year.className = `notice-fee-year notice-fee-accent-${yearIndex % YEAR_ACCENTS}`;
      yearIndex += 1;
      el.classList.add('notice-fee-year-title');
      const list = el.nextElementSibling;
      list.className = 'notice-fee-list';
      [...list.children].forEach(decorateFeeItem);
      year.append(el, list);
      fees.append(year);
    } else if (el.tagName === 'UL' && fees && !el.closest('.notice-fee-year')) {
      el.className = 'notice-fee-list notice-fee-list-vertical notice-fee-accent-0';
      [...el.children].forEach(decorateFeeItem);
      fees.append(el);
    }
  });
}

/**
 * Makes the panel collapsible on small screens (the heading row toggles the body).
 * @param {Element} block
 * @param {Element} head
 * @param {Element} body
 */
function makeCollapsible(block, head, body) {
  idCounter += 1;
  body.id = body.id || `notice-body-${idCounter}`;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'notice-toggle';
  toggle.setAttribute('aria-controls', body.id);
  toggle.setAttribute('aria-expanded', 'false');
  const heading = head.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)');
  toggle.setAttribute('aria-label', `Show details: ${heading.textContent.trim()}`);
  head.append(toggle);
  block.classList.add('notice-collapsible');

  const mq = window.matchMedia(COLLAPSE_QUERY);
  const sync = () => {
    const expanded = block.classList.contains('notice-expanded');
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', `${expanded ? 'Hide' : 'Show'} details: ${heading.textContent.trim()}`);
    if (mq.matches) body.toggleAttribute('hidden', !expanded);
    else body.removeAttribute('hidden');
  };
  head.addEventListener('click', (e) => {
    if (!mq.matches || e.target.closest('a')) return;
    block.classList.toggle('notice-expanded');
    sync();
  });
  mq.addEventListener('change', sync);
  sync();
}

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const nodes = cells.flatMap((cell) => [...cell.children]);

  // a leading heading sits beside the icon; later headings stay in the body
  const heading = nodes[0] && HEADING.test(nodes[0].tagName) ? nodes[0] : null;
  resolveIconNotation(heading || nodes[0]);

  const icon = block.querySelector('.icon');
  const content = document.createElement('div');
  content.className = 'notice-content';
  const head = document.createElement('div');
  head.className = 'notice-head';
  const body = document.createElement('div');
  body.className = 'notice-body';

  let marker = null;
  let removed = null;
  if (icon) {
    marker = document.createElement('span');
    marker.className = 'notice-icon';
    marker.setAttribute('aria-hidden', 'true');
    const iconParent = icon.parentElement;
    marker.append(icon);
    if (iconParent && iconParent.tagName === 'P' && !iconParent.textContent.trim()) {
      iconParent.remove();
      removed = iconParent;
    }
    block.classList.add('notice-panel');
  }

  // (not isConnected: fragments are decorated before they are attached to the page)
  nodes.forEach((el) => {
    if (el === heading) head.append(el);
    else if (el !== removed) body.append(el);
  });

  if (heading) content.append(head);
  if (body.children.length) content.append(body);
  block.replaceChildren(...(marker ? [marker] : []), content);

  if (!icon) return;
  // a panel straight after another panel (e.g. "Further information" under the IFP fees)
  // is ruled off from it
  const prev = block.parentElement && block.parentElement.previousElementSibling;
  const prevNotice = prev && prev.querySelector(':scope > .notice');
  if (prevNotice && (prevNotice.classList.contains('notice-panel')
    || prevNotice.querySelector('.icon') || /^\s*:[a-z0-9-]+:/i.test(prevNotice.textContent))) {
    block.classList.add('notice-follows');
  }
  decorateFees(body);
  if (heading && body.children.length) makeCollapsible(block, head, body);
}
