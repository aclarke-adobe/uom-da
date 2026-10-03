/* eslint-disable */
/* global WebImporter */
/**
 * Parser for video-library. Base: video-library (a custom block, NOT the library Video block: a
 * filterable gallery of many videos, one row per video). Authored as "Video library".
 * Source: section-landing /study-with-us/on-demand, region div.filter-category (the Vue
 * cards-filter-category component). The rendered region only holds the first 12 cards and no video
 * URLs (the player modals are empty until clicked), so the data comes from the snapshot contract
 * <template id="excat-video-data"> (tools/importer/capture-course-snapshots.mjs): the component's
 * full :data array as JSON, unmodified.
 *
 * Clean-up (user decision; rules and lists in tools/importer/on-demand-cleanup.json, passed by the
 * import script as options.onDemandCleanup):
 *   - drop entries whose YouTube id is unavailable (oEmbed 404) or truncated (not 11 characters);
 *   - drop duplicates (same YouTube id + title; the first is kept, with the duplicate's topics and
 *     study levels added: the source repeats a video to list it under a second topic);
 *   - map topics ("Admissions and scholarships" -> "Applications and scholarships");
 *   - durations "21.59" -> "21:59".
 *
 * Output (blocks/video-library/README.md), source order:
 *   | Video library |
 *   | Heading | <type, "On-demand"> |
 *   | Thumbnail | Title | Video | Study level | Topic | Duration |      (column labels, ignored by the block)
 *   | <img src=img_url> | title | <a href="https://www.youtube.com/watch?v=<id>"> | level(s) | topic(s) | m:ss |
 * Several study levels / topics in one cell are joined with "; " (topic names contain commas).
 * Thumbnails keep their source URL; run-bulk-import rewrites them to /media-da/ from the snapshot's
 * .images.json sidecar (tools/importer/check-images.mjs --download collects them from the template).
 * No template / no usable entry: the region is removed and video-data-missing is logged (a block
 * without video links would be empty).
 */

const LOG = '[video-library]';
const DEFAULT_ID_PATTERN = '^[A-Za-z0-9_-]{11}$';

function readData(document) {
  const tpl = document.querySelector('template#excat-video-data');
  if (!tpl) return null;
  const raw = ((tpl.content && tpl.content.textContent) || tpl.textContent || '').trim();
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch (e) {
    console.warn(`${LOG} template#excat-video-data is not valid JSON: ${e.message}`);
    return null;
  }
}

function youtubeIdOf(entry) {
  const src = String(entry.src || entry.link || '').trim();
  const m = src.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([^/?#&]+)/);
  return m ? m[1] : '';
}

function normaliseDuration(d) {
  const t = String(d || '').trim();
  return /^\d{1,2}(?:[.:]\d{2}){1,2}$/.test(t) ? t.replace(/\./g, ':') : t;
}

function list(v) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return v ? [String(v).trim()].filter(Boolean) : [];
}

/** Apply the clean-up rules; returns { videos, stats }. */
function cleanVideos(data, rules = {}) {
  const idPattern = new RegExp(rules.youtubeIdPattern || DEFAULT_ID_PATTERN);
  const unavailable = rules.unavailableYoutubeIds || {};
  const topicMap = rules.topicMap || {};
  const levelMap = rules.studyLevelMap || {};
  const stats = {
    entries: data.length, unavailable: 0, truncated: 0, duplicate: 0, topicsMapped: 0, durationsNormalised: 0, videos: 0,
  };
  const seen = new Map();
  const videos = [];
  data.forEach((entry) => {
    const id = youtubeIdOf(entry);
    const title = String(entry.title || '').replace(/\s+/g, ' ').trim();
    if (!id || !idPattern.test(id)) { stats.truncated += 1; return; }
    if (Object.prototype.hasOwnProperty.call(unavailable, id)) { stats.unavailable += 1; return; }
    const topics = [...new Set(list(entry.disciplines).map((t) => {
      if (Object.prototype.hasOwnProperty.call(topicMap, t)) { stats.topicsMapped += 1; return topicMap[t]; }
      return t;
    }))];
    const levels = [...new Set(list(entry.study_levels).map((l) => levelMap[l] || l))];
    const key = `${id}\u0000${title}`;
    if (seen.has(key)) {
      // the source repeats a video to list it under a second topic / level: one row, both values
      const first = seen.get(key);
      first.topics = [...new Set([...first.topics, ...topics])];
      first.levels = [...new Set([...first.levels, ...levels])];
      stats.duplicate += 1;
      return;
    }
    const duration = normaliseDuration(entry.duration);
    if (duration !== String(entry.duration || '').trim()) stats.durationsNormalised += 1;
    const video = {
      id, title, levels, topics, duration, type: String(entry.type || '').trim(), thumb: String(entry.img_url || '').trim(),
    };
    seen.set(key, video);
    videos.push(video);
  });
  stats.videos = videos.length;
  return { videos, stats };
}

export default function parse(element, { document, onDemandCleanup }) {
  const data = readData(document);
  const { videos, stats } = data ? cleanVideos(data, onDemandCleanup || {}) : { videos: [], stats: null };
  if (!videos.length) {
    console.warn(`${LOG} video-data-missing: no template#excat-video-data entries; region removed`);
    element.remove();
    return;
  }
  const types = [...new Set(videos.map((v) => v.type).filter(Boolean))];
  if (types.length > 1) console.warn(`${LOG} ${types.length} video types (${types.join(', ')}): the block shows one group`);
  console.log(`${LOG} ${stats.entries} entries -> ${stats.videos} videos (dropped: unavailable ${stats.unavailable}, truncated ${stats.truncated}, duplicate ${stats.duplicate}; topics mapped ${stats.topicsMapped}; durations normalised ${stats.durationsNormalised})`);

  const cells = [
    ['Heading', types[0] || 'On-demand'],
    ['Thumbnail', 'Title', 'Video', 'Study level', 'Topic', 'Duration'],
  ];
  videos.forEach((v) => {
    let thumb = '';
    if (v.thumb) {
      thumb = document.createElement('img');
      thumb.setAttribute('src', v.thumb);
      thumb.setAttribute('alt', '');
    }
    const href = `https://www.youtube.com/watch?v=${v.id}`;
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = href;
    cells.push([thumb, v.title, a, v.levels.join('; '), v.topics.join('; '), v.duration]);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'Video library', cells });
  element.replaceWith(block);
}
