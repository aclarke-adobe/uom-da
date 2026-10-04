/* eslint-disable */
/* global WebImporter */
import accordionParse from './accordion.js';
import searchParse from './search.js';

/**
 * Parser for tabs. Base: tabs (no options). Authored as "Tabs".
 * Source: course-detail template, structure tab: subject lists (#available-subjects
 * div.subject-programs) and graduate sample course plans (#sample-plans div.sample-plan).
 * The two instance shapes have different repeating units (tab sections vs div.sample-plan-section)
 * and 1-3 direct children (optional dropdown / note / controls), so the parser branches on the root
 * and treats every part as optional.
 *
 * Output (library 2-column tabs = blocks/tabs/README.md + tabs.js): one row per tab,
 *   cell 1 = tab label, cell 2 = panel content with NESTED Accordion blocks (tabs.js decorates
 *   `.tabs-panel > div[class]`). Spec: migration-work/course-detail/mapping-notes.md, "Dropdown
 *   options contract (template#excat-options)".
 *
 * A. Subject tabs (root div.subject-programs; verified in block-context/tabs/source.html (BA) and
 *    instances/01.html (MMA)):
 *    div.subject-programs > [div > .subject-programs__dropdown select] + div.app-tabs >
 *      nav button.app-tabs__tab[aria-controls] > span.app-tabs__tab-title
 *      section#{aria-controls} .app-tab__inner >
 *        .subject-programs__description (<p>s on BA, bare text on graduate)
 *        .subject-programs-list > ul.toggleblock.subject-programs-list__item      (one list), or
 *        .subject-programs__group > h4.subject-programs__group-title + .subject-programs-list (groups)
 *      item: h3.subject-programs-list__title (BA eyebrow div.subject-programs-list__sub-title dropped),
 *            span.subject-programs-list__points, .subject-programs-list-inner__description,
 *            .subject-programs-list-inner__link a
 *    - 0/1 dropdown option: one Tabs block.
 *    - >1 options: per option <h4>{option label}</h4> + one Tabs block built from that option's root
 *      (live root for the selected option, template#excat-options
 *      [data-excat-part=subject-programs][data-option-label] for the others).
 *    - panel = description <p>(s) + one Accordion, or per group <h4>{group}</h4> (omitted when empty
 *      or "-") + one Accordion. Accordion rows: `{title} · {points}` | description + <p><a>link</a></p>.
 *      No intro row in subject accordions.
 *
 * B. Plan tabs (root div.sample-plan; verified in block-context/tabs/instances/02.html + the MMA and
 *    graduate-certificate-in-international-education-ib snapshots). The plan dropdown
 *    (.sample-plan__dropdown) is the root's preceding SIBLING in the snapshots, so it is looked up
 *    in #sample-plans.
 *    div.sample-plan > [p.sample-plan__note] + .sample-plan-controls (dropped) +
 *      div.sample-plan-section > .sample-plan-section__year (p year-label, p year-points)
 *        .sample-plan-section__year-accordions > ul.sample-plan-section-accordion >
 *          trigger: strong.sample-plan-semester__title, span.sample-plan-semester__points
 *          panel: .sample-plan__subject > .sample-plan-card > p.__type, div.__title, a.__link-label, p.__points
 *    - tab labels = dropdown option texts; panel = note <p> + one Accordion per year:
 *        intro row <h4>{year}</h4><p>{year points}</p> (1 cell), then
 *        `{semester} · {points}` | <ul><li><strong>{title}</strong> – {type} – <a>{code}</a> – {points}</li></ul>
 *    - 0/1 option (or no dropdown): no Tabs wrapper, the year accordions are emitted directly.
 *    - options without a captured part: only the available panels; logs dropdown-options-not-captured.
 */

