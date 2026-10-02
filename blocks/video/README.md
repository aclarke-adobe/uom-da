# video

Custom **video** block. Purpose: Embedded video with click-to-play poster.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Optional intro row (no video link): heading and text. Then one row per video: a link to the video (YouTube, Vimeo or .mp4), optional poster image and optional caption (title, duration). Options: split (intro beside a single video), shorts (intro beside a grid of portrait 9:16 videos with captions).

- **Default**: full-width 16:9 poster with YouTube's red play button; the player loads on click.
- **Split**: intro (a third) beside the video (two thirds). The caption (`title`, `duration`) becomes a navy bar
  with a play icon at the poster's bottom left; the poster gets a 30% navy tint and a white play circle.
- **Shorts**: portrait 9:16 testimonials. Caption cell: title (shown as an `h3`), speaker name, duration (shown in
  the bar on the poster). Without a poster image, the YouTube thumbnail is used. Consecutive `video (shorts)`
  blocks in a section join one row, and default content directly before the first one becomes the intro beside
  them. Below 600px the row scrolls horizontally.

## Supported variations

| Variation | Option class |
| --- | --- |
| Split | `split` |
| Shorts | `shorts` |

## Universal Editor fields

N/A (Document Authoring project)
