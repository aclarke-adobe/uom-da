/*
 * Video library block: a filterable on-demand video library (source: the UniMelb
 * cards-filter-category component on /study-with-us/on-demand).
 *
 * Content (see README.md):
 *   optional config rows, 2 cells: "Heading | On-demand" (group heading), "Page size | 12";
 *   an optional column-label row (3+ cells, no video link) is ignored;
 *   one row per video: thumbnail image | title | YouTube link | study level | topic | duration.
 *   Study level and topic cells may hold several values (one per line or separated by ";").
 *
 * Behaviour (as the source): study level radios, topic select and keyword search apply on
 * Filter / Enter; Clear resets; "N results found with M filters applied"; the first 12 cards,
 * then "Show all N results" (with a "Show all categories" back control); URL params
 * studyLevel / discipline / search (and type=<group> to show all) are read on load and written
 * on Filter / Clear. A card opens a modal YouTube player (native <dialog>, no autoplay).
 * Added (not in the source): an empty-state message.
 */
import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';
import { youtubeId, createYoutubeFrame } from '../../scripts/youtube.js';

const YOUTUBE_LINK = /(?:youtube(?:-nocookie)?\.com|youtu\.be)\//i;
const YOUTUBE_ID = /^[\w-]{11}$/;
const DURATION = /^\d{1,2}(?:[:.]\d{2}){1,2}$/;
const DEFAULT_PAGE_SIZE = 12;
const PARAMS = {
  level: 'studyLevel', topic: 'discipline', search: 'search', type: 'type',
};
// the source player's embed parameters (no autoplay)
const PLAYER_PARAMS = {
  playsinline: 1, rel: 0, cc_load_policy: 1, modestbranding: 1, enablejsapi: 1,
};

const ICONS = {
  arrowRight: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 5 14 14M19 5 5 19" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};

let instanceCount = 0;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'className') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  node.append(...children.filter((c) => c !== undefined && c !== null));
  return node;
}

function text(cell) {
  return (cell?.textContent || '').replace(/\s+/g, ' ').trim();
}

/** Values of a cell: one per paragraph / line / list item, or separated by ";" (not ","). */
function values(cell) {
  if (!cell) return [];
  let raw = '';
  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) raw += child.textContent.replace(/\s+/g, ' ');
      else if (child.nodeName === 'BR') raw += '\n';
      else if (child.nodeType === Node.ELEMENT_NODE) {
        const isBlock = /^(P|LI|DIV|UL|OL)$/.test(child.nodeName);
        if (isBlock) raw += '\n';
        walk(child);
        if (isBlock) raw += '\n';
      }
    });
  };
  walk(cell);
  const parts = [];
  raw.split(/[\n;]/).forEach((v) => {
    const t = v.trim();
    if (t && !parts.includes(t)) parts.push(t);
  });
  return parts;
}

/** "21.59" -> "21:59" (the source mixes "." and ":"). */
function normaliseDuration(value) {
  const t = (value || '').trim();
  return DURATION.test(t) ? t.replace(/\./g, ':') : t;
}

function isUrlText(link) {
  const t = link.textContent.trim();
  return !t || /^https?:\/\//i.test(t) || t === link.href;
}

/** Block rows -> { config, videos }. Rows without a usable YouTube link are config/labels. */
function readRows(block) {
  const config = { heading: 'On-demand', pageSize: DEFAULT_PAGE_SIZE };
  const videos = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const link = [...row.querySelectorAll('a[href]')].find((a) => YOUTUBE_LINK.test(a.href));
    if (!link) {
      if (cells.length === 2 && !row.querySelector('picture, img')) {
        const key = toClassName(text(cells[0]));
        const value = text(cells[1]);
        if (key === 'heading' && value) config.heading = value;
        if (key === 'page-size' && parseInt(value, 10) > 0) config.pageSize = parseInt(value, 10);
      }
      return;
    }
    const id = youtubeId(link.href);
    if (!id || !YOUTUBE_ID.test(id)) return;

    const img = row.querySelector('picture img, img');
    const textCells = cells.filter((c) => !c.contains(link) && !(img && c.contains(img)));
    const durationIndex = textCells.findLastIndex((c) => DURATION.test(text(c)));
    const duration = durationIndex >= 0 ? normaliseDuration(text(textCells[durationIndex])) : '';
    const rest = textCells.filter((c, i) => i !== durationIndex);
    const title = text(rest[0]) || (isUrlText(link) ? '' : text(link)) || 'Video';
    videos.push({
      id,
      title,
      levels: values(rest[1]),
      topics: values(rest[2]),
      duration,
      thumb: img ? { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' } : null,
    });
  });
  return { config, videos };
}

