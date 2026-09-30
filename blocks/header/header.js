// desktop layout starts where the source mega menu switches from its mobile bar
const isDesktop = window.matchMedia('(width >= 1098px)');

// max rows (links + sub-links) per mega menu column before a new column starts
const MAX_COLUMN_ROWS = 10;

/**
 * Fetches the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), base: resp.url };
}

/**
 * Resolves relative image paths against the fragment location so they work on any page depth.
 * @param {Element} root
 * @param {string} base
 */
function resolveImages(root, base) {
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!/^(https?:|data:|\/)/.test(src)) img.src = new URL(src, base).href;
  });
}

function rowCount(li) {
  return 1 + li.querySelectorAll(':scope > ul > li').length;
}

/**
 * Splits panel items into columns, starting a new column when the next group would overflow.
 * @param {Element[]} items
 * @returns {Element[][]}
 */
function splitIntoColumns(items) {
  const columns = [[]];
  let rows = 0;
  items.forEach((li) => {
    const n = rowCount(li);
    if (rows > 0 && rows + n > MAX_COLUMN_ROWS) {
      columns.push([]);
      rows = 0;
    }
    columns[columns.length - 1].push(li);
    rows += n;
  });
  return columns;
}

/**
 * Builds a mega menu panel from a section's nested list.
 * @param {string} title
 * @param {Element} list
 * @param {string} id
 */
function buildPanel(title, list, id) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  panel.id = id;
  panel.hidden = true;

  const heading = document.createElement('p');
  heading.className = 'nav-panel-title';
  heading.textContent = title;
  panel.append(heading);

  const items = [...list.children];
  items.forEach((li) => {
    const label = li.querySelector(':scope > p');
    if (label) label.className = 'nav-panel-group';
    const link = li.querySelector(':scope > a');
    if (link) link.className = 'nav-panel-link';
  });

  const columns = document.createElement('div');
  columns.className = 'nav-panel-columns';
  const groups = splitIntoColumns(items);
  // three or more columns use the wide panel variant
  if (groups.length >= 3) panel.classList.add('nav-panel-wide');
  groups.forEach((colItems) => {
    const col = document.createElement('ul');
    col.className = 'nav-panel-column';
    col.append(...colItems);
    columns.append(col);
  });
  panel.append(columns);
  return panel;
}

/**
 * Positions an open panel centred under its trigger, clamped to the viewport.
 * @param {Element} panel
 * @param {Element} trigger
 */
function positionPanel(panel, trigger) {
  if (!isDesktop.matches) {
    panel.style.left = '';
    return;
  }
  const bar = panel.offsetParent || document.body;
  const barRect = bar.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const width = panel.offsetWidth;
  const viewport = document.documentElement.clientWidth;
  const centred = triggerRect.left + (triggerRect.width / 2) - (width / 2);
  const left = Math.max(0, Math.min(centred, viewport - width));
  panel.style.left = `${left - barRect.left}px`;
}

function closePanels(nav, except) {
  nav.querySelectorAll('.nav-drop > button[aria-expanded="true"]').forEach((btn) => {
    if (btn === except) return;
    btn.setAttribute('aria-expanded', 'false');
    document.getElementById(btn.getAttribute('aria-controls')).hidden = true;
  });
  if (!except) nav.closest('.header').classList.remove('panel-open');
}

function togglePanel(nav, button) {
  const open = button.getAttribute('aria-expanded') !== 'true';
  closePanels(nav, button);
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  const panel = document.getElementById(button.getAttribute('aria-controls'));
  panel.hidden = !open;
  if (open) positionPanel(panel, button);
  nav.closest('.header').classList.toggle('panel-open', open && isDesktop.matches);
}

/**
 * Builds a search form; the action and hidden fields come from the nav search link.
 * @param {HTMLAnchorElement} link
 * @param {string} className
 */
function buildSearchForm(link, className) {
  const target = new URL(link.href);
  const label = link.textContent.trim();
  const form = document.createElement('form');
  form.className = className;
  form.action = `${target.origin}${target.pathname}`;
  form.method = 'get';
  form.setAttribute('role', 'search');
  target.searchParams.forEach((value, name) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.value = value;
    form.append(hidden);
  });
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'query';
  input.placeholder = label;
  input.setAttribute('aria-label', label);
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', label);
  form.append(input, submit);
  return form;
}

