/* eslint-disable */
/* global WebImporter */
/**
 * Parser for residency-notice. Base: residency-notice (no options). Authored as "Residency Notice".
 * Source: course-detail template, entry-requirements (UG + graduate) and graduate how-to-apply.
 *
 * Output (blocks/residency-notice/README.md + residency-notice.js), audience-keyed rows:
 *   'domestic'      | <p><strong>Domestic student</strong></p><p>{info}</p>
 *   'international' | <p><strong>International student</strong></p><p>{info}</p>
 *   then shared 1-cell rows (each conditional; instances differ in direct-child count 1/2/3):
 *     UG:           <p>Can’t find your qualification? <a>Let us know</a></p>   (p.text-inline)
 *     graduate ER:  when #selectpgentry exists, <p><strong>Entry points available for this course</strong></p>
 *                   <ul><li>{radio label}</li>…</ul><p>{small note + link}</p>
 * The "Change" link (removed by cleanup), the qualification / year selects and the radios are not
 * authored.
 *
 * Source (verified in block-context/residency-notice/source.html + instances/01..04):
 *   UG  div.user-profile[data-test=entry-reqs-user-profile] > form >
 *         select#profile-residency (option text = audience title), [data-test=profile-residency--info] > p
 *       p.text-inline
 *   Grad div.user-profile-toggle > .course-section--toggle >
 *         .course-section__info > span[data-test=profile-residency--title], p[data-test=profile-residency--info]
 *       #selectpgentry > form > #program-select-radio-group label, p small   (optional)
 *   International copy: child div[data-excat-audience=international][data-excat-residency] appended by
 *   the audience transformer (UG: info only; graduate: title + info). Missing on pages without
 *   template#excat-international, in which case only the domestic row is emitted (logged).
 */

const TITLES = { domestic: 'Domestic student', international: 'International student' };

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function strongP(text, document) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = text;
  p.append(strong);
  return p;
}

/** The info element as paragraph(s) (it is a <p> on graduate, a div of <p>s on UG). */
function infoParas(info, document) {
  if (!info) return [];
  const paras = info.tagName === 'P' ? [info] : [...info.querySelectorAll('p')];
  if (!paras.length && cleanText(info)) {
    const p = document.createElement('p');
    p.textContent = cleanText(info);
    return [p];
  }
  return paras.filter((p) => cleanText(p)).map((p) => {
    const out = document.createElement('p');
    out.innerHTML = p.innerHTML;
    return out;
  });
}

function audienceCell(root, audience, select, document) {
  const titleEl = root.querySelector('[data-test="profile-residency--title"]');
  let title = cleanText(titleEl);
  if (!title && select) {
    const opt = select.querySelector(`option[value="${audience}"]`);
    title = cleanText(opt);
  }
  if (!title) title = TITLES[audience] || '';
  const info = root.querySelector('[data-test="profile-residency--info"]');
  const cell = [];
  if (title) cell.push(strongP(title, document));
  cell.push(...infoParas(info, document));
  return cell;
}

export default function parse(element, { document }) {
  const intlWrap = element.querySelector(':scope > [data-excat-residency], :scope > [data-excat-audience="international"]');
  if (intlWrap) intlWrap.remove();

  const select = element.querySelector('select#profile-residency, select[data-test="profile-residency"]');
  const selected = select && select.querySelector('option[selected]');
  const domesticKey = (selected && selected.getAttribute('value')) || 'domestic';

  const cells = [];
  const domestic = audienceCell(element, domesticKey, select, document);
  if (domestic.length) cells.push([domesticKey, domestic]);
  if (intlWrap) {
    const intl = audienceCell(intlWrap, 'international', select, document);
    if (intl.length) cells.push(['international', intl]);
  } else {
    console.warn('[residency-notice] no international residency copy (audience-missing): domestic row only');
  }

  // UG shared row: "Can't find your qualification? Let us know"
  element.querySelectorAll('p.text-inline').forEach((p) => {
    if (!cleanText(p)) return;
    const out = document.createElement('p');
    out.innerHTML = p.innerHTML;
    cells.push([[out]]);
  });

  // Graduate ER shared row: entry points
  const entry = element.querySelector('#selectpgentry');
  if (entry) {
    const cell = [];
    const label = cleanText(entry.querySelector('.uom-form-label__text, legend'));
    const options = [...entry.querySelectorAll('#program-select-radio-group label, .uom-radio label')]
      .filter((l, i, all) => all.indexOf(l) === i && !l.closest('.uom-form-label'))
      .map((l) => cleanText(l)).filter(Boolean);
    if (label) cell.push(strongP(label, document));
    if (options.length) {
      const ul = document.createElement('ul');
      options.forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
      cell.push(ul);
    }
    entry.querySelectorAll('p').forEach((p) => {
      if (!cleanText(p)) return;
      const out = document.createElement('p');
      const small = p.querySelector(':scope > small');
      out.innerHTML = (small || p).innerHTML.trim();
      cell.push(out);
    });
    if (cell.length) cells.push([cell]);
  }

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Residency Notice', cells });
  element.replaceWith(block);
}