function uniqueSorted(list) {
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

/** A value from the URL matched against the allowed values (exact, then case-insensitive). */
function matchValue(value, allowed) {
  if (!value) return '';
  return allowed.find((v) => v === value)
    || allowed.find((v) => v.toLowerCase() === value.toLowerCase()) || '';
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function buildPicture(video) {
  if (video.thumb && video.thumb.src) {
    return createOptimizedPicture(video.thumb.src, '', false, [{ width: '750' }]);
  }
  // no thumbnail authored: the video's own YouTube thumbnail
  const picture = document.createElement('picture');
  picture.append(el('img', {
    src: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`, alt: '', loading: 'lazy',
  }));
  return picture;
}

function buildCard(video, onOpen) {
  const label = `Play ${video.title}${video.duration ? `, ${video.duration} minutes` : ''}`;
  const button = el('button', {
    type: 'button', className: 'video-library-open', 'aria-label': label, 'aria-haspopup': 'dialog',
  }, video.title);
  button.addEventListener('click', () => onOpen(video, button));
  const thumb = el('div', { className: 'video-library-thumb' }, buildPicture(video), el('span', { className: 'video-library-play', html: ICONS.play }));
  const body = el('div', { className: 'video-library-body' }, el('h3', { className: 'video-library-title' }, button));
  if (video.duration) {
    body.append(el('p', { className: 'video-library-duration' }, el('span', { className: 'video-library-icon', html: ICONS.clock }), `${video.duration} minutes`));
  }
  return el('li', { className: 'video-library-card' }, thumb, body);
}

/** The modal player: one native <dialog> per block, the iframe is created on open. */
function buildDialog() {
  const player = el('div', { className: 'video-library-player' });
  const close = el('button', {
    type: 'button', className: 'video-library-close', 'aria-label': 'Close video', html: ICONS.close,
  });
  const dialog = el('dialog', { className: 'video-library-dialog' }, el('div', { className: 'video-library-dialog-inner' }, close, player));
  let trigger = null;

  close.addEventListener('click', () => dialog.close());
  // a click on the backdrop lands on the <dialog> itself
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    player.replaceChildren(); // stops playback
    if (trigger && trigger.isConnected) trigger.focus();
    trigger = null;
  });

  const open = (video, from) => {
    trigger = from;
    dialog.setAttribute('aria-label', video.title);
    player.replaceChildren(createYoutubeFrame(video.id, {
      title: video.title, params: { ...PLAYER_PARAMS, origin: window.location.origin },
    }));
    dialog.showModal();
    close.focus();
  };
  return { dialog, open };
}

export default function decorate(block) {
  instanceCount += 1;
  const uid = `video-library-${instanceCount}`;
  const { config, videos } = readRows(block);
  const levels = uniqueSorted(videos.flatMap((v) => v.levels));
  const topics = uniqueSorted(videos.flatMap((v) => v.topics));

  /* ---------- filter form ---------- */
  const radios = ['', ...levels].map((level, i) => {
    const input = el('input', {
      type: 'radio', name: `${uid}-level`, id: `${uid}-level-${i}`, value: level,
    });
    return el('div', { className: 'video-library-radio' }, input, el('label', { for: input.id }, level || 'All'));
  });
  const levelField = el('fieldset', { className: 'video-library-field video-library-levels' }, el('legend', { className: 'video-library-label' }, 'Study level'), el('div', { className: 'video-library-radios' }, ...radios));

  const select = el('select', { id: `${uid}-topic` }, el('option', { value: '' }, 'Show all'), ...topics.map((t) => el('option', { value: t }, t)));
  const topicField = el('div', { className: 'video-library-field video-library-topic' }, el('label', { className: 'video-library-label', for: select.id }, 'Topic'), el('div', { className: 'video-library-select' }, select));

  const search = el('input', {
    type: 'search', id: `${uid}-search`, autocomplete: 'off', enterkeyhint: 'search',
  });
  const searchField = el('div', { className: 'video-library-field video-library-keywords' }, el('label', { className: 'video-library-label', for: search.id }, 'Keywords'), search);

  const filterBtn = el('button', { type: 'submit', className: 'video-library-filter' }, el('span', { className: 'video-library-icon', html: ICONS.arrowRight }), 'Filter');
  const clearBtn = el('button', { type: 'button', className: 'video-library-clear' }, el('span', { className: 'video-library-icon', html: ICONS.close }), el('span', { className: 'video-library-clear-text' }, 'Clear'));
  const actions = el('div', { className: 'video-library-actions' }, filterBtn, clearBtn);

  const form = el('form', { className: 'video-library-form', 'aria-label': 'Filter videos' }, levelField, topicField, searchField, actions);

  /* ---------- results ---------- */
  const status = el('p', { className: 'video-library-status', role: 'status', 'aria-live': 'polite' });
  const backBtn = el('button', { type: 'button', className: 'video-library-back', hidden: true }, el('span', { className: 'video-library-icon', html: ICONS.arrowLeft }), 'Show all categories');
  const heading = el('h2', { className: 'video-library-heading', id: `${uid}-heading` }, config.heading);
  const grid = el('ul', { className: 'video-library-grid', 'aria-labelledby': heading.id });
  const moreBtn = el('button', { type: 'button', className: 'video-library-more', hidden: true });
  const group = el('div', { className: 'video-library-group' }, heading, grid, moreBtn);
  const empty = el('div', { className: 'video-library-empty', hidden: true }, el('p', {}, 'No videos match your filters.'), el('p', {}, 'Try a different study level, topic or keyword, or clear the filters to see all videos.'));
  const results = el('div', { className: 'video-library-results', id: `${uid}-results` }, status, backBtn, group, empty);

  const { dialog, open } = buildDialog();

  /* ---------- state ---------- */
  const params = new URLSearchParams(window.location.search);
  const state = {
    level: matchValue(params.get(PARAMS.level), levels),
    topic: matchValue(params.get(PARAMS.topic), topics),
    search: (params.get(PARAMS.search) || '').trim(),
    showAll: Boolean(params.get(PARAMS.type))
      && params.get(PARAMS.type).toLowerCase() === config.heading.toLowerCase(),
  };

  const syncControls = () => {
    radios.forEach((r) => {
      const input = r.querySelector('input');
      input.checked = input.value === state.level;
    });
    select.value = state.topic;
    search.value = state.search;
  };

  const writeUrl = () => {
    const url = new URL(window.location.href);
    [[PARAMS.level, state.level], [PARAMS.topic, state.topic], [PARAMS.search, state.search]]
      .forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      });
    url.searchParams.delete(PARAMS.type);
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href);
  };

  const matches = (v) => {
    const q = state.search.toLowerCase();
    return (!state.level || v.levels.includes(state.level))
      && (!state.topic || v.topics.includes(state.topic))
      && (!q || v.title.toLowerCase().includes(q));
  };

  const render = () => {
    const found = videos.filter(matches);
    const applied = [state.level, state.topic, state.search].filter(Boolean).length;
    status.innerHTML = '';
    status.append(el('strong', {}, plural(found.length, 'result', 'results')), ' found with ', el('strong', {}, String(applied)), ` ${applied === 1 ? 'filter' : 'filters'} applied`);

    const shown = state.showAll ? found : found.slice(0, config.pageSize);
    grid.replaceChildren(...shown.map((v) => buildCard(v, open)));
    group.hidden = !found.length;
    empty.hidden = Boolean(found.length);
    backBtn.hidden = !state.showAll || !found.length;
    const more = !state.showAll && found.length > config.pageSize;
    moreBtn.hidden = !more;
    moreBtn.replaceChildren(el('span', { className: 'video-library-icon', html: ICONS.arrowRight }), `Show all ${found.length} results`);
  };

  /* ---------- events ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.level = form.querySelector(`input[name="${uid}-level"]:checked`)?.value || '';
    state.topic = select.value;
    state.search = search.value.trim();
    state.showAll = false;
    writeUrl();
    render();
  });

  clearBtn.addEventListener('click', () => {
    Object.assign(state, {
      level: '', topic: '', search: '', showAll: false,
    });
    syncControls();
    writeUrl();
    render();
  });

  moreBtn.addEventListener('click', () => {
    state.showAll = true;
    render();
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    backBtn.focus({ preventScroll: true });
  });

  backBtn.addEventListener('click', () => {
    state.showAll = false;
    render();
    if (!moreBtn.hidden) moreBtn.focus();
  });

  /* ---------- mount ---------- */
  syncControls();
  render();
  block.replaceChildren(el('div', { className: 'video-library-filters' }, form), results, dialog);
}
