# residency-notice

Custom **residency-notice** block. Purpose: Residency status panel explaining domestic vs international applicability.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One row per panel section (separated by rules). First section: a short title line (optional :icon: + e.g. 'Domestic student'), an optional one-link paragraph ('Change') shown inline, then explanatory text. Optional audience-keyed rows: cell 1 = audience key (domestic / international), cell 2 = content; only the section matching the audience-switcher selection is shown. A trailing shared row that is a single short line with one link (e.g. 'Can’t find your qualification? Let us know') renders as an unruled footnote (small, right-aligned from 769px).

Styling: navy panel (darker navy inside a `grey` section, as on undergraduate entry requirements); a white rule separates visible sections; the residency title is 18px / 20px from 769px; a list followed by a paragraph renders as the entry-point list plus a small note.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
