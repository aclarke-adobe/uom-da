/* eslint-disable */
/* global WebImporter */
/**
 * Parser for callout. Base: callout (no options). Authored as "Callout".
 * Source: course-detail template (fees, scholarships, how-to-apply, after-you-apply, graduate entry
 * requirements incl. the eligibility calculator). Hrefs can differ per audience copy.
 *
 * Output (blocks/callout/README.md + callout.js): 1 row, 1 cell
 *   <p>{title / description}</p> + one <p> per CTA:
 *     a.btn without --secondary (cyan primary) -> <p><strong><a>…</a></strong></p>
 *     a.btn--secondary (sage)                  -> <p><em><a>…</a></em></p>
 *   (mapping-notes "Callout CTA buttons": decorateButtons only builds buttons from strong/em, and
 *   callout.css does not style plain links.)
 *
 * Source (verified in block-context/callout/source.html + instances/01..08):
 *   div.callout-panel.grid (2 children) > .cell--desk-1of2 > div.callout-panel__title
 *                                        .cell--desk-1of2.text-right > a.btn[data-test=callout-panel-button]
 *   section#eligibility-calculator (1 child) > .section__inner > .course-section__main >
 *     p#eligibility-calculator-description + a.btn
 * Both shapes are matched by content selectors, not by child position; the message and the CTA are
 * each optional (a callout with only one of them is still emitted).
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function stripAttrs(root) {
  [root, ...root.querySelectorAll('*')].forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (/^(style|class|id|tabindex|role|data-.*|aria-.*)$/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
  return root;
}

function ctaParagraph(a, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = cleanText(a);
  const wrap = document.createElement(/btn--secondary/.test(a.className || '') ? 'em' : 'strong');
  wrap.append(link);
  const p = document.createElement('p');
  p.append(wrap);
  return p;
}

export default function parse(element, { document }) {
  const cell = [];
  const ctas = [...element.querySelectorAll('a.btn[href], a[data-test="callout-panel-button"][href]')]
    .filter((a, i, all) => all.indexOf(a) === i && cleanText(a));

  // message: the panel title, or (eligibility calculator) the description paragraph(s)
  const titles = [...element.querySelectorAll('.callout-panel__title, [data-test="callout-panel-title"], #eligibility-calculator-description')]
    .filter((t, i, all) => all.indexOf(t) === i);
  if (titles.length) {
    titles.forEach((t) => {
      if (!cleanText(t)) return;
      const p = document.createElement('p');
      p.innerHTML = t.innerHTML.trim();
      cell.push(stripAttrs(p));
    });
  } else {
    // fallback: any text paragraphs/headings that are not the CTAs
    element.querySelectorAll('h2, h3, h4, h5, p').forEach((t) => {
      if (!cleanText(t) || ctas.some((a) => t.contains(a) && cleanText(t) === cleanText(a))) return;
      cell.push(stripAttrs(t));
    });
  }

  ctas.forEach((a) => cell.push(ctaParagraph(a, document)));

  if (!cell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Callout', cells: [[cell]] });
  element.replaceWith(block);
}
