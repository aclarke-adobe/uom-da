# callout

Custom **callout** block. Purpose: Call-to-action panel pairing a short prompt with a button.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one or more cells containing a short message (heading or paragraph) and one or more CTA links. A `<strong>` link renders as a cyan (primary) button and an `<em>` link as a sage (secondary) button.

- Short message (up to 120 characters, one element): shown as a title, with the CTA beside it. The CTA wraps beneath the title when they do not fit on one line.
- Longer copy (more than 120 characters or several elements): body text, with the CTA stacked beneath it (e.g. the eligibility calculator panel).

The default look is a grey panel.

## Supported variations

| Variation | Option class | Look |
| --- | --- | --- |
| Bordered | `bordered` | Outlined panel with a smaller bold title. Course "Fees & scholarships" tab callouts. |
| Photo | `photo` | Add a cell containing only an image. It becomes a full-bleed background behind a centred white panel. |

When no option is authored on a course fees tab (`/find/courses/**/fees`), `bordered` is applied automatically, because imported fees pages carry no option. Authoring `Callout (bordered)` explicitly is preferred.

## Universal Editor fields

N/A (Document Authoring project)
