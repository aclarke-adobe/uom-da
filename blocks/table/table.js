/*
 * Table block
 * Each row becomes a table row, each cell a table cell. The first row is used as the
 * header when every non-empty cell in it is only a heading, bold text or a short label
 * (and more rows follow). Cells may contain rich content (lists, links, images).
 * Narrow screens scroll the table sideways inside the block; the scroll container
 * becomes a focusable, labelled region only while it actually overflows.
 */

function isHeaderRow(row, rowCount) {
  if (rowCount < 2) return false;
  const cells = [...row.children].filter((c) => c.textContent.trim());
  if (!cells.length) return false;
  return cells.every((cell) => {
    const els = [...cell.children];
    if (!els.length) return cell.textContent.trim().length <= 60;
    const onlyText = els.length === 1
      && cell.textContent.trim() === els[0].textContent.trim();
    return onlyText && (/^H[1-6]$/.test(els[0].tagName)
      || /^(STRONG|B)$/.test(els[0].tagName)
      || (els[0].tagName === 'P' && els[0].children.length === 1
        && /^(STRONG|B)$/.test(els[0].firstElementChild.tagName)
        && els[0].textContent.trim() === els[0].firstElementChild.textContent.trim())
      || (els[0].tagName === 'P' && !els[0].children.length && els[0].textContent.trim().length <= 60));
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const table = document.createElement('table');
  const hasHeader = isHeaderRow(rows[0], rows.length);

  if (hasHeader) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    [...rows[0].children].forEach((cell) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.append(...cell.childNodes);
      tr.append(th);
    });
    thead.append(tr);
    table.append(thead);
    block.classList.add('table-has-header');
  }

  const tbody = document.createElement('tbody');
  rows.slice(hasHeader ? 1 : 0).forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement('td');
      td.append(...cell.childNodes);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);

  const cols = Math.max(...rows.map((r) => r.children.length));
  block.classList.add(`table-${cols}-cols`);

  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  wrapper.append(table);
  block.replaceChildren(wrapper);

  // keyboard users can scroll an overflowing table; non-overflowing ones stay out of the tab order
  const caption = table.querySelector('th')?.textContent.trim();
  const syncScrollable = () => {
    if (wrapper.scrollWidth > wrapper.clientWidth + 1) {
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', caption ? `Table: ${caption}` : 'Table');
    } else {
      wrapper.removeAttribute('tabindex');
      wrapper.removeAttribute('role');
      wrapper.removeAttribute('aria-label');
    }
  };
  if (window.ResizeObserver) new ResizeObserver(syncScrollable).observe(wrapper);
}
