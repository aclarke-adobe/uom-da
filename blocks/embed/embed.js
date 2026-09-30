/*
 * Embed block
 * Content: optional heading/text, then a link to the embeddable URL (Google Maps /
 * Street View, YouTube, Vimeo or any iframe-able page). An optional image is used as a
 * click-to-load placeholder. The iframe loads lazily when the block scrolls into view.
 */

function toEmbedUrl(href) {
  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
  if (host.endsWith('youtube.com')) {
    const id = url.searchParams.get('v') || url.pathname.split('/').pop();
    return `https://www.youtube.com/embed/${id}`;
  }
  if (host === 'vimeo.com') return `https://player.vimeo.com/video${url.pathname}`;
  return url.href;
}

function loadIframe(frame, src, title) {
  if (frame.querySelector('iframe')) return;
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title || 'Embedded content';
  iframe.loading = 'lazy';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  frame.replaceChildren(iframe);
}

export default function decorate(block) {
  const links = [...block.querySelectorAll('a[href]')];
  const link = links.pop();
  if (!link) return;

  const src = toEmbedUrl(link.href);
  const placeholder = block.querySelector('picture');
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const title = heading?.textContent.trim() || link.textContent.trim();

  const intro = document.createElement('div');
  intro.className = 'embed-intro';
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    [...cell.children].forEach((el) => {
      if (el.contains(link) || el.querySelector('picture') || el.tagName === 'PICTURE') return;
      intro.append(el);
    });
  });

  const frame = document.createElement('div');
  frame.className = 'embed-frame';

  block.replaceChildren();
  if (intro.children.length) block.append(intro);
  block.append(frame);

  if (placeholder) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'embed-placeholder';
    button.setAttribute('aria-label', `Load ${title}`);
    button.append(placeholder);
    button.addEventListener('click', () => loadIframe(frame, src, title));
    frame.append(button);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadIframe(frame, src, title);
    }
  });
  observer.observe(block);
}
