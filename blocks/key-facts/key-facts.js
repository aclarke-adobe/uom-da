/*
 * Key facts block (course key-facts panel)
 * Rows with two cells are facts: [label (optionally with an :icon: or image) | value].
 * Rows with a single cell are actions (CTA links such as Save / How to apply / Enquire).
 */

export default function decorate(block) {
  const facts = document.createElement('dl');
  facts.className = 'key-facts-list';
  const actions = document.createElement('div');
  actions.className = 'key-facts-actions';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2 && cells[0].textContent.trim()) {
      const item = document.createElement('div');
      item.className = 'key-facts-item';
      const dt = document.createElement('dt');
      dt.className = 'key-facts-label';
      const icon = cells[0].querySelector('.icon, picture');
      if (icon) {
        icon.classList.add('key-facts-icon');
        dt.append(icon);
      }
      const labelText = document.createElement('span');
      labelText.textContent = cells[0].textContent.trim();
      dt.append(labelText);
      const dd = document.createElement('dd');
      dd.className = 'key-facts-value';
      cells.slice(1).forEach((cell) => dd.append(...cell.childNodes));
      item.append(dt, dd);
      facts.append(item);
    } else {
      cells.forEach((cell) => actions.append(...cell.childNodes));
    }
  });

  block.replaceChildren();
  if (facts.children.length) block.append(facts);
  if (actions.textContent.trim()) {
    actions.querySelectorAll('a').forEach((a) => {
      const p = a.closest('p');
      if (p && p.parentElement === actions) p.classList.add('key-facts-action');
    });
    block.append(actions);
    block.classList.add('key-facts-has-actions');
  }
}
