/*
 * Accordion block
 * Rows: [question | answer]. An optional first row with a single cell (or an empty
 * second cell) is treated as the intro (heading, text, links) shown beside the items.
 * Answers can contain nested blocks (e.g. a table), which are decorated and loaded here.
 */

import { decorateBlock, loadBlock } from '../../scripts/aem.js';

/**
 * Nested blocks authored inside an item body (e.g. a table in an answer) are not reached
 * by the page-level decorateBlocks, so decorate and load them here. Each gets its own
 * wrapper so the `<name>-wrapper` class lands on that wrapper, not on the item body.
 */
async function loadNestedBlocks(container) {
  const nested = [...container.querySelectorAll(':scope > div[class]:not([data-block-status])')];
  await Promise.all(nested.map((nestedBlock) => {
    const wrapper = document.createElement('div');
    nestedBlock.replaceWith(wrapper);
    wrapper.append(nestedBlock);
    decorateBlock(nestedBlock);
    return loadBlock(nestedBlock);
  }));
}

function isIntroRow(row) {
  const cells = [...row.children];
  if (cells.length === 1) return true;
  return cells.length > 1 && !cells.slice(1).some((c) => c.textContent.trim() || c.querySelector('img, picture'));
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

    const content = body || document.createElement('div');
    content.className = 'accordion-item-body';

    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, content);
    items.append(details);
    row.remove();
  });

  block.append(items);
  if (block.querySelector(':scope > .accordion-intro')) block.classList.add('accordion-has-intro');
  await Promise.all([...items.querySelectorAll(':scope > .accordion-item > .accordion-item-body')]
    .map(loadNestedBlocks));
}
