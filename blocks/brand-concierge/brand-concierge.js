import { loadScript, readBlockConfig } from '../../scripts/aem.js';

/*
 * Brand Concierge (Adobe Experience Platform web agent).
 *
 * Reproduces the vendor deploy script: the Web SDK (alloy) base code, alloy.min.js, the Brand
 * Concierge main.js, `alloy("configure")` + `alloy("sendEvent")`, then
 * `adobe.concierge.bootstrap()` into a mount element inside the block. The defaults below are the
 * deploy script's values; authors may override any of them with optional key | value rows
 * (see README.md).
 */
const DEFAULTS = {
  'datastream-id': '638a5671-d3c7-4d23-9a7f-150360a10e8c',
  'org-id': '447AE26358FA40C50A495DB1@AdobeOrg',
  'edge-domain': 'edge.adobedc.net',
  'edge-base-path': 'ee',
  'default-consent': 'in',
  debug: 'true',
  'sticky-session': 'false',
  'style-configuration': `${window.hlx?.codeBasePath || ''}/blocks/brand-concierge/styleConfigurations.js`,
};

const INSTANCE = 'alloy';
const ALLOY_SRC = 'https://cdn1.adoberesources.net/alloy/2.32.0/alloy.min.js';
const CONCIERGE_SRC = 'https://experience.adobe.net/solutions/experience-platform-brand-concierge-web-agent/static-assets/main.js';

let setup; // one Web SDK set-up per page, shared by every Brand Concierge block

/** Web SDK base code: declares the instance and queues calls until alloy.min.js has loaded. */
function installAlloyBaseCode(name) {
  if (window[name]) return;
  // eslint-disable-next-line no-underscore-dangle
  (window.__alloyNS = window.__alloyNS || []).push(name);
  window[name] = (...args) => new Promise((resolve, reject) => {
    window[name].q.push([resolve, reject, args]);
  });
  window[name].q = [];
}

const isTrue = (value) => ['true', 'yes', '1', 'on'].includes(String(value).trim().toLowerCase());

function setUpWebSdk(config) {
  if (!setup) {
    setup = (async () => {
      installAlloyBaseCode(INSTANCE);
      // the deploy script loads these in document order: styling config, Web SDK, Brand Concierge
      try {
        await loadScript(config['style-configuration']);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('brand-concierge: style configuration not found, using the agent defaults', e);
      }
      await loadScript(ALLOY_SRC);
      await loadScript(CONCIERGE_SRC);
      window[INSTANCE]('configure', {
        defaultConsent: config['default-consent'],
        edgeDomain: config['edge-domain'],
        edgeBasePath: config['edge-base-path'],
        datastreamId: config['datastream-id'],
        orgId: config['org-id'],
        debugEnabled: isTrue(config.debug),
        idMigrationEnabled: false,
        thirdPartyCookiesEnabled: false,
        prehidingStyle: '.personalization-container { opacity: 0 !important }',
      });
      window[INSTANCE]('sendEvent', {});
    })();
  }
  return setup;
}

async function start(block, mount, config) {
  try {
    await setUpWebSdk(config);
    if (!window.adobe?.concierge?.bootstrap) throw new Error('adobe.concierge.bootstrap is not available');
    // the agent rejects a missing styling configuration; fail here with a clear message instead
    if (!window.styleConfiguration) {
      throw new Error(`window.styleConfiguration is not set: add the Brand Concierge styling configuration to ${config['style-configuration']}`);
    }
    window.adobe.concierge.bootstrap({
      instanceName: INSTANCE,
      stylingConfigurations: window.styleConfiguration,
      selector: `#${mount.id}`,
      stickySession: isTrue(config['sticky-session']),
    });
    block.dataset.conciergeStatus = 'ready';
  } catch (error) {
    block.dataset.conciergeStatus = 'error';
    // eslint-disable-next-line no-console
    console.error('brand-concierge: failed to start', error);
  }
}

let mountCount = 0;

/**
 * Decorates the Brand Concierge block.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const authored = readBlockConfig(block);
  const config = { ...DEFAULTS };
  Object.entries(authored).forEach(([key, value]) => {
    if (value && key in DEFAULTS) config[key] = Array.isArray(value) ? value[0] : value;
  });

  mountCount += 1;
  const mount = document.createElement('div');
  mount.id = mountCount === 1 ? 'brand-concierge-mount' : `brand-concierge-mount-${mountCount}`;
  mount.className = 'brand-concierge-mount';
  block.replaceChildren(mount);

  // third-party scripts load only when the block nears the viewport, so they never hold up the page
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      start(block, mount, config);
    }
  }, { rootMargin: '200px' });
  observer.observe(block);
}
