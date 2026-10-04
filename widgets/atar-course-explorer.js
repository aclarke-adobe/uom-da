/*
 * Explore courses by ATAR (source: study.unimelb.edu.au/study-with-us/undergraduate-courses/
 * explore-courses-by-atar, Vue "ATAR Calculator App" 4.0.0 on div#atar-calc-app).
 *
 * Data: atar-course-explorer.data.json next to this file, a snapshot of the source's static
 * feed (/web_services/atar/data-2024/data.json + filter.json), which is behind a Cloudflare
 * challenge and sends no CORS headers. Rows keep the source shape; links to migrated course
 * pages are same-site.
 *
 * Behaviour follows the source:
 * - residency radio (domestic default), ATAR number input + slider (50.00-99.95, step 0.05,
 *   default 90), multi-select area-of-interest dropdown (applied on Apply, Escape or closing;
 *   Clear resets).
 * - a row matches when it is tagged with a selected area (none selected = all) and its score is
 *   at or below the ATAR. Domestic score = Access Melbourne guarantee if the row has one, else
 *   the domestic score; international score = international score. Rows without a score
 *   (range-of-criteria courses) always match; rows with no score for the residency never match.
 * - four result groups: ATAR-based entry, Graduate Degree Packages, range of criteria, career
 *   pathways; card/table view toggles per group; ?atar=, ?residency=, ?view=table URL params.
 *
 * Widget link params (copied to widget.dataset by blocks/widget): data (alternative data file URL).
 */

const ATAR_MIN = 50;
const ATAR_MAX = 99.95;
const ATAR_DEFAULT = 90;
const DOMESTIC = 'domestic';
const INTERNATIONAL = 'international';
const RESIDENCIES = [DOMESTIC, INTERNATIONAL];
// the site-wide domestic/international choice (blocks/audience-switcher); the source used a cookie
const AUDIENCE_KEY = 'uom-audience';
const WIDGET_ID = 'atar-course-explorer';

const ICONS = {
  table: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M55.5 21.41c0 1.1-.9 2-2 2H11.1c-1.1 0-2-.9-2-2V13.1c0-1.1.9-2 2-2h42.4c1.1 0 2 .9 2 2zm0 15.05c0 1.1-.9 2-2 2H11.1c-1.1 0-2-.9-2-2v-8.31c0-1.1.9-2 2-2h42.4c1.1 0 2 .9 2 2zm0 15.05c0 1.1-.9 2-2 2H11.1c-1.1 0-2-.9-2-2V43.2c0-1.1.9-2 2-2h42.4c1.1 0 2 .9 2 2z"/></svg>',
  card: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M20.35 11.28c1.1 0 2 .9 2 2v14.08c0 1.1-.9 2-2 2H11c-1.1 0-2-.9-2-2V13.28c0-1.1.9-2 2-2zm16.33 0c1.1 0 2 .9 2 2v14.08c0 1.1-.9 2-2 2h-9.35c-1.1 0-2-.9-2-2V13.28c0-1.1.9-2 2-2zm16.32 0c1.1 0 2 .9 2 2v14.08c0 1.1-.9 2-2 2h-9.35c-1.1 0-2-.9-2-2V13.28c0-1.1.9-2 2-2zM20.35 34.65c1.1 0 2 .9 2 2v14.08c0 1.1-.9 2-2 2H11c-1.1 0-2-.9-2-2V36.65c0-1.1.9-2 2-2zm16.33 0c1.1 0 2 .9 2 2v14.08c0 1.1-.9 2-2 2h-9.35c-1.1 0-2-.9-2-2V36.65c0-1.1.9-2 2-2zm16.32 0c1.1 0 2 .9 2 2v14.08c0 1.1-.9 2-2 2h-9.35c-1.1 0-2-.9-2-2V36.65c0-1.1.9-2 2-2z"/></svg>',
};

