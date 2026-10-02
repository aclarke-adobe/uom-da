/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au section-landing audience split (individuals / organisations).
 *
 * Implements templates[section-landing].audienceContract (tools/importer/page-templates.json);
 * spec: migration-work/section-landing/mapping-notes.md, "Audience contract". Same approach as
 * unimelb-course-audience.js (domestic / international), with section-landing's matching model
 * (sectionMatching.mode "all": every matching region starts a section; joinWithPrevious regions
 * belong to the section before them).
 *
 * Run order (both hooks): unimelb-landing-cleanup -> unimelb-landing-audience ->
 * unimelb-landing-fragments -> unimelb-landing-sections.
 *
 * All the work happens in beforeTransform, so the block parsers (which run between the two hooks)
 * see both the individuals element and the organisations copy and parse them the same way. This
 * transformer only MARKS regions and inserts the organisations copies; the sections transformer
 * turns the marks into <hr> + Section Metadata {Style?, Audience}.
 *
 *   individuals (live)        data-excat-audience="individuals"   data-excat-section-start="<id>"
 *   organisations (copy)      data-excat-audience="organisations" data-excat-section-start="<id>--organisations"
 *
 * Only pages carrying template#excat-organisations (8 micro-credentials) are touched. Its parts
 * ([data-excat-part] body = main#main of the organisations view, hero = div.page-header-alt,
 * key-facts = div.key-facts) have already been cleaned in place by the cleanup transformer.
 *
 *   1. contract sections (sc-hero / sc-key-facts from their parts; sc-fees / sc-dates from body):
 *      different -> split (copy inserted after the live section); counterpart absent and
 *      whenMissing "individuals-only" -> live keyed individuals, no copy.
 *   2. every other section unit (start region + joined regions) is compared with the unit of the
 *      same section id and occurrence in the body part (text + hrefs, svg/img/script/style
 *      removed): identical -> no key; different -> split.
 *   3. units present only in the body part -> organisations-only: the copy is inserted after the
 *      nearest preceding unit that exists in both views (after its organisations copy, if split),
 *      keyed organisations.
 * Without the template (250 pages): single view, no Audience keys.
 */
const AUD_ATTR = 'data-excat-audience';
const START_ATTR = 'data-excat-section-start';
const FRAGMENT_LINK_ATTR = 'data-excat-fragment-link';
const ORG_SUFFIX = '--organisations';
const LOG = '[landing-audience]';

/* ---------- shared section-unit model (copied in the landing sections / fragments transformers) ---------- */

