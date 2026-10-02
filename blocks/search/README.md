# search

Custom **search** block. Purpose: Course / article search box, optionally with filter links.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Row 1: cell 1 = optional heading/intro + a link whose href is the search results URL (empty param such as ?q= names the query parameter) and whose text is the placeholder (the link may instead sit in its own cell 2, after a heading cell: the landing course search, shown as heading | field on desktop); optional next cell = button label (e.g. 'Search'). Option 'filters': further rows = filter group label | list of filter links (rendered as chips); single-cell rows (notes, 'Clear search' link) follow..

## Supported variations

| Variation | Option class |
| --- | --- |
| Filters | `filters` |

## Universal Editor fields

N/A (Document Authoring project)
