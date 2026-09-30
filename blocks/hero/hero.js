/*
 * Hero block
 * Cells: an image-only cell (optional) is the media; the first text cell is the main
 * content (optional eyebrow paragraph before the heading, heading, text, CTA links);
 * a second text cell is an aside panel (used by the `aside` option).
 * Options: split, split-light (content beside image), aside (heading + side panel),
 * overlay (image background with centred heading). Default: solid band; an image, if
 * present, is used as the background.
 * `hero-page-header` is added when the main heading is an h1: split then renders as a
 * full-bleed page header (image on the right edge) instead of an in-content feature.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = ['split', 'split-light', 'aside', 'overlay'];

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const cells = [...block.querySelectorAll(':scope > div > div')];

  let media = null;
  const textCells = [];
  cells.forEach((cell) => {
    const pic = cell.querySelector('picture');
    if (pic && cell.textContent.trim() === '' && !media) {
      media = cell;
    } else if (pic && cell.textContent.trim() === '') {
      cell.remove();
    } else if (cell.textContent.trim() || cell.children.length) {
      // an image mixed into text content is lifted out as the media
      if (pic && !media) {
        media = document.createElement('div');
        media.append(pic.closest('p') && pic.closest('p').textContent.trim() === '' ? pic.closest('p') : pic);
      }
      textCells.push(cell);
    }
  });

  const content = document.createElement('div');
  content.className = 'hero-content';
  const main = textCells[0] || document.createElement('div');
  main.className = 'hero-main';
  content.append(main);

  if (textCells[1]) {
    const aside = textCells[1];
    aside.className = 'hero-aside';
    content.append(aside);
    block.classList.add('hero-has-aside');
  }
  textCells.slice(2).forEach((extra) => main.append(...extra.childNodes));

  // eyebrow: short paragraph(s) placed before the main heading
  const heading = main.querySelector('h1, h2');
  // a hero whose main heading is the page h1 is a page header (full-bleed layout)
  if (heading && heading.tagName === 'H1') block.classList.add('hero-page-header');
  if (heading) {
    let prev = heading.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'P' && !prev.querySelector('a, picture')) prev.classList.add('hero-eyebrow');
      prev = prev.previousElementSibling;
    }
  }

  block.replaceChildren();
  if (media) {
    media.className = 'hero-media';
    media.querySelectorAll('img').forEach((img) => {
      img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]));
    });
    block.append(media);
    block.classList.add('hero-has-media');
  }
  block.append(content);

  if (!active.length && media) block.classList.add('hero-background');
}
