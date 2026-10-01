# tabs

Custom **tabs** block. Purpose: Tabbed content panels (e.g. course structure by stream).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One row per tab: cell 1 = tab label, cell 2 = panel content (headings, text, lists, links, nested content). First tab is selected by default; keyboard arrow/Home/End navigation..

## Nested blocks

A block inside a tab panel (cell 2) is authored as a table inside that cell, with a first row of one header cell naming the block, the same way a top-level block is named: `Accordion`, or with options, e.g. `Cards (stat)` (becomes `cards stat`) or `Timeline (key dates)` (becomes `timeline key-dates`). The remaining rows and cells are the nested block's rows and cells. The delivered HTML keeps these as plain `<table>`s. `decorateNestedBlocks` in `scripts/nested-blocks.js` turns them into block markup and decorates and loads them before the tabs block is shown, at any depth (for example a Table inside an Accordion inside a tab panel). Tables without a header row naming a block are left as data tables.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
