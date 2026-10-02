# hero

Custom **hero** block. Purpose: Page-top banner with title, eyebrow, intro and CTAs.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Cells: optional image-only cell (media); main text cell with optional eyebrow paragraph before the h1, heading, intro text and CTA links; optional second text cell = aside panel. Options: split (dark content beside image), split-light (light content beside image), aside (heading beside a side panel of links), overlay (image background with centred heading). Default: solid dark band, image used as background if present..

### Course pages

- **Course header** (Split, h1): the main cell holds an optional level paragraph (a single link, e.g. "Undergraduate", renders as an outlined tag; plain text, e.g. "major", as a label), the h1, a list of stat links and an optional `Course code: **CODE**` paragraph. A list after the h1 switches the block to the course header layout (`hero-course`, set by `hero.js`) instead of the homepage page header. The image cell fills the right 30% from 1098px and is hidden below that.
- **Title band** (Aside): main cell = h2; second cell = "Available in these courses" paragraph, a list of course links, then one paragraph per CTA link. The trailing link-only paragraphs become the grey CTA well; the rest is the dark course list.

### Landing pages

- **Landing banner** (Split, alone in its section): an optional tag paragraph holding a single link (e.g. "Micro-credential", rendered as an outlined tag), the h1 (or h2 for a later banner / the organisations copy), intro and a bold CTA link; image cell. `hero.js` adds `hero-banner` when the split hero is the only content of its section (the homepage header shares its section with the search, the homepage feature with its cards). Navy band, image pinned to the right from 769px; darker navy on short course / micro-credential pages; a styled (navy) section drops its padding around it.
- **Campaign banner** (no option, image + h1/h2, subtitle paragraph, CTA): full-bleed photo with a navy gradient, content bottom-aligned on mobile and centred in the left half from 769px.
- **Split Light**: eyebrow paragraph, h2, text and plain link paragraphs (arrow links, `hero-link`); text 1/3 + image 2/3 from 769px.

## Supported variations

| Variation | Option class |
| --- | --- |
| Split | `split` |
| Split Light | `split-light` |
| Aside | `aside` |
| Overlay | `overlay` |

## Universal Editor fields

N/A (Document Authoring project)
