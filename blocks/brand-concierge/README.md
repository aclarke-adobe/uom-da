# brand-concierge

Custom **brand-concierge** block. Purpose: embeds the Adobe Experience Platform Brand Concierge web agent
(conversational assistant) where the block is placed.

## Authoring (Document Authoring)

Model: `standalone`

Add a block table named **Brand Concierge**. It needs no content: an empty one-row table uses the deploy
script's configuration. Optional key | value rows override it:

| Key | Default | Meaning |
| --- | --- | --- |
| Datastream ID | `638a5671-d3c7-4d23-9a7f-150360a10e8c` | Web SDK datastream |
| Org ID | `447AE26358FA40C50A495DB1@AdobeOrg` | Adobe organization |
| Edge Domain | `edge.adobedc.net` | Web SDK edge domain |
| Edge Base Path | `ee` | Web SDK edge base path |
| Default Consent | `in` | Web SDK default consent (`in`, `out`, `pending`) |
| Debug | `true` | Web SDK debug logging |
| Sticky Session | `false` | Keep the conversation across page loads |
| Style Configuration | `/blocks/brand-concierge/styleConfigurations.js` | Script that sets `window.styleConfiguration` |

## Behaviour

- Loads, in order, the styling configuration, the Web SDK (`alloy.min.js` 2.32.0) and the Brand Concierge
  `main.js`, then runs `alloy("configure")`, `alloy("sendEvent")` and `adobe.concierge.bootstrap()` into a mount
  element inside the block (`#brand-concierge-mount`; later blocks on the same page get numbered ids).
- Scripts load when the block comes within 200px of the viewport, so the agent never delays the page.
- The Web SDK is configured once per page, even with several Brand Concierge blocks.
- `block.dataset.conciergeStatus` is `ready` once bootstrapped, or `error` (details in the console).
- The site's consent placeholder (`scripts/consent-check.js`) is not consulted; the Web SDK uses the
  `Default Consent` value above, as in the vendor deploy script.

## Files

- `styleConfigurations.js`: placeholder for the vendor styling configuration file; replace its contents with
  the supplied `styleConfigurations.js`.

## Universal Editor fields

N/A (Document Authoring project)
