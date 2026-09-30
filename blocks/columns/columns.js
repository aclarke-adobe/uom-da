const OPTION_CLASSES = ['split', 'overlap'];

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const rows = [...block.children];

  // overlap: a leading single-image row becomes the banner the content panel overlaps
  if (active.includes('overlap')) {
    const first = rows[0];
    if (first && rows.length > 1 && first.querySelector('picture') && first.textContent.trim() === '') {
      first.className = 'columns-overlap-media';
      const pics = first.querySelectorAll('picture');
      first.replaceChildren(pics[0]);
      rows[1].classList.add('columns-overlap-panel');
    }
  }

  const contentRows = rows.filter((row) => !row.classList.contains('columns-overlap-media'));
  const cols = Math.max(1, ...contentRows.map((row) => row.children.length));
  block.classList.add(`columns-${cols}-cols`);

  // setup image columns
  contentRows.forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
    if (!row.querySelector('.columns-img-col')) row.classList.add('columns-text-row');
  });

  // eyebrow: short link-free paragraph(s) placed before a column's heading
  block.querySelectorAll(':scope > div > div > :is(h1, h2, h3, h4)').forEach((heading) => {
    let prev = heading.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'P' && !prev.querySelector('a, picture')) prev.classList.add('columns-eyebrow');
      prev = prev.previousElementSibling;
    }
  });
}
