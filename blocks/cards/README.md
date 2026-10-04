# cards

Custom **cards** block. Purpose: Grid of cards / tiles for promos, people, stats and link lists.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One row per card. Optional image cell (picture only) plus a body cell with heading, text and optional CTA link(s) (trailing CTA is pinned to the card bottom). A bold link opening the body (or a heading that is just a link) is the card title, not a button; a short link-free paragraph before the heading/title is an eyebrow. 3/6 cards lay out in 3 columns and 4/8 in 4 on desktop. Options: tile (text-only columns), icon (pictogram above the text: the first cell holds either an icon, authored as `:icon-name:` and served from `/icons/icon-name.svg`, e.g. `:uom-access-melbourne:`, shown at a fixed 64px height, or an image, which spans the card width at a 190:150 ratio), link-list (one link per row, ruled list), course-link (single-link chips), chips (one link per row, shown as a wrapping row of white link chips with a light-cyan left border, e.g. graduate pathways / related study areas), people (stacked staff/student profiles: portrait floated beside name and bio, 6px grey rule under each card, cyan under the last), stat (entry-score cards: first text cell = title paragraph, bold figure paragraph, optional label paragraph; second cell = description; first card sage, others grey; inside an accordion they render as white English-test tiles, 6 per row on wide screens).

Automatic sub-styles (no extra class to author): default cards with no CTA link get `cards-profile` (course alumni: white card, fixed-height photo, padded text; a lone card puts the photo on the right on desktop), and icon cards with no pictogram cell get `cards-facts` (centred text-only employment cards with a grey/cyan/yellow/green bottom rule, two per row).

Section-landing shapes (also automatic; `cards.js` `decorateShapes` derives them from the authored cells and the section style only, so homepage and course cards never get them):

| Shape class | Option | Authored as | Source component |
| --- | --- | --- | --- |
| `cards-tile-photo` (+ `cards-tile-desc`) | tile | image cell + linked heading (+ text) | ct-pathfinder photo tiles: navy card, centred white title, whole card links |
| `cards-tile-box` | tile | linked heading (+ text), or plain text only | ct-pathfinder link tiles without a photo: navy boxes |
| `cards-tile-text` | tile | plain heading + text | fee tiers, ct-textthreecolumn text columns (no rule) |
| `cards-tile-button` | tile, grey section | bold link only | ct-section-todolist "personalised advice" white link buttons |
| `cards-tile-panel` | tile, navy section holding only the block | bold link + text | ct-focusboxpathfinder outlined-button panels (teal band) |
| (bold-only title) | tile | `**Title**` + text | pathfinder-today feature tiles on navy (unlinked bold title) |
| `cards-people-profile` | people | portrait + h3 name, role, bio | short-course `page-short-course__profile` (role paragraph is bold) |
| `cards-icon-inline` | icon, no tile block in the section | `:uom-*:` icon + text | ct-textthreecolumn / micro-credential pictograms (48px line icon) |
| `cards-fact-tiles` | icon, text only, h3 | h3 figure + text | ct-factscard navy tiles with serif figure |
| `cards-docs` | icon | image + link(s) only | ct-documentlisting brochure covers |
| `cards-logos` | icon | image only | ct-imagelisting greyscale logos |
| `cards-stat-ranking` | stat, one cell, figure first | `**figure**` + label | uom-stats-and-rankings outlined tiles |
| `cards-chip-<type>` on the card | chips | link + type paragraph | ct-coursecards (left rule coloured by type) |
| `cards-news` | default | linked h3, date, excerpt, links | ct-newslisting / ct-eventslisting |
| `cards-staff` | default, no CTA | image + linked h3 + text | ct-profilelist staff cards |
| `cards-listing` | `listing` option, or default with no CTA | image + h3 (+ teaser); without the option: image + plain h3 only | ct-pagelisting image listing |
| `cards-tile-link` (+ `cards-tile-box` / `cards-tile-photo`) | tile | (image +) one plain link | ct-pathfinder tiles whose title is a paragraph: underlined bold link, whole card links |
| `cards-feature` | default | CTA authored as a button (`*[link]*`) | ct-featurespanel (full-width button) |

Story-article shapes (automatic; only story content produces these cell shapes):

| Shape class | Option | Authored as | Source component |
| --- | --- | --- | --- |
| `cards-chip-study-area` / `-bachelor` / `-major` / `-research` | chips | link + type paragraph | story "Study options" `a.card-course--*` (navy, navy, `#809daa`, `#9fb825` rule) |
| `cards-link-boxes` (+ `cards-link-note` on a title-less box) | link-list | heading + description + one link per paragraph | sublink-menu--blue titled boxes (how-to-apply, languages); the title-less box is the card-rounded-figure "not sure if you're domestic or international?" note |
| `cards-image-focus` | icon | image + h3 name (+ role paragraph) + quote, no links | card--image-focus testimonials / feature photos (cover photo, padded text) |
| `cards-news-list` | default (news), or the `list` option | image + linked h3 + excerpt + tag paragraph(s), no date | card--generic--full-width (STEM episode list): one card per row, photo left on desktop, tags in a row |
| `cards-events` (+ `cards-news-list`) | default (news) | linked h3, date, tag labels, the same labels as links, "View event" | static events listing: label copies hidden, linked tags shown as chips, one card per row |
| (excerpt rule) | default (news) in a section headed `#keep-reading` | image + linked h3 + excerpt + link | story "Keep reading" card--generic (excerpt under a thin rule) |

## Supported variations

| Variation | Option class |
| --- | --- |
| Tile | `tile` |
| Icon | `icon` |
| Link List | `link-list` |
| Course Link | `course-link` |
| People | `people` |
| Stat | `stat` |
| Chips | `chips` |
| Boxed (with Icon) | `icon boxed`, authored as `Cards (icon, boxed)`: ct-focusbox white centred boxes (pictogram or image over heading and text) |
| Listing | `listing`, authored as `Cards (listing)`: ct-pagelisting image listing (photo over a linked, link-styled title and optional teaser; gets `cards-listing`) |
| List | `list`, authored as `Cards (list)` on news cards: card--generic--full-width one-per-row list (gets `cards-news-list`) |

## Universal Editor fields

N/A (Document Authoring project)
