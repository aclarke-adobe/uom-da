# brand-concierge

Custom **brand-concierge** block. Purpose: embeds the Adobe Experience Platform Brand Concierge web agent
(conversational assistant) where the block is placed.

## Authoring (Document Authoring)

Model: `standalone`

Add a block table named **Brand Concierge**. It needs no content: an empty one-row table uses the defaults
below. Optional key | value rows customise it.

Welcome copy and prompts:

| Key | Default | Meaning |
| --- | --- | --- |
| Heading | `How can we help?` | Welcome heading |
| Subheading | (none) | Line under the heading |
| Cards Heading | (none) | Label above the example prompts |
| Placeholder | `Ask a question` | Text in the empty message box |
| Examples | (none) | Example prompts: a list (or one paragraph each); an image in an item becomes the card's picture |

Web SDK settings (defaults are the vendor deploy script's values):

| Key | Default |
| --- | --- |
| Datastream ID | `638a5671-d3c7-4d23-9a7f-150360a10e8c` |
| Org ID | `447AE26358FA40C50A495DB1@AdobeOrg` |
| Edge Domain | `edge.adobedc.net` |
| Edge Base Path | `ee` |
| Default Consent | `in` (`in`, `out` or `pending`) |
| Debug | `true` (Web SDK debug logging) |
| Sticky Session | `false` (keep the conversation across page loads) |

## Behaviour

- Loads the Web SDK (`alloy.min.js` 2.32.0) and the Brand Concierge `main.js`, runs `alloy("configure")` and
  `alloy("sendEvent")`, then `adobe.concierge.bootstrap()` into a mount element inside the block
  (`#brand-concierge-mount`; later blocks on the same page get numbered ids).
- The agent's styling configuration is built in `brand-concierge.js` (no separate styleConfigurations.js):
  - `text`: every string the agent requires, with English defaults, plus the authored welcome copy;
  - `arrays['welcome.examples']`: the authored example prompts;
  - `theme`: the agent's CSS variables mapped to the site tokens (Source Sans, UoM navy, site text colour);
  - `behavior` / `assets`: agent defaults.
- Scripts load when the block comes within 200px of the viewport, so the agent never delays the page.
- The Web SDK is configured once per page, even with several Brand Concierge blocks.
- `block.dataset.conciergeStatus` is `ready` once bootstrapped, or `error` (details in the console).
- The site's consent placeholder (`scripts/consent-check.js`) is not consulted; the Web SDK uses the
  `Default Consent` value above, as in the vendor deploy script.

## Universal Editor fields

N/A (Document Authoring project)
