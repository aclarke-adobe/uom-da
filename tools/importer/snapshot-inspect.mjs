/**
 * String-level inspection of saved course snapshots (no DOM parse, so it is fast enough to
 * scan thousands of files). Shared by capture-course-snapshots.mjs and scan-snapshot-gaps.mjs.
 */

// Structure-page dropdowns that render only the selected option. `select` is the control,
// `root` the region whose outerHTML is captured per option (the sample-plan select sits
// beside div.sample-plan, the subject-program select inside div.subject-programs).
const B = "#main div[data-test$='-page']";
export const OPTION_REGIONS = [
  {
    part: 'sample-plan',
    root: `${B} #sample-plans div.sample-plan`,
    select: `${B} #sample-plans .sample-plan__dropdown select`,
    dropdownClass: 'sample-plan__dropdown',
  },
  {
    part: 'subject-programs',
    root: `${B} #available-subjects div.subject-programs`,
    select: `${B} #available-subjects .subject-programs__dropdown select`,
    dropdownClass: 'subject-programs__dropdown',
  },
];

/** Option counts of the region dropdowns in a snapshot, e.g. { 'sample-plan': 2 }. */
export function snapshotSelectRegions(html) {
  const out = {};
  for (const r of OPTION_REGIONS) {
    const re = new RegExp(`class="[^"]*\\b${r.dropdownClass}\\b[^"]*"`, 'g');
    let m;
    let best = 0;
    while ((m = re.exec(html))) {
      const rest = html.slice(m.index, m.index + 20000);
      const sel = rest.match(/<select\b[\s\S]*?<\/select>/i);
      if (sel) best = Math.max(best, (sel[0].match(/<option\b/gi) || []).length);
    }
    if (best > 0) out[r.part] = best;
  }
  return out;
}

export const hasAudienceSwitcher = (html) => /\bid="user-profile-audience-switcher"/.test(html);
export const hasTemplate = (html, id) => new RegExp(`<template\\b[^>]*\\bid="${id}"`).test(html);
export const isStructureUrl = (url) => /\/structure\/?$/.test(new URL(url).pathname);
