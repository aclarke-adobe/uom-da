# accordion

Custom **accordion** block. Purpose: Expandable FAQ / detail sections, optionally with an intro column.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Optional first row: single cell intro (heading, text, optional links) shown beside the items on desktop. Then one row per item: cell 1 = question/label, cell 2 = answer (rich text, lists, links, images)..

## Nested blocks

A block inside an item body (cell 2) is authored as a table inside that cell, with a first row of one header cell naming the block, the same way a top-level block is named: `Table`, or with options, e.g. `Cards (stat)` (becomes `cards stat`) or `Timeline (key dates)` (becomes `timeline key-dates`). The remaining rows and cells are the nested block's rows and cells. The delivered HTML keeps these as plain `<table>`s. `decorateNestedBlocks` in `scripts/nested-blocks.js` turns them into block markup and decorates and loads them before the accordion is shown, at any depth (for example a Table inside an Accordion inside a tab panel). Tables without a header row naming a block are left as data tables.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
