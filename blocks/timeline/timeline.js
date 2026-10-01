/*
 * Timeline block
 * One row per milestone: [date (optional; may hold a small label line + date line) |
 * description (optional heading + text/links)]. Rows with an empty date cell continue
 * the previous date.
 * Option key-dates: a card with an optional header row (a single first cell holding a small
 * label line and a heading, e.g. 'For domestic students' + 'Key dates'), then one
 * calendar-icon row per date with the description above the date. A header with only a title
 * (no label line) renders as a flat grey panel (.timeline-panel). A first row with no date is
 * a message (e.g. 'Applications now open').
 */

/** Splits a key-dates header cell into its label chip line(s) and title. */
function decorateHeader(cell) {
  cell.className = 'timeline-header';
  const parts = [...cell.children];
  const title = parts.find((el) => /^H[1-6]$/.test(el.tagName))
    || (parts.length > 1 ? parts[parts.length - 1] : null);
  if (title) title.classList.add('timeline-header-title');
  parts.slice(0, title ? parts.indexOf(title) : parts.length)
    .forEach((el) => el.classList.add('timeline-header-label'));
  return cell;
}

export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'timeline-list';

  const rows = [...block.children];
  let header = null;
  if (block.classList.contains('key-dates') && rows.length > 1
    && rows[0].children.length === 1 && rows[0].textContent.trim()) {
    header = decorateHeader(rows.shift().firstElementChild);
    // a header with only a title (no label chip) renders as the flat grey panel
    if (!header.querySelector('.timeline-header-label')) block.classList.add('timeline-panel');
  }

  rows.forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const [dateCell, ...bodyCells] = cells.length > 1 ? cells : [document.createElement('div'), ...cells];

    const item = document.createElement('li');
    item.className = 'timeline-item';

    const date = document.createElement('div');
    date.className = 'timeline-date';
    const dateParts = [...dateCell.children];
    if (dateParts.length > 1) {
      dateParts[0].classList.add('timeline-date-label');
      dateParts.slice(1).forEach((p) => p.classList.add('timeline-date-value'));
      date.append(...dateParts);
    } else if (dateCell.textContent.trim()) {
      const p = dateParts[0] || document.createElement('p');
      if (!dateParts[0]) p.textContent = dateCell.textContent.trim();
      p.classList.add('timeline-date-label');
      date.append(p);
    }
    if (!date.textContent.trim()) item.classList.add('timeline-item-continued');

    const body = document.createElement('div');
    body.className = 'timeline-body';
    bodyCells.forEach((cell) => body.append(...cell.childNodes));

    item.append(date, body);
    list.append(item);
  });

  block.replaceChildren(...(header ? [header] : []), list);
}
