/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au section breaks + Section Metadata.
 * Uses payload.template.sections from page-templates.json (selector arrays tried in order).
 * Selectors are scoped to span.optimizely_experiment__block:first-of-type (visible
 * Optimizely variant). Inserting <hr> never changes :first-of-type / :nth-of-type
 * matches for span/div siblings.
 *
 * Breaks are inserted in beforeTransform (before parsers replace section elements);
 * Section Metadata is inserted in afterTransform, anchored to a marker <hr>.
 */
const SECTION_MARKER_ATTR = 'data-excat-section-id';

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

export default function transform(hookName, element, payload) {
  const allSections = (payload && payload.template && payload.template.sections) || [];
  // Only templates with 2+ sections get breaks/metadata.
  const sections = allSections.length > 1 ? allSections : [];

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue;
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue;

      const hr = element.ownerDocument.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // first section never gets a leading break
      }
    }
  }
}
