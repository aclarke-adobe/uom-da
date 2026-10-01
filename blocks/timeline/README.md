# timeline

Custom **timeline** block. Purpose: Key dates / application process timeline.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One row per milestone: cell 1 = date (one line, or a small label line such as 'Monday' followed by the date line; leave empty to continue the previous date), cell 2 = description (optional heading plus text/links). Option key-dates: a white card; an optional first single-cell row is the header (a short label line such as 'For domestic students' shown as an outlined chip, then a heading such as 'Key dates'); each following row is date | description (bold title), rendered with a calendar icon, description above the uppercase date. A header with only a heading (no label line, e.g. graduate 'UPCOMING INTAKES AND KEY DATES') renders as a flat grey panel with an uppercase header instead of the white card. A first row with a single cell (no date) is a message: in the card it shows a green check badge ('Applications Now Open'), in the panel plain text ('There are currently no scheduled dates…').

## Supported variations

| Variation | Option class |
| --- | --- |
| Key Dates | `key-dates` |

## Universal Editor fields

N/A (Document Authoring project)
