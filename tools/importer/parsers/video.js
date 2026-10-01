/* eslint-disable */
/* global WebImporter */
/**
 * Parser for video. Base: video (no options). Authored as "Video".
 * Source: course-detail template (overview, career outcomes, student experience, majors).
 *
 * Output: the per-sequence structure in migration-work/course-detail/*\/authoring-analysis.json
 * (blocks/video/video.js finds the video link and poster anywhere in the row, so this is equivalent
 * to the library's single-cell link + poster). 1 row per video:
 *   cell 1 = <p><a href="https://www.youtube.com/watch?v={id}">{iframe title or URL}</a></p>
 *   cell 2 = poster <img src="https://i.ytimg.com/vi/{id}/hqdefault.jpg"> (YouTube only; hqdefault
 *            always exists, maxresdefault does not for every video)
 *   [cell 3 = caption paragraph(s), when the source has a figcaption]
 * Vimeo: https://vimeo.com/{id} link, no poster. Embedly wrappers are unwrapped to their YouTube URL.
 *
 * Source (verified in block-context/video/source.html + instances/01..03):
 *   div.embed > iframe[src*="youtube.com/embed/"][title]
 *   p > iframe                      (the p can hold other inline content: it is kept, split around
 *                                    the block, so no default content is lost)
 *   figure.figure--embed > iframe [+ figcaption]
 *   iframe[src*="cdn.embedly.com/widgets/media.html?src=…youtube…"]
 * Videos inside .alumniprofile are excluded by the instance selectors (quote-profile owns them).
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

/** { href, poster } for an iframe src, or null when it is not a supported video. */
function videoFrom(src) {
  if (!src) return null;
  let url;
  try { url = new URL(src, 'https://study.unimelb.edu.au/'); } catch (e) { return null; }
  if (/embedly\.com$/.test(url.hostname)) {
    const inner = url.searchParams.get('src') || url.searchParams.get('url');
    return inner ? videoFrom(inner) : null;
  }
  const host = url.hostname.replace(/^www\./, '');
  if (/youtube(-nocookie)?\.com$/.test(host)) {
    const id = url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : url.searchParams.get('v');
    if (!id) return null;
    return { href: `https://www.youtube.com/watch?v=${id}`, poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    return id ? { href: `https://www.youtube.com/watch?v=${id}`, poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } : null;
  }
  if (/vimeo\.com$/.test(host)) {
    const id = url.pathname.split('/').filter(Boolean).pop();
    return id ? { href: `https://vimeo.com/${id}`, poster: null } : null;
  }
  return null;
}

export default function parse(element, { document }) {
  const iframes = [...(element.matches('iframe') ? [element] : element.querySelectorAll('iframe'))];
  const cells = [];
  iframes.forEach((iframe) => {
    const v = videoFrom(iframe.getAttribute('src') || iframe.getAttribute('data-src'));
    if (!v) return;
    const link = document.createElement('a');
    link.href = v.href;
    link.textContent = (iframe.getAttribute('title') || '').replace(/\s+/g, ' ').trim() || v.href;
    const p = document.createElement('p');
    p.append(link);
    const row = [[p]];
    if (v.poster) {
      const img = document.createElement('img');
      img.src = v.poster;
      img.alt = (iframe.getAttribute('title') || '').trim();
      row.push([img]);
    }
    const caption = cleanText(element.querySelector('figcaption'));
    if (caption) {
      const cp = document.createElement('p');
      cp.textContent = caption;
      if (!v.poster) row.push('');
      row.push([cp]);
    }
    cells.push(row);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Keep any other content of the wrapper (p > iframe + text; div.embed > iframe + "Who is it for?";
  // figure text) as default content around the block, split at the iframe.
  const before = [];
  const after = [];
  let seen = false;
  let cur = document.createElement('p');
  const flush = () => {
    if (cleanText(cur)) (seen ? after : before).push(cur);
    cur = document.createElement('p');
  };
  [...element.childNodes].forEach((n) => {
    if (n.nodeType === 8) return;
    if (n.nodeType === 1 && (n.tagName === 'IFRAME' || n.querySelector('iframe'))) { flush(); seen = true; return; }
    if (n.nodeType === 1 && n.tagName === 'FIGCAPTION') return; // already the caption cell
    if (n.nodeName === 'BR') return;
    if (n.nodeType === 1 && /^(P|H[1-6]|UL|OL|BLOCKQUOTE|DIV)$/.test(n.tagName)) {
      flush();
      if (cleanText(n)) (seen ? after : before).push(n);
      return;
    }
    cur.append(n);
  });
  flush();

  const width = Math.max(...cells.map((r) => r.length));
  cells.forEach((r) => { while (r.length < width) r.push(''); });
  const block = WebImporter.Blocks.createBlock(document, { name: 'Video', cells });
  element.replaceWith(...before, block, ...after);
}
