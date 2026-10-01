/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au course-detail section breaks + Section Metadata.
 *
 * Course pages only. The homepage keeps using unimelb-sections.js. This variant also reads
 * the audience markers set by unimelb-course-audience.js and adds an Audience row.
 * The spec is migration-work/course-detail/mapping-notes.md, "Audience contract", step 5.
 *
 * Run order: unimelb-course-cleanup -> unimelb-course-audience -> unimelb-course-sections.
 *
 * beforeTransform (before parsers replace any section element), sections in reverse:
 *   - resolve the section by [data-excat-section-start="<id>"] first, then by selector[];
 *     honour [data-excat-section-skip~="<id>"];
 *   - insert <hr data-excat-course-section="<id>"> before it, carrying Style/Audience;
 *   - if it was split, do the same before [data-excat-section-start="<id>--international"].
 * afterTransform: turn every marker <hr> into <hr> + Section Metadata {Style?, Audience?}.
 *
 * A marker <hr> directly before an element is never added twice, so running the hook twice
 * does not double up breaks.
 */
const MARK = 'data-excat-course-section';
const META_STYLE = 'data-excat-meta-style';
const META_AUDIENCE = 'data-excat-meta-audience';
const META_FIRST = 'data-excat-meta-first';
const AUD_ATTR = 'data-excat-audience';
const START_ATTR = 'data-excat-section-start';
const SKIP_ATTR = 'data-excat-section-skip';

function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
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

function hasMarkerBefore(el) {
  const prev = el.previousElementSibling;
  return !!(prev && prev.tagName === 'HR' && prev.hasAttribute(MARK));
}

function insertBreak(el, id, style, audience, isFirst) {
  if (hasMarkerBefore(el)) return;
  const hr = el.ownerDocument.createElement('hr');
  hr.setAttribute(MARK, id);
  if (style) hr.setAttribute(META_STYLE, style);
  if (audience) hr.setAttribute(META_AUDIENCE, audience);
  if (isFirst) hr.setAttribute(META_FIRST, '');
  el.before(hr);
}

export default function transform(hookName, element, payload) {
  const allSections = (payload && payload.template && payload.template.sections) || [];
  const sections = allSections.length > 1 ? allSections : [];

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const { id } = section;
      if (element.querySelector(`[${SKIP_ATTR}~="${id}"]`)) continue;

      const el = element.querySelector(`[${START_ATTR}="${id}"]`) || querySection(element, section.selector);
      if (!el) continue; // section not on this page

      const style = section.style || null;
      const audience = el.getAttribute(AUD_ATTR) || null;

      const intl = element.querySelector(`[${START_ATTR}="${id}--international"]`);
      if (intl) insertBreak(intl, `${id}--international`, style, 'international', false);

      if (i === 0 && !style && !audience) continue; // first section: no break, no metadata
      insertBreak(el, id, style, audience, i === 0);
    }
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
