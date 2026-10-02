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
// Short-course / microcredential "individuals vs organisations" (b2c/b2b) switcher; its
// organisations view is captured as <template id="excat-organisations">.
export const hasB2bSwitcher = (html) => /\bid="page-short-course-audience-switcher"/.test(html);

/** The default document only (everything before the first appended excat template). */
const mainDoc = (html) => {
  const i = html.search(/<template\b[^>]*\bid="excat-/);
  return i >= 0 ? html.slice(0, i) : html;
};

/**
 * Click-to-play players (v17.9 button.video__btn / v17.11 button.uom-video-overlay__play-button)
 * vs players carrying data-excat-video-src.
 */
export function videoPlayerStats(html) {
  const doc = mainDoc(html);
  return {
    buttons: (doc.match(/<button\b[^>]*\bclass="[^"]*\b(video__btn|uom-video-overlay__play-button)\b/g) || []).length,
    resolved: (doc.match(/\bdata-excat-video-src="[^"]+"/g) || []).length,
  };
}

/** div.full-width-image elements vs those carrying data-excat-bg. */
export function fullWidthImageStats(html) {
  const tags = mainDoc(html).match(/<div\b[^>]*\bclass="[^"]*\bfull-width-image\b[^"]*"[^>]*>/g) || [];
  return { total: tags.length, marked: tags.filter((t) => /\bdata-excat-bg="[^"]+"/.test(t)).length };
}
export const hasTemplate = (html, id) => new RegExp(`<template\\b[^>]*\\bid="${id}"`).test(html);
export const isStructureUrl = (url) => /\/structure\/?$/.test(new URL(url).pathname);
