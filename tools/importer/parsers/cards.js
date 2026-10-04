/* eslint-disable */
/* global WebImporter */
import { isLandingFamily } from '../landing-family.js';

/**
 * Parser for cards. Base: cards (no option). Authored as "Cards".
 * Source: https://study.unimelb.edu.au (homepage template, section 9 feature panel).
 *
 * Output (blocks/cards/README.md): one row per card, 2 cells
 *   cell 1 = image only
 *   cell 2 = h3 + description p + text-link CTA p (decorator pins trailing CTA to the bottom)
 *
 * Source (verified in block-context/cards/source.html):
 *   div.grid.grid--3col > div.cell > div.card >
 *     div.card__thumb > div.card__thumb-img > img                                   (BD snapshot DOM)
 *     div.card__thumb > div.card__thumb-img[role=img][aria-label][style="background-image:url(/__data/...)"]
 *                                           (raw live DOM: URL resolved to https://study.unimelb.edu.au,
 *                                            alt from aria-label)
 *     div.card__inner > h3.card__title, p.card__meta
 *     div.card__footer > a.btn.btn--text (+ decorative arrow img, sr-only "about …" span)
 * Iteration is keyed on div.card (block wrapper), falling back to div.cell.
 */

function clean(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

const SOURCE_ORIGIN = 'https://study.unimelb.edu.au';

/** Absolute URL for a (possibly root-relative) source image path. */
function absolute(src) {
  try {
    return new URL(src, `${SOURCE_ORIGIN}/`).href;
  } catch (e) {
    return src;
  }
}

/** URL from an inline `background-image: url(...)` style (or data-bg attribute). */
function backgroundUrl(el) {
  if (!el) return '';
  const attr = el.getAttribute('data-bg') || el.getAttribute('data-background-image');
  if (attr) return absolute(attr.trim());
  const m = (el.getAttribute('style') || '').match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
  return m && m[2] && !m[2].startsWith('data:') ? absolute(m[2].trim()) : '';
}

function pickImage(card, document) {
  const out = document.createElement('img');
  // Snapshot DOM: background already materialised as <img>
  const img = card.querySelector('.card__thumb img, .card__thumb-img img, .card__image img');
  if (img) {
    let src = img.getAttribute('src') || '';
    const dataSrc = img.getAttribute('data-src');
    if ((!src || src.startsWith('data:') || src.startsWith('blob:')) && dataSrc) src = dataSrc;
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      out.src = src;
      const labelled = img.closest('[aria-label]');
      out.alt = img.getAttribute('alt') || (labelled && card.contains(labelled) ? labelled.getAttribute('aria-label') : '') || '';
      return out;
    }
  }
  // Raw live DOM: div.card__thumb-img[role=img][aria-label][style="background-image:url(/__data/...)"]
  const thumbs = [...card.querySelectorAll('.card__thumb-img, .card__thumb, .card__image, [role="img"][style*="background"]')];
  const thumb = thumbs.find((el) => backgroundUrl(el));
  if (!thumb) return null;
  out.src = backgroundUrl(thumb);
  out.alt = thumb.getAttribute('aria-label') || '';
  return out;
}

// Course-detail assets known to 403 (mapping-notes "Images (403 rule)"): never emit, log instead.
// Image availability is decided at import time from tools/importer/unloadable-images.json (generated
// by tools/importer/check-images.mjs through Bright Data): the course cleanup transformer drops those
// images before parsing. The assets once listed here as "403" load fine on the source (only curl and
// cross-site hotlinking are refused) and are localised to /media-da/ via the snapshot sidecars.
const BLOCKED_IMAGES = [];

/* ---- section-landing shapes (template 'section-landing'; verified in
 * block-context/cards/instances/section-landing-01..08.html) ----
 *   ct-featurespanel  .card--features-panel: .card__thumb img | h3.card__title + a.btn--cta (-> <em>)
 *   ct-profilelist    a.card--stafflist[href]: .card__thumb img | h3.card__position (linked to the card href)
 *                     + .card__excerpt
 *   ct-pagelisting    .card--generic: .card__thumb img | h3 > a.card__title + .card__excerpt + .card__links a
 *   ct-newslisting    .card-news-tag: same + .card__sub-titles (date); trailing "..." of a teaser dropped
 *   ct-eventslisting  li.event .card-news-tag (no image): h3 link, date/time line, excerpt, tags, links
 * No image -> a single body cell (never an empty image cell).
 */
function landingLink(href, label, document) {
  const a = document.createElement('a');
  a.href = (href || '').trim();
  a.textContent = label;
  return a;
}

function landingPara(textOrNode, document) {
  const p = document.createElement('p');
  if (typeof textOrNode === 'string') p.textContent = textOrNode;
  else p.append(textOrNode);
  return p;
}

