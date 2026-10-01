import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

const OPTION_CLASSES = ['tile', 'icon', 'link-list', 'course-link', 'people', 'stat', 'chips'];

function isActionParagraph(el) {
  if (el.tagName !== 'P') return false;
  const links = el.querySelectorAll('a');
  return links.length > 0 && el.textContent.trim() === [...links].map((a) => a.textContent).join('').trim();
}

/**
 * True when the cell holds nothing but a single icon (`:icon-name:` authored, rendered by
 * decorateIcons as <span class="icon icon-name"><img></span>), optionally wrapped in a <p>.
 * Unprocessed `:icon-name:` text is first turned into that icon markup.
 */
function resolveIconCell(div) {
  // `:icon-name:` left as text (unprocessed HTML, e.g. imported content previewed locally)
  const notation = div.textContent.trim().match(/^:([a-z0-9-]+):$/);
  if (notation && ![...div.querySelectorAll('*')].some((el) => el.tagName !== 'P')) {
    const span = document.createElement('span');
    span.className = `icon icon-${notation[1]}`;
    div.replaceChildren(span);
    decorateIcons(div);
  }
  const icons = div.querySelectorAll('span.icon');
  if (icons.length !== 1 || div.textContent.trim()) return false;
  const icon = icons[0];
  return [...div.querySelectorAll('*')].every((el) => el === icon
    || icon.contains(el)
    || (el.tagName === 'P' && el.contains(icon)));
}

/**
 * A bold link that opens a card body (`**[Title](url)**`, optionally followed by text) is the
 * card title, not a CTA. decorateButtons has already turned it into a `.button`, so undo that
 * and keep the authored bold. A bare `<strong><a>` (no paragraph) is wrapped in one.
 */
function decorateTitle(body) {
  const first = body.firstElementChild;
  if (!first) return;
  if (first.tagName === 'STRONG' && first.querySelector('a')) {
    const p = document.createElement('p');
    first.replaceWith(p);
    p.append(first);
  }
  const titleP = body.firstElementChild;
  const link = titleP.tagName === 'P' ? titleP.querySelector(':scope > a.button, :scope > strong > a') : null;
  if (link && isActionParagraph(titleP) && titleP.querySelectorAll('a').length === 1) {
    const bold = link.classList.contains('button') && !link.classList.contains('secondary');
    if (bold || link.parentElement.tagName === 'STRONG') {
      link.classList.remove('button', 'primary', 'accent');
      if (!link.className) link.removeAttribute('class');
      titleP.classList.remove('button-wrapper');
      if (!titleP.className) titleP.removeAttribute('class');
      if (link.parentElement === titleP) {
        const strong = document.createElement('strong');
        link.replaceWith(strong);
        strong.append(link);
      }
      titleP.classList.add('cards-card-title');
    }
  }

  // heading that is just a link (e.g. `### [Title](url)`) is also a linked title
  body.querySelectorAll(':scope > :is(h2, h3, h4, h5, h6)').forEach((h) => {
    const links = h.querySelectorAll('a');
    if (links.length === 1 && h.textContent.trim() === links[0].textContent.trim()) {
      h.classList.add('cards-card-title');
    }
  });

  // eyebrow: short link-free paragraph(s) placed before the heading / title
  const heading = body.querySelector(':scope > :is(h2, h3, h4, h5, h6), :scope > .cards-card-title');
  let prev = heading ? heading.previousElementSibling : null;
  while (prev) {
    if (prev.tagName === 'P' && !prev.querySelector('a, picture, .icon')) prev.classList.add('cards-card-eyebrow');
    prev = prev.previousElementSibling;
  }
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  // icon pictograms render at card width, so only stat images are small
  const smallImages = active.includes('stat');
  const chips = ['course-link', 'link-list', 'chips'].some((c) => active.includes(c));

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else if (resolveIconCell(div)) div.className = 'cards-card-image cards-card-icon';
      else div.className = 'cards-card-body';
    });

    // title link (bold link / linked heading) and eyebrow; chip/list links stay plain links
    if (!chips) li.querySelectorAll('.cards-card-body').forEach(decorateTitle);

    // trailing CTA-only paragraphs are pinned to the bottom of the card
    li.querySelectorAll('.cards-card-body').forEach((body) => {
      const last = body.lastElementChild;
      if (last && last !== body.firstElementChild && isActionParagraph(last)
        && !last.classList.contains('cards-card-title')) {
        last.classList.add('cards-card-cta');
      }
    });

    if (active.includes('stat')) {
      // first text cell holds the figure + label, following cells the description
      const bodies = li.querySelectorAll('.cards-card-body');
      if (bodies.length > 1) {
        bodies[0].classList.add('cards-card-stat');
        [...bodies].slice(1).forEach((b) => b.classList.add('cards-card-desc'));
      }
    }

    if (chips) {
      const links = li.querySelectorAll('a');
      if (links.length === 1 && li.textContent.trim() === links[0].textContent.trim()) {
        li.classList.add('cards-card-link');
      }
    }

    if (li.children.length) ul.append(li);
  });

  // column-count hook so 3 / 6 cards fill full rows instead of leaving an empty 4th track
  const count = ul.children.length;
  if (count % 4 === 0) block.classList.add('cards-cols-4');
  else if (count % 3 === 0) block.classList.add('cards-cols-3');

  const width = smallImages ? '160' : '750';
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width }])));
  block.replaceChildren(ul);
}
