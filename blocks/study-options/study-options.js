/*
 * Study options block (study-area course browser)
 * Row 1 (single cell): heading and optional intro text.
 * Rows 2+: [tab label | list of courses]. Each list item holds a course link followed by
 * optional attributes separated by "|": level, then study mode, e.g.
 *   <a>Bachelor of Science</a> | Bachelor | On campus
 * Renders tabs with result counts, Level / Study Mode filters built from the items,
 * a results summary and a "View more courses" toggle after the first 5 results.
 */

const PAGE_SIZE = 5;
let instance = 0;

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseCourses(cell) {
  return [...cell.querySelectorAll('li')].map((li) => {
    const link = li.querySelector('a');
    if (!link) return null;
    const rest = li.textContent.replace(link.textContent, '').trim();
    const [level = '', mode = ''] = rest.split('|').map((s) => s.replace(/^[\s\-–—:(]+|[\s)]+$/g, '').trim())
      .filter((s, i) => s || i > 0);
    return {
      href: link.href, title: link.textContent.trim(), level, mode,
    };
  }).filter(Boolean);
}

function buildSelect(id, label, allLabel, values) {
  const wrap = document.createElement('div');
  wrap.className = 'study-options-filter';
  const lbl = document.createElement('label');
  lbl.htmlFor = id;
  lbl.textContent = label;
  const select = document.createElement('select');
  select.id = id;
  const all = document.createElement('option');
  all.value = '';
  all.textContent = allLabel;
  select.append(all);
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.append(opt);
  });
  wrap.append(lbl, select);
  return { wrap, select };
}

function buildPanel(courses, panelId) {
  const panel = document.createElement('div');
  panel.className = 'study-options-panel';
  panel.id = panelId;
  panel.setAttribute('role', 'tabpanel');

  const levels = [...new Set(courses.map((c) => c.level).filter(Boolean))];
  const modes = [...new Set(courses.map((c) => c.mode).filter(Boolean))];

  const results = document.createElement('div');
  results.className = 'study-options-results';
  const summary = document.createElement('p');
  summary.className = 'study-options-summary';
  summary.setAttribute('aria-live', 'polite');
  const list = document.createElement('ul');
  list.className = 'study-options-list';
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'study-options-more';
  more.textContent = 'View more courses';
  results.append(summary, list, more);

  const selects = [];
  let aside = null;
  if (levels.length > 1 || modes.length > 1) {
    aside = document.createElement('form');
    aside.className = 'study-options-filters';
    const title = document.createElement('p');
    title.className = 'study-options-filters-title';
    title.textContent = 'Filter by';
    aside.append(title);
    if (levels.length > 1) {
      const { wrap, select } = buildSelect(`${panelId}-level`, 'Level', 'All options', levels);
      select.dataset.key = 'level';
      selects.push(select);
      aside.append(wrap);
    }
    if (modes.length > 1) {
      const { wrap, select } = buildSelect(`${panelId}-mode`, 'Study Mode', 'All study modes', modes);
      select.dataset.key = 'mode';
      selects.push(select);
      aside.append(wrap);
    }
    const clear = document.createElement('button');
    clear.type = 'reset';
    clear.className = 'study-options-clear';
    clear.textContent = 'Clear filters';
    aside.append(clear);
  }

  let expanded = false;
  const render = () => {
    const applied = selects.filter((s) => s.value);
    const matches = courses.filter((c) => applied.every((s) => c[s.dataset.key] === s.value));
    const shown = expanded ? matches : matches.slice(0, PAGE_SIZE);
    list.replaceChildren(...shown.map((c) => {
      const li = document.createElement('li');
      li.className = 'study-options-item';
      if (c.level) li.dataset.level = slugify(c.level);
      const a = document.createElement('a');
      a.href = c.href;
      a.textContent = c.title;
      li.append(a);
      if (c.level) {
        const tag = document.createElement('span');
        tag.className = 'study-options-level';
        tag.textContent = c.level;
        li.append(tag);
      }
      return li;
    }));
    const count = applied.length;
    summary.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} found with ${count} filter${count === 1 ? '' : 's'} applied.`;
    more.hidden = expanded || matches.length <= PAGE_SIZE;
  };

  more.addEventListener('click', () => {
    expanded = true;
    render();
  });
  selects.forEach((s) => s.addEventListener('change', () => {
    expanded = false;
    render();
  }));
  if (aside) {
    aside.addEventListener('reset', () => setTimeout(() => {
      expanded = false;
      render();
    }));
    aside.addEventListener('submit', (e) => e.preventDefault());
    panel.append(aside);
    panel.classList.add('study-options-has-filters');
  }
  panel.append(results);
  render();
  return panel;
}

export default function decorate(block) {
  instance += 1;
  const rows = [...block.children];
  const header = document.createElement('div');
  header.className = 'study-options-header';
  const intro = document.createElement('div');
  intro.className = 'study-options-intro';

  let tabRows = rows;
  if (rows[0] && rows[0].children.length === 1) {
    const cell = rows[0].firstElementChild;
    const heading = cell.querySelector('h1, h2, h3');
    if (heading) header.append(heading);
    intro.append(...cell.childNodes);
    tabRows = rows.slice(1);
  }

  const tablist = document.createElement('div');
  tablist.className = 'study-options-tablist';
  tablist.setAttribute('role', 'tablist');
  const panels = [];

  tabRows.forEach((row, i) => {
    const [labelCell, listCell] = row.children;
    if (!labelCell || !listCell) return;
    const courses = parseCourses(listCell);
    const id = `study-options-${instance}-${i}`;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'study-options-tab';
    tab.id = `${id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel`);
    tab.innerHTML = `<span></span> <span class="study-options-count">${courses.length}</span>`;
    tab.firstElementChild.textContent = labelCell.textContent.trim();
    tablist.append(tab);

    const panel = buildPanel(courses, `${id}-panel`);
    panel.setAttribute('aria-labelledby', tab.id);
    panels.push(panel);
  });

  const select = (index) => {
    [...tablist.children].forEach((t, i) => {
      t.setAttribute('aria-selected', i === index);
      t.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  };
  [...tablist.children].forEach((t, i) => t.addEventListener('click', () => select(i)));
  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.children];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0 || !['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const next = (current + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    select(next);
    tabs[next].focus();
  });

  if (tablist.children.length) header.append(tablist);
  block.replaceChildren(header);
  if (intro.textContent.trim()) block.append(intro);
  block.append(...panels);
  if (panels.length) select(0);
}
