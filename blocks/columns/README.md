# columns

Custom **columns** block. Purpose: Multi-column layouts: heading/content pairs, image + text splits.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One or more rows, each with N cells (columns). A cell holding only an image is treated as an image column. Two text cells render as a one-third heading column and a two-thirds content column from tablet up. A list where every item is a single link renders as a wrapping row of link chips. With split, two text cells render as two 50/50 text tiles. Options: split (image column + content panel, full-bleed 50/50), overlap (first row = banner image only; next row = heading | content panel that overlaps the banner)..

## Supported variations

| Variation | Option class |
| --- | --- |
| Split | `split` |
| Overlap | `overlap` |

## Universal Editor fields

N/A (Document Authoring project)
