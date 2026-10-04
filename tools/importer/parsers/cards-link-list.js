/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-link-list. Base: cards (option: link-list). Authored as "Cards (link-list)".
 * Source: section-landing template, professional-development category sublink menus
 * (div.section__inner:has(> div.grid .sublink-menu) > div.grid; 8 PD category pages + cost-of-living).
 *
 * Output (blocks/cards/README.md, cards.js `link-list`): one row per link, 1 cell:
 *   <p><a href="…">{label}</a></p>
 * The per-box colour (sublink-menu--blue/green/red) is not authorable and is lost (mapping-notes).
 *
 * Source (verified in block-context/cards-link-list/instances/section-landing-01.html):
 *   div.grid > .cell > .sublink-menu > nav > .sublink-menu__item > a.sublink-menu__link > div (label) + img (arrow)
 * Iteration is keyed on .sublink-menu__item (block wrapper), not on the anchors.
 */

function clean(t) {
  return (t || '').replace(/​/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Titled sublink menus (story-article languages / how-to-apply pages; the landing PD menus have no
 * title / description): one card per grid cell, in source order, 1 cell (the library "no images"
 * card):
 *   sublink box: <h3>{.sublink-menu__title}</h3><p>{.sublink-menu__description, links kept}</p>
 *                + one <p><a>{label}</a></p> per .sublink-menu__item
 *   other cell (e.g. the "Not sure if you're considered domestic or international?" icon card):
 *                its headings / paragraphs / links; on story-article the card-rounded-figure icon
 *                is kept as the first paragraph (<p><img></p>), elsewhere it is dropped
 */
function cleanInline(el, tag, document) {
  const out = document.createElement(tag);
  out.innerHTML = el.innerHTML.trim();
  out.querySelectorAll('*').forEach((c) => [...c.attributes].forEach((at) => { if (at.name !== 'href') c.removeAttribute(at.name); }));
  out.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', a.getAttribute('href').trim()));
  return out;
}

function linkPara(a, label, document) {
  const p = document.createElement('p');
  const link = document.createElement('a');
  link.href = a.getAttribute('href').trim();
  link.textContent = label;
  p.append(link);
  return p;
}

function menuCell(menu, document) {
  const cell = [];
  const title = clean((menu.querySelector('.sublink-menu__title') || {}).textContent);
  if (title) { const h = document.createElement('h3'); h.textContent = title; cell.push(h); }
  menu.querySelectorAll('.sublink-menu__description').forEach((d) => {
    if (clean(d.textContent)) cell.push(cleanInline(d, 'p', document));
  });
  menu.querySelectorAll('.sublink-menu__item').forEach((item) => {
    const a = item.querySelector('a[href]');
    const label = clean((item.querySelector('a > div, a > span') || a || item).textContent);
    if (!label) return;
    if (a) cell.push(linkPara(a, label, document));
    else { const p = document.createElement('p'); p.textContent = label; cell.push(p); }
  });
  return cell;
}

// placeholder alt text the CMS leaves on the card thumb ("Provide aria label for the thumb")
const PLACEHOLDER_ALT = /^provide (an )?aria[- ]label/i;

/**
 * story-article: the card-rounded-figure box icon (.card__thumb img, an https SVG localised to
 * /media-da/ through the snapshot .images.json sidecar like every other image) -> the cell's first
 * paragraph, <p><img></p>. Inline data:/blob: images cannot be imported and are skipped.
 */
function boxIcon(gridCell, document) {
  const img = gridCell.querySelector('.card-rounded-figure .card__thumb img');
  const src = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '').trim() : '';
  if (!src || /^(data|blob):/i.test(src)) return null;
  const out = document.createElement('img');
  out.src = src;
  const holder = img.closest('[aria-label]');
  const alt = clean(img.getAttribute('alt') || (holder ? holder.getAttribute('aria-label') : ''));
  out.alt = PLACEHOLDER_ALT.test(alt) ? '' : alt;
  const p = document.createElement('p');
  p.append(out);
  return p;
}

function otherCell(gridCell, document, story) {
  const cell = [];
  const icon = story ? boxIcon(gridCell, document) : null;
  if (icon) cell.push(icon);
  gridCell.querySelectorAll('h2, h3, h4, h5, h6, p, a[href]').forEach((el) => {
    if (el.matches('a') && el.closest('p, h2, h3, h4, h5, h6')) return;
    const text = clean(el.textContent);
    if (!text) return;
    if (el.matches('a')) cell.push(linkPara(el, text, document));
    else cell.push(cleanInline(el, /^H/.test(el.tagName) ? 'h3' : 'p', document));
  });
  // an icon alone is not a card
  return cell.length === 1 && icon ? [] : cell;
}

function titledMenuRows(element, document, story) {
  const rows = [];
  let units = [...element.querySelectorAll(':scope > .cell')];
  if (!units.length) units = [...element.querySelectorAll('.sublink-menu')];
  units.forEach((unit) => {
    const menus = unit.matches('.sublink-menu') ? [unit] : [...unit.querySelectorAll('.sublink-menu')];
    if (menus.length) {
      menus.forEach((m) => { const cell = menuCell(m, document); if (cell.length) rows.push([cell]); });
      return;
    }
    const cell = otherCell(unit, document, story);
    if (cell.length) rows.push([cell]);
  });
  return rows;
}

export default function parse(element, { document, template }) {
  if (element.querySelector('.sublink-menu__title, .sublink-menu__description')) {
    const rows = titledMenuRows(element, document, template === 'story-article');
    if (rows.length) {
      element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['link-list'], cells: rows }));
      return;
    }
  }
  let items = [...element.querySelectorAll('.sublink-menu__item')];
  if (!items.length) items = [...element.querySelectorAll('li')];
  const cells = [];
  items.forEach((item) => {
    const a = item.querySelector('a[href]');
    const label = clean((item.querySelector('a > div, a > span') || a || item).textContent);
    if (!label) return;
    const p = document.createElement('p');
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href').trim();
      link.textContent = label;
      p.append(link);
    } else {
      p.textContent = label;
    }
    cells.push([p]);
  });
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', variants: ['link-list'], cells });
  element.replaceWith(block);
}
