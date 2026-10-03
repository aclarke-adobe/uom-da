/*
 * YouTube helpers shared by blocks (blocks must not import each other).
 * Used by blocks/video (youtubeId) and blocks/video-library (click-to-load modal player).
 */

/**
 * The video id of a YouTube URL (youtube.com/watch?v=, /embed/, /shorts/, youtu.be/), or null.
 * @param {string} href
 * @returns {string|null}
 */
export function youtubeId(href) {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return url.pathname.slice(1);
    if (host.endsWith('youtube.com')) {
      return url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    }
  } catch (e) {
    // not a valid URL
  }
  return null;
}

/**
 * Embed URL for a video id with the given player parameters (empty values are skipped).
 * @param {string} id
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function youtubeEmbedSrc(id, params = {}) {
  const url = new URL(`https://www.youtube.com/embed/${encodeURIComponent(id)}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return url.href;
}

/**
 * A YouTube player iframe (created on demand, so nothing loads before the user asks for it).
 * @param {string} id
 * @param {{ title?: string, params?: Record<string, string|number> }} [options]
 * @returns {HTMLIFrameElement}
 */
export function createYoutubeFrame(id, { title = '', params = {} } = {}) {
  const iframe = document.createElement('iframe');
  iframe.src = youtubeEmbedSrc(id, params);
  iframe.title = title || 'YouTube video';
  iframe.setAttribute('allow', 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  return iframe;
}
