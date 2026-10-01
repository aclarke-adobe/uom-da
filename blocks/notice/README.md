# notice

Custom **notice** block. Purpose: Highlighted informational note, such as a course fee panel or an "only available to domestic students" notice.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one cell holding an optional leading heading, then body paragraphs, lists and links.

- **No icon** (information notice): a light blue panel with a blue rule and an info marker. Example: the international-only "not available to student visa holders" notice.
- **Heading starting with an icon**, e.g. `:check: Commonwealth Supported Places…` or `:dollar: International full fee…` (fee panel): a plain panel with the icon in a left column and the body beneath the heading.
  - A list whose every item holds a `<strong>` price is a fee list. Each item reads label, price, then an optional description.
  - An `h5` directly before a fee list (e.g. "2026 fees") becomes a year title beside it. Each year group gets its own accent colour.
  - Below 769px the panel collapses to its heading, and a chevron toggle expands it.
  - A fee panel that directly follows another fee panel is separated from it by a rule.

`:icon:` text left unprocessed in the heading (e.g. local previews of imported content) is resolved to the matching `icons/*.svg`.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
