# columns

Custom **columns** block. Purpose: Multi-column layouts: heading/content pairs, image + text splits.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One or more rows, each with N cells (columns). A cell holding only an image is treated as an image column. Two text cells render as a one-third heading column and a two-thirds content column from tablet up. A list where every item is a single link renders as a wrapping row of link chips; a list where every item is a link followed by a bracketed type, e.g. `Effective Negotiation (Micro-credential)`, renders as course cards. Options: split (image column + content panel), overlap (first row = banner image only; next row = heading | content panel that overlaps the banner).

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

## Universal Editor fields

N/A (Document Authoring project)
