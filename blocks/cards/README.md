# cards

Custom **cards** block. Purpose: Grid of cards / tiles for promos, people, stats and link lists.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One row per card. Optional image cell (picture only) plus a body cell with heading, text and optional CTA link(s) (trailing CTA is pinned to the card bottom). A bold link opening the body (or a heading that is just a link) is the card title, not a button; a short link-free paragraph before the heading/title is an eyebrow. 3/6 cards lay out in 3 columns and 4/8 in 4 on desktop. Options: tile (text-only columns), icon (pictogram above the text: the first cell holds either an icon, authored as `:icon-name:` and served from `/icons/icon-name.svg`, e.g. `:uom-access-melbourne:`, shown at a fixed 64px height, or an image, which spans the card width at a 190:150 ratio), link-list (one link per row, ruled list), course-link (single-link chips), chips (one link per row, shown as a wrapping row of white link chips with a light-cyan left border, e.g. graduate pathways / related study areas), people (portrait beside name/role/bio), stat (first text cell = figure + label, second = description)..

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

## Universal Editor fields

N/A (Document Authoring project)
