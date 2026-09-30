/*
 * Quote block (testimonial)
 * Cells: a text cell with an optional heading (name), the quotation and an optional
 * attribution (a final paragraph starting with an em dash or "-", the dash is dropped on
 * render); an optional image-only cell, shown as a square portrait below the text.
 * Option `profile`: a collapsed profile — an eyebrow paragraph, the name heading and a
 * "Read more" toggle that reveals the remaining content (quote, bio, links); an image
 * cell sits beside the text on desktop.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = ['profile'];
let instance = 0;

function buildProfile(block, text) {
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

  text.replaceChildren(summary);
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
  text.append(toggle, details);
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const cells = [...block.querySelectorAll(':scope > div > div')];

  const text = document.createElement('div');
  text.className = 'quote-text';
  let media = null;

  cells.forEach((cell) => {
    const pic = cell.querySelector('picture');
    if (pic && !cell.textContent.trim()) {
      if (!media) {
        media = document.createElement('div');
        media.className = 'quote-media';
        media.append(pic);
      }
    } else {
      text.append(...cell.children);
    }
  });

  // attribution line
  const last = text.lastElementChild;
  if (last && last.tagName === 'P' && /^(—|–|-)\s*/.test(last.textContent.trim())) {
    last.classList.add('quote-attribution');
  }

  if (media) {
    media.querySelectorAll('img').forEach((img) => {
      img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
    });
  }

  if (active.includes('profile')) {
    buildProfile(block, text);
  } else {
    // the leading dash only marks the attribution for authors; the design shows the name alone
    const attribution = text.querySelector('.quote-attribution');
    const walker = attribution && document.createTreeWalker(attribution, NodeFilter.SHOW_TEXT);
    let node = walker && walker.nextNode();
    while (node && !node.textContent.trim()) node = walker.nextNode();
    if (node) node.textContent = node.textContent.replace(/^\s*(—|–|-)\s*/, '');

    // wrap quotation paragraphs (everything after the heading, before attribution)
    const quote = document.createElement('blockquote');
    [...text.children].forEach((el) => {
      if (/^H[1-6]$/.test(el.tagName) || el.classList.contains('quote-attribution')) return;
      if (el.tagName === 'P' || el.tagName === 'UL' || el.tagName === 'OL') {
        if (!quote.parentElement) el.before(quote);
        quote.append(el);
      }
    });
  }

  block.replaceChildren(text);
  if (media) {
    block.append(media);
    block.classList.add('quote-has-media');
  }
}
