/*
 * Tabs block
 * One row per tab: [tab label | panel content]. Panel content can contain any default
 * content, including nested blocks (e.g. an accordion), which are decorated and loaded here.
 */

import { decorateNestedBlocks } from '../../scripts/nested-blocks.js';

let instance = 0;

/**
 * Panel text sections (applicant-route / graduate-courses tabs): each run of default content
 * starting at an h2 becomes a row, the heading (with the paragraphs after it when other
 * content follows them) beside the rest, as on the source "section-alt" rows. Course tab
 * panels have no h2 of their own and are left as they are.
 * @param {HTMLElement} panel
 */
function decoratePanelRows(panel) {
  if (!panel.querySelector(':scope > h2')) return;
  let row = null;
  [...panel.children].forEach((el) => {
    if (el.tagName === 'H2') {
      row = document.createElement('div');
      row.className = 'tabs-panel-row';
      el.before(row);
    } else if (!row || /^(TABLE|DIV)$/.test(el.tagName)) {
      // nested blocks (their wrappers) and tables end a row
      row = null;
      return;
    }
    row.append(el);
  });
  panel.querySelectorAll(':scope > .tabs-panel-row').forEach((r) => {
    const [heading, ...rest] = r.children;
    let split = rest.findIndex((el) => el.tagName !== 'P');
    // only paragraphs: they sit beside the heading
    if (split < 0) split = 0;
    const aside = document.createElement('div');
    aside.className = 'tabs-panel-aside';
    aside.append(heading, ...rest.slice(0, split));
    const main = document.createElement('div');
    main.className = 'tabs-panel-main';
    main.append(...rest.slice(split));
    r.replaceChildren(aside, ...(main.children.length ? [main] : []));
    // a list of links only (study areas): link chips
    const list = main.children.length === 1 ? main.firstElementChild : null;
    if (list && list.tagName === 'UL'
      && [...list.children].every((li) => li.children.length === 1 && li.firstElementChild.tagName === 'A'
        && li.textContent.trim() === li.firstElementChild.textContent.trim())) {
      r.classList.add('tabs-panel-links');
    }
  });
}

function activate(block, index, focus = false) {
  const buttons = [...block.querySelectorAll('.tabs-tab')];
  const panels = [...block.querySelectorAll('.tabs-panel')];
  buttons.forEach((btn, i) => {
    const selected = i === index;
    btn.setAttribute('aria-selected', selected);
    btn.tabIndex = selected ? 0 : -1;
    panels[i].hidden = !selected;
  });
  if (focus) buttons[index].focus();
}

export default async function decorate(block) {
  instance += 1;
  const rows = [...block.children]
    .filter((row) => row.children.length && row.firstElementChild.textContent.trim());
  if (!rows.length) return;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = rows.map((row, i) => {
    const [labelCell, ...contentCells] = row.children;
    const id = `tabs-${instance}-${i}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-tab';
    button.id = `${id}-tab`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `${id}-panel`);
    const only = labelCell.children.length === 1 ? labelCell.firstElementChild : null;
    button.append(...(only && /^(P|H[1-6])$/.test(only.tagName) ? only.childNodes : labelCell.childNodes));
    button.addEventListener('click', () => activate(block, i));
    tablist.append(button);

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    contentCells.forEach((cell) => panel.append(...cell.childNodes));
    return panel;
  });

  tablist.addEventListener('keydown', (e) => {
    const buttons = [...tablist.children];
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = (current + 1) % buttons.length;
    if (e.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = buttons.length - 1;
    if (next !== null) {
      e.preventDefault();
      activate(block, next, true);
    }
  });

  block.replaceChildren(tablist, ...panels);
  if (rows.length === 1) block.classList.add('tabs-single');
  activate(block, 0);
  await Promise.all(panels.map(decorateNestedBlocks));
  // after the nested blocks: their loader takes any classed div in a panel for a block
  panels.forEach(decoratePanelRows);
}
