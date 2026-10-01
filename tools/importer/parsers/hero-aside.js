/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-aside. Base: hero (option: aside). Authored as "Hero (aside)".
 * Source: course-detail template, majors (https://study.unimelb.edu.au/find/courses/major/physics).
 *
 * Output follows the PROJECT hero block (blocks/hero/README.md + hero.js), not the generic library
 * hero: the `aside` option takes 1 row with 2 text cells and no image.
 *   cell 1 = main: the title band content (h2 "Major overview" + any following text)
 *   cell 2 = aside: <p>Available in these courses</p> + <ul> of parent-course links
 *            + each .qual-actions a.btn in its own <p>; the first one wrapped in <strong>
 *            (primary/cyan), later ones in <em> when .btn--secondary.
 *
 * Source (verified in block-context/hero-aside/source.html):
 *   #page-title.course-section--title > .section__inner >
 *     .course-section__main > h2#page-subheader
 *     .course-section__aside .at-a-glance >
 *       .parent-courses > p.parent-courses__title, a.btn[data-test=parent-courses-link] (one per course)
 *       .qual-actions .grid > .cell > a.btn
 * The push-icon arrows are removed by the course cleanup transformer (data-URI svg imgs).
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function link(a, document) {
  const out = document.createElement('a');
  out.href = (a.getAttribute('href') || '').trim();
  out.textContent = cleanText(a);
  return out;
}

export default function parse(element, { document }) {
  const main = element.querySelector('.course-section__main') || element;
  const aside = element.querySelector('.course-section__aside, .at-a-glance');

  // --- cell 1: title band main column (heading + any text) ---
  const mainCell = [];
  [...main.children].forEach((child) => {
    if (!cleanText(child) && !child.querySelector('img')) return;
    if (/^H[1-6]$/.test(child.tagName)) {
      const h = document.createElement(child.tagName.toLowerCase());
      h.textContent = cleanText(child);
      mainCell.push(h);
    } else {
      mainCell.push(child);
    }
  });

  // --- cell 2: aside panel ---
  const asideCell = [];
  if (aside) {
    const title = aside.querySelector('.parent-courses__title, [data-test="parent-courses-title"]');
    if (cleanText(title)) {
      const p = document.createElement('p');
      p.textContent = cleanText(title);
      asideCell.push(p);
    }
    const courses = [...aside.querySelectorAll('.parent-courses a[href], a[data-test="parent-courses-link"]')]
      .filter((a, i, all) => all.indexOf(a) === i && cleanText(a));
    if (courses.length) {
      const ul = document.createElement('ul');
      courses.forEach((a) => {
        const li = document.createElement('li');
        li.append(link(a, document));
        ul.append(li);
      });
      asideCell.push(ul);
    }
    const actions = [...aside.querySelectorAll('.qual-actions a[href], .quals-actions--padded a[href]')]
      .filter((a, i, all) => all.indexOf(a) === i && cleanText(a) && !courses.includes(a));
    actions.forEach((a, i) => {
      const p = document.createElement('p');
      const l = link(a, document);
      if (i === 0) {
        const strong = document.createElement('strong');
        strong.append(l);
        p.append(strong);
      } else if (/btn--secondary/.test(a.className)) {
        const em = document.createElement('em');
        em.append(l);
        p.append(em);
      } else {
        p.append(l);
      }
      asideCell.push(p);
    });
  }

  if (!mainCell.length && !asideCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = [mainCell];
  if (asideCell.length) row.push(asideCell);
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (aside)', cells: [row] });
  element.replaceWith(block);
}
