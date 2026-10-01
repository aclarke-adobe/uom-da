/* eslint-disable */
/* global WebImporter */
/**
 * Parser for timeline-key-dates. Base: timeline (option: key-dates). Authored as "Timeline (key-dates)".
 * Source: course-detail template, how-to-apply key dates (UG title-band aside card; graduate
 * #key-application-dates date-list--alt). One domestic + one international copy when split.
 *
 * Output (blocks/timeline/README.md + timeline.js `key-dates`):
 *   header row (1 cell):
 *     UG aside card:          <p>{.date-list__label}</p><h3>{h3.date-list__title}</h3>
 *     graduate date-list--alt: <h4>{h3.date-list__title}</h4> (no label chip; h4 because the section
 *                              h3 "Key application dates" precedes it)
 *   one row per li.date-entry: <p>{.date-entry__date}</p> | <p><strong>{.date-entry__title}</strong></p>
 *     (the entries are div[href=""], never links)
 *   no-dates marker li.date-list--no-date-msg: a single-cell row with its text.
 *   0-6 entries.
 *
 * Source (verified in block-context/timeline-key-dates/source.html + instances/01..03):
 *   div.date-list[.date-list--alt] > .date-list__header > strong.date-list__label?, h3.date-list__title
 *     ul.date-list__list > li.date-entry > .date-entry__icon (removed by cleanup),
 *       .date-entry__inner > strong.date-entry__title, span.date-entry__date
 *     li.date-list--no-date-msg (no dates published)
 * The digest's repeating unit differs between instances (a 1-entry list reads as "tag:div"): rows
 * are keyed on the list items (ul.date-list__list > li, fallback li.date-entry / no-date marker), so
 * 0, 1 or N entries all produce the right row count.
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const cells = [];
  const alt = element.matches('.date-list--alt') || !!element.closest('#key-application-dates');

  // --- header ---
  const label = cleanText(element.querySelector('.date-list__label, [data-test="date-list-label"]'));
  const title = cleanText(element.querySelector('.date-list__title, [data-test="date-list-title"]'));
  const header = [];
  if (alt) {
    if (title) { const h4 = document.createElement('h4'); h4.textContent = title; header.push(h4); }
    else if (label) { const h4 = document.createElement('h4'); h4.textContent = label; header.push(h4); }
  } else {
    if (label) { const p = document.createElement('p'); p.textContent = label; header.push(p); }
    if (title) { const h3 = document.createElement('h3'); h3.textContent = title; header.push(h3); }
  }
  if (header.length) cells.push([header]);

  // --- entries ---
  let items = [...element.querySelectorAll('.date-list__list > li')];
  if (!items.length) items = [...element.querySelectorAll('li.date-entry, li.date-list--no-date-msg')];
  items.forEach((li) => {
    if (li.matches('.date-list--no-date-msg') || !li.querySelector('.date-entry__title, .date-entry__date')) {
      const text = cleanText(li);
      if (!text) return;
      const p = document.createElement('p');
      p.textContent = text;
      cells.push([[p]]);
      return;
    }
    const date = cleanText(li.querySelector('.date-entry__date, [data-test="date-entry-date"]'));
    const entry = cleanText(li.querySelector('.date-entry__title, [data-test="date-entry-title"]'));
    const dateP = document.createElement('p');
    dateP.textContent = date;
    const bodyP = document.createElement('p');
    if (entry) {
      const strong = document.createElement('strong');
      strong.textContent = entry;
      bodyP.append(strong);
    }
    // any extra description text in the entry
    const extra = [...li.querySelectorAll('.date-entry__inner > p, .date-entry__desc')].map((e) => cleanText(e)).filter(Boolean);
    const body = [bodyP];
    extra.forEach((t) => { const p = document.createElement('p'); p.textContent = t; body.push(p); });
    cells.push([date ? [dateP] : '', body]);
  });

  // trailing note/link under the list (rare)
  [...element.children].forEach((c) => {
    if (c.matches('.date-list__header, .date-list__list, ul') || !cleanText(c)) return;
    const p = document.createElement('p');
    p.innerHTML = c.innerHTML.trim();
    cells.push([[p]]);
  });

  if (!cells.length || (cells.length === 1 && header.length)) {
    // header only (no entries, no marker): keep the heading as default content
    if (header.length) { element.replaceWith(...header); return; }
    element.replaceWith(...element.childNodes);
    return;
  }

  // `variants` keeps the hyphen (header renders as "Timeline (key-dates)").
  const block = WebImporter.Blocks.createBlock(document, { name: 'Timeline', variants: ['key-dates'], cells });
  element.replaceWith(block);
}
