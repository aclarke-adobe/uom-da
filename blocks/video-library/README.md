# video-library

Custom **video library** block. Purpose: a filterable library of YouTube videos (the source's on-demand video
library on `/study-with-us/on-demand`). Authors maintain the list of videos in the block table; nothing is
hard-coded. Put it in a `navy` section (Section Metadata `Style: navy`): it is designed for a navy background.

## Authoring (Document Authoring)

Model: `standalone`. One block table named **Video library**:

| Video library | | | | | |
| --- | --- | --- | --- | --- | --- |
| Heading | On-demand | | | | |
| Thumbnail | Title | Video | Study level | Topic | Duration |
| *(image)* | The Melbourne curriculum | https://www.youtube.com/watch?v=PubbNsh5zyQ | Undergraduate | University experience | 3:28 |
| *(image)* | Narrm Scholarship Program | https://www.youtube.com/watch?v=x_MsxHYjGk4 | Undergraduate | Applications and scholarships | 1:38 |

- **Video rows** (one per video), in this column order:
  1. **Thumbnail**: a 16:9 image (shown cropped to 16:9). Optional: without one, the video's YouTube thumbnail
     is used.
  2. **Title**: plain text.
  3. **Video**: a YouTube link (`youtube.com/watch?v=…`, `youtu.be/…`, `/embed/…` or `/shorts/…`). Rows without a
     valid YouTube link are ignored.
  4. **Study level**: e.g. `Graduate`, `Undergraduate`. The study level radios are built from the values used.
  5. **Topic**: e.g. `Health`. The Topic list is built from the values used, sorted A–Z. Type the topic exactly the
     same way on every row (spelling and capitals), otherwise it shows up twice in the list.
  6. **Duration**: `m:ss` (or `h:mm:ss`), shown as "3:28 minutes". `21.59` is read as `21:59`.

  A video can have several study levels or topics: put each on its own line in the cell, or separate them with
  `;` (not with commas: topic names contain commas). Leave a cell empty rather than deleting it, so the columns
  stay in order.
- **Optional rows** (any row without a YouTube link is not a video):
  - `Heading | <text>`: the heading above the cards (default `On-demand`).
  - `Page size | <number>`: how many cards show before the "Show all N results" button (default 12).
  - A column-label row (`Thumbnail | Title | Video | …`) is ignored; keep it as a reminder of the column order.
- Video order on the page = row order in the table. To add a video, add a row; to remove one, delete its row.

## Behaviour

Same as the source component:

- Filter by **Study level** (All / each level), **Topic** (Show all / each topic) and **Keywords** (matched
  anywhere in the title, case-insensitive). Filters apply when **Filter** is pressed (or Enter in the keyword field);
  **Clear** resets them.
- "**N results** found with **M** filters applied" (announced to screen readers).
- The first 12 cards, then **Show all N results**; when everything is shown, **Show all categories** goes back.
- URL parameters: `?studyLevel=Graduate&discipline=Health&search=rural` preselect and apply the filters;
  `?type=On-demand` (the heading text) opens with every card shown. Filtering updates these parameters (so a
  filtered view can be shared).
- A card (thumbnail or title) opens the video in a modal player (native dialog): no autoplay, Escape / the close
  button / a click outside closes it and returns focus to the card. The YouTube player only loads when opened.

Differences from the source (fixes):

- An empty state: "No videos match your filters." (the source shows nothing below "0 results").
- "Show all N results" is not counted as an applied filter (the source then says "1 filters applied"), and
  result/filter counts are singular when 1 ("1 result found with 1 filter applied").
- No artificial "Fetching results" loading overlay; the controls do not overflow the screen at 375px.
- One keyboard stop per card (the source has two identical buttons per card).

## Supported variations

None.

## Universal Editor fields

N/A (Document Authoring project)