const GROUPS = {
  atar: {
    count: (n, atar) => `${n} ${n === 1 ? 'course' : 'courses'} found with ATAR-based entry, based on an ATAR of ${atar}`,
    status: (n) => `${n} ${n === 1 ? 'course' : 'courses'} with ATAR-based entry`,
  },
  gdp: {
    count: (n, atar) => `${n} Graduate Degree ${n === 1 ? 'Package' : 'Packages'} found, based on an ATAR of ${atar}`,
    status: (n) => `${n} Graduate Degree ${n === 1 ? 'Package' : 'Packages'}`,
  },
  range: {
    count: (n) => `${n} ${n === 1 ? 'course' : 'courses'} with range of criteria-based entry`,
    status: (n) => `${n} ${n === 1 ? 'course' : 'courses'} with a range of criteria`,
  },
  pathways: {
    status: (n) => `${n} career ${n === 1 ? 'pathway' : 'pathways'}`,
  },
};

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([name, value]) => {
    if (value === false || value === undefined || value === null) return;
    if (name === 'className') node.className = value;
    else node.setAttribute(name, value === true ? '' : value);
  });
  node.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false && c !== ''));
  return node;
}

function icon(name, className) {
  const span = el('span', { className });
  span.innerHTML = ICONS[name];
  return span;
}

const has = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const num = (entry) => (entry && has(entry.number) ? String(entry.number).trim() : '');

/**
 * Rounds to the 0.05 grid and clamps to the slider range (source validateAtarScore). Returned
 * as the source displays it, Number(score) as text: 90 stays "90", 77.33 becomes "77.35".
 */
function normaliseAtar(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const clamped = Math.min(ATAR_MAX, Math.max(ATAR_MIN, n));
  return String(Number((Math.round(clamped / 0.05) * 0.05).toFixed(2)));
}

function readStoredResidency() {
  try {
    const v = (localStorage.getItem(AUDIENCE_KEY) || '').trim().toLowerCase();
    return RESIDENCIES.includes(v) ? v : '';
  } catch (e) {
    return '';
  }
}

function storeResidency(value) {
  try {
    localStorage.setItem(AUDIENCE_KEY, value);
  } catch (e) {
    // storage unavailable
  }
}

/** The page the card links to: package page for GDPs, else the course or pathway page. */
function cardUrl(score) {
  return ['gdp', 'ug', 'indigenous', 'other']
    .map((k) => score[k] && score[k].url)
    .find(has) || '';
}

function link(href, ...children) {
  return href ? el('a', { href }, ...children) : el('span', {}, ...children);
}

/** "93.00 (indicative only)" -> big "93.00" plus a small suffix. */
function scoreValue(value) {
  const m = String(value).match(/^\s*([\d.]+)\s*(.*)$/);
  if (!m || !m[2]) return el('span', { className: 'ace-card-score' }, String(value));
  return el('span', { className: 'ace-card-score' }, m[1], el('span', { className: 'ace-card-score-note' }, ` ${m[2]}`));
}

function accessLine(row, residency) {
  const access = num(row.score.access);
  if (residency !== DOMESTIC || !access) return null;
  return el('span', { className: 'ace-card-access' }, el('strong', {}, access), ` Access Melbourne guarantee ${row.year}`);
}

function cardShell({ overline, extraClass = '' }, heading, ...body) {
  const overlineEl = overline ? el('p', { className: 'ace-card-overline' }, overline) : null;
  return el(
    'li',
    { className: `ace-card${extraClass ? ` ${extraClass}` : ''}` },
    overlineEl,
    heading,
    ...body,
  );
}

function atarCard(row, residency) {
  const { score } = row;
  let overline = '';
  if (score.gdp) overline = 'Graduate Degree Package';
  else if (score.indigenous) overline = 'Degrees for Indigenous students';
  const heading = el('h4', { className: 'ace-card-title' }, link(cardUrl(score), row.name));
  const lsr = el('span', { className: 'ace-card-label' }, `Lowest selection rank ${Number(row.year) - 1}`);
  const meta = el('p', { className: 'ace-card-meta' });
  if (residency === DOMESTIC) {
    const value = num(score.ug) || (has(row.domestic) ? row.domestic : '');
    if (value) meta.append(scoreValue(value));
    meta.append(lsr);
    const access = accessLine(row, residency);
    if (access) meta.append(access);
  } else if (has(row.internationalGuarantee)) {
    meta.append(scoreValue(row.internationalGuarantee), el('span', { className: 'ace-card-label' }, `Entry score ${row.year}`));
  } else {
    const value = num(score.international) || row.international;
    if (has(value)) meta.append(scoreValue(value));
  }
  const desc = has(row.desc) && !score.access && !score.mcs ? el('p', { className: 'ace-card-desc' }, row.desc) : null;
  return cardShell({ overline }, heading, meta.childNodes.length ? meta : null, desc);
}

