/*
 * Search block
 * Row 1: optional heading/intro text and a link whose href is the search results URL
 * (an empty query param such as `?q=` names the parameter, default `q`) and whose text
 * is the input placeholder. An optional second cell gives the button label.
 * Option `filters`: further rows [group label | list of filter links] render as groups of
 * filter chips; single-cell rows (notes, "Clear search") are appended after them.
 */

const OPTION_CLASSES = ['filters'];
let instance = 0;

function buildSearchForm(link, buttonLabel) {
  instance += 1;
  const url = new URL(link.href, window.location.href);
  let param = 'q';
  [...url.searchParams.keys()].forEach((key) => {
    if (!url.searchParams.get(key)) param = key;
  });
  url.searchParams.delete(param);

  const form = document.createElement('form');
  form.className = 'search-form';
  form.action = `${url.origin}${url.pathname}`;
  form.method = 'get';
  form.setAttribute('role', 'search');

  url.searchParams.forEach((value, key) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = key;
    hidden.value = value;
    form.append(hidden);
  });

  const id = `search-input-${instance}`;
  const label = document.createElement('label');
  label.className = 'search-label';
  label.htmlFor = id;
  label.textContent = link.textContent.trim() || 'Search';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = id;
  input.name = param;
  input.placeholder = link.textContent.trim();
  input.autocomplete = 'off';
  const current = new URLSearchParams(window.location.search).get(param);
  if (current) input.value = current;

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-submit';
  button.setAttribute('aria-label', buttonLabel || 'Search');
  const icon = document.createElement('span');
  icon.className = 'search-submit-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);
  if (buttonLabel) {
    const text = document.createElement('span');
    text.textContent = buttonLabel;
    button.append(text);
  }

  const field = document.createElement('div');
  field.className = 'search-field';
  field.append(input, button);
  form.append(label, field);
  return form;
}

function buildFilterGroup(labelCell, linksCell) {
  const group = document.createElement('div');
  group.className = 'search-filter-group';
  const label = document.createElement('p');
  label.className = 'search-filter-label';
  label.textContent = labelCell.textContent.trim();
  const list = document.createElement('ul');
  list.className = 'search-filter-list';
  linksCell.querySelectorAll('a').forEach((a) => {
    const li = document.createElement('li');
    a.classList.remove('button');
    li.append(a);
    list.append(li);
  });
  group.append(label, list);
  return group;
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const rows = [...block.children];
  if (!rows.length) return;

  const [firstRow, ...rest] = rows;
  const [mainCell, buttonCell] = firstRow.children;
  const intro = document.createElement('div');
  intro.className = 'search-intro';
  const link = mainCell ? [...mainCell.querySelectorAll('a')].pop() : null;

  if (mainCell) {
    [...mainCell.children].forEach((el) => {
      if (link && el.contains(link)) return;
      intro.append(el);
    });
  }

  const main = document.createElement('div');
  main.className = 'search-main';
  if (intro.children.length) {
    main.append(intro);
    block.classList.add('search-has-intro');
  }
  if (link) main.append(buildSearchForm(link, buttonCell?.textContent.trim()));

  const extras = document.createElement('div');
  extras.className = 'search-extras';
  rest.forEach((row) => {
    const cells = [...row.children];
    if (active.includes('filters') && cells.length >= 2 && cells[1].querySelector('a')) {
      extras.append(buildFilterGroup(cells[0], cells[1]));
    } else {
      cells.forEach((cell) => {
        const note = document.createElement('div');
        note.className = 'search-note';
        note.append(...cell.childNodes);
        if (note.textContent.trim()) extras.append(note);
      });
    }
  });

  block.replaceChildren(main);
  if (extras.children.length) block.append(extras);
}
