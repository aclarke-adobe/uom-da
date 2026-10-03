# columns

Custom **columns** block. Purpose: Multi-column layouts: heading/content pairs, image + text splits.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One or more rows, each with N cells (columns). A cell holding only an image is treated as an image column. Two text cells render as a one-third heading column and a two-thirds content column from tablet up. A list where every item is a single link renders as a wrapping row of link chips; a list where every item is a link followed by a bracketed type, e.g. `Effective Negotiation (Micro-credential)`, renders as course cards. Options: split (image column + content panel), overlap (first row = banner image only; next row = heading | content panel that overlaps the banner), text column (first row = heading column | content column; every later row's cells are cards shown two-up at the end of the content column).

Shapes picked up from the content (no extra option needed):

- Heading-only first cell + a second cell ending in a button: serif heading, one-third / two-thirds.
- Text + image cell (no option): the image is an inset figure (a quarter of the viewport on wide screens) beside text up to 880px; it sits on the side it is authored on.
- Split with an eyebrow paragraph before the heading: inset photo tile (homepage).
- Split without an eyebrow: full-bleed band, the photo filling its half edge to edge.
- Split whose text cell has a link list: menu, a ruled list of arrow links beside the photo.

## Supported variations

| Variation | Option class |
| --- | --- |
| Split | `split` |
| Overlap | `overlap` |
| Text column | `text-column` |

### Text column

`Columns (text column)`. First row: the heading column (serif h2, intro text, links) and the content column (text, lists, `h3` sub-headings). Each later row holds one or two cards, laid out two-up below the content column's text (one column on phones): an optional pictogram (`:uom-name:`) or photo, an `h3`/`h4` title, text and a link. A paragraph holding only a plain link renders as an arrow text link. Blocks can be authored inside a cell as a nested table whose header names the block (e.g. a `Notice`, `Table` or `Video`). The heading column sits in the left third from 900px; below that the columns stack.

## Universal Editor fields

N/A (Document Authoring project)
