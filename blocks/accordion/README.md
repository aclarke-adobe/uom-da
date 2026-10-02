# accordion

Custom **accordion** block. Purpose: Expandable FAQ / detail sections, optionally with an intro column.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Optional first row: single cell intro (heading, text, optional links) shown beside the items on desktop. Then one row per item: cell 1 = question/label, cell 2 = answer (rich text, lists, links, images)..

## Nested blocks

A block inside an item body (cell 2) is authored as a table inside that cell, with a first row of one header cell naming the block, the same way a top-level block is named: `Table`, or with options, e.g. `Cards (stat)` (becomes `cards stat`) or `Timeline (key dates)` (becomes `timeline key-dates`). The remaining rows and cells are the nested block's rows and cells. The delivered HTML keeps these as plain `<table>`s. `decorateNestedBlocks` in `scripts/nested-blocks.js` turns them into block markup and decorates and loads them before the accordion is shown, at any depth (for example a Table inside an Accordion inside a tab panel). Tables without a header row naming a block are left as data tables.

## Supported variations

No authored variations. The look is chosen from the markup:

- **Course pages** (default): "togglerow" rows with a navy left bar, under h3/h4 headings, in tab panels, or as sample course plan years (`h4` "Year" intro + "Semester 1 · 50 pts" rows, `.accordion-plan`).
- **Landing pages** (`.accordion-ds`, added by the JS): the UoM design-system accordion — bold link-blue titles, thin dividers, light-blue hover, tinted open item, light text and cyan chevrons on `navy` sections. Used when the intro row starts with an `h2`/`h3`, or (no intro) when the last heading before the block in its section is an `h2` or nothing precedes it. Items open independently, as on the source.

## Universal Editor fields

N/A (Document Authoring project)
