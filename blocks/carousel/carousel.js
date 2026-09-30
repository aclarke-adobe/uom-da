/*
 * Carousel block (image gallery slider)
 * One row per slide: [image | optional caption]. A single-cell first row without an
 * image is used as the carousel heading.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

let instance = 0;

function updateSlide(block, index) {
  const slides = [...block.querySelectorAll('.carousel-slide')];
  const count = slides.length;
  const current = ((index % count) + count) % count;
  block.dataset.activeSlide = current;
  slides.forEach((slide, i) => {
    const isActive = i === current;
    slide.setAttribute('aria-hidden', !isActive);
    slide.querySelectorAll('a').forEach((a) => {
      if (isActive) a.removeAttribute('tabindex');
      else a.setAttribute('tabindex', '-1');
    });
  });
  const counter = block.querySelector('.carousel-counter');
  if (counter) counter.textContent = `${current + 1} / ${count}`;
  return current;
}

function showSlide(block, index) {
  const current = updateSlide(block, index);
  const track = block.querySelector('.carousel-slides');
  const slide = block.querySelectorAll('.carousel-slide')[current];
  track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
}

export default function decorate(block) {
  instance += 1;
  const rows = [...block.children];
  const heading = document.createElement('div');
  heading.className = 'carousel-heading';

  const track = document.createElement('ul');
  track.className = 'carousel-slides';
  track.id = `carousel-${instance}`;

  rows.forEach((row, i) => {
    const hasImage = row.querySelector('picture');
    if (i === 0 && !hasImage && row.children.length === 1) {
      heading.append(...row.firstElementChild.childNodes);
      return;
    }
    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture') && cell.textContent.trim() === '') {
        cell.className = 'carousel-slide-image';
      } else if (cell.textContent.trim() || cell.children.length) {
        cell.className = 'carousel-slide-caption';
      } else {
        return;
      }
      slide.append(cell);
    });
    if (slide.children.length) track.append(slide);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1600' }, { width: '750' }]));
  });

  const slideCount = track.children.length;
  block.replaceChildren();
  if (heading.childNodes.length) block.append(heading);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  viewport.append(track);
  block.append(viewport);

  if (slideCount < 2) return;
  block.classList.add('carousel-multi');

  const nav = document.createElement('div');
  nav.className = 'carousel-navigation';
  nav.innerHTML = `
    <button type="button" class="carousel-prev" aria-controls="${track.id}" aria-label="Previous slide"></button>
    <button type="button" class="carousel-next" aria-controls="${track.id}" aria-label="Next slide"></button>
  `;
  viewport.append(nav);

  const counter = document.createElement('p');
  counter.className = 'carousel-counter';
  counter.setAttribute('aria-live', 'polite');
  block.append(counter);

  nav.querySelector('.carousel-prev').addEventListener('click', () => {
    showSlide(block, Number(block.dataset.activeSlide || 0) - 1);
  });
  nav.querySelector('.carousel-next').addEventListener('click', () => {
    showSlide(block, Number(block.dataset.activeSlide || 0) + 1);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateSlide(block, [...track.children].indexOf(entry.target));
      }
    });
  }, { root: track, threshold: 0.6 });
  [...track.children].forEach((slide) => observer.observe(slide));

  updateSlide(block, 0);
}
