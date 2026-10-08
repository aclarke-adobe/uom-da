import { loadScript, readBlockConfig, toClassName } from '../../scripts/aem.js';

/*
 * Brand Concierge (Adobe Experience Platform web agent).
 *
 * Reproduces the vendor deploy script: the Web SDK (alloy) base code, alloy.min.js, the Brand
 * Concierge main.js, `alloy("configure")` + `alloy("sendEvent")`, then
 * `adobe.concierge.bootstrap()` into a mount element inside the block.
 *
 * The agent's styling configuration (`stylingConfigurations`: text, arrays, theme, behavior,
 * assets) is built here instead of being loaded from a separate styleConfigurations.js: required
 * strings have defaults, the theme maps the agent's CSS variables onto the site's brand tokens, and
 * authors can set the welcome copy and example prompts in the block (see README.md).
 */
const CONFIG_URL = new URL('./style-config.json', import.meta.url).href;
const SELECTOR = '#brand-concierge-mount';
const WAIT_MS = 10000;

function waitForConcierge(timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.adobe?.concierge?.bootstrap) resolve(window.adobe.concierge);
      else if (Date.now() - start > timeout) reject(new Error('adobe.concierge not available'));
      else setTimeout(check, 100);
    };
    check();
  });
}

export default async function decorate(block) {
  block.textContent = '';
  const mount = document.createElement('div');
  mount.id = SELECTOR.slice(1);
  block.append(mount);

  try {
    const [config, concierge] = await Promise.all([
      fetch(CONFIG_URL).then((resp) => {
        if (!resp.ok) throw new Error(`style config ${resp.status}`);
        return resp.json();
      }),
      waitForConcierge(),
    ]);

    window.styleConfiguration = config;

    concierge.bootstrap({
      instanceName: 'alloy',
      stylingConfigurations: window.styleConfiguration,
      selector: SELECTOR,
      stickySession: false,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('brand-concierge block failed:', e);
  }
}
