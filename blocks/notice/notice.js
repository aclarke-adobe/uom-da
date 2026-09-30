/*
 * Notice block
 * Single cell: heading (optionally preceded by an :icon:), body text and optional CTA.
 * The heading sits beside the icon; the body is indented beneath it.
 */

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const head = document.createElement('div');
  head.className = 'notice-head';
  const body = document.createElement('div');
  body.className = 'notice-body';

  const nodes = cells.flatMap((cell) => [...cell.children]);
  const heading = nodes.find((el) => /^H[1-6]$/.test(el.tagName));

  const icon = block.querySelector('.icon');
  const marker = document.createElement('span');
  marker.className = 'notice-icon';
  marker.setAttribute('aria-hidden', 'true');
  if (icon) {
    const iconParent = icon.parentElement;
    marker.append(icon);
    if (iconParent && iconParent.tagName === 'P' && !iconParent.textContent.trim()) iconParent.remove();
  }
  head.append(marker);

  nodes.forEach((el) => {
    if (!el.isConnected && el !== heading) return;
    if (el === heading) head.append(el);
    else body.append(el);
  });

  block.replaceChildren(head);
  if (body.children.length) block.append(body);
}