function toList(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function safeMatches(el, sel) {
  try {
    return el.matches(sel);
  } catch (e) {
    return false;
  }
}

function safeAll(root, sel) {
  try {
    return [...root.querySelectorAll(sel)];
  } catch (e) {
    return [];
  }
}

// Regions in document order: #main children, descending into the default Optimizely span in place
// (when the cleanup has not unwrapped it).
function contentRegions(root) {
  const main = root.matches && root.matches('#main') ? root : root.querySelector('#main');
  if (!main) return [];
  const out = [];
  [...main.children].forEach((c) => {
    if (c.matches('.optimizely_experiment')) {
      const span = c.querySelector(':scope > span.optimizely_experiment__block');
      if (span) out.push(...span.children);
    } else {
      out.push(c);
    }
  });
  return out;
}

function hasContent(el) {
  if (el.tagName === 'HR') return false;
  return /\S/.test(el.textContent || '')
    || el.matches('img, iframe, video, picture, table, [data-excat-bg], [data-excat-video-src]')
    || !!el.querySelector('img, iframe, video, picture, table, [data-excat-bg], [data-excat-video-src]');
}

function sectionDefFor(el, sections) {
  const start = el.getAttribute(START_ATTR);
  if (start) {
    const id = start.replace(new RegExp(`${ORG_SUFFIX}$`), '');
    const def = sections.find((s) => s.id === id);
    if (def) return def;
  }
  return sections.find((s) => toList(s.selector).some((sel) => safeMatches(el, sel))) || null;
}

/**
 * Section units in document order: { id, n, def, els, fragmentLink }.
 * mode "all": every region matching a section selector starts a unit; joinWithPrevious regions and
 * regions matching no section continue the current unit; the region after a fragment link always
 * starts a new unit (the fragment section holds only the link).
 */
function sectionUnits(root, template) {
  const sections = (template && template.sections) || [];
  const joins = toList(template && template.sectionMatching && template.sectionMatching.joinWithPrevious);
  const units = [];
  const counts = {};
  let cur = null;
  const open = (el, def, fragmentLink) => {
    const id = fragmentLink ? `fragment:${el.getAttribute(FRAGMENT_LINK_ATTR)}` : (def ? def.id : null);
    const key = id || '(none)';
    counts[key] = (counts[key] || 0) + 1;
    cur = { id, n: counts[key], def, els: [el], fragmentLink };
    units.push(cur);
  };
  contentRegions(root).forEach((el) => {
    const isLink = el.hasAttribute(FRAGMENT_LINK_ATTR);
    if (!isLink && !hasContent(el)) return;
    if (isLink) { open(el, null, true); return; }
    if (cur && !cur.fragmentLink && joins.some((j) => safeMatches(el, j))) { cur.els.push(el); return; }
    const def = sectionDefFor(el, sections);
    if (def || !cur || cur.fragmentLink) { open(el, def, false); return; }
    cur.els.push(el);
  });
  return units;
}

/* ---------- audience ---------- */

// Text + hrefs with svg/img/script/style removed and whitespace collapsed.
function signature(els) {
  return toList(els).map((el) => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('svg, img, script, style').forEach((n) => n.remove());
    const text = (copy.textContent || '').replace(/\s+/g, ' ').trim();
    const hrefs = [...copy.querySelectorAll('a[href]')]
      .map((a) => a.getAttribute('href').trim().replace(/\/+$/, ''))
      .join('\n');
    return `${text}\n--\n${hrefs}`;
  }).join('\n==\n');
}

const CONSUMED_ATTR = 'data-excat-consumed';

function loadParts(doc, contract) {
  const tpl = doc.querySelector(contract.template || 'template#excat-organisations');
  if (!tpl) return null;
  // Idempotent: a second beforeTransform must not split again (the live page then already holds
  // the copies and fragment placeholders, which would read as organisations-only sections).
  if (tpl.hasAttribute(CONSUMED_ATTR)) return null;
  tpl.setAttribute(CONSUMED_ATTR, '');
  const frag = tpl.content && tpl.content.childNodes.length ? tpl.content : tpl;
  const parts = {};
  frag.querySelectorAll('[data-excat-part]').forEach((p) => {
    const name = p.getAttribute('data-excat-part');
    if (!parts[name]) parts[name] = doc.importNode(p, true);
  });
  return parts;
}

function markLive(el, id) {
  el.setAttribute(AUD_ATTR, 'individuals');
  el.setAttribute(START_ATTR, id);
}

function markCopy(el, id) {
  el.setAttribute(AUD_ATTR, 'organisations');
  el.setAttribute(START_ATTR, `${id}${ORG_SUFFIX}`);
}

// Insert nodes after ref, in order; returns the last inserted node.
function insertAfter(ref, nodes) {
  let last = ref;
  nodes.forEach((n) => { last.after(n); last = n; });
  return last;
}

// The last element of a live unit, skipping over organisations copies already inserted after it.
function unitTail(unit) {
  let tail = unit.els[unit.els.length - 1];
  while (tail.nextElementSibling && tail.nextElementSibling.getAttribute(AUD_ATTR) === 'organisations') {
    tail = tail.nextElementSibling;
  }
  return tail;
}

// Copy of an organisations unit (start region + joined regions); every copy is tagged
// organisations so unitTail() can step over it.
function cloneUnit(unit, id) {
  const copies = unit.els.map((el) => doc0(el).importNode(el, true));
  markCopy(copies[0], id);
  copies.slice(1).forEach((c) => c.setAttribute(AUD_ATTR, 'organisations'));
  return copies;
}

function doc0(el) {
  return el.ownerDocument || document;
}

