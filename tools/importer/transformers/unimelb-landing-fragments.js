/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au section-landing shared fragments (fragmentContract).
 *
 * Spec: migration-work/section-landing/mapping-notes.md, "Shared fragments", and
 * templates[section-landing].fragmentContract in tools/importer/page-templates.json (16 bands).
 *
 * Run order (both hooks): unimelb-landing-cleanup -> unimelb-landing-audience ->
 * unimelb-landing-fragments -> unimelb-landing-sections. The identity is computed after the
 * cleanup (chrome removed, links fixed) and after the audience split (so an organisations copy of
 * a band is checked on its own).
 *
 * BAND. A band is one section unit: the region matching the fragment's section (and one of its
 * selectors) plus the joinWithPrevious regions that follow it (e.g. the "View all news" button
 * after the pdo-newsroom ct-newslisting). The identity is computed on the region only, exactly as
 * in the contract: clone, drop svg/script/style; text = textContent, whitespace collapsed and
 * trimmed; links = every a[href] trimmed, https://study.unimelb.edu.au origin and trailing slash
 * removed, joined "|"; media = every img[src] not starting with data:, joined "|"; each hashed
 * with djb2-xor (h = 5381; h = ((h * 33) ^ c) >>> 0; h.toString(36)). All three must equal
 * fragment.identity. No match -> the page keeps its own copy (logged).
 *
 * ---------------------------------------------------------------------------------------------
 * HANDSHAKE WITH THE IMPORT SCRIPT
 *
 * Mode is read from (first hit wins):
 *   payload.excatFragment                         explicit slug, set by the import script, or
 *   payload.params.originalURL / payload.url       "...#excat-fragment=<slug>"
 * No slug -> PAGE mode. A slug -> FRAGMENT mode.
 *
 * beforeTransform, both modes: every matching band region gets
 *   data-excat-fragment="<slug>"   (and data-excat-fragment-path="<path>" on the start region)
 * and document.excatFragments = [{ slug, path, section, audience, regions }] lists the matches.
 *
 * PAGE mode (beforeTransform): each matching band (all its regions) is replaced by
 *   <div data-excat-fragment-link="<slug>" [data-excat-audience=..]><p><a href="<path>"><path></a></p></div>
 * so no parser sees the band. The sections transformer gives that placeholder a section of its own
 * (<hr> before it, NO Section Metadata Style; an Audience key is kept if the band was keyed) and
 * starts a new section at the next region. The cleanup's afterTransform strips the data-excat-*
 * attributes, leaving <hr><p><a href="/fragments/section-landing/<slug>">…</a></p><hr>.
 * The import script needs to do nothing else in page mode (optionally report
 * document.excatFragments).
 *
 * FRAGMENT mode (beforeTransform): the first matching band for <slug> is kept, its Audience marks
 * are removed, and every other region of #main (and everything around #main in the element) is
 * removed. Parsers, cleanup and sections then run as usual, so the output is the band with its
 * normal section mapping and its Section Metadata Style (first section: Metadata, no leading <hr>).
 * The transformer sets
 *   document.excatFragmentMode = { slug, path, found: true|false, sourcePage }
 * The import script must, for "<page url>#excat-fragment=<slug>" (as import-course-detail.js does
 * with #excat-fragment-N):
 *   1. keep params.originalURL with the hash when calling the transformers (or pass
 *      payload.excatFragment = <slug>);
 *   2. after afterTransform, read document.excatFragmentMode:
 *        found === false -> emit nothing (return []) and report "fragment-missing";
 *        found === true  -> return [{ element: main, path: document.excatFragmentMode.path, report }]
 *      and skip WebImporter.rules.createMetadata (a fragment has no page metadata).
 *   3. import each fragment once, from fragment.sourcePage (fragmentContract.fragments[].sourcePage).
 * ---------------------------------------------------------------------------------------------
 */
const AUD_ATTR = 'data-excat-audience';
const START_ATTR = 'data-excat-section-start';
const FRAGMENT_ATTR = 'data-excat-fragment';
const FRAGMENT_PATH_ATTR = 'data-excat-fragment-path';
const FRAGMENT_LINK_ATTR = 'data-excat-fragment-link';
const ORG_SUFFIX = '--organisations';
const STUDY_ORIGIN_RE = /^https?:\/\/study\.unimelb\.edu\.au/i;
const LOG = '[landing-fragments]';

/* ---------- shared section-unit model (same as the landing audience / sections transformers) ---------- */

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

/* ---------- identity ---------- */

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function identityOf(el) {
  const c = el.cloneNode(true);
  c.querySelectorAll('svg, script, style').forEach((x) => x.remove());
  const text = (c.textContent || '').replace(/\s+/g, ' ').trim();
  const links = [...c.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href').trim().replace(STUDY_ORIGIN_RE, '').replace(/\/$/, ''))
    .join('|');
  // html2md's preProcess has already turned data: images into blob: URLs (random per run) by the
  // time transformers run; both stand for the same inline images the contract excludes.
  const media = [...c.querySelectorAll('img[src]:not([src^="data:"]):not([src^="blob:"])')].map((i) => i.getAttribute('src')).join('|');
  return { text: djb2(text), links: djb2(links), media: djb2(media), chars: text.length };
}

function sameIdentity(a, b) {
  return !!b && a.text === b.text && a.links === b.links && a.media === b.media;
}

function requestedSlug(payload) {
  if (payload && payload.excatFragment) return String(payload.excatFragment);
  const urls = [payload && payload.params && payload.params.originalURL, payload && payload.url];
  for (const u of urls) {
    const m = u && /#excat-fragment=([\w-]+)/.exec(String(u));
    if (m) return m[1];
  }
  return null;
}

// Keep only `keep` inside element: every sibling on the path from #main up to element, and every
// other region of #main, is removed.
function pruneTo(element, main, keep) {
  const keepSet = new Set(keep);
  contentRegions(main).forEach((r) => { if (!keepSet.has(r)) r.remove(); });
  [...main.children].forEach((c) => { if (!keepSet.has(c) && !keep.some((k) => c.contains(k))) c.remove(); });
  for (let node = main; node && node !== element; node = node.parentElement) {
    const parent = node.parentElement;
    if (!parent) break;
    [...parent.children].forEach((sib) => { if (sib !== node) sib.remove(); });
  }
}

export default function transform(hookName, element, payload) {
  const template = (payload && payload.template) || {};
  const contract = template.fragmentContract;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    doc.excatFragments = [];
    doc.excatFragmentMode = null;
    if (!contract || !toList(contract.fragments).length) return;
    const fragments = contract.fragments;
    const slug = requestedSlug(payload);
    const bySection = {};
    fragments.forEach((f) => { (bySection[f.section] = bySection[f.section] || []).push(f); });

    const units = sectionUnits(element, template);
    const matches = [];
    units.forEach((u) => {
      if (!u.def || !bySection[u.def.id]) return;
      const region = u.els[0];
      const id = identityOf(region);
      const f = bySection[u.def.id].find((x) => sameIdentity(id, x.identity)
        && toList(x.selector).some((sel) => safeMatches(region, sel)));
      if (!f) {
        console.log(`${LOG} no identity match, kept inline: ${u.def.id} (text ${id.text}, links ${id.links}, media ${id.media}, ${id.chars} chars)`);
        return;
      }
      u.els.forEach((el) => el.setAttribute(FRAGMENT_ATTR, f.slug));
      region.setAttribute(FRAGMENT_PATH_ATTR, f.path);
      matches.push({ unit: u, fragment: f });
    });
    doc.excatFragments = matches.map(({ unit, fragment }) => ({
      slug: fragment.slug,
      path: fragment.path,
      section: unit.def.id,
      audience: unit.els[0].getAttribute(AUD_ATTR) || null,
      regions: unit.els.length,
    }));

    if (slug) {
      // FRAGMENT mode
      const f = fragments.find((x) => x.slug === slug);
      const hit = matches.find((m) => m.fragment.slug === slug);
      doc.excatFragmentMode = { slug, path: f ? f.path : null, found: !!hit, sourcePage: f ? f.sourcePage : null };
      if (!f) { console.warn(`${LOG} fragment-missing: unknown slug ${slug}`); return; }
      if (!hit) { console.warn(`${LOG} fragment-missing: band ${slug} not found (or identity mismatch) on this page`); return; }
      const main = element.querySelector('#main') || element;
      hit.unit.els.forEach((el) => { el.removeAttribute(AUD_ATTR); el.removeAttribute(START_ATTR); });
      pruneTo(element, main, hit.unit.els);
      console.log(`${LOG} fragment mode: ${slug} -> ${f.path} (${hit.unit.els.length} region(s))`);
      return;
    }

    // PAGE mode: replace each matching band with a fragment link placeholder
    matches.forEach(({ unit, fragment }) => {
      const first = unit.els[0];
      const holder = doc.createElement('div');
      holder.setAttribute(FRAGMENT_LINK_ATTR, fragment.slug);
      const audience = first.getAttribute(AUD_ATTR);
      if (audience) holder.setAttribute(AUD_ATTR, audience);
      const p = doc.createElement('p');
      const a = doc.createElement('a');
      a.setAttribute('href', fragment.path);
      a.textContent = fragment.path;
      p.append(a);
      holder.append(p);
      first.before(holder);
      unit.els.forEach((el) => el.remove());
      console.log(`${LOG} ${unit.def.id} -> ${fragment.path}${unit.els.length > 1 ? ` (+${unit.els.length - 1} joined region(s))` : ''}${audience ? ` [${audience}]` : ''}`);
    });
  }

  if (hookName === 'afterTransform') {
    // Nothing to do: the cleanup's afterTransform strips data-excat-fragment* attributes.
  }
}
