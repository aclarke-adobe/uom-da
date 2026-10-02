/*
 * Key facts block (course key-facts panel)
 * Rows with two cells are facts: [label (optionally with an :icon: or image) | value].
 * Rows with a single cell are actions (CTA links such as How to apply / Enquire):
 * <strong> link = primary button, <em> link = secondary button, plain link = text link.
 */

import { decorateIcons } from '../../scripts/aem.js';

// `:icon-name:` left as text (unprocessed HTML, e.g. imported content previewed locally)
const ICON_NOTATION = /^\s*:([a-z0-9-]+):\s*/i;

/**
 * Turns a leading `:icon-name:` text token in a label cell into icon markup.
 * @param {Element} cell Label cell
 */
function resolveIconNotation(cell) {
  if (cell.querySelector('.icon, picture, img')) return;
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent.trim()) node = walker.nextNode();
  const match = node && node.textContent.match(ICON_NOTATION);
  if (!match) return;
  node.textContent = node.textContent.slice(match[0].length);
  const span = document.createElement('span');
  span.className = `icon icon-${match[1].toLowerCase()}`;
  node.before(span);
  decorateIcons(cell);
}

/**
 * Builds a fact (dt/dd pair) from a label cell and one or more value cells.
 * @param {Element} labelCell
 * @param {Element[]} valueCells
 * @returns {HTMLDivElement}
 */
function buildFact(labelCell, valueCells) {
  resolveIconNotation(labelCell);
  const item = document.createElement('div');
  item.className = 'key-facts-item';

  const dt = document.createElement('dt');
  dt.className = 'key-facts-label';
  const icon = labelCell.querySelector('.icon, picture');
  if (icon) {
    icon.classList.add('key-facts-icon');
    icon.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    dt.append(icon);
    item.classList.add('key-facts-item-has-icon');
  }
  const labelText = document.createElement('span');
  labelText.textContent = labelCell.textContent.replace(/\s+/g, ' ').trim();
  dt.append(labelText);

  const dd = document.createElement('dd');
  dd.className = 'key-facts-value';
  valueCells.forEach((cell) => dd.append(...cell.childNodes));

  // partner logo rows ("In collaboration with", "Endorsed by"): images only, no icon
  if (!icon && dd.querySelector('img') && !dd.textContent.trim()) {
    item.classList.add('key-facts-item-logos');
  }

  item.append(dt, dd);
  return item;
}

/**
 * Gives each action its CTA style. decorateButtons normally handles <strong>/<em> links
 * before the block runs; this covers content it skipped (e.g. no wrapping <p>).
 * @param {HTMLDivElement} actions
 */
function decorateActions(actions) {
  actions.querySelectorAll('a[href]').forEach((a) => {
    if (!a.classList.contains('button')) {
      const strong = a.closest('strong');
      const em = a.closest('em');
      if (strong || em) {
        a.classList.add('button');
        if (strong && em) a.classList.add('accent');
        else a.classList.add(strong ? 'primary' : 'secondary');
        let outer = strong || em;
        if (strong && em) outer = strong.contains(em) ? strong : em;
        outer.replaceWith(a);
      } else {
        a.classList.add('key-facts-link');
      }
    }
    let wrapper = a.parentElement;
    if (wrapper === actions) {
      wrapper = document.createElement('p');
      a.replaceWith(wrapper);
      wrapper.append(a);
    }
    wrapper.classList.add('key-facts-action');
  });
}

export default function decorate(block) {
  const facts = document.createElement('dl');
  facts.className = 'key-facts-list';
  const actions = document.createElement('div');
  actions.className = 'key-facts-actions';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [labelCell, ...valueCells] = cells;
    const hasValue = valueCells.some((c) => c.textContent.trim() || c.querySelector('img, picture'));
    if (labelCell && labelCell.textContent.trim() && hasValue) {
      facts.append(buildFact(labelCell, valueCells));
    } else {
      cells.forEach((cell) => actions.append(...cell.childNodes));
    }
  });

  block.replaceChildren();
  if (facts.children.length) block.append(facts);
  if (actions.querySelector('a[href]')) {
    decorateActions(actions);
    block.append(actions);
    block.classList.add('key-facts-has-actions');
  }
}