/**
 * Builds the full-screen desktop search overlay.
 * @param {HTMLAnchorElement} link
 */
function buildSearch(link) {
  const overlay = document.createElement('div');
  overlay.className = 'nav-search-overlay';
  overlay.id = 'nav-search';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', link.textContent.trim());

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-search-close';
  close.setAttribute('aria-label', 'Close search');
  close.innerHTML = '<span>Close</span>';

  overlay.append(buildSearchForm(link, 'nav-search-form'), close);
  return overlay;
}

/**
 * Builds one drawer view: back row + heading (sub views) and the item list.
 * Items with children drill into a new view; leaves are plain links.
 * @param {Element} drawer
 * @param {object} opts
 */
function buildDrawerView(drawer, opts) {
  const {
    heading, items, depth, extras = [],
  } = opts;
  const view = document.createElement('div');
  view.className = `nav-drawer-view nav-drawer-depth-${depth}`;

  if (depth > 0) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'nav-drawer-back';
    back.textContent = 'Back';
    back.addEventListener('click', () => {
      view.remove();
      const prev = drawer.querySelector('.nav-drawer-view:last-child');
      prev.hidden = false;
      prev.querySelector('[data-opened]')?.focus();
      prev.querySelector('[data-opened]')?.removeAttribute('data-opened');
    });
    view.append(back);
    heading.classList.add('nav-drawer-heading');
    view.append(heading);
  }

  view.prepend(...extras.filter((x) => x.classList.contains('nav-drawer-search')));
  const list = document.createElement('ul');
  list.className = 'nav-drawer-list';
  items.forEach((li) => {
    const row = document.createElement('li');
    const children = li.querySelector(':scope > ul');
    const labelEl = li.querySelector(':scope > a, :scope > p');
    if (!labelEl) return;
    if (children) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-drawer-item nav-drawer-parent';
      button.textContent = labelEl.textContent.trim();
      button.addEventListener('click', () => {
        const title = labelEl.tagName === 'A' ? labelEl.cloneNode(true) : document.createElement('p');
        if (title.tagName === 'P') title.textContent = labelEl.textContent.trim();
        title.removeAttribute('class');
        button.dataset.opened = '';
        view.hidden = true;
        const next = buildDrawerView(drawer, {
          heading: title,
          items: [...children.children],
          depth: depth + 1,
        });
        drawer.append(next);
        next.querySelector('.nav-drawer-back').focus();
      });
      row.append(button);
    } else {
      const link = labelEl.cloneNode(true);
      link.className = 'nav-drawer-item';
      row.append(link);
    }
    list.append(row);
  });
  view.append(list, ...extras.filter((x) => !x.classList.contains('nav-drawer-search')));
  return view;
}

/**
 * Builds the mobile slide-in drawer from the nav sections, utility links and search link.
 * @param {Element[]} topItems
 * @param {Element|null} utilityList
 * @param {HTMLAnchorElement|null} searchLink
 */
function buildDrawer(topItems, utilityList, searchLink) {
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.id = 'nav-drawer';
  const extras = [];
  if (searchLink) extras.push(buildSearchForm(searchLink, 'nav-drawer-search'));
  if (utilityList) {
    const util = utilityList.cloneNode(true);
    util.className = 'nav-drawer-utility';
    extras.push(util);
  }
  const rootItems = topItems.map((li) => {
    const copy = li.cloneNode(true);
    copy.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));
    return copy;
  });
  drawer.append(buildDrawerView(drawer, { items: rootItems, depth: 0, extras }));
  return drawer;
}

function resetDrawer(nav) {
  const views = nav.querySelectorAll('.nav-drawer-view');
  views.forEach((view, i) => {
    if (i > 0) view.remove();
    else view.hidden = false;
  });
}

