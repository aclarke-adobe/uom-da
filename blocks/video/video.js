/*
 * Video block
 * Intro row (optional): a row without a video link holding a heading and text.
 * Video rows: a link to the video (YouTube, Vimeo or .mp4), an optional poster image and
 * optional caption text (title, duration). The poster shows a play button (YouTube's red
 * button for YouTube links); the player loads on click (or lazily when in view if there is
 * no poster).
 * Options: split (intro beside a single video), shorts (intro beside a grid of
 * portrait 9:16 videos with captions).
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = ['split', 'shorts'];
const VIDEO_LINK = /youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)/i;
const YOUTUBE_LINK = /youtube\.com|youtu\.be/i;

function embedSrc(href, autoplay) {
  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, '');
  const params = autoplay ? '?autoplay=1&rel=0' : '?rel=0';
  if (host === 'youtu.be') return `https://www.youtube.com/embed/${url.pathname.slice(1)}${params}`;
  if (host.endsWith('youtube.com')) {
    const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    return `https://www.youtube.com/embed/${id}${params}`;
  }
  if (host.endsWith('vimeo.com')) {
    const id = url.pathname.split('/').filter(Boolean).pop();
    return `https://player.vimeo.com/video/${id}${autoplay ? '?autoplay=1' : ''}`;
  }
  return url.href;
}

function loadPlayer(frame, href, title, autoplay) {
  if (frame.querySelector('iframe, video')) return;
  let player;
  if (/\.mp4(\?|$)/i.test(href)) {
    player = document.createElement('video');
    player.src = href;
    player.controls = true;
    player.playsInline = true;
    if (autoplay) player.autoplay = true;
  } else {
    player = document.createElement('iframe');
    player.src = embedSrc(href, autoplay);
    player.title = title || 'Video';
    player.loading = 'lazy';
    player.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  }
  frame.replaceChildren(player);
}

function buildItem(row) {
  const link = [...row.querySelectorAll('a[href]')].find((a) => VIDEO_LINK.test(a.href));
  const pic = row.querySelector('picture');
  const item = document.createElement('div');
  item.className = 'video-item';
  if (link && YOUTUBE_LINK.test(link.href)) item.classList.add('video-youtube');

  const caption = document.createElement('div');
  caption.className = 'video-caption';
  row.querySelectorAll(':scope > div').forEach((cell) => {
    [...cell.children].forEach((el) => {
      if (el.contains(link) || el === pic || el.contains(pic)) {
        if (el.contains(link) && el.textContent.trim() !== link.textContent.trim()) {
          link.remove();
          if (el.textContent.trim()) caption.append(el);
        }
        return;
      }
      caption.append(el);
    });
  });

  const title = caption.querySelector('h1, h2, h3, h4, h5, h6, p')?.textContent.trim()
    || link.textContent.trim();
  const frame = document.createElement('div');
  frame.className = 'video-frame';

  if (pic) {
    const img = pic.querySelector('img');
    const poster = document.createElement('button');
    poster.type = 'button';
    poster.className = 'video-poster';
    poster.setAttribute('aria-label', `Play video: ${title}`);
    poster.append(createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]));
    const play = document.createElement('span');
    play.className = 'video-play';
    play.setAttribute('aria-hidden', 'true');
    poster.append(play);
    poster.addEventListener('click', () => loadPlayer(frame, link.href, title, true));
    frame.append(poster);
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadPlayer(frame, link.href, title, false);
      }
    });
    observer.observe(frame);
  }

  item.append(frame);
  if (caption.children.length) item.append(caption);
  return item;
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const intro = document.createElement('div');
  intro.className = 'video-intro';
  const items = document.createElement('div');
  items.className = 'video-items';

  [...block.children].forEach((row) => {
    const hasVideo = [...row.querySelectorAll('a[href]')].some((a) => VIDEO_LINK.test(a.href));
    if (hasVideo) {
      items.append(buildItem(row));
    } else {
      row.querySelectorAll(':scope > div').forEach((cell) => intro.append(...cell.childNodes));
    }
  });

  block.replaceChildren();
  if (intro.textContent.trim()) {
    block.append(intro);
    block.classList.add('video-has-intro');
  }
  block.append(items);
  if (active.includes('shorts')) items.classList.add('video-grid');
}