function landingCard(card, document, story) {
  card.querySelectorAll('.screenreaders-only, .sr-only').forEach((x) => x.remove());
  const body = [];
  const cardHref = card.matches('a[href]') ? card.getAttribute('href') : '';
  const heading = card.querySelector('.card__inner h1, .card__inner h2, .card__inner h3, .card__inner h4, .card__title, .card__header, h3');
  const title = clean(heading);
  if (title) {
    const h = document.createElement('h3');
    // the link is in the heading, or wraps it (card--imagelisting: .card__inner > a > h3)
    const wrapping = heading.parentElement && heading.parentElement.closest('a[href]');
    const titleLink = heading.matches('a[href]') ? heading
      : (heading.querySelector('a[href]') || (wrapping && card.contains(wrapping) ? wrapping : null));
    const href = (titleLink && titleLink.getAttribute('href')) || cardHref;
    if (href) h.append(landingLink(href, title, document));
    else h.textContent = title;
    body.push(h);
  }
  card.querySelectorAll('.card__sub-titles .sub-title, .card__sub-titles > :not(.sub-title)').forEach((st) => {
    if (clean(st)) body.push(landingPara(clean(st), document));
  });
  const inner = card.querySelector('.card__inner') || card;
  inner.querySelectorAll(':scope > p, :scope > .card__meta, .card__excerpt').forEach((ex) => {
    if (heading && (ex === heading || ex.contains(heading))) return;
    const t = clean(ex).replace(/\s*(\.{3,}|…)$/, '');
    if (t) body.push(landingPara(t, document));
  });
  card.querySelectorAll('.card__tags .tags__item').forEach((tag) => {
    // story-article: a linked tag (static events copy) is emitted once, as the link from the
    // footer below, not also as a plain label
    if (story && tag.querySelector('a[href]') && tag.closest('.card__footer')) return;
    if (clean(tag)) body.push(landingPara(clean(tag), document));
  });
  const titleHref = heading && (heading.matches('a') ? heading : heading.querySelector('a'));
  card.querySelectorAll('.card__links a[href], .card__footer a[href]').forEach((a) => {
    const label = clean(a) || (a.getAttribute('aria-label') || '').trim();
    if (!label) return;
    const link = landingLink(a.getAttribute('href'), label, document);
    const cls = a.className || '';
    if (/btn--cta|btn--secondary/.test(cls)) { const em = document.createElement('em'); em.append(link); body.push(landingPara(em, document)); return; }
    if (/\bbtn\b/.test(cls) && !/btn--text/.test(cls)) { const st = document.createElement('strong'); st.append(link); body.push(landingPara(st, document)); return; }
    body.push(landingPara(link, document));
  });
  if (!titleHref && !body.some((b) => b.querySelector && b.querySelector('a'))) { /* text-only card */ }
  let image = pickImage(card, document);
  // CSS-background thumbnail captured as data-excat-bg (snapshot contract "lazyBackground"):
  // e.g. ct-eventslisting a.card__thumb, an empty link that html2md's preProcess deletes
  const bgHolder = image ? null : [card, ...card.querySelectorAll('[data-excat-bg]')].find((el) => (el.getAttribute('data-excat-bg') || '').trim());
  if (bgHolder) {
    image = document.createElement('img');
    image.src = bgHolder.getAttribute('data-excat-bg').trim();
    image.alt = (bgHolder.getAttribute('aria-label') || '').trim();
  }
  if (image && card.matches('.card--stafflist') && /^profile-image$/i.test(image.alt)) {
    const t = card.querySelector('[title]');
    image.alt = (t && t.getAttribute('title').trim()) || title;
  }
  if (!body.length && !image) return null;
  return image ? [[image], body.length ? body : ''] : [body];
}

function parseLanding(element, document, url, template) {
  let cards = [...element.querySelectorAll('.card')].filter((c) => !c.parentElement.closest('.card'));
  if (!cards.length) cards = [...element.querySelectorAll(':scope > .cell, :scope > li')];
  // live feeds copy what the source shows initially: "Show more" items (.cell.news.hidden on
  // ct-newslisting) are not imported (mapping-notes "Live feeds") — except on a newsroom page
  // (path ending /news, or a story-article news hub such as .../alumni-news-and-updates), where the
  // listing is the page and every article is kept
  const newsroom = /\/(?:news|[\w-]*-news-and-updates)\/?$/.test(url ? new URL(url, 'https://study.unimelb.edu.au').pathname : '');
  if (!newsroom) {
    cards = cards.filter((c) => {
      const hidden = c.closest('.hidden');
      return !hidden || !element.contains(hidden);
    });
  }
  const story = template === 'story-article';
  const rows = cards.map((c) => landingCard(c, document, story)).filter(Boolean);
  if (!rows.length) { element.replaceWith(...element.childNodes); return; }
  // image listing (card--imagelisting: photo over a linked title, optional text) is authored as an
  // option: with the title linked it is otherwise indistinguishable from the staff-list cards
  const listing = cards.length && cards.every((c) => c.matches('.card--imagelisting'));
  // story-article one-per-row news list (.grid--1col > .cell > .card--generic--full-width: STEM
  // episode list, Wilam Hall alumni news) is the List option
  const list = story && cards.length
    && cards.every((c) => c.matches('.grid--1col > .cell > .card--generic--full-width'));
  let name = 'Cards';
  if (listing) name = 'Cards (listing)';
  else if (list) name = 'Cards (list)';
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name, cells: rows }));
}

