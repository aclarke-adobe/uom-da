/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: study.unimelb.edu.au (Squiz Matrix + Optimizely) site-wide cleanup.
 * All selectors verified against migration-work/cleaned.html (homepage capture).
 *
 * Optimizely: every content region in #main is
 *   div.optimizely_experiment > span.optimizely_experiment__block x2
 * The FIRST span is the visible (domestic) variant; the SECOND is a hidden
 * (international) variant. Block/section selectors in page-templates.json are
 * scoped to `span.optimizely_experiment__block:first-of-type`, so the first span
 * is left in place and only the second/hidden ones are removed.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Hidden Optimizely variants (div.optimizely_experiment > span.optimizely_experiment__block, 2nd span)
    element
      .querySelectorAll('.optimizely_experiment > span.optimizely_experiment__block:not(:first-of-type)')
      .forEach((span) => span.remove());

    // Consent / tracking overlays (found: div#__tealiumGDPRecModal, Optimizely client-storage iframe)
    WebImporter.DOMUtils.remove(element, [
      '#__tealiumGDPRecModal',
      '.tealium_privacy_prompt',
      'iframe[src*="optimizely.com"]',
    ]);

    // Tracking pixels / ad beacons injected at runtime (raw live DOM), wherever they sit
    // (found: t.co, analytics.twitter.com, sp.analytics.yahoo.com, insight.adsrvr.org
    // "TTD Universal Pixel" iframe; others guarded).
    const TRACKER = /^(?:https?:)?\/\/(?:[^/]*\.)?(?:t\.co|analytics\.twitter\.com|sp\.analytics\.yahoo\.com|analytics\.yahoo\.com|facebook\.com\/tr|[^/]*doubleclick\.net|bat\.bing\.com|[^/]*googleadservices\.com|[^/]*google-analytics\.com|googletagmanager\.com|google\.com\/(?:pagead|measurement|ads)|[^/]*adsrvr\.org)(?:[/?#]|$)/i;
    element.querySelectorAll('img, iframe').forEach((el) => {
      const src = (el.getAttribute('src') || '').trim();
      const title = el.getAttribute('title') || '';
      if (TRACKER.test(src) || (el.tagName === 'IFRAME' && /pixel|tracking/i.test(title))) el.remove();
    });

    // Decorative / sprite icons. Inline SVGs and data-URI images cannot be authored (the importer
    // turns them into unpublishable data:/blob: images), so all of them are dropped EXCEPT the
    // section-10 pictograms in .card__icons__left, which the cards-icon parser maps to EDS icons
    // (icons/uom-*.svg). Covers:
    //  - svg#__SVG_SPRITE_NODE__ and <svg><use xlink:href="#icon-arrow-right|#icon-search"/></svg>
    //    (raw live DOM)
    //  - the same icons serialised as <img src="data:image/svg+xml;base64,..."> (BD snapshot). The
    //    importer's preProcess has already rewritten every data: <img> src to a blob: URL before
    //    transformers run, so blob: sources are matched too.
    const isPictogram = (el) => !!el.closest('.card__icons__left');
    WebImporter.DOMUtils.remove(element, ['#__SVG_SPRITE_NODE__']);
    element.querySelectorAll('svg').forEach((svg) => {
      if (!isPictogram(svg) && svg.isConnected) svg.remove();
    });
    element.querySelectorAll('img').forEach((img) => {
      const src = (img.getAttribute('src') || '').trim();
      if (/^(?:data:image\/svg\+xml|blob:)/i.test(src) && !isPictogram(img)) img.remove();
    });

    // Decorative icon wrappers inside link-list links (div.uom-icon.uom-link__icon)
    WebImporter.DOMUtils.remove(element, ['a.uom-link .uom-link__icon']);

    // sr-only "about <title>" suffixes inside "Read more" links (a.btn > span.screenreaders-only)
    element.querySelectorAll('a.btn span.screenreaders-only').forEach((s) => s.remove());

    // Trim whitespace/newlines in hrefs (e.g. href=" \n\t https://study.unimelb.edu.au/...")
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const trimmed = href.trim();
      if (trimmed !== href) a.setAttribute('href', trimmed);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Site chrome (header/footer migrated separately as fragments)
    WebImporter.DOMUtils.remove(element, [
      '.screen-reader-jump-to', // skip links
      'uom-ds-mega-menu', // header / mega menu web component
      'uom-ds-font-loader-component',
      'dash-cart', // "0 saved courses" dashboard link
      '#ui > section.uom-link-list-section', // "How can we help?" band
      'footer.uom-page-footer',
    ]);

    // Non-authorable elements
    WebImporter.DOMUtils.remove(element, ['script', 'noscript', 'style', 'link']);
  }
}