function setSearchOpen(nav, open) {
  const overlay = nav.querySelector('.nav-search-overlay');
  const toggle = nav.querySelector('.nav-search-toggle');
  if (!overlay || !toggle || overlay.hidden === !open) return;
  overlay.hidden = !open;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.classList.toggle('nav-search-open', open);
  if (open) {
    closePanels(nav);
    overlay.querySelector('input[name="query"]').focus();
  } else {
    toggle.focus();
  }
}

function setMenuOpen(nav, open) {
  const button = nav.querySelector('.nav-hamburger');
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  button.querySelector('.nav-hamburger-label').textContent = open ? 'Close' : 'Menu';
  document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
  if (!open) {
    closePanels(nav);
    resetDrawer(nav);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;

  const source = document.createElement('div');
  source.innerHTML = fragment.html;
  resolveImages(source, fragment.base);
  const [brandSec, utilitySec, sectionsSec, toolsSec] = source.children;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  // brand: logo tile (first link) + site title (second link)
  const brandLinks = brandSec ? [...brandSec.querySelectorAll('a')] : [];
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandLinks[0]) {
    brandLinks[0].className = 'nav-logo';
    brandLinks[0].setAttribute('aria-label', brandLinks[0].querySelector('img')?.alt || brandLinks[0].textContent);
    brand.append(brandLinks[0]);
  }

  const bars = document.createElement('div');
  bars.className = 'nav-bars';

  // utility bar
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  const utilityList = utilitySec?.querySelector('ul');
  if (utilityList) {
    utilityList.className = 'nav-utility-links';
    utility.append(utilityList);
  }

  // main bar: site title + mega menu triggers
  const main = document.createElement('div');
  main.className = 'nav-main';
  if (brandLinks[1]) {
    brandLinks[1].className = 'nav-site-title';
    main.append(brandLinks[1]);
  }

  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', 'nav-drawer');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span><span class="nav-hamburger-label">Menu</span>';
  hamburger.addEventListener('click', () => setMenuOpen(nav, nav.getAttribute('aria-expanded') !== 'true'));

  const sections = document.createElement('ul');
  sections.className = 'nav-sections';
  sections.id = 'nav-sections';
  const topItems = sectionsSec ? [...sectionsSec.querySelectorAll(':scope > ul > li')] : [];
  const searchLink = toolsSec?.querySelector('a');
  const drawer = buildDrawer(topItems, utilityList, searchLink);
  topItems.forEach((li, i) => {
    const label = li.querySelector(':scope > p')?.textContent.trim() || '';
    const list = li.querySelector(':scope > ul');
    const item = document.createElement('li');
    item.className = 'nav-drop';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `nav-panel-${i}`);
    button.innerHTML = '<span></span>';
    button.firstElementChild.textContent = label;
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(nav, button);
    });
    item.append(button);
    if (list) item.append(buildPanel(label, list, `nav-panel-${i}`));
    sections.append(item);
  });

  main.append(sections, hamburger);

  // tools: search toggle + overlay
  if (searchLink) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-search-toggle';
    toggle.setAttribute('aria-controls', 'nav-search');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open search');
    toggle.addEventListener('click', () => setSearchOpen(nav, true));
    utility.append(toggle);
    const overlay = buildSearch(searchLink);
    overlay.querySelector('.nav-search-close').addEventListener('click', () => setSearchOpen(nav, false));
    nav.append(overlay);
  }

  bars.append(utility, main);
  nav.prepend(brand, bars);
  nav.append(drawer);

  // light dismiss: outside click and Escape close open panels / search
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-panel')) closePanels(nav);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const open = nav.querySelector('.nav-drop > button[aria-expanded="true"]');
    if (open) {
      closePanels(nav);
      open.focus();
    } else if (!nav.querySelector('.nav-search-overlay')?.hidden) {
      setSearchOpen(nav, false);
    } else if (nav.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(nav, false);
      hamburger.focus();
    }
  });
  window.addEventListener('resize', () => {
    const open = nav.querySelector('.nav-drop > button[aria-expanded="true"]');
    if (open) positionPanel(document.getElementById(open.getAttribute('aria-controls')), open);
  });
  isDesktop.addEventListener('change', () => {
    setMenuOpen(nav, false);
    setSearchOpen(nav, false);
  });

  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper, backdrop);
}
