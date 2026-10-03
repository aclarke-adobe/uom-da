import { createOptimizedPicture } from '../scripts/aem.js';

/*
 * Online course browser (source: study.unimelb.edu.au/study-with-us/online-courses, CourseListing
 * on Funnelback). Driven by the site query index over the migrated course overview pages
 * (migration-work/section-landing/query-index.yaml), filtered and faceted client-side.
 *
 * Widget link params (copied to widget.dataset by blocks/widget):
 *   index     query index path (default /find/courses/query-index.json)
 *   level     study level(s), comma separated, exact match (default "Graduate coursework")
 *   location  text the location must contain (default "online"; empty = any)
 *   mode      text the study mode must contain (default: any)
 *   browse    "Browse all courses" link (default /find)
 */

const DEFAULT_INDEX = '/find/courses/query-index.json';
const DEFAULT_LEVEL = 'Graduate coursework';
const DEFAULT_LOCATION = 'online';
const PAGE_SIZE = 9;
const INDEX_LIMIT = 1000;

// Funnelback "Duration - 3a" buckets (courseDurationInMonths ranges, checked against the live
// facet counts): the year ranges are inclusive at both ends, so 12, 24, 36 and 48 months count in
// both neighbouring year ranges; "Less than 1 year" is under 12 and "Over 4 years" over 48.
const DURATIONS = [
  { label: 'Less than 1 year', test: (m) => m < 12 },
  { label: '1-2 years', test: (m) => m >= 12 && m <= 24 },
  { label: '2-3 years', test: (m) => m >= 24 && m <= 36 },
  { label: '3-4 years', test: (m) => m >= 36 && m <= 48 },
  { label: 'Over 4 years', test: (m) => m > 48 },
];

const FACETS = [
  { id: 'areas', label: 'Study area' },
  { id: 'durations', label: 'Duration', order: DURATIONS.map((d) => d.label) },
];

const FACTS = [
  { key: 'duration', icon: 'clock', label: 'Duration' },
  { key: 'intakes', icon: 'calendar', label: 'Intakes' },
  { key: 'delivery', icon: 'location', label: 'Delivery' },
];

const splitList = (value) => String(value || '').split(';').map((v) => v.trim()).filter(Boolean);
const norm = (value) => String(value || '').trim().toLowerCase();

let instanceCount = 0;

function durationBuckets(row) {
  const months = parseFloat(row['duration-months']);
  if (Number.isFinite(months)) {
    return DURATIONS.filter((d) => d.test(months)).map((d) => d.label);
  }
  // no month count: fall back to the source's own bucket list
  const known = DURATIONS.map((d) => d.label);
  return splitList(row['duration-filter']).filter((label) => known.includes(label));
}

function toCourse(row) {
  const title = (row['course-title'] || row.title || '').replace(/\s+[-|]\s+(The )?University of Melbourne$/, '').trim();
  return {
    path: row.path,
    title,
    image: row.image && !/default-meta-image/.test(row.image) ? row.image : '',
    level: norm(row['study-level']),
    location: norm(row.location),
    mode: norm(row['study-mode']),
    areas: splitList(row['study-area']),
    durations: durationBuckets(row),
    duration: row['duration-display'] || '',
    intakes: splitList(row.intakes).join(', '),
    delivery: row.delivery || '',
  };
}

/** Fetches every row of an EDS query index, following offset/limit paging. */
async function fetchIndex(indexPath) {
  const rows = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const url = new URL(indexPath, window.location.href);
    url.searchParams.set('offset', offset);
    url.searchParams.set('limit', INDEX_LIMIT);
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`query index ${url.pathname}: HTTP ${resp.status}`);
    // eslint-disable-next-line no-await-in-loop
    let json = await resp.json();
    if (json[':type'] === 'multi-sheet') json = json.default || json[json[':names'][0]] || {};
    const data = Array.isArray(json.data) ? json.data : [];
    rows.push(...data);
    total = Number.isFinite(json.total) ? json.total : rows.length;
    if (!data.length) break;
    offset += data.length;
  }
  return rows;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([name, value]) => {
    if (value === false || value === undefined || value === null) return;
    if (name === 'className') node.className = value;
    else node.setAttribute(name, value === true ? '' : value);
  });
  node.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

function iconImg(name) {
  const base = (window.hlx && window.hlx.codeBasePath) || '';
  return el(
    'span',
    { className: `icon icon-${name}`, 'aria-hidden': 'true' },
    el('img', {
      src: `${base}/icons/${name}.svg`, alt: '', width: 24, height: 24,
    }),
  );
}