function gdpCard(row, residency) {
  const heading = el(
    'h4',
    { className: 'ace-card-title' },
    link(
      cardUrl(row.score),
      el('span', {}, `${row.ugName}\u00a0/`),
      ' ',
      el('span', {}, row.gradName),
    ),
  );
  const meta = el('p', { className: 'ace-card-meta' });
  const value = num(row.score.gdp);
  if (value) {
    meta.append(
      scoreValue(value),
      el('span', { className: 'ace-card-label' }, 'Indicative ATAR entry requirement'),
    );
  }
  const access = accessLine(row, residency);
  if (access) meta.append(access);
  return cardShell({ overline: 'Graduate Degree Package', extraClass: 'ace-card-wide' }, heading, meta.childNodes.length ? meta : null);
}

function rangeCard(row) {
  const title = row.displayName || row.name;
  const sub = row.displayName ? row.displaySubheading : '';
  const heading = el(
    'h4',
    { className: 'ace-card-title' },
    link(cardUrl(row.score), title, sub ? el('span', { className: 'ace-card-subheading' }, ` ${sub}`) : null),
  );
  const desc = has(row.desc) && !row.score.access && !row.score.mcs ? el('p', { className: 'ace-card-desc' }, row.desc) : null;
  return cardShell({ extraClass: 'ace-card-wide ace-card-range' }, heading, desc);
}

