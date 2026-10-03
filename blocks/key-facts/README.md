# key-facts

Custom **key-facts** block. Purpose: Course key-facts panel (duration, mode, intake, fees) with primary CTAs.

## Authoring (Document Authoring)

Model: `standalone`

Single block table.

- **Fact rows** (two cells): cell 1 = label with an optional `:icon:` (e.g. `:clock: Duration`; icons live in `/icons`), cell 2 = value. Put each value line in its own paragraph; a final paragraph holding only a link is the fact's link. In a three-paragraph value, the middle paragraph is a secondary line and renders in small text (e.g. an alternative duration). Facts without an icon (e.g. `CRICOS code`) keep the icon gutter so the labels line up.
- **Partner logo rows** (short courses / micro-credentials): cell 1 = label without an icon (`In collaboration with`, `Endorsed by`, `Co-designed with`, …), cell 2 = one or more images only. These rows drop the icon gutter (as on the source) and stack the logos at up to 200px wide. From 769px, a row with more than two logos takes two columns of the facts grid and shows two logos per column (the source splits a 3rd+ logo into the next column).
- **Action rows** (one cell): a CTA link. **Bold** link = cyan primary button, *italic* link = sage secondary button, plain link = text link with an arrow. Actions stack in a right-hand column at 900px and wider, and below the facts on smaller screens.

The facts grid fills as many 200px columns as fit (250px at 769px and wider), up to three on desktop. This matches the source `auto-fill` grid.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