export default function parse(element, { document, template, url }) {
  if (isLandingFamily(template)) {
    parseLanding(element, document, url, template);
    return;
  }
  // Course-detail shape (block-context/cards/instances/course-detail-01.html, MMA career outcomes
  // alumni grid): div.grid > div.cell > div.card.card--division > div.card__thumb > img,
  // div.card__inner > div.card__subheader > h4.card__header, p (role), p.card__meta (completed).
  // Differences from the homepage: name heading authored as h5 (it sits under the section h4),
  // cards are not links (btn-owner is a styling artefact), and a 403 portrait drops the image cell
  // instead of leaving it empty. The homepage (no course wrapper) keeps the original behaviour.
  const course = !!element.closest('.course-content, .course-section__main, [data-test$="-page"]');

  let cards = [...element.querySelectorAll('.card')];
  if (!cards.length) cards = [...element.querySelectorAll(':scope > .cell, :scope > div')];

  const cells = [];
  cards.forEach((card) => {
    const body = [];
    const heading = card.querySelector('h2, h3, h4, h5, h6, .card__title, .card__header');
    if (heading && clean(heading)) {
      let tag = /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : 'h3';
      if (course) tag = 'h5';
      const h = document.createElement(tag);
      const br = course ? heading.querySelector(':scope > br') : null;
      if (br) {
        // "Dr Muralee Das<br><strong><em>PhD (…)</em></strong>": name = heading, rest = a paragraph
        const rest = document.createElement('p');
        let n = br.nextSibling;
        while (n) { const next = n.nextSibling; rest.append(n); n = next; }
        br.remove();
        h.textContent = clean(heading);
        body.push(h);
        if (clean(rest)) body.push(rest);
      } else {
        h.textContent = clean(heading);
        body.push(h);
      }
    }
    if (course) {
      // keep inline markup (<br> line breaks, <strong>/<em>, real links) and the footer line
      // (e.g. <strong><em>Completed - 2016</em></strong>), in source order
      // every block of the card body in source order: p / ul / ol kept, wrapper divs walked,
      // blockquotes (student quotes) and bare text (news-card teasers) become paragraphs; the
      // title heading is already in `body`, other headings become paragraphs
      const walkInner = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            if (clean(n)) { const p = document.createElement('p'); p.textContent = clean(n); body.push(p); }
            return;
          }
          if (n.nodeType !== 1 || n === heading) return;
          if (heading && n.contains(heading)) { walkInner(n); return; } // e.g. div.card__subheader
          if (!clean(n) && !n.querySelector('img')) return;
          if (/^(P|UL|OL)$/.test(n.tagName)) {
            n.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', a.getAttribute('href').trim()));
            body.push(n);
          } else if (/^(DIV|SECTION|BLOCKQUOTE|FIGURE)$/.test(n.tagName)) {
            if (n.querySelector('p, ul, ol, div, blockquote, h1, h2, h3, h4, h5, h6')) walkInner(n);
            else { const p = document.createElement('p'); p.innerHTML = n.innerHTML.trim(); body.push(p); }
          } else if (/^H[1-6]$/.test(n.tagName) || /^(CITE|SPAN|STRONG|EM|A|SMALL)$/.test(n.tagName)) {
            const p = document.createElement('p');
            p.innerHTML = n.innerHTML.trim();
            body.push(p);
          } else if (n.tagName !== 'HR' && n.tagName !== 'IMG') {
            const p = document.createElement('p'); p.textContent = clean(n); body.push(p);
          }
        });
      };
      const inner = card.querySelector('.card__inner');
      if (inner) walkInner(inner);
      const footer = card.querySelector('.card__footer');
      if (footer && clean(footer)) {
        const blocks = [...footer.children].filter((c) => /^(P|UL|OL)$/.test(c.tagName));
        if (blocks.length) body.push(...blocks);
        else {
          const p = document.createElement('p');
          p.append(...footer.childNodes);
          body.push(p);
        }
      }
    } else {
      card.querySelectorAll('.card__inner p, .card__meta').forEach((p, i, all) => {
        if ([...all].indexOf(p) !== i || !clean(p)) return;
        const para = document.createElement('p');
        para.textContent = clean(p);
        body.push(para);
      });
    }
    const cta = course ? null : card.querySelector('.card__footer a[href], a.btn[href]');
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
    let image = pickImage(card, document);
    if (course && image && BLOCKED_IMAGES.some((frag) => image.src.includes(frag))) {
      console.warn(`[cards] image dropped (403): ${image.src}`);
      image = null;
    }
    if (course) {
      cells.push(image ? [[image], body] : [body]);
      return;
    }
    cells.push([image ? [image] : '', body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(block);
}
