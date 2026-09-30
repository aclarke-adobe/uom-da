/*
 * Tabs block
 * One row per tab: [tab label | panel content]. Panel content can contain any default
 * content, including nested blocks authored as fragments.
 */

let instance = 0;

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

export default function decorate(block) {
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
}
