/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au course-detail audience split (domestic / international).
 *
 * Implements templates[course-detail].audienceContract from tools/importer/page-templates.json.
 * The spec is migration-work/course-detail/mapping-notes.md, "Audience contract".
 *
 * Run order: unimelb-course-cleanup -> unimelb-course-audience -> unimelb-course-sections.
 * All the work happens in beforeTransform, so the block parsers (which run between the two
 * hooks) see both the domestic element and the international copy and parse them the same way.
 *
 * This transformer only MARKS elements and inserts the international copies. It does not add
 * <hr> or Section Metadata: the course sections transformer does that from the markers, which
 * keeps breaks and metadata from being added twice.
 *
 *   D (live, domestic)       data-excat-audience="domestic"      data-excat-section-start="<id>"
 *   I (international copy)   data-excat-audience="international" data-excat-section-start="<id>--international"
 *   domestic-only            data-excat-audience="domestic"      data-excat-section-start="<id>"
 *   shared tail (different)  data-excat-section-skip="<tail id>" on D
 *
 * The cleanup transformer has already cleaned template#excat-international in place. The text
 * comparison still strips svg/img/script/style first: live captures carry inline-SVG <title>
 * text that BD snapshots serialise as data-URI <img>.
 */
const AUD_ATTR = 'data-excat-audience';
const START_ATTR = 'data-excat-section-start';
const SKIP_ATTR = 'data-excat-section-skip';
const HERO_CODES_ATTR = 'data-excat-hero-codes';
const RESIDENCY_ATTR = 'data-excat-residency';
const LOG = '[course-audience]';

const DEFAULT_RESIDENCY_INSTANCES = [
  "#admission-requirements div.user-profile[data-test='entry-reqs-user-profile']",
  "#main div[data-test$='-page'] div.user-profile-toggle",
];

function toList(selectors) {
  if (!selectors) return [];
  return Array.isArray(selectors) ? selectors : [selectors];
}

function first(root, selectors) {
  if (!root) return null;
  for (const sel of toList(selectors)) {
    if (!sel) continue;
    let el = null;
    try {
      el = root.querySelector(sel);
    } catch (e) {
      el = null;
    }
    if (el) return el;
  }
  return null;
}

