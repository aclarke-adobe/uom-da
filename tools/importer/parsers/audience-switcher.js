/* eslint-disable */
/* global WebImporter */
/**
 * Parser for audience-switcher. Base: audience-switcher (no options). Authored as "Audience Switcher".
 * Source: course-detail template (all course tabs with a domestic/international toggle).
 *
 * Output (blocks/audience-switcher/README.md + audience-switcher.js):
 *   row 1: 1 cell  = group label ("Showing information for")
 *   rows 2+: 2 cells = option label ("Domestic students") | audience key ("domestic")
 * The keys must equal the Section Metadata `Audience` values written by the course sections
 * transformer (domestic / international), so they come from the radio values.
 *
 * Source (verified in block-context/audience-switcher/source.html):
 *   #user-profile-audience-switcher .uom-radio-group >
 *     .uom-form-label__text (label), .uom-radio-group__options > .uom-radio > input[value] + label
 */

function cleanText(el) {
  return (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function parse(element, { document }) {
  const label = cleanText(element.querySelector('.uom-form-label__text, .uom-form-label, legend'));

  let options = [...element.querySelectorAll('.uom-radio')].map((radio) => {
    const input = radio.querySelector('input');
    const text = cleanText(radio.querySelector('label') || radio);
    return { text, key: (input && input.getAttribute('value')) || slugify(text) };
  });
  if (!options.length) {
    options = [...element.querySelectorAll('input[type="radio"]')].map((input) => {
      const lbl = input.id ? element.querySelector(`label[for="${input.id}"]`) : input.closest('label');
      const text = cleanText(lbl);
      return { text, key: input.getAttribute('value') || slugify(text) };
    });
  }
  // section-landing short courses: radio values b2c / b2b are authored as the audienceContract keys
  // (Section Metadata `Audience` individuals / organisations). Course pages use domestic/international.
  const KEY_MAP = { b2c: 'individuals', b2b: 'organisations' };
  options = options.map((o) => ({ ...o, key: KEY_MAP[o.key] || o.key }));
  options = options.filter((o) => o.text && o.key);

  if (!options.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (label) cells.push([label]);
  options.forEach((o) => cells.push([o.text, o.key]));

  const block = WebImporter.Blocks.createBlock(document, { name: 'Audience Switcher', cells });
  element.replaceWith(block);
}
