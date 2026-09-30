/*
 * Table block
 * Each row becomes a table row, each cell a table cell. The first row is used as the
 * header when every non-empty cell in it is only a heading, bold text or a short label
 * (and more rows follow). Cells may contain rich content (lists, links, images).
 * On small screens rows stack; header labels are repeated per cell via data-label.
 */

function isHeaderRow(row, rowCount) {
  if (rowCount < 2) return false;
  const cells = [...row.children].filter((c) => c.textContent.trim());
  if (!cells.length) return false;
  return cells.every((cell) => {
    const els = [...cell.children];
    if (!els.length) return cell.textContent.trim().length <= 60;
    return els.length === 1 && (/^H[1-6]$/.test(els[0].tagName)
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
  const labels = [];

  if (hasHeader) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    [...rows[0].children].forEach((cell) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.append(...cell.childNodes);
      labels.push(th.textContent.trim());
      tr.append(th);
    });
    thead.append(tr);
    table.append(thead);
    block.classList.add('table-has-header');
  }

  const tbody = document.createElement('tbody');
  rows.slice(hasHeader ? 1 : 0).forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell, i) => {
      const td = document.createElement('td');
      if (labels[i]) td.dataset.label = labels[i];
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
}
