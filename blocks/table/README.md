# table

Custom **table** block. Purpose: Tabular or side-by-side content (fees, contacts, comparisons).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Rows and cells map 1:1 to table rows and cells; cells may hold rich content (lists, links, CTAs, images). The first row becomes the header when each of its cells is only a heading, bold text or a short label and more rows follow. The header row is navy and body rows are striped. On narrow screens the table keeps its columns (at least 600px wide) and scrolls sideways inside the block. A header cell that is a bold link stays a plain link (not a button).

## Supported variations

| Variation | Option class | Look |
| --- | --- | --- |
| Compact | `compact` | Columns size to their content. Below 600px each body row becomes a card: the first cell is a navy title bar and, when the table has a header row, every other cell is prefixed with its bold column header. Only a bold or heading first row counts as the header (source `table--is-compacted`, e.g. the accommodation scholarships table; headerless: the extension-program grade table). |

## Universal Editor fields

N/A (Document Authoring project)
