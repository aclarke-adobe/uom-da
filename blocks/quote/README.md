# quote

Custom **quote** block. Purpose: Student / staff testimonial or expandable profile.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Text cell: optional name heading, the quotation paragraphs, optional attribution paragraph starting with an em dash; optional image-only cell shown as a square portrait below the text (the leading dash of the attribution is hidden). Option 'profile': eyebrow paragraph (e.g. 'Profile') + name heading shown, remaining content (quote/bio/links) collapsed behind a 'Read more' toggle..

Card: when the attribution paragraph is followed by one more paragraph (a course or role line), the quote renders as a card. On desktop the portrait takes a third of the width, on the side of its cell: image cell first puts it on the left, image cell second puts it on the right. Without authored quotation marks you get an italic quotation, a semibold name after a dash and an uppercase course line. With authored quotation marks (the alumni profile) the layout changes: the role line comes first, then a large navy name over a short rule, then the quotation in plain text.

On section landing pages, a text-only quote with no portrait and no course line ("What people are saying") renders as a large navy quotation, up to 544px wide. Its opening mark sits on its own line.

## Supported variations

| Variation | Option class |
| --- | --- |
| Profile | `profile` |

## Universal Editor fields

N/A (Document Authoring project)
