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
const SDK_DEFAULTS = {
  'datastream-id': '638a5671-d3c7-4d23-9a7f-150360a10e8c',
  'org-id': '447AE26358FA40C50A495DB1@AdobeOrg',
  'edge-domain': 'edge.adobedc.net',
  'edge-base-path': 'ee',
  'default-consent': 'in',
  debug: 'true',
  'sticky-session': 'false',
};

// authorable rows -> agent text keys
const TEXT_ROWS = {
  heading: 'welcome.heading',
  subheading: 'welcome.subheading',
  'cards-heading': 'welcome.cardsHeading',
  placeholder: 'input.placeholder',
};

// every key the agent requires (it throws when one is missing) plus common optional ones
const TEXT_DEFAULTS = {
  'welcome.heading': 'How can we help?',
  'input.placeholder': 'Ask a question',
  'input.send.aria': 'Send message',
  'input.send.tooltip': 'Send',
  'input.mic.aria': 'Use voice input',
  'input.messageInput.aria': 'Message',
  'input.message_input.aria': 'Message',
  'input.clearHistory.aria': 'Clear conversation',
  'input.clearHistory.label': 'Clear conversation',
  'scroll.bottom.aria': 'Scroll to the latest message',
  'carousel.prev.aria': 'Previous',
  'carousel.next.aria': 'Next',
  'feedback.dialog.notes': 'Tell us more (optional)',
  'feedback.dialog.submit': 'Submit',
  'feedback.dialog.cancel': 'Cancel',
  'feedback.toast.success': 'Thanks for your feedback',
  'loading.message': 'Thinking…',
  'error.general': 'Something went wrong. Please try again.',
  'error.network': 'We couldn’t connect. Check your connection and try again.',
  'error.offline': 'You appear to be offline.',
};

// agent CSS variables -> site brand tokens (styles/brand.css)
const THEME = {
  '--font-family': 'var(--body-font-family)',
  '--color-primary': 'var(--uom-navy)',
  '--color-primary-hover': 'var(--uom-navy-light)',
  '--color-text': 'var(--text-color)',
  '--color-text-primary': 'var(--uom-navy)',
  '--color-button-primary': 'var(--uom-navy)',
  '--color-button-primary-hover': 'var(--uom-navy-light)',
  '--color-button-primary-border': 'var(--uom-navy)',
  '--color-message-user': 'var(--uom-navy)',
  '--color-text-user': '#fff',
  '--color-message-concierge': 'var(--uom-grey)',
  '--color-text-concierge': 'var(--text-color)',
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
      // the deploy script loads these in document order: Web SDK, then Brand Concierge
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

/**
 * Example prompts from the "Examples" row: one per list item (or paragraph), with an optional
 * image shown as the example card's picture.
 */
function readExamples(row) {
  const cell = row && row.children[1];
  if (!cell) return [];
  const items = cell.querySelectorAll('li').length ? cell.querySelectorAll('li') : cell.querySelectorAll('p');
  return [...items].map((item) => {
    const text = item.textContent.replace(/\s+/g, ' ').trim();
    const img = item.querySelector('img');
    return img ? { text, image: img.currentSrc || img.src } : { text };
  }).filter((example) => example.text);
}

function stylingConfigurations(authored, examples) {
  const text = { ...TEXT_DEFAULTS };
  Object.entries(TEXT_ROWS).forEach(([row, key]) => {
    const value = authored[row];
    if (value) text[key] = Array.isArray(value) ? value.join(' ') : value;
  });
  return {
    text,
    arrays: examples.length ? { 'welcome.examples': examples } : {},
    theme: THEME,
    behavior: {},
    assets: { icons: {} },
  };
}

async function start(block, mount, config, styling) {
  try {
    await setUpWebSdk(config);
    if (!window.adobe?.concierge?.bootstrap) throw new Error('adobe.concierge.bootstrap is not available');
    await window.adobe.concierge.bootstrap({
      instanceName: INSTANCE,
      stylingConfigurations: styling,
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
  const examplesRow = [...block.children]
    .find((row) => row.children[0] && toClassName(row.children[0].textContent) === 'examples');
  const examples = readExamples(examplesRow);
  if (examplesRow) examplesRow.remove();

  const authored = readBlockConfig(block);
  const config = { ...SDK_DEFAULTS };
  Object.entries(authored).forEach(([key, value]) => {
    if (value && key in SDK_DEFAULTS) config[key] = Array.isArray(value) ? value[0] : value;
  });
  const styling = stylingConfigurations(authored, examples);

  mountCount += 1;
  const mount = document.createElement('div');
  mount.id = mountCount === 1 ? 'brand-concierge-mount' : `brand-concierge-mount-${mountCount}`;
  mount.className = 'brand-concierge-mount';
  block.replaceChildren(mount);

  // third-party scripts load only when the block nears the viewport, so they never hold up the page
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      start(block, mount, config, styling);
    }
  }, { rootMargin: '200px' });
  observer.observe(block);
}
