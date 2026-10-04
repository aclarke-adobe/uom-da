# tabs

Custom **tabs** block. Purpose: Tabbed content panels (e.g. course structure by stream).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: One row per tab: cell 1 = tab label, cell 2 = panel content (headings, text, lists, links, nested content). First tab is selected by default; keyboard arrow/Home/End navigation..

## Nested blocks

A block inside a tab panel (cell 2) is authored as a table inside that cell, with a first row of one header cell naming the block, the same way a top-level block is named: `Accordion`, or with options, e.g. `Cards (stat)` (becomes `cards stat`) or `Timeline (key dates)` (becomes `timeline key-dates`). The remaining rows and cells are the nested block's rows and cells. The delivered HTML keeps these as plain `<table>`s. `decorateNestedBlocks` in `scripts/nested-blocks.js` turns them into block markup and decorates and loads them before the tabs block is shown, at any depth (for example a Table inside an Accordion inside a tab panel). Tables without a header row naming a block are left as data tables.

## Applicant-route tabs (story pages)

On pages that open with a navy title band or a plain hero (e.g. graduate degree packages, graduate courses), the tab strip is a full-width navy bar with white labels and a cyan active bar, and it follows a navy section with no gap. Panels are white and use an 80px (mobile 48px) rhythm between blocks and text rows. Each run of panel text that starts with an `h2` becomes a row: on desktop the heading takes a third, the content two thirds. Paragraphs straight after the heading stay beside it when other content follows them. A row whose content is only a list of links shows those links as chips. A nested Accordion whose intro starts with an `h2` uses the design-system (landing) accordion style.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
