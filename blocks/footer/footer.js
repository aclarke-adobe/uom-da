/**
 * Fetches the footer fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), base: resp.url };
}

/**
 * Resolves relative image paths against the fragment location so they work on any page depth.
 * @param {Element} root
 * @param {string} base
 */
function resolveImages(root, base) {
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!/^(https?:|data:|\/)/.test(src)) img.src = new URL(src, base).href;
  });
}

function wrap(className, children) {
  const el = document.createElement('div');
  el.className = className;
  el.append(...children);
  return el;
}

const isImageOnly = (el) => el?.tagName === 'P' && el.querySelector('img') && !el.textContent.trim();

/**
 * Groups a section's children into columns. A new column starts at each heading,
 * where a paragraph follows a list or a media-only paragraph, and at a trailing image.
 * @param {Element} section
 * @returns {Element[][]}
 */
function splitIntoColumns(section) {
  const columns = [[]];
  const children = [...section.children];
  children.forEach((child, i) => {
    const prev = children[i - 1];
    const isLast = i === children.length - 1;
    const startsColumn = /^H[1-6]$/.test(child.tagName)
      || (child.tagName === 'P' && (prev?.tagName === 'UL' || (isImageOnly(prev) && !isImageOnly(child))))
      || (isLast && isImageOnly(child));
    if (startsColumn && columns[columns.length - 1].length) columns.push([]);
    columns[columns.length - 1].push(child);
  });
  return columns;
}

/**
 * Turns icon-only links (a link wrapping just an image) into recolourable mask icons,
 * keeping the image alt text as the accessible name.
 * @param {Element} root
 */
function decorateIconLinks(root) {
  root.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    if (!img || a.textContent.trim()) return;
    const icon = document.createElement('span');
    icon.className = 'footer-icon';
    icon.style.setProperty('--icon-url', `url("${img.src}")`);
    const label = document.createElement('span');
    label.className = 'footer-sr-only';
    label.textContent = img.alt;
    img.replaceWith(icon, label);
    a.classList.add('footer-icon-link');
    a.closest('ul')?.classList.add('footer-icon-list');
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;

  const source = document.createElement('div');
  source.innerHTML = fragment.html;
  resolveImages(source, fragment.base);

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-bands';

  [...source.children].forEach((section, i) => {
    decorateIconLinks(section);
    section.querySelectorAll('p').forEach((para) => {
      const link = para.querySelector(':scope > a');
      const linkOnly = link && para.children.length === 1
        && para.textContent.trim() === link.textContent.trim();
      if (linkOnly) para.classList.add('footer-link-row');
    });
    const band = document.createElement('div');
    band.className = `footer-band footer-band-${i + 1}`;
    const columns = splitIntoColumns(section);
    band.append(wrap('footer-band-inner', columns.map((col, c) => wrap(`footer-col footer-col-${c + 1}`, col))));
    footer.append(band);
  });

  block.append(footer);
}
