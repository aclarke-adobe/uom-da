/* eslint-disable */
/* global WebImporter */
/**
 * Parser for video-shorts. Base: video (option: shorts). Authored as "Video (shorts)".
 * Source: section-landing template, portrait video testimonials
 * (div.ct-testimonial.section-alt .section-alt__right div.testimonials-alt--video; 7 pages / 12 items).
 *
 * Output (blocks/video/README.md + video.js `shorts`): one row per portrait video
 *   <p><a href="https://www.youtube.com/watch?v=<id>">{title}</a></p> | caption <p>{title}</p><p>{cite}</p>[<p>{duration}</p>]
 * There is no poster image (the source preview is a looping .mp4 <video>, not authorable).
 * The intro (heading beside the grid) is the section's default content, not part of the block.
 * Video URL from data-excat-video-src; an item without it is logged (video-url-missing) and its
 * title / cite are kept as default content.
 *
 * Source (verified in block-context/video-shorts/instances/section-landing-01.html):
 *   div.testimonials-alt--video > .card-portrait > h3.card-portrait__title > span, cite.card-portrait__description,
 *     div.video.video--portrait[data-excat-video-src] > video > source, button > .video__duration
 * Iteration is keyed on .card-portrait (block wrapper).
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
  return '';
}

function para(t, document) {
  const p = document.createElement('p');
  p.textContent = t;
  return p;
}

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('.card-portrait')];
  if (!items.length) items = [element];
  const cells = [];
  const leftovers = [];
  items.forEach((item) => {
    const title = text(item.querySelector('.card-portrait__title, h3, h4'));
    const cite = text(item.querySelector('cite, .card-portrait__description'));
    const root = item.querySelector('[data-excat-video-src]') || (item.hasAttribute('data-excat-video-src') ? item : null);
    const iframe = item.querySelector('iframe');
    const href = watchUrl((root && root.getAttribute('data-excat-video-src')) || (iframe && iframe.getAttribute('src')));
    const duration = text(item.querySelector('.video__duration'));
    if (!href) {
      console.warn(`[video-shorts] video-url-missing: ${title || cite || '(untitled)'}`);
      if (title) { const h = document.createElement('h3'); h.textContent = title; leftovers.push(h); }
      if (cite) leftovers.push(para(cite, document));
      return;
    }
    const a = document.createElement('a');
    a.href = href;
    a.textContent = title || cite || href;
    const link = document.createElement('p');
    link.append(a);
    const caption = [];
    if (title) caption.push(para(title, document));
    if (cite) caption.push(para(cite, document));
    if (duration) caption.push(para(duration, document));
    cells.push([[link], caption.length ? caption : '']);
  });

  if (!cells.length) {
    element.replaceWith(...leftovers);
    return;
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'Video', variants: ['shorts'], cells });
  element.replaceWith(block, ...leftovers);
}
