/*
 * Audience switcher block
 * Row 1: label (e.g. "Showing information for").
 * Rows 2+: [option label | optional key]. The key defaults to the slugified label.
 *
 * The selected key is stored on <body data-audience>, persisted in localStorage and
 * broadcast as an `audience-change` event. Page sections authored with section metadata
 * `Audience: <key>` (rendered as data-audience) and elements carrying an
 * `audience-<key>` class are shown only for the matching audience.
 *
 * Each switcher type (its set of option keys) persists under its own storage key, so
 * choosing Organisations on a micro-credential leaves the course domestic/international
 * choice alone.
 */

const LEGACY_STORAGE_KEY = 'uom-audience';

// the course switcher predates per-type keys; it keeps the legacy key so that
// returning visitors keep their choice
const STORAGE_KEYS = {
  'domestic|international': LEGACY_STORAGE_KEY,
};

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function storageKeyFor(keys) {
  const type = [...new Set(keys)].sort().join('|');
  return STORAGE_KEYS[type] || `${LEGACY_STORAGE_KEY}:${type}`;
}

function readStored(storageKey) {
  try {
    return localStorage.getItem(storageKey);
  } catch (e) {
    return null;
  }
}

/**
 * The stored choice for this switcher type. Before per-type keys every switcher wrote the
 * legacy key, so a value there that belongs to this switcher's options is still honoured.
 */
function readChoice(storageKey, keys) {
  const stored = slugify(readStored(storageKey) || '');
  if (keys.includes(stored)) return stored;
  if (storageKey === LEGACY_STORAGE_KEY) return '';
  const legacy = slugify(readStored(LEGACY_STORAGE_KEY) || '');
  return keys.includes(legacy) ? legacy : '';
}

function store(storageKey, key) {
  try {
    localStorage.setItem(storageKey, key);
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
  const storageKey = storageKeyFor(keys);
  const params = new URLSearchParams(window.location.search);
  const fromUrl = slugify(params.get('audience') || '');
  const current = (keys.includes(fromUrl) && fromUrl) || readChoice(storageKey, keys) || keys[0];

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
      store(storageKey, key);
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