export default function transform(hookName, element, payload) {
  const template = (payload && payload.template) || {};
  const contract = template.audienceContract;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    doc.excatAudience = null;
    if (!contract) return;
    const parts = loadParts(doc, contract);
    if (!parts) return; // single view: no switcher, no Audience keys
    const body = parts.body || null;
    const contractSections = contract.sections || {};
    const contractIds = new Set(Object.keys(contractSections));

    // Units of both views, computed before anything is inserted.
    const liveUnits = sectionUnits(element, template).filter((u) => u.def);
    const orgUnits = body ? sectionUnits(body, template).filter((u) => u.def) : [];
    const key = (u) => `${u.id}#${u.n}`;
    const liveByKey = new Map(liveUnits.map((u) => [key(u), u]));
    const orgByKey = new Map(orgUnits.map((u) => [key(u), u]));
    const tally = { split: [], identical: [], individualsOnly: [], organisationsOnly: [], missing: [] };

    // 1. contract sections
    Object.entries(contractSections).forEach(([id, c]) => {
      const part = parts[c.part];
      const lives = liveUnits.filter((u) => u.id === id);
      const counterparts = part ? toList(c.selector).map((s) => safeAll(part, s)).find((l) => l.length) || [] : [];
      lives.forEach((u, i) => {
        if (u.els[0].hasAttribute(AUD_ATTR)) return; // already handled
        const other = counterparts[i];
        if (!other) {
          if (c.whenMissing === 'individuals-only' && part) {
            markLive(u.els[0], id);
            tally.individualsOnly.push(id);
          } else {
            tally.missing.push(id);
            console.warn(`${LOG} audience-missing: ${id}`);
          }
          return;
        }
        if (signature(u.els[0]) === signature(other)) { tally.identical.push(id); return; }
        other.remove(); // detach from the imported part
        markLive(u.els[0], id);
        markCopy(other, id);
        insertAfter(unitTail(u), [other]);
        tally.split.push(id);
      });
    });

    if (body) {
      // 2. every other section: compare with the same unit in the body part
      liveUnits.forEach((u) => {
        if (contractIds.has(u.id) || u.els[0].hasAttribute(AUD_ATTR)) return;
        const o = orgByKey.get(key(u));
        if (!o) {
          // Not in the organisations view, and the contract defines no whenMissing for it: kept shared.
          tally.missing.push(u.id);
          console.warn(`${LOG} audience-missing (kept shared): ${key(u)}`);
          return;
        }
        if (signature(u.els) === signature(o.els)) { tally.identical.push(u.id); return; }
        markLive(u.els[0], u.id);
        insertAfter(unitTail(u), cloneUnit(o, u.id));
        tally.split.push(u.id);
      });

      // 3. organisations-only units
      const lastInserted = new Map(); // live unit -> last node inserted after it
      let prevCommon = null;
      orgUnits.forEach((o) => {
        if (contractIds.has(o.id)) { if (liveByKey.has(key(o))) prevCommon = liveByKey.get(key(o)); return; }
        const live = liveByKey.get(key(o));
        if (live) { prevCommon = live; return; }
        const copies = cloneUnit(o, o.id);
        let ref = prevCommon ? (lastInserted.get(prevCommon) || unitTail(prevCommon)) : null;
        if (ref) {
          lastInserted.set(prevCommon, insertAfter(ref, copies));
        } else {
          const first = liveUnits[0] && liveUnits[0].els[0];
          if (!first) return;
          copies.forEach((c) => first.before(c));
        }
        tally.organisationsOnly.push(o.id);
      });
    }

    console.log(`${LOG} split [${tally.split.join(', ')}] individuals-only [${tally.individualsOnly.join(', ')}] organisations-only [${tally.organisationsOnly.join(', ')}] identical [${tally.identical.join(', ')}]${tally.missing.length ? ` missing [${tally.missing.join(', ')}]` : ''}`);
    doc.excatAudience = tally;
  }

  if (hookName === 'afterTransform') {
    // Import scaffolding must never leak into the content.
    doc.querySelectorAll('template#excat-organisations').forEach((t) => t.remove());
  }
}
