/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-icon. Base: cards (option: icon). Authored as "Cards (icon)".
 * Source: https://study.unimelb.edu.au (homepage template, section 10 feature panel).
 *
 * Output (blocks/cards/README.md): one row per card, 2 cells
 *   cell 1 = pictogram as an EDS icon `:uom-<slug>:` (rendered as <span class="icon icon-uom-<slug>">)
 *   cell 2 = h3 + description p + text-link CTA p
 *
 * Source (verified in block-context/cards-icon/source.html + live snapshot + raw live DOM):
 *   div.grid.grid--3col > div.cell > div.card >
 *     div.card__icons__left > (img[src^="data:image/svg+xml"] (snapshot) | inline <svg> (raw))
 *     div.card__inner > h3.card__title, p.card__meta
 *     div.card__footer > a.btn.btn--text (+ decorative arrow img)
 *
 * Pictograms have no remote URL (inline SVG / data URI, which the importer turns into
 * unpublishable blob: URLs). They are shipped as code assets instead:
 *   icons/uom-<slug>.svg, slug = kebab-case of the card h3 title
 *   (e.g. "Access Melbourne" -> icons/uom-access-melbourne.svg)
 * and referenced with the EDS icon mechanism (decorateIcons adds the <img>).
 * Iteration is keyed on div.card, falling back to div.cell.
 */

function clean(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

/** Icon name for a card title: "uom-" + kebab-case slug. */
function iconName(title) {
  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `uom-${slug}` : '';
}

function pictogram(card, title, document) {
  const holder = card.querySelector('.card__icons__left, [class*="card__icon"]');
  if (!holder || !holder.querySelector('img, svg')) return null;
  const name = iconName(title);
  if (!name) return null;
  // Emitted as the EDS icon notation `:uom-<slug>:`. An empty <span class="icon icon-..."> would be
  // dropped by the importer's html2md step; the pipeline (and blocks/cards on local html-folder
  // previews) turns `:name:` into <span class="icon icon-name"><img src="/icons/name.svg"></span>.
  const p = document.createElement('p');
  p.textContent = `:${name}:`;
  return p;
}

/* ---- section-landing shapes (verified in block-context/cards-icon/instances/section-landing-*.html) ----
 *   A. ct-textthreecolumn.section-alt: .grid > .cell.section-alt__inner-flex-items >
 *        .section-alt__inner-svg-icon > img (data-URI pictogram; preprocess tags data-excat-icon) + h3 + p…
 *   B. ct-focusbox: .grid > .cell > .card-focus > .card--focus-box__icon > img (svg pictogram or PNG) + h3 + p…
 *   C. ct-factscard: .card--fact > .card__inner > h3.card__header (figure) + h4.card__meta  -> 1 body cell
 *   D. ct-imagelisting: .logo-listing > .logo-listing__item > img                         -> image-only rows
 *   E. ct-documentlisting: ul.document-list > li > figure > img + figcaption > p > a      -> [img] | links
 *   F. micro-credential #overview: .grid > .cell > img (remote Matrix SVG) + h3 + p        -> icon by file name
 * Pictogram cells are `:uom-<name>:` (names from tools/importer/pictogram-map.json via data-excat-icon).
 * A card with no icon/image gets a single body cell (never an empty cell).
 */
// The #overview pictograms are remote Matrix files (Cloudflare refuses them to scripts); they are the
// same artwork as these shipped icons.
const OVERVIEW_ICONS = { briefcase: 'briefcase', handshake: 'handshake', circlewavycheck: 'verified-badge' };

function landingIconCell(holder, document) {
  if (!holder) return null;
  const img = holder.matches('img') ? holder : holder.querySelector('img');
  if (!img) return null;
  const tagged = img.getAttribute('data-excat-icon');
  const src = (img.getAttribute('src') || '').trim();
  const file = (src.split('/').pop() || '').replace(/\.svg$/i, '').toLowerCase();
  const name = tagged || (/\.svg$/i.test(src) && OVERVIEW_ICONS[file]);
  if (name) {
    const p = document.createElement('p');
    p.textContent = `:uom-${name}:`;
    return p;
  }
  if (!src || /^(data|blob):/.test(src)) return null;
  const out = document.createElement('img');
  out.src = src;
  out.alt = clean({ textContent: img.getAttribute('alt') || '' });
  return out;
}

function landingCta(a, document) {
  a.querySelectorAll('.screenreaders-only, .sr-only').forEach((x) => x.remove());
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = clean(a) || (a.getAttribute('title') || '').trim();
  const cls = a.className || '';
  const p = document.createElement('p');
  if (/\bbtn\b/.test(cls) && !/btn--text/.test(cls)) {
    const w = document.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
    w.append(link);
    p.append(w);
  } else p.append(link);
  return p;
}

function landingBody(card, skip, document) {
  const body = [];
  const heading = card.querySelector('h2, h3, h4, h5, h6');
  if (heading && clean(heading)) {
    const h = document.createElement('h3');
    h.textContent = clean(heading);
    body.push(h);
  }
  [...card.querySelectorAll('h2, h3, h4, h5, h6, p, ul, ol, a.btn, a[class*="btn--"]')].forEach((el) => {
    if (el === heading || (skip && skip.contains(el)) || !clean(el)) return;
    if (el.parentElement && el.parentElement.closest('p, ul, ol') && card.contains(el.parentElement)) return;
    if (el.matches('a')) { if (!el.closest('p, li')) body.push(landingCta(el, document)); return; }
    if (/^H[2-6]$/.test(el.tagName)) { const p = document.createElement('p'); p.textContent = clean(el); body.push(p); return; }
    const out = document.createElement(el.tagName.toLowerCase());
    out.innerHTML = el.innerHTML.trim();
    out.querySelectorAll('a.btn, a[class*="btn--"]').forEach((a) => {
      const cta = landingCta(a, document);
      a.replaceWith(...cta.childNodes);
    });
    out.querySelectorAll('*').forEach((c) => [...c.attributes].forEach((at) => { if (at.name !== 'href') c.removeAttribute(at.name); }));
    out.querySelectorAll('span').forEach((sp) => sp.replaceWith(...sp.childNodes));
    if (clean(out)) body.push(out);
  });
  return body;
}

function parseLanding(element, document) {
  const rows = [];
  if (element.matches('.logo-listing') || element.querySelector('.logo-listing__item')) {
    element.querySelectorAll('.logo-listing__item').forEach((item) => {
      const img = landingIconCell(item.querySelector('img'), document);
      if (img) rows.push([[img]]);
    });
  } else if (element.matches('ul.document-list') || element.querySelector('ul.document-list')) {
    element.querySelectorAll('li').forEach((li) => {
      const img = landingIconCell(li.querySelector('figure > img, img'), document);
      const body = [];
      (li.querySelector('figcaption') || li).querySelectorAll('a[href]').forEach((a) => {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = a.getAttribute('href').trim();
        link.textContent = clean(a);
        p.append(link);
        body.push(p);
      });
      if (!body.length && !img) return;
      rows.push(img ? [[img], body.length ? body : ''] : [body]);
    });
  } else {
    let cards = [...element.querySelectorAll('.card--fact, .card-focus, .section-alt__inner-flex-items')];
    if (!cards.length) cards = [...element.querySelectorAll(':scope > .cell')];
    cards.forEach((card) => {
      // focus boxes without the icon holder carry their pictogram as an image-only paragraph
      // (professional-development: <p><img src="…/trophy-blue.png"></p> above the h3)
      const imageParagraph = card.matches('.card-focus')
        ? [...card.querySelectorAll(':scope > p')].find((p) => !clean(p) && p.querySelector(':scope > img'))
        : null;
      const holder = card.querySelector('.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left')
        || card.querySelector(':scope > img') || imageParagraph;
      const icon = card.matches('.card--fact') ? null : landingIconCell(holder, document);
      const body = landingBody(card, holder, document);
      if (!body.length && !icon) return;
      rows.push(icon ? [[icon], body.length ? body : ''] : [body]);
    });
  }
  if (!rows.length) { element.replaceWith(...element.childNodes); return; }
  // ct-focusbox: white, centred boxes on the grey band (not the pictogram text columns)
  const name = element.closest('.ct-focusbox') ? 'Cards (icon, boxed)' : 'Cards (icon)';
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name, cells: rows }));
}

