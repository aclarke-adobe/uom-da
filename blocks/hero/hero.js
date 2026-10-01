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
 * `hero-course` replaces it when the h1 is followed by a list of stat links (course and
 * major pages): level tag / h1 / stat links / "Course code" line, image on the right 30%.
 * The aside option splits its panel into the course list and the trailing CTA links.
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
  // course header: h1 followed by a list of stat links (and an optional "Course code" line)
  const mainChildren = [...main.children];
  const isCourse = heading && heading.tagName === 'H1'
    && mainChildren.slice(mainChildren.indexOf(heading) + 1).some((el) => el.tagName === 'UL');
  if (isCourse) {
    block.classList.add('hero-course');
  } else if (heading && heading.tagName === 'H1') {
    // a hero whose main heading is the page h1 is a page header (full-bleed layout)
    block.classList.add('hero-page-header');
  }
  if (heading) {
    let prev = heading.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'P' && !prev.querySelector('a, picture')) {
        prev.classList.add('hero-eyebrow');
      } else if (isCourse && prev.tagName === 'P' && !prev.querySelector('picture')
        && prev.querySelectorAll('a').length === 1
        && prev.textContent.trim() === prev.querySelector('a').textContent.trim()) {
        // course level link (e.g. "Undergraduate") is shown as an outlined tag
        prev.classList.add('hero-eyebrow', 'hero-eyebrow-tag');
      }
      prev = prev.previousElementSibling;
    }
  }

  if (isCourse) {
    [...main.children].forEach((el) => {
      if (el.tagName === 'UL') {
        el.classList.add('hero-stats');
        el.querySelectorAll(':scope > li > a').forEach((a) => {
          const text = document.createElement('span');
          text.className = 'hero-stat-text';
          text.append(...a.childNodes);
          a.append(text);
          try {
            if (new URL(a.href, window.location).host !== window.location.host) a.classList.add('hero-stat-external');
          } catch { /* relative or malformed href: treat as internal */ }
        });
      } else if (el.tagName === 'P' && /code\s*:/i.test(el.textContent)) {
        el.classList.add('hero-codes');
      }
    });
  }

  // aside panel: list of parent courses (upper, dark) and the CTA links below it (lower, grey)
  if (active.includes('aside') && textCells[1]) {
    const aside = textCells[1];
    const actions = [];
    let last = aside.lastElementChild;
    while (last && last.tagName === 'P' && last.querySelector('a')
      && last.textContent.trim() === [...last.querySelectorAll('a')].map((a) => a.textContent).join('').trim()) {
      actions.unshift(last);
      last = last.previousElementSibling;
    }
    const courses = document.createElement('div');
    courses.className = 'hero-aside-courses';
    courses.append(...[...aside.children].filter((el) => !actions.includes(el)));
    const list = courses.querySelector(':scope > ul');
    if (list) list.classList.add('hero-aside-links');
    const first = courses.firstElementChild;
    if (first && first.tagName === 'P') first.classList.add('hero-aside-title');
    aside.replaceChildren();
    if (courses.children.length) aside.append(courses);
    if (actions.length) {
      const actionWrap = document.createElement('div');
      actionWrap.className = 'hero-aside-actions';
      actionWrap.append(...actions);
      aside.append(actionWrap);
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
