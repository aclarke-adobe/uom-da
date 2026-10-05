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

### Story articles and content pages

- **Story page hook**: on a page with `Template: story-article` metadata `hero.js` adds `body.story-article` (aem.js does it on aem.page/live; the local dev server keeps the meta name's case, which aem.js misses), so `styles/story.css` can scope story rules with it.
- **Story header** (Split, h1 only, alone in its section, page has `Template: story-article` metadata): `hero-story` instead of `hero-banner`. Navy band; 16:9 image above the title on mobile; from 769px the title is centred vertically in the left half (min 432px) and the image covers the right half.
- **Menu header** (Aside with an h1): main cell = h1 + intro; second cell = list of links. `hero-menu`: navy band, intro 2/3 + panel of cyan-arrow links 1/3 from 769px, stacked below on mobile. The panel stays in the band (no `hero-has-aside`, so course.css does not narrow the next section).
- **Search header** (Split, h1 + intro + image, its section holds only this hero and a Search block): `hero-search`: page header layout (image on the right 45% from 769px); `hero.js` moves the search box under the intro.
- **Campaign banner, centred** (Overlay; add `dark` for the 50% scrim): image + h1 and an optional bold CTA link centred over the photo under a 25% black scrim.

## Supported variations

| Variation | Option class |
| --- | --- |
| Split | `split` |
| Split Light | `split-light` |
| Aside | `aside` |
| Overlay | `overlay` |
| Overlay (dark scrim) | `overlay dark` |

## Universal Editor fields

N/A (Document Authoring project)
