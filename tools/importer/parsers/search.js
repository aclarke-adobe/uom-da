/* eslint-disable */
/* global WebImporter */
/**
 * Parser for search. Base: search (no options). Authored as "Search".
 * Source: https://study.unimelb.edu.au (homepage template).
 *
 * Output (blocks/search/README.md): 1 row, 1 cell
 *   cell 1 = a link whose href is the search results URL with an empty query param naming the
 *            input (https://study.unimelb.edu.au/find/?query=) and whose text is the placeholder.
 *   The optional button-label cell is intentionally omitted: the source submit button is icon-only
 *   (sr-only "Submit"); the decorator then renders an icon-only button with aria-label "Search".
 *
 * Source (form.inline-search, verified in block-context/search/source.html + live snapshot):
 *   form[action="/find/"] > .inline-search__row > input.inline-search__input[name="query"][placeholder]
 * The cleaned capture drops action/name/placeholder, so defaults mirror the live form.
 */
const DEFAULT_ORIGIN = 'https://study.unimelb.edu.au';
const DEFAULT_ACTION = '/find/';
const DEFAULT_PARAM = 'query';
const DEFAULT_PLACEHOLDER = 'Find a course, study area or major';

export default function parse(element, { document, params }) {
  const form = element.matches('form') ? element : element.querySelector('form');
  const input = (form || element).querySelector('input.inline-search__input, input[type="search"], input[type="text"], input:not([type="hidden"])');

  let origin = DEFAULT_ORIGIN;
  try {
    const src = params && params.originalURL;
    if (src) origin = new URL(src).origin;
  } catch (e) { /* keep default */ }

  const action = (form && form.getAttribute('action')) || DEFAULT_ACTION;
  let url;
  try {
    url = new URL(action, origin);
  } catch (e) {
    url = new URL(DEFAULT_ACTION, DEFAULT_ORIGIN);
  }

  // Hidden inputs become fixed query params; the text input names the empty query param.
  (form ? [...form.querySelectorAll('input[type="hidden"][name]')] : []).forEach((h) => {
    url.searchParams.set(h.getAttribute('name'), h.getAttribute('value') || '');
  });
  const param = (input && input.getAttribute('name')) || DEFAULT_PARAM;
  url.searchParams.set(param, '');

  const placeholder = (input && input.getAttribute('placeholder'))
    || (form && form.querySelector('label') && form.querySelector('label').textContent.trim())
    || DEFAULT_PLACEHOLDER;

  if (!form && !input) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const link = document.createElement('a');
  link.href = url.toString();
  link.textContent = placeholder;
  const p = document.createElement('p');
  p.append(link);

  // section-landing ct-coursesearch (.section-alt__row: .section-alt__left h2 | .section-alt__right form):
  // the heading goes in the cell above the search link. The homepage instance is the form itself.
  const left = element.querySelector(':scope > .section-alt__left');
  const heading = left && left.querySelector('h1, h2, h3, h4');
  const cell = [];
  if (heading && heading.textContent.trim()) {
    const h = document.createElement('h2');
    h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    cell.push(h);
  }
  cell.push(p);
  const cells = [cell];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Search', cells });
  element.replaceWith(block);
}
