/* eslint-disable */
/* global WebImporter */
/**
 * Parser for key-facts. Base: key-facts (no options). Authored as "Key Facts".
 * Source: course-detail template (every course tab; one domestic + one international copy when the
 * audience transformer split the key-facts section).
 *
 * Output (blocks/key-facts/README.md + key-facts.js):
 *   fact rows, 2 cells:   <p>:icon: Label</p> | value paragraph(s) (text, <strong>, links; <br> splits lines)
 *   code rows, 2 cells:   "VTAC code" | "3800538001" (from ul[data-excat-hero-codes], every code except
 *                         "Course code", which stays in the hero)
 *   action rows, 1 cell:  <p><strong><a>How to apply</a></strong></p> (btn--primary, cyan),
 *                         <p><em><a>Enquire</a></em></p> (btn--secondary, sage), <p><a>Register…</a></p>
 *                         (btn--text). The "Save" web component has no href and is removed by cleanup.
 *
 * Source (verified in block-context/key-facts/source.html + instances/01-international.html):
 *   div.key-facts .key-facts-section__main > .key-facts-section__main--item (BA 6, MMA 5) >
 *     .key-facts-section__main--icon (data-URI svg, removed by cleanup), --title, --value
 *   .key-facts-cta .cell > a.btn (btn--primary / btn--secondary / btn--text)
 *   ul[data-excat-hero-codes] > li > span (label) + span.text-bold (value)   (audience transformer)
 * Iteration is keyed on the block-level item wrappers, never on anchors.
 */

const ICONS = {
  duration: 'clock',
  'mode (location)': 'location',
  mode: 'location',
  location: 'location',
  intake: 'calendar',
  intakes: 'calendar',
  fees: 'fees',
  'entry requirements': 'entry-requirements',
  'entry schemes': 'entry-schemes',
  'english language requirements': 'english-language',
};

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function linkFrom(a, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = cleanText(a);
  return link;
}

/** Value cell: split the value element on <br> into paragraphs, keeping inline markup. */
function valueCell(value, document) {
  const paras = [];
  let current = document.createElement('p');
  const flush = () => {
    if (cleanText(current) || current.querySelector('a, img')) {
      // trim edge whitespace
      if (current.firstChild && current.firstChild.nodeType === 3) current.firstChild.textContent = current.firstChild.textContent.replace(/^\s+/, '');
      if (current.lastChild && current.lastChild.nodeType === 3) current.lastChild.textContent = current.lastChild.textContent.replace(/\s+$/, '');
      paras.push(current);
    }
    current = document.createElement('p');
  };
  [...value.childNodes].forEach((node) => {
    if (node.nodeType === 8) return; // comments
    if (node.nodeName === 'BR') { flush(); return; }
    if (node.nodeType === 1 && /^(P|DIV|UL|OL)$/.test(node.tagName)) {
      flush();
      if (/^(UL|OL)$/.test(node.tagName)) paras.push(node);
      else { [...node.childNodes].forEach((c) => current.append(c)); flush(); }
      return;
    }
    if (node.nodeType === 1) {
      node.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', a.getAttribute('href').trim()));
      if (node.matches('a[href]')) node.setAttribute('href', node.getAttribute('href').trim());
    }
    current.append(node);
  });
  flush();
  return paras;
}

export default function parse(element, { document }) {
  const cells = [];

  // --- fact rows ---
  let items = [...element.querySelectorAll('.key-facts-section__main--item')];
  if (!items.length) items = [...element.querySelectorAll('.key-facts-section__main > div')];
  items.forEach((item) => {
    const label = cleanText(item.querySelector('.key-facts-section__main--title, [class*="--title"]'));
    const value = item.querySelector('.key-facts-section__main--value, [class*="--value"]');
    if (!label || !value || !cleanText(value)) return;
    const icon = ICONS[label.toLowerCase()];
    const labelP = document.createElement('p');
    labelP.textContent = icon ? `:${icon}: ${label}` : label;
    // any extra siblings after the value (secondary line + link) join the value cell
    const extras = [...item.children].filter((c) => c !== value
      && !c.matches('.key-facts-section__main--icon, .key-facts-section__main--title, [class*="--title"], [class*="--icon"]')
      && cleanText(c));
    const valueParas = valueCell(value, document);
    extras.forEach((c) => valueParas.push(...valueCell(c, document)));
    cells.push([[labelP], valueParas]);
  });

  // --- code rows (hero codes copied in by the audience transformer) ---
  element.querySelectorAll('ul[data-excat-hero-codes] > li').forEach((li) => {
    // label / value from the text: the importer's preProcess unwraps the attribute-less label
    // <span> ("VTAC code: "), so child positions are not reliable
    const full = cleanText(li);
    const valueEl = li.querySelector('.text-bold, strong, b');
    const value = cleanText(valueEl) || full.split(':').slice(1).join(':').trim();
    const label = (full.includes(':') ? full.split(':')[0] : full.replace(value, '')).trim();
    if (!label || !value || /^course code$/i.test(label)) return;
    cells.push([label, value]);
  });

  // --- action rows ---
  const ctas = [...element.querySelectorAll('.key-facts-cta a[href]')]
    .filter((a, i, all) => all.indexOf(a) === i && cleanText(a));
  ctas.forEach((a) => {
    const p = document.createElement('p');
    const link = linkFrom(a, document);
    const cls = a.className || '';
    if (/btn--secondary/.test(cls)) {
      const em = document.createElement('em');
      em.append(link);
      p.append(em);
    } else if (/btn--text/.test(cls) || !/btn/.test(cls)) {
      p.append(link);
    } else {
      const strong = document.createElement('strong');
      strong.append(link);
      p.append(strong);
    }
    cells.push([[p]]);
  });
  // non-link CTA panel messages (e.g. .cta-panel-message) as action text
  // (e.g. div.key-facts-buttons-additional "Applications for this course are currently closed",
  // shown instead of / beside the buttons on 35 snapshots)
  element.querySelectorAll('.key-facts-cta .cta-panel-message, .key-facts-cta .key-facts-buttons-additional').forEach((m) => {
    if (!cleanText(m) || m.querySelector('a')) return;
    const p = document.createElement('p');
    p.textContent = cleanText(m);
    cells.push([[p]]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Key Facts', cells });
  element.replaceWith(block);
}
