/*
 * Timeline block
 * One row per milestone: [date (optional; may hold a small label line + date line) |
 * description (optional heading + text/links)]. Rows with an empty date cell continue
 * the previous date.
 */

export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'timeline-list';

  [...block.children].forEach((row) => {
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

  block.replaceChildren(list);
}
