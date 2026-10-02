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
function decorateTitle(body, tile) {
  const first = body.firstElementChild;
  if (!first) return;
  if (first.tagName === 'STRONG' && first.querySelector('a')) {
    const p = document.createElement('p');
    first.replaceWith(p);
    p.append(first);
  }
  const titleP = body.firstElementChild;
  // a bold-only opening paragraph followed by text is an unlinked title (feature tiles on navy)
  const boldOnly = titleP.tagName === 'P' && titleP.children.length === 1
    && titleP.firstElementChild.tagName === 'STRONG' && !titleP.querySelector('a')
    && titleP.textContent.trim() === titleP.firstElementChild.textContent.trim();
  if (tile && boldOnly && titleP.nextElementSibling) titleP.classList.add('cards-card-title');
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

const HEADING = 'H2 H3 H4 H5 H6';
const isHeading = (el) => !!el && HEADING.includes(el.tagName);
const slug = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Shape hooks for the section-landing card patterns, derived only from the authored
 * cells (and the section style), so the homepage / course shapes keep their look.
 * Each `cards-<shape>` class names one source component.
 */
function decorateShapes(block, ul, active) {
  const lis = [...ul.children];
  if (!lis.length) return;
  const section = block.closest('.section');
  const sectionHas = (c) => !!section && section.classList.contains(c);
  const body = (li) => li.querySelector(':scope > .cards-card-body');
  const first = (li) => body(li)?.firstElementChild || null;
  const all = (fn) => lis.every(fn);
  const add = (...c) => block.classList.add(...c);
  const hasImage = (li) => !!li.querySelector(':scope > .cards-card-image:not(.cards-card-icon)');
  const linkedHeading = (el) => isHeading(el) && el.classList.contains('cards-card-title');

  if (active.includes('tile')) {
    const textOnly = (li) => {
      const b = body(li);
      if (!b || !b.textContent.trim()) return false;
      return !b.children.length || (b.children.length === 1 && b.firstElementChild.tagName === 'P'
        && !b.firstElementChild.children.length);
    };
    if (all(hasImage)) {
      // pathfinder photo tiles: navy card, photo on top, centred white title (+ description)
      add('cards-tile-photo');
      if (lis.some((li) => body(li)?.querySelector(':scope > p:not(.cards-card-cta)'))) add('cards-tile-desc');
    } else if (all((li) => !hasImage(li) && (textOnly(li)
      || (linkedHeading(first(li)) && !body(li).querySelector('.cards-card-eyebrow'))))) {
      // pathfinder link tiles without a photo: centred navy boxes
      add('cards-tile-box');
      if (lis.some((li) => body(li)?.querySelector(':scope > p'))) add('cards-tile-desc');
    } else if (all((li) => isHeading(first(li)) && !first(li).classList.contains('cards-card-title'))) {
      // fee tiers / three-column text: plain heading over text, no rule
      add('cards-tile-text');
    } else if (all((li) => body(li)?.children.length === 1 && first(li).matches('p.cards-card-title'))
      && sectionHas('grey')) {
      // "personalised advice" to-do list: white link buttons beside an intro
      add('cards-tile-button');
    } else if (all((li) => first(li)?.matches('p.cards-card-title') && first(li).querySelector('a'))
      && sectionHas('navy') && block.parentElement?.parentElement === section
      && section.children.length === 1) {
      // focus-box pathfinder: two navy panels with an outlined button and a line of text
      add('cards-tile-panel');
    }
  }

  if (active.includes('people') && all((li) => first(li)?.tagName === 'H3')) {
    // short-course profile: portrait beside an h3 name, bold role and bio
    add('cards-people-profile');
    lis.forEach((li) => {
      const ps = body(li).querySelectorAll(':scope > p');
      if (ps.length > 1) ps[0].classList.add('cards-card-role');
    });
  }

  if (active.includes('icon')) {
    if (all((li) => hasImage(li) && !body(li))) add('cards-logos');
    else if (all((li) => hasImage(li) && body(li)
      && [...body(li).children].every((el) => el.tagName === 'A' || isActionParagraph(el)))) add('cards-docs');
    else if (block.classList.contains('cards-facts') && all((li) => first(li)?.tagName === 'H3')) add('cards-fact-tiles');
    else if (ul.querySelector('.cards-card-icon') && !section?.querySelector('.cards.tile')) {
      // line pictograms beside the text columns (the homepage feature panel keeps full-width art)
      add('cards-icon-inline');
    }
  }

  if (active.includes('stat') && all((li) => li.querySelectorAll('.cards-card-body').length === 1
    && first(li)?.classList.contains('cards-stat-value'))) {
    add('cards-stat-ranking');
  }

  if (active.includes('link-list')) {
    // sublink menus fill their three columns top to bottom
    ul.style.setProperty('--link-rows', Math.ceil(lis.length / 3));
  }

  if (active.includes('chips')) {
    lis.filter((li) => !li.classList.contains('cards-card-link')).forEach((li) => {
      const type = [...li.querySelectorAll('.cards-card-body > p')].find((p) => !p.querySelector('a'));
      if (type) {
        type.classList.add('cards-card-type');
        li.classList.add(`cards-chip-${slug(type.textContent)}`);
      }
    });
  }

  if (!active.length) {
    if (all((li) => linkedHeading(first(li)) && body(li).querySelector('.cards-card-cta'))) {
      // news / event listing: linked title, date line, excerpt, right-aligned links
      add('cards-news');
      lis.forEach((li) => {
        const b = body(li);
        const date = first(li).nextElementSibling;
        if (date?.tagName === 'P' && !date.querySelector('a') && /\d/.test(date.textContent)
          && date.textContent.trim().length < 60) date.classList.add('cards-card-date');
        // trailing link paragraphs stack at the bottom; a short label before them is a tag
        let el = b.lastElementChild;
        while (el && isActionParagraph(el) && el !== first(li)) {
          el.classList.add('cards-card-cta');
          el = el.previousElementSibling;
        }
        if (el && el.tagName === 'P' && !el.classList.contains('cards-card-date')
          && el.previousElementSibling?.tagName === 'P' && !el.previousElementSibling.classList.contains('cards-card-date')
          && el.textContent.trim().length < 40 && !/[.!?]$/.test(el.textContent.trim())) {
          el.classList.add('cards-card-tag');
        }
      });
    } else if (block.classList.contains('cards-profile') && all(hasImage)) {
      if (all((li) => linkedHeading(first(li)))) add('cards-staff');
      else if (all((li) => body(li)?.children.length === 1 && first(li).tagName === 'H3')) add('cards-listing');
    } else if (ul.querySelector('.cards-card-cta a.button')) {
      // feature panel: full-width button under each card
      add('cards-feature');
    }
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
    if (!chips) li.querySelectorAll('.cards-card-body').forEach((b) => decorateTitle(b, active.includes('tile')));

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
      // figure = the bold-only paragraph; paragraphs before it are the title, after it the label
      const stat = bodies[0];
      const parts = stat ? [...stat.children] : [];
      const valueIndex = parts.findIndex((el) => {
        const strong = el.querySelector('strong');
        return el.tagName === 'P' && strong && el.textContent.trim() === strong.textContent.trim();
      });
      if (valueIndex >= 0) {
        parts.forEach((el, i) => {
          if (i < valueIndex) el.classList.add('cards-stat-title');
          else if (i === valueIndex) el.classList.add('cards-stat-value');
          else el.classList.add('cards-stat-label');
        });
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

  // default cards without CTAs are profile cards (course alumni: white card, padded text);
  // icon cards without any pictogram are text-only fact cards (employment outcomes)
  if (!active.length && !ul.querySelector('.cards-card-cta')) block.classList.add('cards-profile');
  if (active.includes('icon') && !ul.querySelector('.cards-card-image')) block.classList.add('cards-facts');

  // column-count hook so 3 / 6 cards fill full rows instead of leaving an empty 4th track
  const count = ul.children.length;
  if (count % 4 === 0) block.classList.add('cards-cols-4');
  else if (count % 3 === 0) block.classList.add('cards-cols-3');
  else if (count === 2) block.classList.add('cards-cols-2');

  decorateShapes(block, ul, active);

  const width = smallImages ? '160' : '750';
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width }])));
  block.replaceChildren(ul);
}
