/*
 * Callout block
 * Default: a band with a short message and one or more CTA links.
 * Option `photo`: an image cell becomes a full-bleed background behind a centred panel.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = ['photo'];

function isActionParagraph(el) {
  if (el.tagName !== 'P') return false;
  const links = el.querySelectorAll('a');
  return links.length > 0 && el.textContent.trim() === [...links].map((a) => a.textContent).join('').trim();
}

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const cells = [...block.querySelectorAll(':scope > div > div')];
  const media = document.createElement('div');
  media.className = 'callout-media';
  const text = document.createElement('div');
  text.className = 'callout-text';
  const actions = document.createElement('div');
  actions.className = 'callout-actions';

  cells.forEach((cell) => {
    [...cell.children].forEach((el) => {
      const pic = el.tagName === 'PICTURE' ? el : el.querySelector('picture');
      if (pic && el.textContent.trim() === '') {
        media.append(pic);
      } else if (isActionParagraph(el) || el.classList.contains('button-container')) {
        actions.append(el);
      } else {
        text.append(el);
      }
    });
  });

  media.querySelectorAll('img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]));
  });

  const panel = document.createElement('div');
  panel.className = 'callout-panel';
  if (text.children.length) panel.append(text);
  if (actions.children.length) panel.append(actions);

  block.replaceChildren();
  if (active.includes('photo') && media.children.length) {
    block.classList.add('callout-has-media');
    block.append(media);
  }
  block.append(panel);

  // long copy stacks the CTA under the message instead of beside it
  if (text.textContent.trim().length > 120 || text.children.length > 1) {
    block.classList.add('callout-stacked');
  }
}
