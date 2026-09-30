/*
 * Residency notice block
 * Each row is a panel section, separated by rules. In the first section, a short
 * heading/strong line followed by a link (e.g. "Domestic student  Change") is laid out
 * inline as the panel header.
 *
 * Audience-keyed rows: a row with two cells whose first cell is a short key (e.g.
 * "domestic", "international") only shows while that audience is selected by an
 * audience-switcher block on the page (listens for the `audience-change` event).
 */

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isKeyCell(cell) {
  const text = cell.textContent.trim();
  return text && text.length <= 30 && !cell.querySelector('a, picture, h1, h2, h3, h4, h5, h6, ul, ol')
    && cell.children.length <= 1;
}

function applyAudience(block, audience) {
  const sections = block.querySelectorAll('.residency-notice-section[data-audience]');
  if (!sections.length) return;
  const keys = [...sections].map((s) => s.dataset.audience);
  const current = keys.includes(audience) ? audience : keys[0];
  sections.forEach((s) => { s.hidden = s.dataset.audience !== current; });
}

export default function decorate(block) {
  const sections = [...block.children].map((row) => {
    const cells = [...row.children];
    const section = document.createElement('div');
    section.className = 'residency-notice-section';
    let contentCells = cells;
    if (cells.length >= 2 && isKeyCell(cells[0])) {
      section.dataset.audience = slugify(cells[0].textContent);
      contentCells = cells.slice(1);
    }
    contentCells.forEach((cell) => section.append(...cell.childNodes));
    return section;
  }).filter((s) => s.textContent.trim() || s.querySelector('picture, .icon'));

  sections.forEach((section) => {
    const first = section.firstElementChild;
    if (!first) return;
    // header line: title (icon + strong/heading) with an inline link such as "Change"
    if (/^(H[1-6]|P)$/.test(first.tagName) && first.textContent.trim().length <= 60) {
      first.classList.add('residency-notice-title');
      const next = first.nextElementSibling;
      if (next && next.tagName === 'P' && next.querySelectorAll('a').length === 1
        && next.textContent.trim() === next.querySelector('a').textContent.trim()
        && next.textContent.trim().length <= 20) {
        next.classList.add('residency-notice-change');
        next.querySelector('a').classList.remove('button');
        next.classList.remove('button-container');
        const header = document.createElement('div');
        header.className = 'residency-notice-header';
        first.before(header);
        header.append(first, next);
      }
    }
  });

  block.replaceChildren(...sections);

  applyAudience(block, document.body.dataset.audience);
  document.addEventListener('audience-change', (e) => applyAudience(block, e.detail.audience));
}
