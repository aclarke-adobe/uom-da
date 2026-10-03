/* eslint-disable */
/* global WebImporter */
/**
 * Parser for video-split. Base: video (option: split). Authored as "Video (split)".
 * Source: section-landing template, ct-video split sections
 * (div.ct-video.section-alt .section-alt__row:has(.uom-video, .video, iframe)).
 *
 * Output (blocks/video/README.md + video.js `split`): intro beside a single video
 *   row 1 (intro, no video link) = .section-alt__left: heading, text, CTA links
 *   row 2+ (one per player)      = <p><a href="https://www.youtube.com/watch?v=<id>">{title}</a></p> |
 *                                  poster <img> (when present) | caption <p>{title}</p><p>{duration}</p>
 * Option `plain` ("Video (split, plain)"): every player is the newer div.uom-video (uom-video-overlay,
 * no navy tint); the older div.video / iframe players stay "Video (split)".
 * Video URL: data-excat-video-src on the click-to-play root (snapshot contract), else an iframe src.
 * A player without a URL is logged (video-url-missing) and its poster is kept as default content;
 * a video row is never emitted without a link.
 *
 * Source (verified in block-context/video-split/instances/section-landing-01..03):
 *   .section-alt__row > .section-alt__left (h2, p, a.btn--text)
 *                       .section-alt__right > div.uom-video[data-excat-video-src] >
 *                         .uom-video-overlay > .uom-video-overlay__poster[title] > img,
 *                         button[aria-label="Play {title} {duration} video"]
 *                     | div.video[data-excat-video-src] > … .video__img img[alt], .video__label, .video__duration
 *                     | iframe[src*="youtube.com/embed"]
 */

function clean(t) {
  return (t || '').replace(/​/g, '').replace(/\s+/g, ' ').trim();
}

function text(el) {
  return clean(el ? el.textContent : '');
}

function watchUrl(src) {
  if (!src) return '';
  let u;
  try { u = new URL(src.trim(), 'https://www.youtube.com/'); } catch (e) { return ''; }
  const host = u.hostname.replace(/^www\./, '');
  if (/youtube(-nocookie)?\.com$/.test(host)) {
    const id = u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : u.searchParams.get('v');
    return id ? `https://www.youtube.com/watch?v=${id}` : '';
  }
  if (host === 'youtu.be') return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
  if (/vimeo\.com$/.test(host)) {
    const id = u.pathname.split('/').filter(Boolean).pop();
    return id ? `https://vimeo.com/${id}` : '';
  }
  return /\.mp4(\?|$)/i.test(u.pathname) ? u.href : '';
}

/** {href, poster, title, duration} for a player root (div.uom-video / div.video / iframe holder). */
function videoInfo(root) {
  const iframe = root.matches('iframe') ? root : root.querySelector('iframe');
  const src = root.getAttribute('data-excat-video-src')
    || (root.querySelector('[data-excat-video-src]') || { getAttribute: () => '' }).getAttribute('data-excat-video-src')
    || (iframe ? iframe.getAttribute('src') : '');
  const href = watchUrl(src);
  const posterImg = root.querySelector('.uom-video-overlay__poster img, .video__img img, img:not([src^="data:"]):not([src^="blob:"])');
  let poster = posterImg ? (posterImg.getAttribute('src') || '') : '';
  if (/^(data|blob):/.test(poster)) poster = '';
  const btn = root.querySelector('button[aria-label]');
  const label = btn ? clean(btn.getAttribute('aria-label')) : '';
  const m = /^Play\s+(.*?)\s+((?:\d+h\s*)?(?:\d+m\s*)?(?:\d+s)?)\s+video$/i.exec(label);
  const title = clean((root.querySelector('.uom-video-overlay__poster') || { getAttribute: () => '' }).getAttribute('title'))
    || text(root.querySelector('.video__label'))
    || (m && clean(m[1]))
    || clean(posterImg && posterImg.getAttribute('alt'))
    || clean(iframe && iframe.getAttribute('title'));
  const duration = text(root.querySelector('.video__duration')) || (m ? clean(m[2]) : '');
  const alt = clean(posterImg && posterImg.getAttribute('alt')) || title;
  return { href, poster, title, duration, alt };
}

