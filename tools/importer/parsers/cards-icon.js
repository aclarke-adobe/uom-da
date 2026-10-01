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

export default function parse(element, { document }) {
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
    const heading = card.querySelector('h2, h3, h4, .card__title');
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
