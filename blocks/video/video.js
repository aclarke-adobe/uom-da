/*
 * Video block
 * Intro row (optional): a row without a video link holding a heading and text.
 * Video rows: a link to the video (YouTube, Vimeo or .mp4), an optional poster image and
 * optional caption text (title, duration). The poster shows a play button (YouTube's red
 * button for YouTube links); the player loads on click (or lazily when in view if there is
 * no poster).
 * Options: split (intro beside a single video; the caption sits in a bar over the poster),
 * shorts (portrait 9:16 video testimonials: title, name and duration; consecutive shorts
 * blocks in a section join one row, and the section's intro text sits beside them).
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = ['split', 'shorts'];
const VIDEO_LINK = /youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)/i;
const YOUTUBE_LINK = /youtube\.com|youtu\.be/i;
const DURATION = /^(\d+h\s*)?(\d+m\s*)?(\d+s)?$/i;

function youtubeId(href) {
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

function embedSrc(href, autoplay) {
  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, '');
  const params = autoplay ? '?autoplay=1&rel=0' : '?rel=0';
  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    return `https://www.youtube.com/embed/${youtubeId(href)}${params}`;
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

function span(className, text) {
  const el = document.createElement('span');
  el.className = className;
  if (text) el.textContent = text;
  return el;
}

/* split / shorts: navy bar over the poster with a play icon, the title and the duration */
function buildControls(caption, withTitle) {
  const texts = [...caption.children].map((el) => el.textContent.trim());
  const durationIndex = texts.findIndex((t, i) => i > 0 && t && DURATION.test(t));
  const duration = durationIndex > 0 ? texts[durationIndex] : '';
  if (durationIndex > 0) caption.children[durationIndex].remove();

  const controls = span('video-controls');
  controls.setAttribute('aria-hidden', 'true');
  controls.append(span('video-controls-icon'));
  const label = span('video-controls-label');
  if (withTitle && texts[0]) {
    label.append(span('video-controls-title', texts[0]));
    caption.firstElementChild.remove();
  }
  if (duration) label.append(span('video-controls-duration', duration));
  controls.append(label);
  return { controls, duration };
}

function buildItem(row, variant) {
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
  // a bare caption text node (no <p>) in a cell
  if (!caption.children.length && variant) {
    row.querySelectorAll(':scope > div').forEach((cell) => {
      const text = cell.textContent.trim();
      if (text && !cell.contains(link) && !cell.contains(pic)) {
        const p = document.createElement('p');
        p.textContent = text;
        caption.append(p);
      }
    });
  }

  const title = caption.querySelector('h1, h2, h3, h4, h5, h6, p')?.textContent.trim()
    || link.textContent.trim();
  const frame = document.createElement('div');
  frame.className = 'video-frame';

  let controls;
  let duration = '';
  if (variant && caption.children.length) {
    ({ controls, duration } = buildControls(caption, variant === 'split'));
  }

  // shorts without a poster: the video's own YouTube thumbnail (cropped to 9:16)
  const picImg = pic?.querySelector('img');
  let posterPic = picImg
    && createOptimizedPicture(picImg.src, picImg.alt, false, [{ width: '1200' }]);
  const ytId = link && YOUTUBE_LINK.test(link.href) && youtubeId(link.href);
  if (!posterPic && variant === 'shorts' && ytId) {
    posterPic = document.createElement('picture');
    const img = document.createElement('img');
    img.src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    img.alt = '';
    img.loading = 'lazy';
    posterPic.append(img);
  }

  if (posterPic) {
    const poster = document.createElement('button');
    poster.type = 'button';
    poster.className = 'video-poster';
    poster.setAttribute('aria-label', `Play video: ${title}${duration ? ` ${duration}` : ''}`);
    poster.append(posterPic);
    const play = document.createElement('span');
    play.className = 'video-play';
    play.setAttribute('aria-hidden', 'true');
    poster.append(play);
    if (controls) poster.append(controls);
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

  if (variant === 'shorts' && caption.firstElementChild) {
    // testimonial title (h3) and the speaker's name
    const first = caption.firstElementChild;
    if (!/^H\d$/.test(first.tagName)) {
      const h3 = document.createElement('h3');
      h3.className = 'video-title';
      h3.append(...first.childNodes);
      first.replaceWith(h3);
    } else {
      first.classList.add('video-title');
    }
    caption.querySelectorAll(':scope > p').forEach((p) => p.classList.add('video-name'));
  }

  item.append(frame);
  if (caption.children.length) item.append(caption);
  return item;
}

/* shorts: join a following shorts block into the first one, and adopt the intro text before it */
function groupShorts(block, items) {
  const wrapper = block.parentElement;
  const prev = wrapper?.previousElementSibling;
  const host = prev?.querySelector(':scope > .video.shorts .video-items');
  if (host) {
    host.append(...items.children);
    wrapper.remove();
    return true;
  }
  if (prev?.classList.contains('default-content-wrapper') && prev.textContent.trim()) {
    const intro = document.createElement('div');
    intro.className = 'video-intro';
    intro.append(...prev.childNodes);
    prev.remove();
    block.prepend(intro);
    block.classList.add('video-has-intro');
  }
  return false;
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const variant = active.includes('shorts') ? 'shorts' : active[0];
  const intro = document.createElement('div');
  intro.className = 'video-intro';
  const items = document.createElement('div');
  items.className = 'video-items';

  [...block.children].forEach((row) => {
    const hasVideo = [...row.querySelectorAll('a[href]')].some((a) => VIDEO_LINK.test(a.href));
    if (hasVideo) {
      items.append(buildItem(row, variant));
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
  if (variant === 'shorts') {
    items.classList.add('video-grid');
    if (!block.classList.contains('video-has-intro')) groupShorts(block, items);
  }
}
