/*
 * Accordion block
 * Rows: [question | answer]. An optional first row with a single cell (or an empty
 * second cell) is treated as the intro (heading, text, links) shown beside the items.
 * Answers can contain nested blocks (e.g. a table), which are decorated and loaded here.
 */

import { decorateNestedBlocks } from '../../scripts/nested-blocks.js';

// trailing " · 12.5 pts" on a label
const META = /\s*·\s*(\d+(?:\.\d+)?\s*(?:credit\s+)?(?:pts?|points?))\s*$/i;
// " – core – " between a subject's title and code
const DASHES = /^[\s–—-]+|[\s–—-]+$/g;

/**
 * Wraps the label content in a title span, and a trailing points value
 * (e.g. "Semester 1 · 50 pts") in a meta span, as styling hooks.
 * @param {HTMLElement} summary
 */
function decorateLabel(summary) {
  const title = document.createElement('span');
  title.className = 'accordion-item-title';
  title.append(...summary.childNodes);
  summary.append(title);
  const last = title.lastChild;
  if (last?.nodeType !== Node.TEXT_NODE) return;
  const match = last.textContent.match(META);
  if (!match) return;
  const before = last.textContent.slice(0, match.index);
  // keep a label that is only a points value as the title
  if (!before.trim() && last === title.firstChild) return;
  last.textContent = before;
  const [, points] = match;
  const meta = document.createElement('span');
  meta.className = 'accordion-item-meta';
  meta.textContent = points;
  summary.append(meta);
}

/**
 * Parses a subject list item: "<strong>Title</strong> – type – <a>CODE</a> – 12.5 pts",
 * or a placeholder such as "elective – 12.5 pts".
 * @param {HTMLLIElement} li
 * @returns {{title: ?Element, type: string, link: ?Element, points: string}|null}
 */
function parseSubject(li) {
  const nodes = [...li.childNodes]
    .filter((n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim());
  if (nodes.length === 1 && nodes[0].nodeType === Node.TEXT_NODE) {
    const match = nodes[0].textContent.trim().match(/^([^–—]+?)\s+[–—-]\s+(\d[\d.]*\s*pts?)$/i);
    if (!match) return null;
    return {
      title: null, type: match[1], link: null, points: match[2],
    };
  }
  const [title, typeNode, link, pointsNode, ...rest] = nodes;
  if (rest.length || title?.tagName !== 'STRONG' || link?.tagName !== 'A') return null;
  if (typeNode?.nodeType !== Node.TEXT_NODE || pointsNode?.nodeType !== Node.TEXT_NODE) return null;
  const type = typeNode.textContent.replace(DASHES, '').trim();
  const points = pointsNode.textContent.replace(DASHES, '').trim();
  if (!type || !/^\d/.test(points)) return null;
  return {
    title, type, link, points,
  };
}

/**
 * Turns lists of subjects (sample course plans) into cards, as styling hooks.
 * Lists where any item doesn't follow the subject pattern are left as they are.
 * @param {HTMLElement} body
 */
function decorateSubjects(body) {
  body.querySelectorAll(':scope > ul').forEach((ul) => {
    const items = [...ul.children];
    const subjects = items.map(parseSubject);
    if (!items.length || subjects.some((s) => !s)) return;
    ul.classList.add('accordion-subjects');
    items.forEach((li, i) => {
      const {
        title, type, link, points,
      } = subjects[i];
      const typeEl = document.createElement('span');
      typeEl.className = 'accordion-subject-type';
      typeEl.textContent = type;
      const children = [typeEl];
      if (title) {
        const titleEl = document.createElement('strong');
        titleEl.className = 'accordion-subject-title';
        titleEl.append(...title.childNodes);
        children.push(titleEl);
      }
      const footer = document.createElement('span');
      footer.className = 'accordion-subject-footer';
      const pointsEl = document.createElement('span');
      pointsEl.className = 'accordion-subject-points';
      pointsEl.textContent = points;
      if (link) {
        link.className = 'accordion-subject-link';
        footer.append(link);
      }
      footer.append(pointsEl);
      children.push(footer);
      li.className = `accordion-subject accordion-subject-${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      li.replaceChildren(...children);
    });
  });
}

function isIntroRow(row) {
  const cells = [...row.children];
  if (cells.length === 1) return true;
  return cells.length > 1 && !cells.slice(1).some((c) => c.textContent.trim() || c.querySelector('img, picture'));
}

/**
 * Landing-page accordions (UoM design-system "uom-accordion": blue bold titles, thin
 * dividers, tinted open item) are told apart from course-page "togglerow" accordions by
 * their markup: an h2/h3 intro row, or (without an intro) a section h2 as the last heading
 * before the block, or nothing before it in its section. Course accordions sit under
 * h3/h4 headings, have h4 "Year" intros (sample plans) or are nested in tabs.
 * @param {HTMLElement} block
 * @param {?HTMLElement} intro
 * @returns {boolean}
 */
function isLandingAccordion(block, intro) {
  if (block.closest('.tabs')) return false;
  if (intro) return !!intro.querySelector(':scope > :is(h2, h3)') && !intro.querySelector(':scope > :is(h4, h5, h6)');
  const wrapper = block.parentElement;
  const section = wrapper?.parentElement;
  if (!section?.classList.contains('section')) return false;
  const before = [...section.children].slice(0, [...section.children].indexOf(wrapper));
  if (!before.some((el) => el.textContent.trim() || el.querySelector('img, picture'))) return true;
  const headings = before.flatMap((el) => [...el.querySelectorAll('h1, h2, h3, h4, h5, h6')]);
  return headings.at(-1)?.tagName === 'H2';
}

export default async function decorate(block) {
  const rows = [...block.children];
  const items = document.createElement('div');
  items.className = 'accordion-items';

  rows.forEach((row, i) => {
    if (i === 0 && rows.length > 1 && isIntroRow(row) && row.querySelector('h1, h2, h3, h4, h5, h6, p')) {
      const intro = row.firstElementChild;
      intro.className = 'accordion-intro';
      row.replaceWith(intro);
      return;
    }

    const [label, body] = row.children;
    if (!label) {
      row.remove();
      return;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    // unwrap a single heading/paragraph so the label stays inline
    const only = label.children.length === 1 ? label.firstElementChild : null;
    if (only && /^(P|H[1-6])$/.test(only.tagName)) summary.append(...only.childNodes);
    else summary.append(...label.childNodes);
    decorateLabel(summary);

    const content = body || document.createElement('div');
    content.className = 'accordion-item-body';
    decorateSubjects(content);

    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, content);
    items.append(details);
    row.remove();
  });

  block.append(items);
  if (isLandingAccordion(block, block.querySelector(':scope > .accordion-intro'))) {
    block.classList.add('accordion-ds');
  }
  if (block.querySelector(':scope > .accordion-intro')) {
    block.classList.add('accordion-has-intro');
    // a year of a sample course plan: intro + "Semester 1 · 50 pts" rows
    const labels = [...items.querySelectorAll(':scope > .accordion-item > .accordion-item-label')];
    if (labels.length && labels.every((l) => l.querySelector('.accordion-item-meta'))) {
      block.classList.add('accordion-plan');
    }
  }
  await Promise.all([...items.querySelectorAll(':scope > .accordion-item > .accordion-item-body')]
    .map(decorateNestedBlocks));
}