function isLanding(element) {
  if (element.closest('.course-content, .course-section__main, [data-test$="-page"]')) return false;
  return !!(element.closest('.ct-factscard, .ct-imagelisting, .ct-textthreecolumn, .ct-focusbox, .ct-documentlisting')
    || element.closest('#main > section#overview'));
}

export default function parse(element, { document }) {
  if (isLanding(element)) {
    parseLanding(element, document);
    return;
  }
  // Course-detail shape (career outcomes "Employment outcomes" fact cards; found in the bulk
  // snapshots, e.g. graduate/master-of-actuarial-science/career-outcomes):
  //   div.ct-factscard-border div.grid.grid--center > div.cell > div.card.card--fact > div.card__inner >
  //     [h4.card__meta (e.g. "Within 1 year of graduating")] + p (role, employer)
  // These cards carry no pictogram: in course mode a card without an icon gets a single body cell
  // (no empty icon cell), the h4 is authored as h5 (it sits under the section h4) and is not
  // repeated as a paragraph. The homepage (no course wrapper) keeps the original behaviour.
  const course = !!element.closest('.course-content, .course-section__main, [data-test$="-page"]');

  let cards = [...element.querySelectorAll('.card')];
  if (!cards.length) cards = [...element.querySelectorAll(':scope > .cell, :scope > div')];

  const cells = [];
  cards.forEach((card) => {
    const body = [];
    const heading = card.querySelector(course ? 'h2, h3, h4, h5, h6, .card__title' : 'h2, h3, h4, .card__title');
    const title = clean(heading);
    if (title) {
      const h = document.createElement(course ? 'h5' : (/^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : 'h3'));
      h.textContent = title;
      body.push(h);
    }
    card.querySelectorAll('.card__inner p, .card__meta').forEach((p, i, all) => {
      if (course && p === heading) return;
      if ([...all].indexOf(p) !== i || !clean(p)) return;
      const para = document.createElement('p');
      para.textContent = clean(p);
      body.push(para);
    });
    const cta = card.querySelector('.card__footer a[href], a.btn[href]');
    if (cta) {
      cta.querySelectorAll('.screenreaders-only, .sr-only').forEach((s) => s.remove());
      const link = document.createElement('a');
      link.href = cta.getAttribute('href').trim();
      link.textContent = clean(cta);
      const p = document.createElement('p');
      p.append(link);
      body.push(p);
    }
    if (!body.length) return;
    const icon = pictogram(card, title, document);
    if (course && !icon) {
      cells.push([body]);
      return;
    }
    cells.push([icon ? [icon] : '', body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (icon)', cells });
  element.replaceWith(block);
}