const SEP = ' · ';

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function stripAttrs(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    if (!el.attributes) return;
    [...el.attributes].forEach((a) => {
      if (/^(style|class|id|tabindex|role|data-.*|aria-.*|target|rel)$/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
  return root;
}

function para(text, document) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function heading(tag, text, document) {
  const h = document.createElement(tag);
  h.textContent = text;
  return h;
}

/** Text-ish container -> paragraphs (keeps <p>/<ul>/<ol>, wraps bare text). */
function paragraphs(el, document) {
  if (!el || !cleanText(el)) return [];
  const blocks = [...el.children].filter((c) => /^(P|UL|OL|H[1-6]|TABLE)$/.test(c.tagName));
  if (!blocks.length) {
    const p = document.createElement('p');
    p.innerHTML = el.innerHTML.trim();
    return [stripAttrs(p)];
  }
  const out = [];
  let loose = document.createElement('p');
  [...el.childNodes].forEach((n) => {
    if (n.nodeType === 1 && blocks.includes(n)) {
      if (cleanText(loose)) out.push(loose);
      loose = document.createElement('p');
      if (cleanText(n) || n.querySelector('img')) out.push(stripAttrs(n));
    } else if (n.nodeType === 3 || (n.nodeType === 1 && n.tagName !== 'DIV')) {
      loose.append(n);
    } else if (n.nodeType === 1) {
      if (cleanText(loose)) out.push(loose);
      loose = document.createElement('p');
      out.push(...paragraphs(n, document));
    }
  });
  if (cleanText(loose)) out.push(loose);
  return out;
}

// ---------------------------------------------------------------- options (excat-options)
function optionParts(document, part) {
  const tpl = document.querySelector('template#excat-options');
  if (!tpl) return [];
  const frag = tpl.content && tpl.content.childNodes.length ? tpl.content : tpl;
  return [...frag.querySelectorAll(`[data-excat-part="${part}"]`)];
}

function selectInfo(select) {
  if (!select) return { labels: [], selected: -1 };
  const opts = [...select.querySelectorAll('option')];
  const labels = opts.map((o) => cleanText(o)).filter(Boolean);
  let selected = opts.findIndex((o) => o.hasAttribute('selected'));
  if (selected < 0) selected = 0;
  return { labels, selected };
}

/** Root element for one option: live root for the selected one, else the captured part. */
function rootForOption(document, part, rootSel, label, isSelected, live) {
  if (isSelected) return live;
  const match = optionParts(document, part).find((p) => cleanText({ textContent: p.getAttribute('data-option-label') || '' }) === label);
  if (!match) return null;
  const copy = document.importNode(match, true);
  return copy.querySelector(rootSel) || copy.firstElementChild || copy;
}

// ---------------------------------------------------------------- subject tabs
function subjectAccordion(list, document) {
  const items = [...list.querySelectorAll(':scope > ul.toggleblock, :scope > ul.subject-programs-list__item')];
  if (!items.length) items.push(...list.querySelectorAll('ul.toggleblock'));
  const cells = [];
  items.forEach((ul) => {
    const titleEl = ul.querySelector('.subject-programs-list__title') || ul.querySelector('[data-testid="toggleblock-trigger"]');
    if (!titleEl) return;
    const t = titleEl.cloneNode(true);
    t.querySelectorAll('.subject-programs-list__sub-title, .subject-programs-list__points, .togglerow__chevron').forEach((s) => s.remove());
    const title = cleanText(t);
    if (!title) return;
    const points = cleanText(ul.querySelector('.subject-programs-list__points'));
    const label = points ? `${title}${SEP}${points}` : title;
    const body = [];
    const content = ul.querySelector('.subject-programs-list-inner__content');
    if (content) {
      [...content.children].forEach((c) => body.push(...paragraphs(c, document)));
    }
    ul.querySelectorAll('.subject-programs-list-inner__link a[href], a.subject-programs-list__link[href]').forEach((a, i, all) => {
      if ([...all].indexOf(a) !== i || !cleanText(a)) return;
      const link = document.createElement('a');
      link.href = a.getAttribute('href').trim();
      link.textContent = cleanText(a);
      const p = document.createElement('p');
      p.append(link);
      body.push(p);
    });
    cells.push([label, body.length ? body : '']);
  });
  if (!cells.length) return null;
  return WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
}

function subjectPanel(section, document) {
  const inner = section.querySelector('.app-tab__inner') || section;
  const out = [];
  inner.querySelectorAll(':scope > .subject-programs__description').forEach((d) => out.push(...paragraphs(d, document)));
  const groups = [...inner.querySelectorAll('.subject-programs__group')];
  if (groups.length) {
    // lists outside any group (rare) first
    inner.querySelectorAll(':scope > .subject-programs-list').forEach((l) => { const a = subjectAccordion(l, document); if (a) out.push(a); });
    groups.forEach((g) => {
      const title = cleanText(g.querySelector('.subject-programs__group-title'));
      if (title && title !== '-') out.push(heading('h4', title, document));
      g.querySelectorAll(':scope > .subject-programs__group-description, :scope > p').forEach((d) => out.push(...paragraphs(d, document)));
      g.querySelectorAll('.subject-programs-list').forEach((l) => { const a = subjectAccordion(l, document); if (a) out.push(a); });
    });
  } else {
    inner.querySelectorAll('.subject-programs-list').forEach((l) => { const a = subjectAccordion(l, document); if (a) out.push(a); });
  }
  return out;
}

function subjectTabs(root, document) {
  const tabsRoot = root.querySelector('.app-tabs') || root;
  const buttons = [...tabsRoot.querySelectorAll('button.app-tabs__tab, [role="tab"]')]
    .filter((b, i, all) => all.indexOf(b) === i);
  const cells = [];
  buttons.forEach((btn) => {
    const label = cleanText(btn.querySelector('.app-tabs__tab-title') || btn);
    const id = btn.getAttribute('aria-controls');
    const section = id ? tabsRoot.querySelector(`[id="${id}"]`) : null;
    if (!label || !section) return;
    const panel = subjectPanel(section, document);
    cells.push([label, panel.length ? panel : '']);
  });
  if (!cells.length) {
    // no tab chrome: a single list
    const panel = subjectPanel(root, document);
    if (!panel.length) return null;
    return { flat: panel };
  }
  return WebImporter.Blocks.createBlock(document, { name: 'Tabs', cells });
}

function parseSubjectPrograms(element, document) {
  const select = element.querySelector('.subject-programs__dropdown select');
  const { labels, selected } = selectInfo(select);
  const extra = paragraphs(element.querySelector('.subject-programs__available-description'), document);
  const out = [];

  if (labels.length > 1) {
    const missing = [];
    labels.forEach((label, i) => {
      const root = rootForOption(document, 'subject-programs', '.subject-programs', label, i === selected, element);
      if (!root) { missing.push(label); return; }
      const tabs = subjectTabs(root, document);
      if (!tabs) return;
      out.push(heading('h4', label, document));
      if (i === selected) out.push(...extra);
      else out.push(...paragraphs(root.querySelector('.subject-programs__available-description'), document));
      if (tabs.flat) out.push(...tabs.flat); else out.push(tabs);
    });
    if (missing.length) console.warn(`[tabs] dropdown-options-not-captured (subject-programs): ${missing.join(' | ')}`);
  } else {
    out.push(...extra);
    const tabs = subjectTabs(element, document);
    if (tabs) { if (tabs.flat) out.push(...tabs.flat); else out.push(tabs); }
  }
  return out;
}

// ---------------------------------------------------------------- plan tabs
function subjectLine(card, document) {
  const li = document.createElement('li');
  const parts = [];
  const title = cleanText(card.querySelector('.sample-plan-card__title'));
  const type = cleanText(card.querySelector('.sample-plan-card__type'));
  // the code is a handbook link; generic slots ("Elective") are an <a> without href -> plain text
  const codeA = card.querySelector('.sample-plan-card__link-label, .sample-plan-card__footer a');
  const points = cleanText(card.querySelector('.sample-plan-card__points'));
  if (title) { const s = document.createElement('strong'); s.textContent = title; parts.push(s); }
  if (type) parts.push(type);
  if (codeA && cleanText(codeA)) {
    if (codeA.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = codeA.getAttribute('href').trim();
      a.textContent = cleanText(codeA);
      parts.push(a);
    } else {
      parts.push(cleanText(codeA));
    }
  }
  if (points) parts.push(points);
  if (!parts.length) {
    const text = cleanText(card);
    if (!text) return null;
    parts.push(text);
  }
  parts.forEach((p, i) => { if (i) li.append(' – '); li.append(p); });
  return li;
}

function yearAccordion(section, document) {
  const cells = [];
  const year = cleanText(section.querySelector('.sample-plan-section__year-label'));
  const yearPoints = cleanText(section.querySelector('.sample-plan-section__year-points'));
  if (year || yearPoints) {
    const intro = [];
    if (year) intro.push(heading('h4', year, document));
    if (yearPoints) intro.push(para(yearPoints, document));
    cells.push([intro]);
  }
  section.querySelectorAll('ul.sample-plan-section-accordion, .sample-plan-section__year-accordions > ul.toggleblock').forEach((ul, i, all) => {
    if ([...all].indexOf(ul) !== i) return;
    const sem = cleanText(ul.querySelector('.sample-plan-semester__title'));
    const pts = cleanText(ul.querySelector('.sample-plan-semester__points'));
    const label = [sem, pts].filter(Boolean).join(SEP) || cleanText(ul.querySelector('[data-testid="toggleblock-trigger"]'));
    if (!label) return;
    const list = document.createElement('ul');
    let subjects = [...ul.querySelectorAll('.sample-plan-card')];
    if (!subjects.length) subjects = [...ul.querySelectorAll('.sample-plan__subject')];
    subjects.forEach((card) => { const li = subjectLine(card, document); if (li) list.append(li); });
    const body = [];
    if (list.children.length) body.push(list);
    // any free text in the panel (notes) besides the subject cards
    const panel = ul.querySelector('[data-testid="toggleblock-panel"]');
    if (panel) {
      panel.querySelectorAll('p:not(.sample-plan-card *)').forEach((p) => { if (cleanText(p)) body.push(stripAttrs(p)); });
    }
    cells.push([label, body.length ? body : '']);
  });
  // a year with only its intro row and no semesters is still a valid (intro-only) accordion
  if (!cells.length) return null;
  return WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
}

function planPanel(root, document) {
  const out = [];
  root.querySelectorAll(':scope > .sample-plan__note, :scope > p').forEach((p) => { if (cleanText(p)) out.push(para(cleanText(p), document)); });
  const sections = [...root.querySelectorAll('.sample-plan-section')];
  sections.forEach((s) => { const a = yearAccordion(s, document); if (a) out.push(a); });
  return out;
}

function parseSamplePlan(element, document) {
  const scope = element.closest('#sample-plans') || element.parentElement || element;
  const dropdown = element.querySelector('.sample-plan__dropdown') || scope.querySelector('.sample-plan__dropdown');
  const { labels, selected } = selectInfo(dropdown && dropdown.querySelector('select'));
  if (dropdown) dropdown.remove(); // read; drop the dropdown UI

  if (labels.length <= 1) return planPanel(element, document);

  const cells = [];
  const missing = [];
  labels.forEach((label, i) => {
    const root = rootForOption(document, 'sample-plan', '.sample-plan', label, i === selected, element);
    if (!root) { missing.push(label); return; }
    const panel = planPanel(root, document);
    if (panel.length) cells.push([label, panel]);
  });
  if (missing.length) console.warn(`[tabs] dropdown-options-not-captured (sample-plan): ${missing.join(' | ')}`);
  if (!cells.length) return planPanel(element, document);
  return [WebImporter.Blocks.createBlock(document, { name: 'Tabs', cells })];
}

// ---------------------------------------------------------------- generic app-tabs panels
/*
 * C. Generic tabs (section-landing family, story-article graduate-degree-packages + graduate-courses;
 *    verified on the snapshots): the instance IS div.app-tabs (its untyped wrapper div is unwrapped by
 *    the cleanup transformer, template.unwrap):
 *    div.app-tabs > .app-tabs__container nav button.app-tabs__tab[aria-controls] > span.app-tabs__tab-title
 *      .app-tabs__tabpanels > section.app-tab#{aria-controls} > .loading-overlay (empty) + .app-tab__inner >
 *        landing components: div.section-alt.ct-accordion (.section-alt__row: left intro | right
 *        .uom-accordion), div.content-block, div.ct-textcolumnlayout, ct-coursesearch, section-alt with
 *        ul.card-course-list
 *    - one row per tab: label | panel content;
 *    - nested blocks in the panel (scripts/nested-blocks.js convention, a block table inside the cell):
 *        accordion rows -> "Accordion" (parsers/accordion.js: 1-cell intro row from the left column +
 *        one row per details item), the ct-coursesearch row -> "Search" (parsers/search.js);
 *    - everything else is flattened to default content in source order (headings, paragraphs, lists;
 *      a.btn -> <p><strong><a>, a.btn--secondary -> <em>, a.btn--text -> plain link).
 */
const PANEL_BLOCKS = /^(P|UL|OL|H[1-6]|TABLE|BLOCKQUOTE|PRE)$/;

function panelButtons(root, document) {
  root.querySelectorAll('a.btn, a[class*="btn--"]').forEach((a) => {
    if (a.closest('table')) return;
    const cls = a.className || '';
    const link = document.createElement('a');
    link.href = (a.getAttribute('href') || '').trim();
    link.textContent = cleanText(a);
    let node = link;
    if (!/btn--text/.test(cls) && /\bbtn\b/.test(cls)) {
      node = document.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
      node.append(link);
    }
    const parent = a.parentElement;
    if (parent && parent.tagName === 'P') a.replaceWith(node);
    else { const p = document.createElement('p'); p.append(node); a.replaceWith(p); }
  });
}

function flattenPanel(node, document, out) {
  let loose = null;
  [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      if (!n.textContent.trim()) return;
      if (!loose) { loose = document.createElement('p'); out.push(loose); }
      loose.append(n.textContent.replace(/\s+/g, ' '));
      return;
    }
    if (n.nodeType !== 1) return;
    if (n.tagName === 'TABLE') { loose = null; out.push(n); return; }
    if (PANEL_BLOCKS.test(n.tagName)) {
      loose = null;
      if (!cleanText(n) && !n.querySelector('img, table')) return;
      if (/^H[1-6]$/.test(n.tagName)) { out.push(heading(n.tagName.toLowerCase(), cleanText(n), document)); return; }
      out.push(stripAttrs(n));
      return;
    }
    if (/^(DIV|SECTION|ARTICLE|ASIDE|NAV|HEADER|FOOTER|MAIN|FORM|FIGURE)$/.test(n.tagName)) {
      loose = null;
      flattenPanel(n, document, out);
      return;
    }
    if (/^(BUTTON|INPUT|SELECT|LABEL|TEXTAREA)$/.test(n.tagName)) return;
    // inline element (a, strong, span …) outside a paragraph
    if (!cleanText(n) && !n.querySelector('img')) return;
    if (!loose) { loose = document.createElement('p'); out.push(loose); }
    loose.append(stripAttrs(n));
  });
}

function genericPanel(section, document, params) {
  const inner = section.querySelector(':scope > .app-tab__inner') || section;
  inner.querySelectorAll('.loading-overlay').forEach((o) => o.remove());
  // nested Accordion blocks (intro row + items), then nested Search blocks, in place
  inner.querySelectorAll('.section-alt__row:has(.uom-accordion)').forEach((row) => accordionParse(row, { document }));
  inner.querySelectorAll('.uom-accordion').forEach((acc) => { if (acc.isConnected) accordionParse(acc, { document }); });
  inner.querySelectorAll('.ct-coursesearch .section-alt__row').forEach((row) => searchParse(row, { document, params }));
  panelButtons(inner, document);
  const out = [];
  flattenPanel(inner, document, out);
  return out;
}

function genericTabs(element, document, params) {
  const buttons = [...element.querySelectorAll('button.app-tabs__tab[aria-controls], [role="tab"][aria-controls]')]
    .filter((b, i, all) => all.indexOf(b) === i);
  const cells = [];
  buttons.forEach((btn) => {
    const label = cleanText(btn.querySelector('.app-tabs__tab-title') || btn);
    const id = btn.getAttribute('aria-controls');
    const section = id ? element.querySelector(`[id="${id}"]`) : null;
    if (!label || !section) return;
    const panel = genericPanel(section, document, params);
    cells.push([label, panel.length ? panel : '']);
  });
  return cells.length ? [WebImporter.Blocks.createBlock(document, { name: 'Tabs', cells })] : [];
}

function isGenericAppTabs(element) {
  return element.matches('.app-tabs') && !!element.querySelector('section.app-tab .app-tab__inner')
    && !element.querySelector('.subject-programs-list, .subject-programs__group, .sample-plan-section')
    && !element.closest('.subject-programs, .sample-plan, #sample-plans');
}

export default function parse(element, { document, params }) {
  let out = [];
  if (isGenericAppTabs(element)) {
    out = genericTabs(element, document, params);
    if (!out.length) { element.replaceWith(...element.childNodes); return; }
    element.replaceWith(...out);
    return;
  }
  if (element.matches('.sample-plan') || element.querySelector(':scope > .sample-plan-section')) {
    out = parseSamplePlan(element, document);
  } else {
    out = parseSubjectPrograms(element, document);
  }

  if (!out.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  // The block (or, for multi-program subject lists, h4 + block pairs) replaces the root.
  const block = out.length === 1 ? out[0] : null;
  if (block) {
    element.replaceWith(block);
    return;
  }
  element.replaceWith(...out);
}
