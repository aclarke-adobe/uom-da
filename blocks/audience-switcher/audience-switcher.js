/*
 * Audience switcher block
 * Row 1: label (e.g. "Showing information for").
 * Rows 2+: [option label | optional key]. The key defaults to the slugified label.
 *
 * The selected key is stored on <body data-audience>, persisted in localStorage and
 * broadcast as an `audience-change` event. Page sections authored with section metadata
 * `Audience: <key>` (rendered as data-audience) and elements carrying an
 * `audience-<key>` class are shown only for the matching audience.
 */

const STORAGE_KEY = 'uom-audience';

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function store(key) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch (e) {
    // storage unavailable, ignore
  }
}

function applyAudience(key, keys) {
  document.body.dataset.audience = key;
  const main = document.querySelector('main');
  if (main) {
    main.querySelectorAll('[data-audience]').forEach((el) => {
      const values = el.dataset.audience.split(',').map((v) => slugify(v));
      el.hidden = !values.includes(key);
    });
    keys.forEach((k) => {
      main.querySelectorAll(`.audience-${k}`).forEach((el) => { el.hidden = k !== key; });
    });
  }
  document.dispatchEvent(new CustomEvent('audience-change', { detail: { audience: key } }));
}

let instance = 0;

export default function decorate(block) {
  instance += 1;
  const rows = [...block.children];
  if (!rows.length) return;

  let labelText = '';
  let optionRows = rows;
  // a single-cell first row (followed by option rows) is the group label
  if (rows.length > 1 && rows[0].children.length === 1) {
    labelText = rows[0].textContent.trim();
    optionRows = rows.slice(1);
  }

  const options = optionRows.map((row) => {
    const [labelCell, keyCell] = row.children;
    const label = (labelCell?.textContent || '').trim();
    const key = slugify((keyCell?.textContent || '').trim() || label);
    return { label, key };
  }).filter((o) => o.label && o.key);
  if (!options.length) return;

  const keys = options.map((o) => o.key);
  const params = new URLSearchParams(window.location.search);
  const requested = slugify(params.get('audience') || readStored() || '');
  const current = keys.includes(requested) ? requested : keys[0];

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'audience-switcher-group';
  if (labelText) {
    const legend = document.createElement('legend');
    legend.className = 'audience-switcher-label';
    legend.textContent = labelText;
    fieldset.append(legend);
  }

  const name = `audience-switcher-${instance}`;
  const list = document.createElement('div');
  list.className = 'audience-switcher-options';
  options.forEach(({ label, key }) => {
    const id = `${name}-${key}`;
    const wrap = document.createElement('div');
    wrap.className = 'audience-switcher-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.id = id;
    input.value = key;
    input.checked = key === current;
    const lbl = document.createElement('label');
    lbl.htmlFor = id;
    lbl.textContent = label;
    input.addEventListener('change', () => {
      if (!input.checked) return;
      store(key);
      applyAudience(key, keys);
      // keep other switchers on the page in sync
      document.querySelectorAll(`.audience-switcher input[value="${key}"]`).forEach((other) => {
        other.checked = true;
      });
    });
    wrap.append(input, lbl);
    list.append(wrap);
  });
  fieldset.append(list);
  block.replaceChildren(fieldset);

  applyAudience(current, keys);
}
