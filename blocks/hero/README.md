# hero

Custom **hero** block. Purpose: Page-top banner with title, eyebrow, intro and CTAs.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Cells: optional image-only cell (media); main text cell with optional eyebrow paragraph before the h1, heading, intro text and CTA links; optional second text cell = aside panel. Options: split (dark content beside image), split-light (light content beside image), aside (heading beside a side panel of links), overlay (image background with centred heading). Default: solid dark band, image used as background if present..

### Course pages

- **Course header** (Split, h1): the main cell holds an optional level paragraph (a single link, e.g. "Undergraduate", renders as an outlined tag; plain text, e.g. "major", as a label), the h1, a list of stat links and an optional `Course code: **CODE**` paragraph. A list after the h1 switches the block to the course header layout (`hero-course`, set by `hero.js`) instead of the homepage page header. The image cell fills the right 30% from 1098px and is hidden below that.
- **Title band** (Aside): main cell = h2; second cell = "Available in these courses" paragraph, a list of course links, then one paragraph per CTA link. The trailing link-only paragraphs become the grey CTA well; the rest is the dark course list.

## Supported variations

| Variation | Option class |
| --- | --- |
| Split | `split` |
| Split Light | `split-light` |
| Aside | `aside` |
| Overlay | `overlay` |

## Universal Editor fields

N/A (Document Authoring project)
