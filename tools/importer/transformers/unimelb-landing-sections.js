/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au section-landing section breaks + Section Metadata.
 *
 * section-landing pages only. The homepage keeps unimelb-sections.js, course pages keep
 * unimelb-course-sections.js (first-match model). This one implements
 * templates[section-landing].sectionMatching (page-templates.json; mapping-notes.md "Matching
 * model"):
 *   - mode "all": every region (a #main child, or a child of the default Optimizely span when it
 *     has not been unwrapped) that matches a section selector starts a section with that entry's
 *     style, in document order; regions are taken one by one, so repeated components each start a
 *     section;
 *   - joinWithPrevious regions never start a section; they continue the previous one (precedence
 *     over section starts);
 *   - regions that match no entry continue the current section;
 *   - every selector uses the ROOT form :is(#main, #main > .optimizely_experiment >
 *     span.optimizely_experiment__block:first-of-type) > X, so matching works with or without the
 *     visible Optimizely span; matching uses Element.matches, so it is independent of where the
 *     region sits.
 *
 * Markers from the other landing transformers:
 *   data-excat-section-start="<id>" / "<id>--organisations" + data-excat-audience (audience
 *     transformer): the region starts section <id>, with Audience individuals|organisations;
 *   data-excat-fragment-link="<slug>" (fragments transformer, page mode): the placeholder gets a
 *     section of its own with NO Style (the style lives in the fragment), Audience kept if set,
 *     and the next region always starts a new section.
 *
 * Run order (both hooks): unimelb-landing-cleanup -> unimelb-landing-audience ->
 * unimelb-landing-fragments -> unimelb-landing-sections.
 *
 * beforeTransform (before parsers replace any region): insert
 *   <hr data-excat-landing-section="<id>" [data-excat-landing-style] [data-excat-landing-audience]>
 * before each section start. The first section gets a marker only when it has Style or Audience
 * (flagged data-excat-landing-first: Metadata without a leading break).
 * story-article only (keyed on the template name): a section whose default content is a centred
 * h2 title with centred text gets `centered`; h2.title--md / h2.uom-title-3 count as sans section
 * titles (heading-sans) like h2.heading-section; each lead paragraph (p.lead / p.lead.text-center)
 * starts a section with Style `lead` / `lead-center` (see unitLeads).
 * afterTransform: every marker <hr> -> <hr> + Section Metadata {Style?, Audience?}; the first
 * section's marker <hr> is removed after its metadata is placed. A marker directly before a region
 * is never added twice, so running the hook twice does not double up breaks.
 */
const MARK = 'data-excat-landing-section';
const META_STYLE = 'data-excat-landing-style';
const META_AUDIENCE = 'data-excat-landing-audience';
const META_FIRST = 'data-excat-landing-first';
const AUD_ATTR = 'data-excat-audience';
const START_ATTR = 'data-excat-section-start';
const FRAGMENT_LINK_ATTR = 'data-excat-fragment-link';
const ORG_SUFFIX = '--organisations';
const LOG = '[landing-sections]';

/* ---------- shared section-unit model (same as the landing audience / fragments transformers) ---------- */

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

/* ---------- breaks ---------- */

function hasMarkerBefore(el) {
  const prev = el.previousElementSibling;
  return !!(prev && prev.tagName === 'HR' && prev.hasAttribute(MARK));
}

function insertBreak(el, id, style, audience, isFirst) {
  if (hasMarkerBefore(el)) return false;
  const hr = el.ownerDocument.createElement('hr');
  hr.setAttribute(MARK, id || 'section');
  if (style) hr.setAttribute(META_STYLE, style);
  if (audience) hr.setAttribute(META_AUDIENCE, audience);
  if (isFirst) hr.setAttribute(META_FIRST, '');
  el.before(hr);
  return true;
}

/* ---------- section title style ---------- */

// Section option for a UI-kit section title (h2.heading-section: sans 600, 24px / 32px from
// tablet) left in default content; plain h2s keep the serif. Titles inside a block (e.g. the
// split-section h2 in Columns (split)) are styled by the block.
const HEADING_SANS = 'heading-sans';

function blockElements(root, template) {
  const els = [];
  toList(template && template.blocks).forEach((b) => toList(b.instances).forEach((sel) => {
    try {
      els.push(...root.ownerDocument.querySelectorAll(sel));
    } catch (e) { /* invalid selector */ }
  }));
  return els;
}

// story-article also reads the UI-kit title classes with the same sans title-3 type as
// .heading-section (ui.min.css: .title--md, .uom-title-3); section-landing keeps .heading-section.
const SANS_TITLE = { 'story-article': 'h2:is(.heading-section, .title--md, .uom-title-3)' };
const SANS_TITLE_DEFAULT = 'h2.heading-section';

function hasDefaultSectionTitle(unit, blocks, template) {
  const sel = SANS_TITLE[template && template.name] || SANS_TITLE_DEFAULT;
  return unit.els.some((el) => [...el.querySelectorAll(sel)]
    .some((h) => !blocks.some((b) => b.contains(h))));
}

function withStyle(style, token) {
  const list = (style || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!list.includes(token)) list.push(token);
  return list.join(', ');
}

/* ---------- story-article: centred sections and lead paragraphs ---------- */

// Templates with the two story rules below (keyed on the template name; section-landing has neither).
const STORY_RULES = new Set(['story-article']);
const CENTERED = 'centered';
const LEAD = 'lead';
const LEAD_CENTER = 'lead-center';
const TEXT_ELS = 'h1, h2, h3, h4, h5, h6, p, li';

function isCentredText(el, region) {
  for (let n = el; n && n !== region.parentElement; n = n.parentElement) {
    if (n.classList && n.classList.contains('text-center')) return true;
    if (/text-align\s*:\s*center/i.test(n.getAttribute('style') || '')) return true;
  }
  return false;
}

function regionOfUnit(unit, el) {
  return unit.els.find((r) => r.contains(el)) || unit.els[0];
}

/** Default-content text elements of a unit (outside every block instance), in document order. */
function defaultTextEls(unit, blocks) {
  const out = [];
  unit.els.forEach((r) => {
    const own = r.matches(TEXT_ELS) ? [r] : [];
    [...own, ...r.querySelectorAll(TEXT_ELS)].forEach((el) => {
      if (!/\S/.test(el.textContent || '') || blocks.some((b) => b.contains(el))) return;
      if (el.matches('li') && el.querySelector(TEXT_ELS)) return;
      out.push(el);
    });
  });
  return out;
}

/**
 * A centred section title: the unit's default content opens with an h2 marked text-center (class
 * or inline style, on it or a wrapper in its region) and all its default-content text is centred
 * the same way (e.g. graduate-research "Make a difference through graduate research", the navy
 * stats band's h2.uom-title-3.text-center). Left-aligned body text keeps the section uncentred.
 */
function isCentredSection(unit, blocks) {
  const els = defaultTextEls(unit, blocks);
  if (!els.length || els[0].tagName !== 'H2') return false;
  return els.every((el) => isCentredText(el, regionOfUnit(unit, el)));
}

/** True when nothing with content precedes `target` inside the unit. */
function opensUnit(unit, target) {
  for (const r of unit.els) {
    if (r === target || r.contains(target)) {
      const doc = r.ownerDocument;
      const walker = doc.createTreeWalker(r, 1 | 4 /* SHOW_ELEMENT | SHOW_TEXT */);
      for (let n = walker.currentNode; n; n = walker.nextNode()) {
        if (n === target) return true;
        if (n.nodeType === 3 && /\S/.test(n.textContent)) return false;
        if (n.nodeType === 1 && n.matches('img, iframe, video, picture, table')) return false;
      }
      return true;
    }
    if (hasContent(r)) return false;
  }
  return false;
}

/**
 * Lead paragraphs (source p.lead / p.lead.text-center lose their class at import): each one in
 * default content starts a section with Style `lead` / `lead-center` (styles/story.css styles the
 * first paragraph of such a section). A lead opening its unit adds the token to that section's
 * style; any other lead (e.g. the second of the languages' two intro leads) gets a break of its
 * own, carrying the unit's style (minus lead tokens) and Audience, so the surrounding sections keep
 * their styles and metadata.
 * Returns { token, splits: [{ el, token }] } for the unit.
 */
function unitLeads(unit, blocks) {
  const leads = [];
  unit.els.forEach((r) => {
    const own = r.matches('p.lead') ? [r] : [];
    [...own, ...r.querySelectorAll('p.lead')].forEach((p) => {
      if (!/\S/.test(p.textContent || '') || blocks.some((b) => b.contains(p))) return;
      leads.push({ el: p, token: p.classList.contains('text-center') ? LEAD_CENTER : LEAD });
    });
  });
  let token = null;
  const splits = [];
  leads.forEach((l, i) => {
    if (i === 0 && opensUnit(unit, l.el)) token = l.token;
    else splits.push(l);
  });
  return { token, splits };
}

function withoutLead(style) {
  return (style || '').split(',').map((s) => s.trim()).filter((s) => s && s !== LEAD && s !== LEAD_CENTER).join(', ');
}

export default function transform(hookName, element, payload) {
  const template = (payload && payload.template) || {};

  if (hookName === 'beforeTransform') {
    if (!toList(template.sections).length) return;
    const units = sectionUnits(element, template);
    const blocks = blockElements(element, template);
    const story = STORY_RULES.has(template.name);
    units.forEach((u, i) => {
      const start = u.els[0];
      let style = u.fragmentLink ? null : ((u.def && u.def.style) || null);
      if (story && !u.fragmentLink && isCentredSection(u, blocks)) style = withStyle(style, CENTERED);
      if (!u.fragmentLink && hasDefaultSectionTitle(u, blocks, template)) style = withStyle(style, HEADING_SANS);
      const leads = story && !u.fragmentLink ? unitLeads(u, blocks) : { token: null, splits: [] };
      const carry = style;
      if (leads.token) style = withStyle(style, leads.token);
      const audience = start.getAttribute(AUD_ATTR) || null;
      leads.splits.forEach((l) => insertBreak(l.el, LEAD, withStyle(withoutLead(carry), l.token), audience, false));
      if (i === 0 && !style && !audience) return; // first section: no break, no metadata
      insertBreak(start, u.id, style, audience, i === 0);
    });
    // section sequence for the import report, e.g. "banner-hero content-white fragment:personalised-advice …"
    element.ownerDocument.excatSections = units.map((u) => `${u.id || '(none)'}${u.els[0].getAttribute(AUD_ATTR) ? `[${u.els[0].getAttribute(AUD_ATTR)}]` : ''}`);
    const unmatched = units.filter((u) => !u.def && !u.fragmentLink).length;
    console.log(`${LOG} ${units.length} sections (${units.filter((u) => u.els.length > 1).length} with joined/continued regions${unmatched ? `, ${unmatched} without a section entry` : ''})`);
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll(`hr[${MARK}]`).forEach((hr) => {
      const cells = {};
      const style = hr.getAttribute(META_STYLE);
      const audience = hr.getAttribute(META_AUDIENCE);
      if (style) cells.Style = style;
      if (audience) cells.Audience = audience;
      if (Object.keys(cells).length) {
        const metadata = WebImporter.Blocks.createBlock(element.ownerDocument, {
          name: 'Section Metadata',
          cells,
        });
        hr.after(metadata);
      }
      if (hr.hasAttribute(META_FIRST)) {
        hr.remove(); // the first section never gets a leading break
        return;
      }
      [MARK, META_STYLE, META_AUDIENCE, META_FIRST].forEach((a) => hr.removeAttribute(a));
    });
  }
}
