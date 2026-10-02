/*
 * Quote block (testimonial)
 * Cells: a text cell with an optional heading (name), the quotation and an optional
 * attribution (a final paragraph starting with an em dash or "-", the dash is dropped on
 * render); an optional image-only cell, shown as a square portrait below the text.
 * A quotation that already starts with a quotation mark gets `quote-marked` (no generated
 * marks).
 * An attribution followed by one more paragraph (a course or role line) makes a card
 * (`quote-card`, line gets `quote-subcite`); its portrait sits beside the text on desktop,
 * on the side of its cell (image cell first = left, otherwise right).
 * A card with authored quotation marks is the profile card (role, name, rule, quotation).
 * Option `profile`: a collapsed profile — a header row with the image, an eyebrow
 * paragraph, the name heading and a "Read more" toggle; the toggle reveals a full-width
 * panel with the remaining content. When that content ends with an attribution, the
 * paragraphs before it render as a quotation.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = ['profile'];
const BLOCK_TAGS = /^(P|H[1-6]|UL|OL|DIV|BLOCKQUOTE|PICTURE|TABLE|HR)$/;
const DASH = /^(—|–|-)\s*/;
const QUOTE_MARK = /^["“”‘’„«]/;
let instance = 0;

function buildProfile(block, text, media) {
  instance += 1;
  const heading = text.querySelector('h1, h2, h3, h4, h5, h6');
  const summary = document.createElement('div');
  summary.className = 'quote-profile-summary';
  const details = document.createElement('div');
  details.className = 'quote-profile-details';
  details.id = `quote-profile-${instance}`;

  let pastHeading = !heading;
  [...text.children].forEach((el) => {
    if (!pastHeading) {
      if (el !== heading && el.tagName === 'P') el.classList.add('quote-eyebrow');
      summary.append(el);
      if (el === heading) pastHeading = true;
    } else {
      details.append(el);
    }
  });

  // a closing attribution turns the paragraphs before it into a quotation
  const attribution = details.querySelector(':scope > .quote-attribution:last-child');
  if (attribution) {
    const quote = document.createElement('blockquote');
    [...details.children].forEach((el) => {
      if (el.tagName !== 'P' || el === attribution) return;
      if (!quote.parentElement) el.before(quote);
      quote.append(el);
    });
    if (quote.parentElement) quote.append(attribution);
  }

  const header = document.createElement('div');
  header.className = 'quote-profile-header';
  if (media) header.append(media);
  header.append(text);
  text.replaceChildren(summary);
  block.replaceChildren(header);
  if (!details.children.length) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'quote-profile-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', details.id);
  toggle.textContent = 'Read more';
  details.hidden = true;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    toggle.textContent = open ? 'Read less' : 'Read more';
    details.hidden = !open;
    block.classList.toggle('quote-open', open);
  });
  text.append(toggle);
  block.append(details);
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const cells = [...block.querySelectorAll(':scope > div > div')];

  const text = document.createElement('div');
  text.className = 'quote-text';
  let media = null;
  let mediaFirst = false;

  cells.forEach((cell) => {
    const pic = cell.querySelector('picture');
    if (pic && !cell.textContent.trim()) {
      if (!media) {
        media = document.createElement('div');
        media.className = 'quote-media';
        media.append(pic);
        mediaFirst = !text.children.length;
      }
    } else if (![...cell.children].some((el) => BLOCK_TAGS.test(el.tagName))) {
      // bare text (or inline-only) cell
      if (cell.textContent.trim()) {
        const p = document.createElement('p');
        p.append(...cell.childNodes);
        text.append(p);
      }
    } else {
      text.append(...cell.children);
    }
  });

  // attribution line
  const last = text.lastElementChild;
  if (last && last.tagName === 'P' && DASH.test(last.textContent.trim())) {
    last.classList.add('quote-attribution');
  } else if (!active.includes('profile') && last && last.tagName === 'P') {
    // card: the attribution is followed by a single course / role line
    const name = last.previousElementSibling;
    if (name && name.tagName === 'P' && DASH.test(name.textContent.trim())) {
      name.classList.add('quote-attribution');
      last.classList.add('quote-subcite');
      block.classList.add('quote-card');
    }
  }

  if (media) {
    media.querySelectorAll('img').forEach((img) => {
      img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
    });
    block.classList.add('quote-has-media');
  }

  if (active.includes('profile')) {
    buildProfile(block, text, media);
    return;
  }

  // the leading dash only marks the attribution for authors; the design shows the name alone
  const attribution = text.querySelector('.quote-attribution');
  const walker = attribution && document.createTreeWalker(attribution, NodeFilter.SHOW_TEXT);
  let node = walker && walker.nextNode();
  while (node && !node.textContent.trim()) node = walker.nextNode();
  if (node) node.textContent = node.textContent.replace(/^\s*(—|–|-)\s*/, '');

  // wrap quotation paragraphs (everything after the heading, before attribution)
  const quote = document.createElement('blockquote');
  [...text.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName) || el.matches('.quote-attribution, .quote-subcite')) return;
    if (el.tagName === 'P' || el.tagName === 'UL' || el.tagName === 'OL') {
      if (!quote.parentElement) el.before(quote);
      quote.append(el);
    }
  });
  // authored quotation marks replace the generated ones
  if (QUOTE_MARK.test(quote.textContent.trim())) block.classList.add('quote-marked');

  block.replaceChildren(text);
  // a card keeps the authored side of its portrait; other quotes show it below the text
  if (media && mediaFirst && block.classList.contains('quote-card')) block.prepend(media);
  else if (media) block.append(media);
}