// Text + hrefs with svg/img/script/style removed and whitespace collapsed.
function signature(el) {
  const copy = el.cloneNode(true);
  copy.querySelectorAll('svg, img, script, style').forEach((n) => n.remove());
  copy.querySelectorAll(`[${HERO_CODES_ATTR}]`).forEach((n) => n.removeAttribute(HERO_CODES_ATTR));
  const text = (copy.textContent || '').replace(/\s+/g, ' ').trim();
  const hrefs = [...copy.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href').trim().replace(/\/+$/, ''))
    .join('\n');
  return `${text}\n--\n${hrefs}`;
}

// Read the template parts and import a copy of each into the page document.
function loadParts(doc, contract) {
  const tpl = doc.querySelector(contract.template || 'template#excat-international');
  if (!tpl) return null;
  const frag = tpl.content && tpl.content.childNodes.length ? tpl.content : tpl;
  const parts = {};
  frag.querySelectorAll('[data-excat-part]').forEach((p) => {
    const name = p.getAttribute('data-excat-part');
    if (!parts[name]) parts[name] = doc.importNode(p, true);
  });
  return parts;
}

// A detached copy of a hero codes list, tagged for the key-facts parser.
function heroCodesCopy(ul) {
  const copy = ul.cloneNode(true);
  copy.removeAttribute('class');
  copy.removeAttribute('data-test');
  copy.setAttribute(HERO_CODES_ATTR, '');
  return copy;
}

function appendHeroCodes(keyFacts, codesUl) {
  if (!keyFacts || !codesUl) return;
  if (keyFacts.querySelector(`:scope > [${HERO_CODES_ATTR}]`)) return;
  keyFacts.append(heroCodesCopy(codesUl));
}

function markSplit(d, clone, id) {
  d.setAttribute(AUD_ATTR, 'domestic');
  d.setAttribute(START_ATTR, id);
  clone.setAttribute(AUD_ATTR, 'international');
  clone.setAttribute(START_ATTR, `${id}--international`);
  d.after(clone);
}

// residency-notice: the international residency text goes inside the domestic block.
function addInternationalResidency(element, template, inBlock, bodyPart) {
  if (!inBlock || !bodyPart) return;
  const blockDef = (template.blocks || []).find((b) => b.name === 'residency-notice');
  const instances = blockDef ? blockDef.instances : DEFAULT_RESIDENCY_INSTANCES;
  const doc = element.ownerDocument;
  toList(instances).forEach((sel) => {
    let blocks = [];
    try {
      blocks = element.querySelectorAll(sel);
    } catch (e) {
      blocks = [];
    }
    blocks.forEach((block) => {
      if (block.closest(`[${AUD_ATTR}="international"]`)) return;
      if (block.querySelector(`:scope > [${RESIDENCY_ATTR}]`)) return;
      const isGrad = block.matches('div.user-profile-toggle');
      const infoSel = toList(inBlock.selector).filter((s) => (isGrad ? /user-profile-toggle/.test(s) : !/user-profile-toggle/.test(s)));
      const info = first(bodyPart, infoSel);
      if (!info) {
        console.warn(`${LOG} audience-missing: residency-notice (${sel})`);
        return;
      }
      const wrap = doc.createElement('div');
      wrap.setAttribute(AUD_ATTR, 'international');
      wrap.setAttribute(RESIDENCY_ATTR, 'international');
      if (isGrad) {
        const title = first(bodyPart, inBlock.titleSelector);
        if (title) wrap.append(title.cloneNode(true));
      }
      wrap.append(info.cloneNode(true));
      block.append(wrap);
    });
  });
}

export default function transform(hookName, element, payload) {
  const template = (payload && payload.template) || {};
  const contract = template.audienceContract;

  if (hookName === 'beforeTransform') {
    if (!contract || !contract.sections) return;
    const doc = element.ownerDocument || document;
    const sectionDefs = template.sections || [];
    const liveSelector = (id) => {
      const def = sectionDefs.find((s) => s.id === id);
      return def ? def.selector : contract.sections[id].selector;
    };

    // Domestic hero codes -> domestic key-facts (also when there is no international template,
    // so the key-facts parser always finds its code rows in the same place).
    const domesticKeyFacts = first(element, liveSelector('key-facts'));
    const domesticCodes = first(element, ['#main > div > div.course-header ul.course-header__codes', 'div.course-header ul.course-header__codes']);
    appendHeroCodes(domesticKeyFacts, domesticCodes);

    // Majors and single-audience courses: no switcher, nothing to split.
    if (!element.querySelector('#user-profile-audience-switcher')) return;

    const parts = loadParts(doc, contract);
    if (!parts) {
      console.warn(`${LOG} audience-missing: no ${contract.template || 'template#excat-international'} (domestic only, no Audience keys)`);
      return;
    }

    const split = {};

    Object.entries(contract.sections).forEach(([id, c]) => {
      const d = first(element, liveSelector(id));
      if (!d) return; // section not on this page
      if (d.hasAttribute(START_ATTR) || d.closest(`[${AUD_ATTR}]`)) return; // already handled

      const part = parts[c.part];
      const i = part ? first(part, c.selector) : null;

      // key-facts carries the hero codes of its audience (inBlock.key-facts)
      if (id === 'key-facts' && i && parts['hero-codes']) {
        const intlCodes = first(parts['hero-codes'], (contract.inBlock && contract.inBlock['key-facts'] && contract.inBlock['key-facts'].selector) || 'ul.course-header__codes');
        appendHeroCodes(i, intlCodes);
      }

      if (!i) {
        if (c.whenMissing === 'domestic-only' && part) {
          d.setAttribute(AUD_ATTR, 'domestic');
          d.setAttribute(START_ATTR, id);
          console.log(`${LOG} domestic-only: ${id}`);
        } else {
          console.warn(`${LOG} audience-missing: ${id}`);
        }
        return;
      }

      if (signature(d) === signature(i)) {
        console.log(`${LOG} identical (not split): ${id}`);
        return;
      }

      i.remove(); // detach from the imported part
      markSplit(d, i, id);
      split[id] = { d, clone: i };
      console.log(`${LOG} split: ${id}`);
    });

    // sharedTails, e.g. other-financial-assistance of fees-explained
    Object.entries(contract.sharedTails || {}).forEach(([tailId, ownerId]) => {
      const owner = split[ownerId];
      if (!owner) return; // owner not split: the tail stays where it is
      const tailSel = liveSelector(tailId);
      const dHead = first(owner.d, tailSel);
      const iHead = first(owner.clone, tailSel);
      const dTail = dHead ? [dHead, dHead.nextElementSibling].filter(Boolean) : [];
      const iTail = iHead ? [iHead, iHead.nextElementSibling].filter(Boolean) : [];
      const sig = (els) => els.map((e) => signature(e)).join('\n');
      if (dTail.length && iTail.length && sig(dTail) === sig(iTail)) {
        iTail.forEach((e) => e.remove());
        const wrap = doc.createElement('div');
        wrap.setAttribute(START_ATTR, tailId);
        dTail.forEach((e) => wrap.append(e));
        owner.clone.after(wrap);
      } else {
        const skip = (owner.d.getAttribute(SKIP_ATTR) || '').split(/\s+/).filter(Boolean);
        if (!skip.includes(tailId)) skip.push(tailId);
        owner.d.setAttribute(SKIP_ATTR, skip.join(' '));
      }
    });

    // residency-notice (inBlock, not split into sections)
    addInternationalResidency(element, template, contract.inBlock && contract.inBlock['residency-notice'], parts.body);
  }

  if (hookName === 'afterTransform') {
    // Import scaffolding must never leak into the content.
    const doc = element.ownerDocument || document;
    doc.querySelectorAll('template#excat-international, template#excat-options').forEach((t) => t.remove());
  }
}