/** One video row: [link] [poster] [caption], or null when there is no URL. */
function videoRow(info, document) {
  if (!info.href) return null;
  const a = document.createElement('a');
  a.href = info.href;
  a.textContent = info.title || info.href;
  const p = document.createElement('p');
  p.append(a);
  const row = [[p]];
  if (info.poster) {
    const img = document.createElement('img');
    img.src = info.poster;
    img.alt = info.alt || '';
    row.push([img]);
  } else row.push('');
  const caption = [];
  if (info.title) { const t = document.createElement('p'); t.textContent = info.title; caption.push(t); }
  if (info.duration) { const d = document.createElement('p'); d.textContent = info.duration; caption.push(d); }
  row.push(caption.length ? caption : '');
  return row;
}

function ctaParagraph(a, document) {
  const link = document.createElement('a');
  link.href = (a.getAttribute('href') || '').trim();
  link.textContent = text(a);
  const p = document.createElement('p');
  const cls = a.className || '';
  if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
  else {
    const wrap = document.createElement(/btn--secondary/.test(cls) ? 'em' : 'strong');
    wrap.append(link);
    p.append(wrap);
  }
  return p;
}

function intro(left, document) {
  const out = [];
  if (!left) return out;
  [...left.children].forEach((el) => {
    if (el.matches('a[href]')) { if (text(el)) out.push(ctaParagraph(el, document)); return; }
    if (!text(el)) return;
    if (/^H[1-6]$/.test(el.tagName)) {
      const h = document.createElement(el.tagName.toLowerCase());
      h.textContent = text(el);
      out.push(h);
      return;
    }
    const btn = el.querySelector('a.btn, a[class*="btn--"]');
    if (btn && text(el) === text(btn)) { out.push(ctaParagraph(btn, document)); return; }
    [...el.attributes].forEach((a) => el.removeAttribute(a.name));
    el.querySelectorAll('*').forEach((c) => [...c.attributes].forEach((a) => { if (a.name !== 'href') c.removeAttribute(a.name); }));
    out.push(el);
  });
  return out;
}

export default function parse(element, { document }) {
  const left = element.querySelector(':scope > .section-alt__left');
  const right = element.querySelector(':scope > .section-alt__right') || element;
  const roots = [...right.querySelectorAll('[data-excat-video-src], .uom-video, div.video')]
    .filter((r, i, all) => !all.some((o) => o !== r && o.contains(r)));
  if (!roots.length) right.querySelectorAll('iframe').forEach((f) => roots.push(f));

  const cells = [];
  const introCell = intro(left, document);
  if (introCell.length) cells.push([introCell, '', '']);
  const leftovers = [];
  roots.forEach((root) => {
    const info = videoInfo(root);
    const row = videoRow(info, document);
    if (row) cells.push(row);
    else {
      console.warn(`[video-split] video-url-missing: ${info.title || '(untitled)'}`);
      if (info.poster) { const img = document.createElement('img'); img.src = info.poster; img.alt = info.alt || ''; const p = document.createElement('p'); p.append(img); leftovers.push(p); }
    }
  });

  if (cells.length < 1 || !roots.some((r) => videoInfo(r).href)) {
    element.replaceWith(...introCell, ...leftovers);
    return;
  }
  // the newer UI-kit player (div.uom-video > .uom-video-overlay: no navy tint on the poster,
  // semibold caption bar) is `plain`; the older div.video / iframe players keep the tinted split
  const plain = roots.length > 0 && roots.every((r) => r.matches('.uom-video') || !!r.querySelector('.uom-video-overlay'));
  const block = WebImporter.Blocks.createBlock(document, { name: 'Video', variants: plain ? ['split', 'plain'] : ['split'], cells });
  element.replaceWith(block, ...leftovers);
}