function renderCard(course) {
  const thumb = el('a', {
    className: 'online-course-listing-card-image', href: course.path, tabindex: '-1', 'aria-hidden': 'true',
  });
  if (course.image) {
    thumb.append(createOptimizedPicture(course.image, '', false, [
      { media: '(min-width: 600px)', width: '750' }, { width: '750' },
    ]));
  }
  const facts = el('ul', { className: 'online-course-listing-card-facts' });
  FACTS.forEach(({ key, icon, label }) => {
    if (!course[key]) return;
    facts.append(el(
      'li',
      {},
      iconImg(icon),
      el('span', { className: 'online-course-listing-sr-only' }, `${label}: `),
      el('span', {}, course[key]),
    ));
  });
  return el(
    'li',
    { className: 'online-course-listing-card' },
    thumb,
    el(
      'div',
      { className: 'online-course-listing-card-body' },
      el('h3', { className: 'online-course-listing-card-title' }, el('a', { href: course.path }, course.title)),
      facts.children.length ? facts : null,
    ),
  );
}

export default async function decorate(widget) {
  instanceCount += 1;
  const uid = `ocl${instanceCount}`;
  const { dataset } = widget;
  const indexPath = dataset.index || DEFAULT_INDEX;
  const levels = (dataset.level ?? DEFAULT_LEVEL).split(',').map(norm).filter(Boolean);
  const location = norm(dataset.location ?? DEFAULT_LOCATION);
  const mode = norm(dataset.mode);

  const facetsEl = widget.querySelector('.online-course-listing-facets');
  const info = widget.querySelector('.online-course-listing-info');
  const tagsEl = widget.querySelector('.online-course-listing-tags');
  const message = widget.querySelector('.online-course-listing-message');
  const list = widget.querySelector('.online-course-listing-list');
  const more = widget.querySelector('.online-course-listing-more');
  const moreButton = more.querySelector('button');
  const browse = widget.querySelector('.online-course-listing-browse');
  if (dataset.browse) browse.href = dataset.browse;
  widget.querySelector('form').addEventListener('submit', (e) => e.preventDefault());

  const selected = Object.fromEntries(FACETS.map((f) => [f.id, new Set()]));
  let courses = [];
  let results = [];
  let shown = 0;
  const dropdowns = [];

  const matches = (course, except) => FACETS.every(({ id }) => id === except
    || !selected[id].size || course[id].some((v) => selected[id].has(v)));

  function closeAll(except) {
    dropdowns.forEach((d) => { if (d !== except) d.close(); });
  }

  function buildDropdown(facet, index) {
    const values = [...new Set(courses.flatMap((c) => c[facet.id]))];
    if (facet.order) values.sort((a, b) => facet.order.indexOf(a) - facet.order.indexOf(b));
    else values.sort((a, b) => a.localeCompare(b));
    const panelId = `${uid}-panel-${index}`;
    const button = el('button', {
      type: 'button', className: 'online-course-listing-toggle', 'aria-expanded': 'false', 'aria-controls': panelId,
    }, facet.label);
    const fieldset = el('fieldset', {}, el('legend', { className: 'online-course-listing-sr-only' }, facet.label));
    const options = values.map((value, i) => {
      const id = `${uid}-${index}-${i}`;
      const input = el('input', { type: 'checkbox', id, value });
      const count = el('span', { className: 'online-course-listing-count' });
      const row = el('div', { className: 'online-course-listing-option' }, input, el('label', { for: id }, value, count));
      input.addEventListener('change', () => {
        if (input.checked) selected[facet.id].add(value);
        else selected[facet.id].delete(value);
        // eslint-disable-next-line no-use-before-define
        update();
      });
      fieldset.append(row);
      return {
        value, input, count, row,
      };
    });
    const panel = el('div', { className: 'online-course-listing-panel', id: panelId, hidden: true }, fieldset);
    const root = el('div', { className: 'online-course-listing-dropdown' }, button, panel);

    const dropdown = {
      facet,
      root,
      button,
      options,
      open() {
        closeAll(dropdown);
        panel.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        root.classList.add('is-open');
      },
      close() {
        panel.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        root.classList.remove('is-open');
      },
      isOpen: () => !panel.hidden,
    };
    button.addEventListener('click', () => (dropdown.isOpen() ? dropdown.close() : dropdown.open()));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.isOpen()) {
        e.preventDefault();
        dropdown.close();
        button.focus();
      }
    });
    root.addEventListener('focusout', (e) => {
      if (e.relatedTarget && !root.contains(e.relatedTarget)) dropdown.close();
    });
    dropdowns.push(dropdown);
    return root;
  }

  function renderFacets() {
    dropdowns.forEach(({ facet, options, root }) => {
      // live counts: everything else selected applies; OR within this facet
      const pool = courses.filter((c) => matches(c, facet.id));
      let visible = 0;
      options.forEach((o) => {
        const n = pool.filter((c) => c[facet.id].includes(o.value)).length;
        o.input.checked = selected[facet.id].has(o.value);
        o.count.textContent = ` (${n})`;
        o.row.hidden = n === 0 && !o.input.checked;
        if (!o.row.hidden) visible += 1;
      });
      root.hidden = visible === 0;
    });
  }

  function renderTags() {
    tagsEl.replaceChildren();
    FACETS.forEach(({ id }) => {
      selected[id].forEach((value) => {
        const button = el(
          'button',
          { type: 'button', className: 'online-course-listing-tag', 'data-facet': id },
          el('span', { className: 'online-course-listing-sr-only' }, 'Remove filter: '),
          value,
        );
        button.dataset.value = value;
        tagsEl.append(el('li', {}, button));
      });
    });
    tagsEl.hidden = !tagsEl.children.length;
  }

  function renderInfo() {
    const total = results.length;
    if (!total) info.textContent = 'Showing 0 courses';
    else info.textContent = `Showing 1 to ${shown} of ${total} ${total === 1 ? 'course' : 'courses'}`;
  }

  function showMore(count) {
    const start = shown;
    shown = Math.min(results.length, shown + count);
    results.slice(start, shown).forEach((c) => list.append(renderCard(c)));
    more.hidden = shown >= results.length;
    renderInfo();
    return list.children[start];
  }

  function clearFilters() {
    FACETS.forEach(({ id }) => selected[id].clear());
    // eslint-disable-next-line no-use-before-define
    update();
  }

  function renderEmpty() {
    if (results.length) {
      message.hidden = true;
      message.replaceChildren();
      return;
    }
    const clear = el('button', { type: 'button', className: 'online-course-listing-clear' }, 'Clear all filters');
    clear.addEventListener('click', () => {
      clearFilters();
      (dropdowns[0] && dropdowns[0].button).focus();
    });
    message.className = 'online-course-listing-message online-course-listing-empty';
    message.replaceChildren(
      el('p', { className: 'online-course-listing-empty-title' }, 'No courses match your selection.'),
      el('p', {}, 'Try removing a filter or ', el('a', { href: browse.href }, 'browse all courses'), '.'),
      el('p', {}, clear),
    );
    message.hidden = false;
  }

  function update() {
    results = courses.filter((c) => matches(c));
    shown = 0;
    list.replaceChildren();
    showMore(PAGE_SIZE);
    renderFacets();
    renderTags();
    renderEmpty();
  }

  tagsEl.addEventListener('click', (e) => {
    const tag = e.target.closest('.online-course-listing-tag');
    if (!tag) return;
    const tags = [...tagsEl.querySelectorAll('.online-course-listing-tag')];
    const pos = tags.indexOf(tag);
    selected[tag.dataset.facet].delete(tag.dataset.value);
    update();
    const remaining = [...tagsEl.querySelectorAll('.online-course-listing-tag')];
    const next = remaining[Math.min(pos, remaining.length - 1)];
    const facetIndex = FACETS.findIndex((f) => f.id === tag.dataset.facet);
    (next || dropdowns[facetIndex].button).focus();
  });

  moreButton.addEventListener('click', () => {
    const first = showMore(PAGE_SIZE);
    const link = first && first.querySelector('.online-course-listing-card-title a');
    if (link) link.focus();
  });

  document.addEventListener('click', (e) => {
    dropdowns.forEach((d) => { if (d.isOpen() && !d.root.contains(e.target)) d.close(); });
  });

  try {
    const rows = await fetchIndex(indexPath);
    courses = rows.map(toCourse)
      .filter((c) => c.path && c.title)
      .filter((c) => !levels.length || levels.includes(c.level))
      .filter((c) => !location || c.location.includes(location))
      .filter((c) => !mode || c.mode.includes(mode))
      .sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('online-course-listing: could not load the course index', error);
    info.textContent = '';
    message.className = 'online-course-listing-message online-course-listing-error';
    message.setAttribute('role', 'alert');
    message.replaceChildren(el('p', {}, 'Courses could not be loaded. Please try again later, or ', el('a', { href: browse.href }, 'browse all courses'), '.'));
    message.hidden = false;
    widget.querySelector('.online-course-listing-filters').hidden = true;
    return;
  }

  FACETS.forEach((facet, i) => facetsEl.append(buildDropdown(facet, i)));
  update();
}
