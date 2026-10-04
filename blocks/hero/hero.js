/*
 * Hero block
 * Cells: an image-only cell (optional) is the media; the first text cell is the main
 * content (optional eyebrow paragraph before the heading, heading, text, CTA links);
 * a second text cell is an aside panel (used by the `aside` option).
 * Options: split, split-light (content beside image), aside (heading + side panel),
 * overlay (image background with centred heading). Default: solid band; an image, if
 * present, is used as the background.
 * `hero-page-header` is added when a split hero's main heading is an h1 (homepage): it
 * renders as a full-bleed page header (image on the right edge) instead of an in-content
 * feature. `hero-course` replaces it when the h1 is followed by a list of stat links
 * (course and major pages): level tag / h1 / stat links / "Course code" line, image on
 * the right 30%. `hero-banner` replaces it when a split hero is the only content of its
 * section (landing page header or feature banner): navy band, optional tag link, image
 * pinned to the right edge.
 * `hero-story` replaces `hero-banner` for a story article header: an h1-only banner on a
 * page that carries `Tags` metadata (only story articles do): navy half with the title
 * centred vertically beside a half-width image. `hero-search` replaces the page header
 * when a split h1 hero shares its section only with a Search block (study-level header,
 * e.g. graduate research): the search box moves into the text column.
 * The aside option splits its panel into the course list and the trailing CTA links;
 * with an h1 (`hero-menu`, how-to-apply menu header) it is a navy band with the panel
 * of arrow links beside the intro.
 * Overlay: centred title (and CTA) over the photo with a black scrim, `dark` doubles it.
 * Link-only paragraphs that are not buttons get `hero-link` (arrow links in split-light).
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
  // menu header: an aside hero whose heading is the page h1 (the course title band has an h2)
  const isMenu = active.includes('aside') && !!main.querySelector(':scope > h1');

  if (textCells[1]) {
    const aside = textCells[1];
    aside.className = 'hero-aside';
    content.append(aside);
    // the menu header (h1) keeps its panel in the band; hero-has-aside is the course
    // title band's overhanging panel, which course.css makes room for
    if (!isMenu) block.classList.add('hero-has-aside');
  }
  textCells.slice(2).forEach((extra) => main.append(...extra.childNodes));

  // eyebrow: short paragraph(s) placed before the main heading
  const heading = main.querySelector('h1, h2');
  // course header: h1 followed by a list of stat links (and an optional "Course code" line)
  const mainChildren = [...main.children];
  const isCourse = heading && heading.tagName === 'H1'
    && mainChildren.slice(mainChildren.indexOf(heading) + 1).some((el) => el.tagName === 'UL');
  // landing banner: a split hero that is the only content of its section (landing page
  // header, or a later feature banner with an h2); the homepage header shares its
  // section with the search and the homepage feature with its cards
  const section = block.closest('.section');
  const isBanner = !isCourse && active.includes('split') && section
    && [...section.children].every((el) => el === block.parentElement);
  // story article header: the banner holds nothing but its h1, and the page has tags
  // (the meta name keeps the authored case on some pipelines, hence the `i` flag)
  const tags = document.head.querySelector('meta[name="tags" i]');
  const isStory = isBanner && heading && heading.tagName === 'H1'
    && main.children.length === 1 && !!tags && tags.content.trim() !== '';
  // study-level header: the section holds this hero and a search box only
  const siblings = section ? [...section.children].filter((el) => el !== block.parentElement) : [];
  const searchBlock = !isCourse && active.includes('split') && heading && heading.tagName === 'H1'
    && siblings.length === 1 && siblings[0].matches('.search-wrapper')
    ? siblings[0].querySelector(':scope > .search') : null;
  if (isCourse) {
    block.classList.add('hero-course');
  } else if (isStory) {
    block.classList.add('hero-story');
  } else if (isBanner) {
    block.classList.add('hero-banner');
  } else if (searchBlock) {
    block.classList.add('hero-search');
    const wrapper = searchBlock.parentElement;
    main.append(searchBlock);
    wrapper.remove();
  } else if (active.includes('split') && heading && heading.tagName === 'H1') {
    // a split hero whose main heading is the page h1 is the homepage page header
    block.classList.add('hero-page-header');
  }
  if (isMenu) block.classList.add('hero-menu');
  const tagEyebrows = isCourse || isBanner;
  if (heading) {
    let prev = heading.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'P' && !prev.querySelector('a, picture')) {
        prev.classList.add('hero-eyebrow');
      } else if (tagEyebrows && prev.tagName === 'P' && !prev.querySelector('picture')
        && prev.querySelectorAll('a').length === 1
        && prev.textContent.trim() === prev.querySelector('a').textContent.trim()) {
        // course level link (e.g. "Undergraduate") is shown as an outlined tag
        prev.classList.add('hero-eyebrow', 'hero-eyebrow-tag');
      }
      prev = prev.previousElementSibling;
    }
  }

  [...main.children].forEach((el) => {
    const links = el.tagName === 'P' && !el.classList.contains('button-wrapper')
      && !el.classList.contains('hero-eyebrow') ? el.querySelectorAll('a') : [];
    if (links.length === 1 && el.textContent.trim() === links[0].textContent.trim()) {
      el.classList.add('hero-link');
    }
  });

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
