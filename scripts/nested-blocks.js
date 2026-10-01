/*
 * Nested blocks
 * The delivery pipeline only turns top-level block tables into block divs. A block authored
 * inside another block's cell (e.g. an accordion in a tab panel, a table in an accordion
 * item) is delivered as a plain <table> whose first row is a single header cell naming the
 * block. This module converts those tables into standard block markup, then decorates and
 * loads them. It imports only from ./aem.js so blocks can use it without pulling in
 * scripts.js (which runs loadPage() on import).
 */

import { decorateBlock, loadBlock, toClassName } from './aem.js';

// "Accordion", "Table", "Cards (stat)", "Timeline (key dates)", "Columns (wide, dark)"
const BLOCK_NAME = /^[a-z][a-z0-9 _-]{0,39}(\s*\([a-z0-9 ,_-]{1,80}\))?$/i;

/**
 * Block class names for a header cell text, matching the pipeline's naming of top-level
 * blocks: the name before the last "(", then the comma-separated options inside it, each
 * passed through toClassName (so "Timeline (key dates)" becomes "timeline key-dates").
 * @param {string} text Header cell text
 * @returns {string[]} Class names, block name first
 */
function toBlockClassNames(text) {
  const idx = text.lastIndexOf('(');
  const names = idx >= 0
    ? [text.substring(0, idx), ...text.substring(idx + 1).replace(/\)\s*$/, '').split(',')]
    : [text];
  return names.map((name) => toClassName(name.trim())).filter(Boolean);
}

/**
 * Returns the block class names if the table's first row is a block header: one header
 * cell (a th, or any cell of a thead row) holding only a block-like name. Trailing empty
 * cells in that row are ignored (importers sometimes pad the header row to the table width).
 * @param {HTMLTableElement} table
 * @returns {string[]|null}
 */
function getBlockHeader(table) {
  const [first] = [...table.rows];
  if (!first || !first.cells.length) return null;
  const [cell, ...rest] = first.cells;
  const isHeader = cell.tagName === 'TH' || first.parentElement.tagName === 'THEAD';
  if (!isHeader || rest.some((c) => c.textContent.trim() || c.children.length)) return null;
  if (cell.querySelector('img, picture, a, ul, ol, table')) return null;
  const text = cell.textContent.replace(/\s+/g, ' ').trim();
  if (!BLOCK_NAME.test(text)) return null;
  const names = toBlockClassNames(text);
  return names.length ? names : null;
}

/**
 * Block-header tables in a container that are not inside another block-header table
 * (inner ones are handled when their parent block loads).
 * @param {Element} container
 * @returns {HTMLTableElement[]}
 */
function findBlockTables(container) {
  const candidates = [...container.querySelectorAll('table')].filter(getBlockHeader);
  return candidates.filter((t) => !candidates.some((o) => o !== t && o.contains(t)));
}

/**
 * Converts a block-header table into `<div class="name option…">` with one div per
 * remaining row and one div per cell (colspan cells become a single cell).
 * @param {HTMLTableElement} table
 * @returns {HTMLDivElement}
 */
function tableToBlock(table) {
  const block = document.createElement('div');
  block.classList.add(...getBlockHeader(table));
  [...table.rows].slice(1).forEach((tr) => {
    const row = document.createElement('div');
    [...tr.cells].forEach((td) => {
      const cell = document.createElement('div');
      cell.append(...td.childNodes);
      row.append(cell);
    });
    block.append(row);
  });
  return block;
}

/**
 * Wraps, decorates and loads a nested block, then converts any block tables inside it
 * that its own decoration did not handle (multi-level nesting for blocks that don't call
 * decorateNestedBlocks themselves).
 * @param {HTMLDivElement} block Undecorated block, already in the DOM
 */
async function loadNestedBlock(block) {
  const wrapper = document.createElement('div');
  block.replaceWith(wrapper);
  wrapper.append(block);
  // collect inner block tables before decoration, so tables a block renders itself
  // (e.g. the table block's own <table>) are never mistaken for nested blocks
  const inner = findBlockTables(block);
  decorateBlock(block);
  await loadBlock(block);
  const pending = inner.filter((t) => t.isConnected && block.contains(t));
  // eslint-disable-next-line no-use-before-define
  await Promise.all(pending.map((t) => convertAndLoad(t)));
}

async function convertAndLoad(table) {
  const block = tableToBlock(table);
  table.replaceWith(block);
  await loadNestedBlock(block);
}

/**
 * Decorates and loads blocks nested in a container (a tab panel, an accordion item body…):
 * block-header tables anywhere in it, plus already-built block divs that are direct
 * children. Each nested block gets its own `<name>-wrapper` div. Resolves once all
 * nested blocks (at every level) are loaded.
 * @param {Element} container
 */
// eslint-disable-next-line import/prefer-default-export
export async function decorateNestedBlocks(container) {
  const divBlocks = [...container.querySelectorAll(':scope > div[class]:not([data-block-status])')];
  const tables = findBlockTables(container);
  await Promise.all([
    ...divBlocks.map(loadNestedBlock),
    ...tables.map(convertAndLoad),
  ]);
}