function table(headings, rows) {
  return el(
    'div',
    { className: 'ace-table-wrap' },
    el(
      'table',
      { className: 'ace-table' },
      el('thead', {}, el('tr', {}, headings.map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, rows),
    ),
  );
}

function atarTable(rows, residency, year) {
  if (residency === INTERNATIONAL) {
    return table(['Course', `Entry score ${year}`], rows.map((row) => el(
      'tr',
      {},
      el('th', { scope: 'row' }, link(cardUrl(row.score), row.name)),
      el('td', {}, has(row.internationalGuarantee) ? row.internationalGuarantee : '-'),
    )));
  }
  return table(
    ['Course', `Lowest selection rank ${year - 1}`, `Access Melbourne guarantee ${year}`],
    rows.map((row) => el(
      'tr',
      {},
      el('th', { scope: 'row' }, link(cardUrl(row.score), row.name)),
      el('td', {}, num(row.score.ug) || (has(row.domestic) ? row.domestic : '-')),
      el('td', {}, num(row.score.access) || '-'),
    )),
  );
}

function gdpTable(rows, residency, year) {
  const headings = ['Course', 'Indicative ATAR entry requirement'];
  if (residency === DOMESTIC) headings.push(`Access Melbourne guarantee ${year}`);
  return table(headings, rows.map((row) => el(
    'tr',
    {},
    el('th', { scope: 'row' }, link(row.ugUrl, row.ugName), ' / ', link(row.gradUrl, row.gradName)),
    el('td', {}, num(row.score.gdp) || (has(row[residency]) ? row[residency] : '-')),
    residency === DOMESTIC ? el('td', {}, num(row.score.access) || '-') : null,
  )));
}

function rangeTable(rows) {
  return table(['Course'], rows.map((row) => el('tr', {}, el('th', { scope: 'row' }, link(cardUrl(row.score), row.name)))));
}

function pathwayList(rows) {
  return el('ul', { className: 'ace-pathways' }, rows.map((row) => el(
    'li',
    {},
    link(row.score.other && row.score.other.url, row.name),
  )));
}

const bySort = (a, b) => {
  const x = String(a.sort || '');
  const y = String(b.sort || '');
  if (x < y) return -1;
  return x > y ? 1 : 0;
};

export default async function decorate(widget) {
  const q = (sel) => widget.querySelector(sel);
  const form = q('.ace-form');
  const radios = [...widget.querySelectorAll('input[name="ace-residency"]')];
  const input = q('#ace-atar-input');
  const slider = q('#ace-atar-slider');
  const toggle = q('#ace-area-toggle');
  const panel = q('#ace-area-panel');
  const optionsEl = q('.ace-dropdown-options');
  const status = q('.ace-status');
  const loading = q('.ace-loading');
  const message = q('.ace-message');
  const results = q('.ace-results');
  const sections = Object.fromEntries(
    [...widget.querySelectorAll('.ace-section[data-section]')].map((s) => [s.dataset.section, s]),
  );
  const params = new URLSearchParams(window.location.search);

  const state = {
    residency: DOMESTIC,
    atar: String(ATAR_DEFAULT), // as displayed in the counts, like the source
    areas: new Set(), // applied selection (area codes)
    views: { atar: 'card', gdp: 'card', range: 'card' },
    rows: [],
    year: '',
  };

  form.addEventListener('submit', (e) => e.preventDefault());
  toggle.disabled = true; // until the areas have loaded

  /* ---------- residency ---------- */
  const fromUrl = (params.get('residency') || '').toLowerCase();
  state.residency = (RESIDENCIES.includes(fromUrl) && fromUrl) || readStoredResidency() || DOMESTIC;
  radios.forEach((r) => { r.checked = r.value === state.residency; });

  /* ---------- ATAR ---------- */
  function setSlider(value) {
    const n = Math.min(ATAR_MAX, Math.max(ATAR_MIN, Number(value)));
    slider.value = String(n);
    slider.style.setProperty('--ace-fill', `${((n - ATAR_MIN) / (ATAR_MAX - ATAR_MIN)) * 100}%`);
  }
  const paramAtar = params.has('atar') ? normaliseAtar(params.get('atar')) : null;
  if (paramAtar) state.atar = paramAtar;
  input.value = state.atar;
  setSlider(state.atar);
  if (params.get('view') === 'table') Object.keys(state.views).forEach((k) => { state.views[k] = 'table'; });

  /* ---------- rendering ---------- */
  let statusTimer;
  function announce(text) {
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = text; }, 600);
  }

  function filterRows() {
    const atar = Number(state.atar);
    const { residency } = state;
    return state.rows.filter((row) => {
      const tags = String(row.filter || '').split(',').map((t) => t.trim().toLowerCase());
      const wanted = state.areas.size ? [...state.areas] : ['all'];
      if (!wanted.some((a) => tags.includes(a))) return false;
      const access = residency !== INTERNATIONAL ? num(row.score.access) : '';
      const raw = access || row[residency];
      if (raw === undefined || raw === null) return false;
      return (Number(String(raw).trim()) || 0) <= atar; // '' (range of criteria) counts as 0
    }).sort(bySort);
  }

  function renderViewToggle(section, key) {
    const holder = section.querySelector('.ace-view');
    if (!holder) return;
    holder.replaceChildren(...['table', 'card'].map((view) => {
      const button = el(
        'button',
        {
          type: 'button',
          className: `ace-view-button${state.views[key] === view ? ' is-active' : ''}`,
          'aria-pressed': String(state.views[key] === view),
          'data-view': view,
        },
        icon(view, 'ace-view-icon'),
        el('span', { className: 'ace-sr-only' }, view === 'table' ? 'Table view' : 'Card view'),
      );
      button.addEventListener('click', () => {
        if (state.views[key] === view) return;
        state.views[key] = view;
        // eslint-disable-next-line no-use-before-define
        render(false);
        section.querySelector(`.ace-view-button[data-view="${view}"]`).focus();
      });
      return button;
    }));
  }

  function renderGroup(key, rows) {
    const section = sections[key];
    section.hidden = !rows.length;
    widget.querySelector(`.ace-jump [data-jump="${key}"]`).hidden = !rows.length;
    if (!rows.length) return;
    const count = section.querySelector('.ace-count');
    if (count && GROUPS[key].count) count.textContent = GROUPS[key].count(rows.length, state.atar);
    renderViewToggle(section, key);
    const list = section.querySelector('.ace-list');
    const { residency, year } = state;
    const view = state.views[key];
    let content;
    if (key === 'pathways') content = pathwayList(rows);
    else if (view === 'table') {
      if (key === 'atar') content = atarTable(rows, residency, Number(year));
      else if (key === 'gdp') content = gdpTable(rows, residency, Number(year));
      else content = rangeTable(rows);
    } else {
      const make = { atar: atarCard, gdp: gdpCard, range: rangeCard }[key];
      content = el('ul', { className: `ace-cards ace-cards-${key}` }, rows.map((row) => make(row, residency)));
    }
    list.replaceChildren(content);
  }

  function render(announceIt = true) {
    const rows = filterRows();
    const groups = {
      atar: rows.filter((r) => !r.isRangeCriteria && !r.isPathways && !r.isGdp),
      gdp: rows.filter((r) => r.isGdp),
      range: rows.filter((r) => r.isRangeCriteria),
      pathways: rows.filter((r) => r.isPathways),
    };
    widget.querySelectorAll('[data-residency]').forEach((p) => { p.hidden = p.dataset.residency !== state.residency; });
    Object.entries(groups).forEach(([key, list]) => renderGroup(key, list));
    // nothing at all: the source drops "Your study options", keeps "No matching courses found"
    const none = !rows.length;
    q('.ace-options > h2').hidden = none;
    q('.ace-options > .ace-text').hidden = none;
    q('.ace-jump').hidden = none;
    sections['atar-empty'].hidden = groups.atar.length > 0;
    if (announceIt) {
      const parts = Object.entries(groups)
        .filter(([, l]) => l.length)
        .map(([k, l]) => GROUPS[k].status(l.length));
      const who = state.residency === DOMESTIC ? 'domestic' : 'international';
      announce(none
        ? `No matching courses found for an ATAR of ${state.atar} (${who} student).`
        : `${parts.join(', ')} for an ATAR of ${state.atar} (${who} student).`);
    }
  }

  /* ---------- controls ---------- */
  radios.forEach((radio) => radio.addEventListener('change', () => {
    if (!radio.checked || radio.value === state.residency) return;
    state.residency = radio.value;
    storeResidency(state.residency);
    document.dispatchEvent(new CustomEvent('audience-change', { detail: { audience: state.residency, source: WIDGET_ID } }));
    if (state.rows.length) render();
  }));
  // keep in step with an audience switcher elsewhere on the page
  document.addEventListener('audience-change', (e) => {
    const audience = e.detail && e.detail.audience;
    if (!e.detail || e.detail.source === WIDGET_ID) return;
    if (!RESIDENCIES.includes(audience) || audience === state.residency) return;
    state.residency = audience;
    radios.forEach((r) => { r.checked = r.value === audience; });
    if (state.rows.length) render();
  });

  let atarTimer;
  function setAtar(display, { debounce = false } = {}) {
    state.atar = display;
    clearTimeout(atarTimer);
    if (!state.rows.length) return;
    if (debounce) atarTimer = setTimeout(() => render(), 250);
    else render();
  }

  input.addEventListener('input', () => {
    const raw = input.value.trim();
    if (raw === '' || !Number.isFinite(Number(raw))) return;
    // filter as you type (clamped), normalise the field on commit
    setSlider(raw);
    setAtar(String(Math.min(ATAR_MAX, Math.max(ATAR_MIN, Number(raw)))), { debounce: true });
  });
  function commitInput() {
    const value = normaliseAtar(input.value);
    const next = value || normaliseAtar(state.atar);
    input.value = next;
    setSlider(next);
    if (next !== state.atar) setAtar(next);
  }
  input.addEventListener('change', commitInput);
  input.addEventListener('blur', commitInput);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInput();
    }
  });
  slider.addEventListener('input', () => {
    const value = String(Number(slider.value));
    input.value = value;
    setSlider(value);
    setAtar(value, { debounce: true });
  });

  /* ---------- area dropdown ---------- */
  let draft = new Set();
  const placeholder = () => {
    const n = state.areas.size;
    if (!n) return 'Please select';
    if (n === optionsEl.querySelectorAll('input').length) return 'All interest areas';
    return `${n} interest ${n === 1 ? 'area' : 'areas'} selected`;
  };
  const isOpen = () => !panel.hidden;
  function syncChecks() {
    optionsEl.querySelectorAll('input').forEach((c) => { c.checked = draft.has(c.value); });
  }
  function openPanel() {
    draft = new Set(state.areas);
    syncChecks();
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.parentElement.classList.add('is-open');
  }
  function closePanel({ apply = true, focus = false } = {}) {
    if (!isOpen()) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.parentElement.classList.remove('is-open');
    const changed = draft.size !== state.areas.size || [...draft].some((v) => !state.areas.has(v));
    if (apply && changed) {
      state.areas = new Set(draft);
      toggle.textContent = placeholder();
      if (state.rows.length) render();
    }
    if (focus) toggle.focus();
  }
  toggle.addEventListener('click', () => (isOpen() ? closePanel() : openPanel()));
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && !isOpen()) {
      e.preventDefault();
      openPanel();
      const first = optionsEl.querySelector('input');
      if (first) first.focus();
    }
  });
  panel.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'clear') draft = new Set();
    closePanel({ focus: true });
  });
  q('.ace-dropdown').addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      closePanel({ focus: true });
    }
  });
  q('.ace-dropdown').addEventListener('focusout', (e) => {
    if (e.relatedTarget && !q('.ace-dropdown').contains(e.relatedTarget)) closePanel();
  });
  document.addEventListener('click', (e) => {
    if (isOpen() && !q('.ace-dropdown').contains(e.target)) closePanel();
  });
  optionsEl.addEventListener('change', (e) => {
    const box = e.target.closest('input[type="checkbox"]');
    if (!box) return;
    if (box.checked) draft.add(box.value);
    else draft.delete(box.value);
  });
  // Enter on a checkbox toggles it (the source applied on Enter; Space stays native)
  optionsEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input[type="checkbox"]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ---------- data ---------- */
  const dataUrl = widget.dataset.data
    ? new URL(widget.dataset.data, window.location.href)
    : new URL('./atar-course-explorer.data.json', import.meta.url);

  // the controls show straight away (with "Loading courses"); results render when the data arrives
  async function loadData() {
    try {
      const resp = await fetch(dataUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const rows = (Array.isArray(json) ? json : json.courses || [])
        .filter((r) => r && r.name && (!r.status || r.status === 'Live'))
        .map((r) => ({ ...r, score: r.score || {} }));
      if (!rows.length) throw new Error('no courses in data');
      state.rows = rows;
      const sci = rows.find((r) => r.name === 'Bachelor of Science');
      const yearRow = sci || rows.find((r) => has(r.year)) || {};
      state.year = String(yearRow.year || new Date().getFullYear());
      const used = new Set(rows.flatMap((r) => String(r.filter || '').split(',').map((t) => t.trim())));
      (json.areas || [])
        .filter((a) => a && a.value && a.value !== 'all' && used.has(String(a.value)))
        .forEach((a, i) => {
          const id = `ace-area-${i}`;
          optionsEl.append(el(
            'div',
            { className: 'ace-checkbox' },
            el('input', { type: 'checkbox', id, value: String(a.value).toLowerCase() }),
            el('label', { for: id }, a.label),
          ));
        });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('atar-course-explorer: could not load course data', error);
      loading.hidden = true;
      message.setAttribute('role', 'alert');
      message.replaceChildren(
        el('h3', {}, 'Course information is unavailable'),
        el(
          'p',
          {},
          'We couldn’t load the courses for this tool. Please try again later, or see the ',
          el('a', { href: '/study-with-us/undergraduate-courses/change-of-preference/atar-entry-score-guide' }, 'ATAR entry score guide'),
          ' and ',
          el('a', { href: '/find' }, 'find a course'),
          '.',
        ),
      );
      message.hidden = false;
      q('.ace-filter').hidden = true;
      return;
    }

    loading.hidden = true;
    results.hidden = false;
    toggle.disabled = false;
    render(false);
  }

  loadData();
}
