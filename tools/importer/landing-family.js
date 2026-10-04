/**
 * Templates built on the section-landing model (Matrix / UI kit ct-* components): the parsers
 * shared with the homepage and course importers branch on this instead of one template name.
 * story-article is the section-landing entry plus story deltas
 * (migration-work/story-article/analysis.md).
 */
export const LANDING_FAMILY = new Set(['section-landing', 'story-article']);

/** True when the import runs a section-landing-family template (by template name). */
export function isLandingFamily(template) {
  return LANDING_FAMILY.has(template);
}
