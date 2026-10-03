/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: course listing metadata for course OVERVIEW pages (/find/courses/<level>/<slug>).
 *
 * The course snapshots carry the Funnelback listing fields as <meta name="…"> tags in the head.
 * beforeTransform reads them (before any cleanup can touch the head) into
 * document.excatCourseMetadata under clean kebab-case keys; the import script appends them as
 * extra rows at the end of the page Metadata block, so a query index over /find/courses/*\/*
 * can drive the online course browser (widgets/online-course-listing).
 * Tab sub-pages (/fees, /structure, …) and fragment imports get nothing. The DOM is not changed.
 *
 * Multi-valued fields (study-mode, location, study-area, duration-filter, intakes) keep the
 * source's ";" separator: study area labels contain commas
 * ("Architecture, building, planning and design").
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// [metadata key, source <meta name>] in output order
const FIELDS = [
  ['course-title', 'title_search_display'],
  ['course-code', 'course_code'],
  ['qualification-type', 'qualification_type_search_display'],
  ['study-level', 'study_level_search_filter'],
  ['study-mode', 'study_mode_search_filter'],
  ['location', 'location_search_filter'],
  ['delivery', 'delivery'],
  ['study-area', 'study_area_search_filter'],
  ['duration-months', 'duration_in_months_search_filter'],
  ['duration-filter', 'duration_filter'],
  ['duration-display', 'duration_search_display'],
  ['intakes', 'intakes_search_display'],
];

const OVERVIEW_PATH = /^\/find\/courses\/[^/]+\/[^/]+$/;

/** True for a course overview page URL (not a tab sub-page, not a fragment import). */
function isCourseOverview(originalURL) {
  if (!originalURL || /#excat-fragment-\d+$/.test(originalURL)) return false;
  let path;
  try {
    path = new URL(originalURL).pathname;
  } catch (e) {
    return false;
  }
  return OVERVIEW_PATH.test(path.replace(/\/$/, '').replace(/\.html?$/, ''));
}

/** Course listing metadata { key: value } (FIELDS order, empty values skipped) from the head. */
function readCourseMetadata(doc) {
  const out = {};
  const head = doc.head || doc;
  FIELDS.forEach(([key, name]) => {
    const el = head.querySelector(`meta[name="${name}"]`);
    const value = el && (el.getAttribute('content') || '').replace(/\s+/g, ' ').trim();
    if (value) out[key] = value;
  });
  return out;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;
  const doc = (element && element.ownerDocument) || (payload && payload.document);
  if (!doc) return;
  const originalURL = payload && payload.params && payload.params.originalURL;
  doc.excatCourseMetadata = isCourseOverview(originalURL) ? readCourseMetadata(doc) : {};
}
