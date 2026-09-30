/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-split.js
  function imageFrom(container, document) {
    if (!container) return null;
    const img = container.querySelector("img");
    if (!img) return null;
    const dataSrc = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
    const src = img.getAttribute("src") || "";
    const inline = (s) => !s || s.startsWith("data:") || s.startsWith("blob:");
    if (inline(src) && dataSrc) img.setAttribute("src", dataSrc);
    if (inline(img.getAttribute("src"))) return null;
    const clean5 = document.createElement("img");
    clean5.src = img.getAttribute("src");
    clean5.alt = img.getAttribute("alt") || "";
    return clean5;
  }
  function splitParagraph(p, document) {
    const out = [];
    let current = document.createElement("p");
    const nodes = [...p.childNodes];
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.nodeName === "BR") {
        let j = i + 1;
        while (j < nodes.length && nodes[j].nodeType === 3 && !nodes[j].textContent.trim()) j += 1;
        if (j < nodes.length && nodes[j].nodeName === "BR") {
          if (current.textContent.trim()) out.push(current);
          current = document.createElement("p");
          i = j;
          continue;
        }
      }
      current.append(node);
    }
    if (current.textContent.trim()) out.push(current);
    out.forEach((para) => {
      if (para.firstChild && para.firstChild.nodeType === 3) para.firstChild.textContent = para.firstChild.textContent.replace(/^\s+/, "");
      if (para.lastChild && para.lastChild.nodeType === 3) para.lastChild.textContent = para.lastChild.textContent.replace(/\s+$/, "");
    });
    return out.length ? out : [p];
  }
  function ctaFrom(a, document) {
    const link = document.createElement("a");
    link.href = a.getAttribute("href");
    link.textContent = a.textContent.replace(/\s+/g, " ").trim();
    const p = document.createElement("p");
    const wrap = document.createElement(/btn--secondary/.test(a.className) ? "em" : "strong");
    wrap.append(link);
    p.append(wrap);
    return p;
  }
  function parse(element, { document }) {
    const preserved = [];
    const form = element.querySelector('form.inline-search, form[class*="search"]');
    if (form) preserved.push(form);
    element.querySelectorAll("table").forEach((t) => {
      if (!t.parentElement.closest("table")) preserved.push(t);
    });
    const browse = element.querySelector(".page-header-study__content-inner > .text-small, .page-header-study__content .text-small");
    if (browse && !preserved.some((el) => el.contains(browse))) preserved.push(browse);
    preserved.forEach((el) => el.remove());
    const heading = element.querySelector("h1, h2, h3");
    if (heading) heading.textContent = heading.textContent.replace(/\s+/g, " ").trim();
    const eyebrow = element.querySelector('.card-article-large__category, [class*="__category"], [class*="eyebrow"]');
    const contentRoot = element.querySelector(
      '.page-header-study__content-inner, .card-article-large__content, [class*="__content"]'
    ) || element;
    const paragraphs = [];
    [...contentRoot.querySelectorAll("p")].forEach((p) => {
      if (p === eyebrow || !p.textContent.trim()) return;
      if (p.closest("a, .btn")) return;
      paragraphs.push(...splitParagraph(p, document));
    });
    const ctas = [...contentRoot.querySelectorAll('a.btn, a[class*="btn--"], a.button')].filter((a, i, all) => all.indexOf(a) === i && a.getAttribute("href")).map((a) => ctaFrom(a, document));
    const image = imageFrom(
      element.querySelector('.page-header-study__img, .card-article-large__img, [class*="__img"]') || element,
      document
    );
    if (!heading && !paragraphs.length) {
      element.replaceWith(...element.childNodes, ...preserved);
      return;
    }
    const textCell2 = [];
    if (eyebrow && eyebrow.textContent.trim()) {
      const ep = document.createElement("p");
      ep.textContent = eyebrow.textContent.replace(/\s+/g, " ").trim();
      textCell2.push(ep);
    }
    if (heading) textCell2.push(heading);
    textCell2.push(...paragraphs, ...ctas);
    const cells = [[textCell2, image ? [image] : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero (split)", cells });
    element.replaceWith(block);
    if (preserved.length) block.after(...preserved);
  }

  // tools/importer/parsers/search.js
  var DEFAULT_ORIGIN = "https://study.unimelb.edu.au";
  var DEFAULT_ACTION = "/find/";
  var DEFAULT_PARAM = "query";
  var DEFAULT_PLACEHOLDER = "Find a course, study area or major";
  function parse2(element, { document, params }) {
    const form = element.matches("form") ? element : element.querySelector("form");
    const input = (form || element).querySelector('input.inline-search__input, input[type="search"], input[type="text"], input:not([type="hidden"])');
    let origin = DEFAULT_ORIGIN;
    try {
      const src = params && params.originalURL;
      if (src) origin = new URL(src).origin;
    } catch (e) {
    }
    const action = form && form.getAttribute("action") || DEFAULT_ACTION;
    let url;
    try {
      url = new URL(action, origin);
    } catch (e) {
      url = new URL(DEFAULT_ACTION, DEFAULT_ORIGIN);
    }
    (form ? [...form.querySelectorAll('input[type="hidden"][name]')] : []).forEach((h) => {
      url.searchParams.set(h.getAttribute("name"), h.getAttribute("value") || "");
    });
    const param = input && input.getAttribute("name") || DEFAULT_PARAM;
    url.searchParams.set(param, "");
    const placeholder = input && input.getAttribute("placeholder") || form && form.querySelector("label") && form.querySelector("label").textContent.trim() || DEFAULT_PLACEHOLDER;
    if (!form && !input) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const link = document.createElement("a");
    link.href = url.toString();
    link.textContent = placeholder;
    const p = document.createElement("p");
    p.append(link);
    const cells = [[p]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Search", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-tile.js
  function cleanText(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function makeLink(a, text, document) {
    const link = document.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = text;
    return link;
  }
  function parse3(element, { document }) {
    const cells = [];
    let items = [...element.querySelectorAll(".pathfinder-today__link")];
    if (!items.length) items = [...element.querySelectorAll(".pathfinder-today__list-item")];
    items.forEach((item) => {
      const a = item.querySelector("a[href]");
      const titleEl = item.querySelector(".pathfinder-today__link-title") || a;
      const title = cleanText(titleEl);
      if (!a || !title) return;
      const body = [];
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.append(makeLink(a, title, document));
      p.append(strong);
      body.push(p);
      const desc = cleanText(item.querySelector('.pathfinder-today__link-description, [class*="description"]'));
      if (desc) {
        const dp = document.createElement("p");
        dp.textContent = desc;
        body.push(dp);
      }
      cells.push([body]);
    });
    if (!cells.length) {
      let cards = [...element.querySelectorAll(".article-card__inner")];
      if (!cards.length) cards = [...element.querySelectorAll(".article-card")];
      cards.forEach((card) => {
        const heading = card.querySelector("h2, h3, h4, .article-card__title");
        const a = heading && heading.querySelector("a[href]") || card.querySelector("a[href]");
        const title = cleanText(a && a.querySelector(".push-icon") || a || heading);
        if (!title) return;
        const body = [];
        const eyebrow = cleanText(card.querySelector('.article-card__category, [class*="category"], [class*="eyebrow"]'));
        if (eyebrow) {
          const ep = document.createElement("p");
          ep.textContent = eyebrow;
          body.push(ep);
        }
        const h = document.createElement(heading && /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3");
        if (a) h.append(makeLink(a, title, document));
        else h.textContent = title;
        body.push(h);
        cells.push([body]);
      });
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards (tile)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-course-link.js
  function parse4(element, { document }) {
    let items = [...element.querySelectorAll(":scope > li, :scope > .uom-link-list__item")];
    if (!items.length) items = [...element.querySelectorAll("li")];
    const cells = [];
    items.forEach((li) => {
      const a = li.querySelector("a[href]");
      if (!a) return;
      const textEl = a.querySelector(".uom-link__text") || a;
      const text = textEl.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const link = document.createElement("a");
      link.href = a.getAttribute("href").trim();
      link.textContent = text;
      const p = document.createElement("p");
      p.append(link);
      cells.push([p]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards", variants: ["course-link"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-split.js
  function clean(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  var SOURCE_ORIGIN = "https://study.unimelb.edu.au";
  function absolute(src) {
    try {
      return new URL(src, `${SOURCE_ORIGIN}/`).href;
    } catch (e) {
      return src;
    }
  }
  function backgroundUrl(side) {
    const els = [side, ...side.querySelectorAll('[style*="background"], [data-bg], [data-background-image]')];
    for (const el of els) {
      const attr = el.getAttribute("data-bg") || el.getAttribute("data-background-image");
      if (attr) return absolute(attr.trim());
      const m = (el.getAttribute("style") || "").match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      if (m && m[2] && !m[2].startsWith("data:")) return absolute(m[2].trim());
    }
    return "";
  }
  function imageCell(side, document) {
    const out = document.createElement("img");
    const img = side.querySelector("img");
    let src = "";
    if (img) {
      src = img.getAttribute("src") || "";
      const dataSrc = img.getAttribute("data-src");
      if ((!src || src.startsWith("data:") || src.startsWith("blob:")) && dataSrc) src = dataSrc;
      if (src.startsWith("data:") || src.startsWith("blob:")) src = "";
      out.alt = img.getAttribute("alt") || "";
    }
    if (!src) {
      src = backgroundUrl(side);
      const label = side.getAttribute("aria-label") || (side.querySelector("[aria-label]") || { getAttribute: () => "" }).getAttribute("aria-label");
      out.alt = label || out.alt || "";
    }
    if (!src) return "";
    out.src = src;
    return [out];
  }
  function textCell(side, document) {
    const root = side.querySelector(".split-section__inner") || side;
    const content = [];
    [...root.querySelectorAll("p, h1, h2, h3, h4, a.btn")].forEach((el) => {
      if (el.matches("a.btn")) {
        const href = (el.getAttribute("href") || "").trim();
        const text = clean(el);
        if (!href || !text) return;
        const link = document.createElement("a");
        link.href = href;
        link.textContent = text;
        const wrap = document.createElement(/btn--secondary/.test(el.className) ? "em" : "strong");
        wrap.append(link);
        const p = document.createElement("p");
        p.append(wrap);
        content.push(p);
        return;
      }
      if (el.closest("a.btn") || !clean(el)) return;
      if (el.matches('.uom-title-overline, [class*="overline"], [class*="eyebrow"]')) {
        const p = document.createElement("p");
        p.textContent = clean(el);
        content.push(p);
        return;
      }
      el.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
      content.push(el);
    });
    return content;
  }
  function parse5(element, { document }) {
    let sides = [...element.querySelectorAll(":scope > .split-section__side, :scope > div")];
    if (!sides.length) sides = [...element.children];
    const row = [];
    sides.forEach((side) => {
      const isImage = side.matches('[class*="--with-image"]') || side.querySelector("img") && !clean(side);
      if (isImage) {
        const cell = imageCell(side, document);
        if (cell) row.push(cell);
      } else {
        const cell = textCell(side, document);
        if (cell.length) row.push(cell);
      }
    });
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns (split)", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function clean2(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  var SOURCE_ORIGIN2 = "https://study.unimelb.edu.au";
  function absolute2(src) {
    try {
      return new URL(src, `${SOURCE_ORIGIN2}/`).href;
    } catch (e) {
      return src;
    }
  }
  function backgroundUrl2(el) {
    if (!el) return "";
    const attr = el.getAttribute("data-bg") || el.getAttribute("data-background-image");
    if (attr) return absolute2(attr.trim());
    const m = (el.getAttribute("style") || "").match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    return m && m[2] && !m[2].startsWith("data:") ? absolute2(m[2].trim()) : "";
  }
  function pickImage(card, document) {
    const out = document.createElement("img");
    const img = card.querySelector(".card__thumb img, .card__thumb-img img, .card__image img");
    if (img) {
      let src = img.getAttribute("src") || "";
      const dataSrc = img.getAttribute("data-src");
      if ((!src || src.startsWith("data:") || src.startsWith("blob:")) && dataSrc) src = dataSrc;
      if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
        out.src = src;
        const labelled = img.closest("[aria-label]");
        out.alt = img.getAttribute("alt") || (labelled && card.contains(labelled) ? labelled.getAttribute("aria-label") : "") || "";
        return out;
      }
    }
    const thumbs = [...card.querySelectorAll('.card__thumb-img, .card__thumb, .card__image, [role="img"][style*="background"]')];
    const thumb = thumbs.find((el) => backgroundUrl2(el));
    if (!thumb) return null;
    out.src = backgroundUrl2(thumb);
    out.alt = thumb.getAttribute("aria-label") || "";
    return out;
  }
  function parse6(element, { document }) {
    let cards = [...element.querySelectorAll(".card")];
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > div")];
    const cells = [];
    cards.forEach((card) => {
      const body = [];
      const heading = card.querySelector("h2, h3, h4, .card__title");
      if (heading && clean2(heading)) {
        const h = document.createElement(/^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3");
        h.textContent = clean2(heading);
        body.push(h);
      }
      card.querySelectorAll(".card__inner p, .card__meta").forEach((p, i, all) => {
        if ([...all].indexOf(p) !== i || !clean2(p)) return;
        const para = document.createElement("p");
        para.textContent = clean2(p);
        body.push(para);
      });
      const cta = card.querySelector(".card__footer a[href], a.btn[href]");
      if (cta) {
        cta.querySelectorAll(".screenreaders-only, .sr-only").forEach((s) => s.remove());
        const link = document.createElement("a");
        link.href = cta.getAttribute("href").trim();
        link.textContent = clean2(cta);
        const p = document.createElement("p");
        p.append(link);
        body.push(p);
      }
      if (!body.length) return;
      const image = pickImage(card, document);
      cells.push([image ? [image] : "", body]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  function clean3(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function iconName(title) {
    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return slug ? `uom-${slug}` : "";
  }
  function pictogram(card, title, document) {
    const holder = card.querySelector('.card__icons__left, [class*="card__icon"]');
    if (!holder || !holder.querySelector("img, svg")) return null;
    const name = iconName(title);
    if (!name) return null;
    const p = document.createElement("p");
    p.textContent = `:${name}:`;
    return p;
  }
  function parse7(element, { document }) {
    let cards = [...element.querySelectorAll(".card")];
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > div")];
    const cells = [];
    cards.forEach((card) => {
      const body = [];
      const heading = card.querySelector("h2, h3, h4, .card__title");
      const title = clean3(heading);
      if (title) {
        const h = document.createElement(/^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3");
        h.textContent = title;
        body.push(h);
      }
      card.querySelectorAll(".card__inner p, .card__meta").forEach((p, i, all) => {
        if ([...all].indexOf(p) !== i || !clean3(p)) return;
        const para = document.createElement("p");
        para.textContent = clean3(p);
        body.push(para);
      });
      const cta = card.querySelector(".card__footer a[href], a.btn[href]");
      if (cta) {
        cta.querySelectorAll(".screenreaders-only, .sr-only").forEach((s) => s.remove());
        const link = document.createElement("a");
        link.href = cta.getAttribute("href").trim();
        link.textContent = clean3(cta);
        const p = document.createElement("p");
        p.append(link);
        body.push(p);
      }
      if (!body.length) return;
      const icon = pictogram(card, title, document);
      cells.push([icon ? [icon] : "", body]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards (icon)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  function clean4(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function parse8(element, { document }) {
    const root = element.matches("blockquote") ? element : element.querySelector("blockquote") || element;
    const quoteParas = [...root.querySelectorAll("p")].filter((p) => !p.closest("cite") && clean4(p)).map((p) => {
      const out = document.createElement("p");
      out.textContent = clean4(p);
      return out;
    });
    const citeEl = root.querySelector('cite, .testimonials-alt__name, [class*="__name"]');
    let attribution = null;
    if (citeEl && clean4(citeEl)) {
      attribution = document.createElement("p");
      attribution.textContent = `\u2014 ${clean4(citeEl).replace(/^[—–-]\s*/, "")}`;
    }
    let image = null;
    const img = root.querySelector(".testimonials-alt__img img, .progressive-image img, img");
    if (img) {
      let src = img.getAttribute("src") || "";
      const dataSrc = img.getAttribute("data-src");
      const inline = (s) => !s || s.startsWith("data:") || s.startsWith("blob:");
      if (inline(src) && dataSrc) src = dataSrc;
      if (!inline(src)) {
        image = document.createElement("img");
        image.src = src;
        image.alt = img.getAttribute("alt") || "";
      }
    }
    if (!quoteParas.length && !attribution) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const text = [...quoteParas];
    if (attribution) text.push(attribution);
    const row = [text];
    if (image) row.push([image]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Quote", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/transformers/unimelb-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      element.querySelectorAll(".optimizely_experiment > span.optimizely_experiment__block:not(:first-of-type)").forEach((span) => span.remove());
      WebImporter.DOMUtils.remove(element, [
        "#__tealiumGDPRecModal",
        ".tealium_privacy_prompt",
        'iframe[src*="optimizely.com"]'
      ]);
      const TRACKER = /^(?:https?:)?\/\/(?:[^/]*\.)?(?:t\.co|analytics\.twitter\.com|sp\.analytics\.yahoo\.com|analytics\.yahoo\.com|facebook\.com\/tr|[^/]*doubleclick\.net|bat\.bing\.com|[^/]*googleadservices\.com|[^/]*google-analytics\.com|googletagmanager\.com|google\.com\/(?:pagead|measurement|ads)|[^/]*adsrvr\.org)(?:[/?#]|$)/i;
      element.querySelectorAll("img, iframe").forEach((el) => {
        const src = (el.getAttribute("src") || "").trim();
        const title = el.getAttribute("title") || "";
        if (TRACKER.test(src) || el.tagName === "IFRAME" && /pixel|tracking/i.test(title)) el.remove();
      });
      const isPictogram = (el) => !!el.closest(".card__icons__left");
      WebImporter.DOMUtils.remove(element, ["#__SVG_SPRITE_NODE__"]);
      element.querySelectorAll("svg").forEach((svg) => {
        if (!isPictogram(svg) && svg.isConnected) svg.remove();
      });
      element.querySelectorAll("img").forEach((img) => {
        const src = (img.getAttribute("src") || "").trim();
        if (/^(?:data:image\/svg\+xml|blob:)/i.test(src) && !isPictogram(img)) img.remove();
      });
      WebImporter.DOMUtils.remove(element, ["a.uom-link .uom-link__icon"]);
      element.querySelectorAll("a.btn span.screenreaders-only").forEach((s) => s.remove());
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        const trimmed = href.trim();
        if (trimmed !== href) a.setAttribute("href", trimmed);
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".screen-reader-jump-to",
        // skip links
        "uom-ds-mega-menu",
        // header / mega menu web component
        "uom-ds-font-loader-component",
        "dash-cart",
        // "0 saved courses" dashboard link
        "#ui > section.uom-link-list-section",
        // "How can we help?" band
        "footer.uom-page-footer"
      ]);
      WebImporter.DOMUtils.remove(element, ["script", "noscript", "style", "link"]);
    }
  }

  // tools/importer/transformers/unimelb-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const allSections = payload && payload.template && payload.template.sections || [];
    const sections = allSections.length > 1 ? allSections : [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = element.ownerDocument.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(element.ownerDocument, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-split": parse,
    "search": parse2,
    "cards-tile": parse3,
    "cards-course-link": parse4,
    "columns-split": parse5,
    "cards": parse6,
    "cards-icon": parse7,
    "quote": parse8
  };
  var PAGE_TEMPLATE = {
    "name": "homepage",
    "description": "Site homepage with search hero, tabbed course finder, feature sections and testimonial quote",
    "urls": [
      "https://study.unimelb.edu.au",
      "https://study.unimelb.edu.au/home"
    ],
    "blocks": [
      {
        "name": "hero-split",
        "instances": [
          "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner .page-header-study",
          "span.optimizely_experiment__block:first-of-type > section.ct-searchbanner .card-article-large"
        ]
      },
      {
        "name": "search",
        "instances": [
          "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner form.inline-search"
        ]
      },
      {
        "name": "cards-tile",
        "instances": [
          "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner .pathfinder-today",
          "span.optimizely_experiment__block:first-of-type > section.ct-searchbanner .article-card-list",
          "span.optimizely_experiment__block:first-of-type > .pathfinder-today"
        ]
      },
      {
        "name": "cards-course-link",
        "instances": [
          "span.optimizely_experiment__block:first-of-type > .slimline-quicklinks .uom-link-list__list"
        ]
      },
      {
        "name": "columns-split",
        "instances": [
          "span.optimizely_experiment__block:first-of-type > div.tile-split-section section.split-section"
        ]
      },
      {
        "name": "cards",
        "instances": [
          "span.optimizely_experiment__block:first-of-type > .ct-featurespanel.bg-alt .grid.grid--3col"
        ]
      },
      {
        "name": "cards-icon",
        "instances": [
          "span.optimizely_experiment__block:first-of-type:has(> .pathfinder-today) .ct-featurespanel .grid.grid--3col"
        ]
      },
      {
        "name": "quote",
        "instances": [
          "span.optimizely_experiment__block:first-of-type > .ct-testimonial .section-alt__right blockquote"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Hero with course search and study-level pathfinder",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner"
        ],
        "style": "navy",
        "blocks": [
          "hero-split",
          "search",
          "cards-tile"
        ],
        "defaultContent": [
          'span.optimizely_experiment__block:first-of-type > div.ct-searchbanner .page-header-study [aria-label="Popular searches"]',
          "span.optimizely_experiment__block:first-of-type > div.ct-searchbanner .page-header-study__content-inner > div.text-small"
        ]
      },
      {
        "id": "section-2",
        "name": "Quick links bar",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > .slimline-quicklinks"
        ],
        "style": "grey",
        "blocks": [
          "cards-course-link"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Intro statement",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > .content-block"
        ],
        "style": "centered",
        "blocks": [],
        "defaultContent": [
          "span.optimizely_experiment__block:first-of-type > .content-block h2",
          "span.optimizely_experiment__block:first-of-type > .content-block p"
        ]
      },
      {
        "id": "section-4",
        "name": "Access Melbourne feature",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > section.ct-searchbanner"
        ],
        "style": "navy",
        "blocks": [
          "hero-split",
          "cards-tile"
        ],
        "defaultContent": []
      },
      {
        "id": "section-5",
        "name": "Split tile - Flexible and focused degrees",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > div.tile-split-section:nth-of-type(1)"
        ],
        "style": "grey",
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "section-6",
        "name": "Split tile - Ranked #1 in graduate employability",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > div.tile-split-section:nth-of-type(2)"
        ],
        "style": null,
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "section-7",
        "name": "Split tile - Get financial support",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > div.tile-split-section:nth-of-type(3)"
        ],
        "style": "grey",
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "section-8",
        "name": "Split tile - Connect with your community",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > div.tile-split-section:nth-of-type(4)"
        ],
        "style": null,
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "section-9",
        "name": "What's happening at Melbourne",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > .ct-featurespanel.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          "span.optimizely_experiment__block:first-of-type > .ct-featurespanel.bg-alt h2",
          "span.optimizely_experiment__block:first-of-type > .ct-featurespanel.bg-alt h2 + p"
        ]
      },
      {
        "id": "section-10",
        "name": "Looking for more information?",
        "selector": [
          "span.optimizely_experiment__block:first-of-type:has(> .pathfinder-today)"
        ],
        "style": "centered",
        "blocks": [
          "cards-icon",
          "cards-tile"
        ],
        "defaultContent": [
          "span.optimizely_experiment__block:first-of-type:has(> .pathfinder-today) .ct-featurespanel h2"
        ]
      },
      {
        "id": "section-11",
        "name": "Meet our students",
        "selector": [
          "span.optimizely_experiment__block:first-of-type > .ct-testimonial"
        ],
        "style": "grey",
        "blocks": [
          "quote"
        ],
        "defaultContent": [
          "span.optimizely_experiment__block:first-of-type > .ct-testimonial .section-alt__left"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [];
        try {
          elements = document.querySelectorAll(selector);
        } catch (e) {
          console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
        }
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    pageBlocks.sort((a, b) => {
      if (a.element === b.element) return 0;
      return a.element.compareDocumentPosition(b.element) & 4 ? -1 : 1;
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
