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
  var BLOCKED_IMAGES = [];
  function cleanText(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function courseImage(element, document) {
    const holder = element.querySelector('.course-header__img, [data-test="course-header-img"]');
    if (!holder) return null;
    const img = holder.querySelector("img");
    let src = img ? img.getAttribute("src") || img.getAttribute("data-src") || "" : "";
    if (!src || /^(data|blob):/.test(src)) {
      const m = (holder.getAttribute("style") || "").match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      src = m ? m[2].trim() : "";
    }
    if (!src || /^(data|blob):/.test(src)) return null;
    if (BLOCKED_IMAGES.some((frag) => src.includes(frag))) {
      console.warn(`[hero-split] image dropped (403): ${src}`);
      return null;
    }
    const out = document.createElement("img");
    out.src = src;
    out.alt = img && img.getAttribute("alt") || holder.getAttribute("aria-label") || "";
    return out;
  }
  function parseCourseHeader(element, document) {
    const textCell2 = [];
    const eyebrow = element.querySelector(".course-header__type, .course-header__tag");
    if (eyebrow && cleanText(eyebrow)) {
      const p = document.createElement("p");
      const a = eyebrow.querySelector("a[href]");
      if (a) {
        const link = document.createElement("a");
        link.href = a.getAttribute("href").trim();
        link.textContent = cleanText(a);
        p.append(link);
      } else {
        p.textContent = cleanText(eyebrow);
      }
      textCell2.push(p);
    }
    const title = element.querySelector("h1, .course-header__title, h2");
    if (title) {
      const h1 = document.createElement("h1");
      h1.textContent = cleanText(title);
      textCell2.push(h1);
    }
    const stats = [...element.querySelectorAll(".course-header__statistics > li, .course-header__stat")].filter((li, i, all) => all.indexOf(li) === i);
    if (stats.length) {
      const ul = document.createElement("ul");
      stats.forEach((li) => {
        li.querySelectorAll(".screenreaders-only, .sr-only").forEach((s) => s.remove());
        const a = li.querySelector("a[href]");
        const text = cleanText(li.querySelector(".uom-link__text") || a || li);
        if (!text) return;
        const item = document.createElement("li");
        if (a) {
          const link = document.createElement("a");
          link.href = a.getAttribute("href").trim();
          link.textContent = text;
          item.append(link);
        } else {
          item.textContent = text;
        }
        ul.append(item);
      });
      if (ul.children.length) textCell2.push(ul);
    }
    element.querySelectorAll(".course-header__codes > li, .course-header__code").forEach((li) => {
      const full = cleanText(li);
      const valueEl = li.querySelector(".text-bold, strong, b");
      const value = cleanText(valueEl) || full.split(":").slice(1).join(":").trim();
      const label = (full.includes(":") ? full.split(":")[0] : full.replace(value, "")).trim();
      if (!/^course code$/i.test(label)) return;
      if (!value) return;
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = value;
      p.append(`${label}: `, strong);
      textCell2.push(p);
    });
    element.querySelectorAll(".course-header__btns a[href]").forEach((a) => {
      if (cleanText(a)) textCell2.push(ctaFrom(a, document));
    });
    if (!textCell2.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const image = courseImage(element, document);
    const cells = [image ? [textCell2, [image]] : [textCell2]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero (split)", cells });
    element.replaceWith(block);
  }
  function parsePageHeaderAlt(element, document) {
    const content = element.querySelector(".page-header-alt__content-inner, .page-header-alt__content") || element;
    const textCell2 = [];
    const tag = content.querySelector(".page-header-alt__title-tag, .title--overline");
    if (tag && cleanText(tag)) {
      const p = document.createElement("p");
      if (tag.matches("a[href]")) {
        const a = document.createElement("a");
        a.href = tag.getAttribute("href").trim();
        a.textContent = cleanText(tag);
        p.append(a);
      } else p.textContent = cleanText(tag);
      textCell2.push(p);
    }
    const title = content.querySelector("h1, h2, .page-header-alt__title");
    if (title && cleanText(title)) {
      const later = [...document.querySelectorAll("h1")].some((h2) => h2 !== title && !element.contains(h2) && h2.compareDocumentPosition(element) & 4);
      const h = document.createElement(later ? "h2" : "h1");
      h.textContent = cleanText(title);
      textCell2.push(h);
    }
    content.querySelectorAll("p").forEach((p) => {
      if (p === tag || p.closest(".page-header-alt__actions") || !cleanText(p)) return;
      const out = document.createElement("p");
      out.innerHTML = p.innerHTML.trim();
      out.querySelectorAll("*").forEach((c) => [...c.attributes].forEach((a) => {
        if (a.name !== "href") c.removeAttribute(a.name);
      }));
      textCell2.push(out);
    });
    content.querySelectorAll(".page-header-alt__actions a[href]").forEach((a) => {
      if (!cleanText(a)) return;
      if (/btn--text/.test(a.className) || !/\bbtn\b/.test(a.className)) {
        const link = document.createElement("a");
        link.href = a.getAttribute("href").trim();
        link.textContent = cleanText(a);
        const p = document.createElement("p");
        p.append(link);
        textCell2.push(p);
      } else textCell2.push(ctaFrom(a, document));
    });
    if (!textCell2.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const holder = element.querySelector(".page-header-alt__img");
    let image = null;
    if (holder) {
      const img = holder.querySelector("img");
      let src = img ? img.getAttribute("src") || img.getAttribute("data-src") || "" : "";
      if ((!src || /^(data|blob):/.test(src)) && holder.querySelector("[data-excat-bg]")) src = holder.querySelector("[data-excat-bg]").getAttribute("data-excat-bg");
      if (src && !/^(data|blob):/.test(src)) {
        image = document.createElement("img");
        image.src = src.trim();
        image.alt = img && img.getAttribute("alt") || "";
      }
    }
    const cells = [image ? [textCell2, [image]] : [textCell2]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero (split)", cells });
    element.replaceWith(block);
  }
  function parse(element, { document }) {
    if (element.matches(".page-header-alt")) {
      parsePageHeaderAlt(element, document);
      return;
    }
    if (element.matches(".course-header") || element.querySelector(":scope > .course-header__inner")) {
      parseCourseHeader(element, document);
      return;
    }
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
    const left = element.querySelector(":scope > .section-alt__left");
    const heading = left && left.querySelector("h1, h2, h3, h4");
    const cell = [];
    if (heading && heading.textContent.trim()) {
      const h = document.createElement("h2");
      h.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      cell.push(h);
    }
    cell.push(p);
    const cells = [cell];
    const block = WebImporter.Blocks.createBlock(document, { name: "Search", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-tile.js
  function cleanText2(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function makeLink(a, text, document) {
    const link = document.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = text;
    return link;
  }
  function landingCta(a, document) {
    const link = makeLink(a, cleanText2(a) || cleanText2({ textContent: a.getAttribute("aria-label") || "" }), document);
    const p = document.createElement("p");
    const cls = a.className || "";
    if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
    else {
      const wrap = document.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      wrap.append(link);
      p.append(wrap);
    }
    return p;
  }
  function stripAll(el) {
    [el, ...el.querySelectorAll("*")].forEach((n) => [...n.attributes].forEach((a) => {
      if (!/^(href|src|alt)$/.test(a.name)) n.removeAttribute(a.name);
    }));
    return el;
  }
  function tileBody(root, document, titleLink) {
    const body = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          if (cleanText2(n)) {
            const p = document.createElement("p");
            p.textContent = cleanText2(n);
            body.push(p);
          }
          return;
        }
        if (n.nodeType !== 1) return;
        if (n.matches(".card__thumb, img, picture, svg")) return;
        if (n.matches('a.btn, a[class*="btn--"]')) {
          if (cleanText2(n)) body.push(landingCta(n, document));
          return;
        }
        if (!cleanText2(n)) return;
        if (/^H[1-6]$/.test(n.tagName) || n.matches(".card__header, .btn-card__label")) {
          const parts = n.querySelector("br") ? n.innerHTML.split(/<br\s*\/?>/i).map((s) => cleanText2({ textContent: s.replace(/<[^>]+>/g, " ") })).filter(Boolean) : [cleanText2(n)];
          const h = document.createElement("h3");
          if (titleLink && !body.some((b) => b.tagName === "H3")) h.append(makeLink(titleLink, parts[0], document));
          else h.textContent = parts[0];
          body.push(h);
          parts.slice(1).forEach((t) => {
            const p = document.createElement("p");
            p.textContent = t;
            body.push(p);
          });
          return;
        }
        if (/^(P|UL|OL)$/.test(n.tagName)) {
          const only = n.querySelector(':scope > a.btn, :scope > a[class*="btn--"]');
          if (only && cleanText2(only) === cleanText2(n)) {
            body.push(landingCta(only, document));
            return;
          }
          body.push(stripAll(n));
          return;
        }
        walk(n);
      });
    };
    walk(root);
    return body;
  }
  function tileImage(card, document) {
    const holder = card.querySelector(".card__thumb");
    if (!holder) return null;
    const img = holder.querySelector("img");
    let src = img ? img.getAttribute("src") || "" : "";
    if ((!src || /^(data|blob):/.test(src)) && holder.hasAttribute("data-excat-bg")) src = holder.getAttribute("data-excat-bg");
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document.createElement("img");
    out.src = src.trim();
    out.alt = holder.getAttribute("aria-label") || img && img.getAttribute("alt") || "";
    return out;
  }
  function landingTiles(element, document) {
    const cells = [];
    const btnCards = [...element.querySelectorAll(".btn-card__inner")];
    if (btnCards.length) {
      btnCards.forEach((inner) => {
        const a = inner.closest("a[href]");
        const label = cleanText2(inner.querySelector(".btn-card__label") || inner);
        if (!label) return;
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        if (a) strong.append(makeLink(a, label, document));
        else strong.textContent = label;
        p.append(strong);
        const rest = [...inner.children].filter((c) => !c.matches(".btn-card__label") && cleanText2(c)).map((c) => {
          const q = document.createElement("p");
          q.textContent = cleanText2(c);
          return q;
        });
        cells.push([[p, ...rest]]);
      });
      return cells;
    }
    const pathfinders = [...element.querySelectorAll(".card--pathfinder")];
    if (pathfinders.length) {
      pathfinders.forEach((card) => {
        const body = [];
        const inner = card.querySelector(".card__inner") || card;
        [...inner.children].forEach((c) => {
          if (c.matches("a[href]")) {
            const p = document.createElement("p");
            const strong = document.createElement("strong");
            strong.append(makeLink(c, cleanText2(c), document));
            p.append(strong);
            body.push(p);
          } else if (cleanText2(c)) body.push(stripAll(c));
        });
        if (body.length) cells.push([body]);
      });
      return cells;
    }
    const linkCards = [...element.querySelectorAll(":scope > .cell")].map((c) => c.querySelector(":scope > a.card[href]")).filter(Boolean);
    if (linkCards.length) {
      linkCards.forEach((card) => {
        const body = tileBody(card, document, card);
        if (!body.length) return;
        const image = tileImage(card, document);
        cells.push(image ? [[image], body] : [body]);
      });
      return cells;
    }
    let cols = [...element.querySelectorAll(":scope > .section__flex-items")];
    if (!cols.length && element.closest("#fees")) cols = [...element.querySelectorAll(":scope > .cell")];
    if (cols.length) {
      cols.forEach((col) => {
        const body = tileBody(col, document, null);
        if (body.length) cells.push([body]);
      });
      return cells;
    }
    return cells;
  }
  function parse3(element, { document }) {
    const landingCells = landingTiles(element, document);
    if (landingCells.length) {
      const block2 = WebImporter.Blocks.createBlock(document, { name: "Cards (tile)", cells: landingCells });
      element.replaceWith(block2);
      return;
    }
    const cells = [];
    let items = [...element.querySelectorAll(".pathfinder-today__link")];
    if (!items.length) items = [...element.querySelectorAll(".pathfinder-today__list-item")];
    items.forEach((item) => {
      const a = item.querySelector("a[href]");
      const titleEl = item.querySelector(".pathfinder-today__link-title") || a;
      const title = cleanText2(titleEl);
      if (!title) return;
      const body = [];
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      if (a) strong.append(makeLink(a, title, document));
      else strong.textContent = title;
      p.append(strong);
      body.push(p);
      const desc = cleanText2(item.querySelector('.pathfinder-today__link-description, [class*="description"]'));
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
        const title = cleanText2(a && a.querySelector(".push-icon") || a || heading);
        if (!title) return;
        const body = [];
        const eyebrow = cleanText2(card.querySelector('.article-card__category, [class*="category"], [class*="eyebrow"]'));
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
    [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, ul, ol, a.btn")].forEach((el) => {
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
      if (el.parentElement && el.parentElement.closest("ul, ol, p") && root.contains(el.parentElement.closest("ul, ol, p"))) return;
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
  function landingCta2(a, document) {
    const link = document.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = clean(a);
    const cls = a.className || "";
    const p = document.createElement("p");
    if (/btn--text/.test(cls)) {
      p.append(link);
      return p;
    }
    const wrap = document.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
    wrap.append(link);
    p.append(wrap);
    return p;
  }
  function stripAttrs(el) {
    [el, ...el.querySelectorAll("*")].forEach((c) => [...c.attributes].forEach((a) => {
      if (!["href", "src", "alt", "colspan", "rowspan"].includes(a.name)) c.removeAttribute(a.name);
    }));
    el.querySelectorAll("span").forEach((sp) => sp.replaceWith(...sp.childNodes));
    el.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
    return el;
  }
  var BR_BR = /<br\s*\/?>\s*(?:&nbsp;|\s)*<br\s*\/?>/i;
  function splitBrParagraph(p, document) {
    if (!BR_BR.test(p.innerHTML)) return [p];
    return p.innerHTML.split(BR_BR).map((h) => {
      const q = document.createElement("p");
      q.innerHTML = h.trim();
      return q;
    }).filter((q) => clean(q) || q.querySelector("img"));
  }
  function landingTextCell(side, document) {
    const root = side.querySelector(".split-section__inner, .section-image__content") || side;
    const content = [];
    [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, a.btn, a[class*="btn--"]')].forEach((el) => {
      if (el.matches("a")) {
        if (el.parentElement && el.parentElement.closest("ul, ol") && root.contains(el.parentElement)) return;
        if (clean(el) && el.getAttribute("href")) content.push(landingCta2(el, document));
        return;
      }
      if (el.closest("a") || !clean(el)) return;
      if (el.parentElement && el.parentElement.closest("ul, ol, p") && root.contains(el.parentElement.closest("ul, ol, p"))) return;
      if (el.matches("ul.uom-link-panel-list__items, .uom-link-panel-list ul")) {
        const ul = document.createElement("ul");
        el.querySelectorAll("li").forEach((li) => {
          const a = li.querySelector("a[href]");
          const label = clean(li.querySelector(".uom-link-panel__text") || a || li);
          if (!label) return;
          const item = document.createElement("li");
          if (a) {
            const link = document.createElement("a");
            link.href = a.getAttribute("href").trim();
            link.textContent = label;
            item.append(link);
          } else item.textContent = label;
          ul.append(item);
        });
        if (ul.children.length) content.push(ul);
        return;
      }
      const copy = el.cloneNode(true);
      copy.querySelectorAll('a.btn, a[class*="btn--"]').forEach((a) => a.remove());
      if (!clean(copy) && !copy.querySelector("img")) return;
      stripAttrs(copy);
      if (copy.tagName === "P") content.push(...splitBrParagraph(copy, document));
      else content.push(copy);
    });
    return content;
  }
  function repairAlt(alt) {
    return (alt || "").replace(/^\s*Image for\s+/i, "").replace(/\}\s*$/, "").trim();
  }
  function parseLanding(element, document) {
    let sides;
    if (element.querySelector(".section-image__img")) {
      sides = [element.querySelector(".section-image__img"), element.querySelector(".section-image__content") || element.querySelector(".section-image__inner")];
    } else {
      sides = [...element.querySelectorAll(":scope > .split-section__side, :scope > div")];
      if (!sides.length) sides = [...element.children];
    }
    const row = [];
    sides.filter(Boolean).forEach((side) => {
      const isImage = side.matches('[class*="--with-image"], .section-image__img') || side.querySelector("img") && !clean(side);
      if (isImage) {
        const cell = imageCell(side, document);
        if (cell) {
          cell[0].alt = repairAlt(cell[0].alt);
          row.push(cell);
        }
      } else {
        const cell = landingTextCell(side, document);
        if (cell.length) row.push(cell);
      }
    });
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Columns (split)", cells: [row] }));
  }
  function parse5(element, { document, template }) {
    if (template === "section-landing") {
      parseLanding(element, document);
      return;
    }
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
  var BLOCKED_IMAGES2 = [];
  function landingLink(href, label, document) {
    const a = document.createElement("a");
    a.href = (href || "").trim();
    a.textContent = label;
    return a;
  }
  function landingPara(textOrNode, document) {
    const p = document.createElement("p");
    if (typeof textOrNode === "string") p.textContent = textOrNode;
    else p.append(textOrNode);
    return p;
  }
  function landingCard(card, document) {
    card.querySelectorAll(".screenreaders-only, .sr-only").forEach((x) => x.remove());
    const body = [];
    const cardHref = card.matches("a[href]") ? card.getAttribute("href") : "";
    const heading = card.querySelector(".card__inner h1, .card__inner h2, .card__inner h3, .card__inner h4, .card__title, .card__header, h3");
    const title = clean2(heading);
    if (title) {
      const h = document.createElement("h3");
      const titleLink = heading.matches("a[href]") ? heading : heading.querySelector("a[href]");
      const href = titleLink && titleLink.getAttribute("href") || cardHref;
      if (href) h.append(landingLink(href, title, document));
      else h.textContent = title;
      body.push(h);
    }
    card.querySelectorAll(".card__sub-titles .sub-title, .card__sub-titles > :not(.sub-title)").forEach((st) => {
      if (clean2(st)) body.push(landingPara(clean2(st), document));
    });
    const inner = card.querySelector(".card__inner") || card;
    inner.querySelectorAll(":scope > p, :scope > .card__meta, .card__excerpt").forEach((ex) => {
      if (heading && (ex === heading || ex.contains(heading))) return;
      const t = clean2(ex).replace(/\s*(\.{3,}|…)$/, "");
      if (t) body.push(landingPara(t, document));
    });
    card.querySelectorAll(".card__tags .tags__item").forEach((tag) => {
      if (clean2(tag)) body.push(landingPara(clean2(tag), document));
    });
    const titleHref = heading && (heading.matches("a") ? heading : heading.querySelector("a"));
    card.querySelectorAll(".card__links a[href], .card__footer a[href]").forEach((a) => {
      const label = clean2(a) || (a.getAttribute("aria-label") || "").trim();
      if (!label) return;
      const link = landingLink(a.getAttribute("href"), label, document);
      const cls = a.className || "";
      if (/btn--cta|btn--secondary/.test(cls)) {
        const em = document.createElement("em");
        em.append(link);
        body.push(landingPara(em, document));
        return;
      }
      if (/\bbtn\b/.test(cls) && !/btn--text/.test(cls)) {
        const st = document.createElement("strong");
        st.append(link);
        body.push(landingPara(st, document));
        return;
      }
      body.push(landingPara(link, document));
    });
    if (!titleHref && !body.some((b) => b.querySelector && b.querySelector("a"))) {
    }
    const image = pickImage(card, document);
    if (image && card.matches(".card--stafflist") && /^profile-image$/i.test(image.alt)) {
      const t = card.querySelector("[title]");
      image.alt = t && t.getAttribute("title").trim() || title;
    }
    if (!body.length && !image) return null;
    return image ? [[image], body.length ? body : ""] : [body];
  }
  function parseLanding2(element, document) {
    let cards = [...element.querySelectorAll(".card")].filter((c) => !c.parentElement.closest(".card"));
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > li")];
    const rows = cards.map((c) => landingCard(c, document)).filter(Boolean);
    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Cards", cells: rows }));
  }
  function parse6(element, { document, template }) {
    if (template === "section-landing") {
      parseLanding2(element, document);
      return;
    }
    const course = !!element.closest('.course-content, .course-section__main, [data-test$="-page"]');
    let cards = [...element.querySelectorAll(".card")];
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > div")];
    const cells = [];
    cards.forEach((card) => {
      const body = [];
      const heading = card.querySelector("h2, h3, h4, h5, h6, .card__title, .card__header");
      if (heading && clean2(heading)) {
        let tag = /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3";
        if (course) tag = "h5";
        const h = document.createElement(tag);
        const br = course ? heading.querySelector(":scope > br") : null;
        if (br) {
          const rest = document.createElement("p");
          let n = br.nextSibling;
          while (n) {
            const next = n.nextSibling;
            rest.append(n);
            n = next;
          }
          br.remove();
          h.textContent = clean2(heading);
          body.push(h);
          if (clean2(rest)) body.push(rest);
        } else {
          h.textContent = clean2(heading);
          body.push(h);
        }
      }
      if (course) {
        const walkInner = (node) => {
          [...node.childNodes].forEach((n) => {
            if (n.nodeType === 3) {
              if (clean2(n)) {
                const p = document.createElement("p");
                p.textContent = clean2(n);
                body.push(p);
              }
              return;
            }
            if (n.nodeType !== 1 || n === heading) return;
            if (heading && n.contains(heading)) {
              walkInner(n);
              return;
            }
            if (!clean2(n) && !n.querySelector("img")) return;
            if (/^(P|UL|OL)$/.test(n.tagName)) {
              n.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
              body.push(n);
            } else if (/^(DIV|SECTION|BLOCKQUOTE|FIGURE)$/.test(n.tagName)) {
              if (n.querySelector("p, ul, ol, div, blockquote, h1, h2, h3, h4, h5, h6")) walkInner(n);
              else {
                const p = document.createElement("p");
                p.innerHTML = n.innerHTML.trim();
                body.push(p);
              }
            } else if (/^H[1-6]$/.test(n.tagName) || /^(CITE|SPAN|STRONG|EM|A|SMALL)$/.test(n.tagName)) {
              const p = document.createElement("p");
              p.innerHTML = n.innerHTML.trim();
              body.push(p);
            } else if (n.tagName !== "HR" && n.tagName !== "IMG") {
              const p = document.createElement("p");
              p.textContent = clean2(n);
              body.push(p);
            }
          });
        };
        const inner = card.querySelector(".card__inner");
        if (inner) walkInner(inner);
        const footer = card.querySelector(".card__footer");
        if (footer && clean2(footer)) {
          const blocks = [...footer.children].filter((c) => /^(P|UL|OL)$/.test(c.tagName));
          if (blocks.length) body.push(...blocks);
          else {
            const p = document.createElement("p");
            p.append(...footer.childNodes);
            body.push(p);
          }
        }
      } else {
        card.querySelectorAll(".card__inner p, .card__meta").forEach((p, i, all) => {
          if ([...all].indexOf(p) !== i || !clean2(p)) return;
          const para = document.createElement("p");
          para.textContent = clean2(p);
          body.push(para);
        });
      }
      const cta = course ? null : card.querySelector(".card__footer a[href], a.btn[href]");
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
      let image = pickImage(card, document);
      if (course && image && BLOCKED_IMAGES2.some((frag) => image.src.includes(frag))) {
        console.warn(`[cards] image dropped (403): ${image.src}`);
        image = null;
      }
      if (course) {
        cells.push(image ? [[image], body] : [body]);
        return;
      }
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
  var OVERVIEW_ICONS = { briefcase: "briefcase", handshake: "handshake", circlewavycheck: "verified-badge" };
  function landingIconCell(holder, document) {
    if (!holder) return null;
    const img = holder.matches("img") ? holder : holder.querySelector("img");
    if (!img) return null;
    const tagged = img.getAttribute("data-excat-icon");
    const src = (img.getAttribute("src") || "").trim();
    const file = (src.split("/").pop() || "").replace(/\.svg$/i, "").toLowerCase();
    const name = tagged || /\.svg$/i.test(src) && OVERVIEW_ICONS[file];
    if (name) {
      const p = document.createElement("p");
      p.textContent = `:uom-${name}:`;
      return p;
    }
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document.createElement("img");
    out.src = src;
    out.alt = clean3({ textContent: img.getAttribute("alt") || "" });
    return out;
  }
  function landingCta3(a, document) {
    a.querySelectorAll(".screenreaders-only, .sr-only").forEach((x) => x.remove());
    const link = document.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = clean3(a) || (a.getAttribute("title") || "").trim();
    const cls = a.className || "";
    const p = document.createElement("p");
    if (/\bbtn\b/.test(cls) && !/btn--text/.test(cls)) {
      const w = document.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      w.append(link);
      p.append(w);
    } else p.append(link);
    return p;
  }
  function landingBody(card, skip, document) {
    const body = [];
    const heading = card.querySelector("h2, h3, h4, h5, h6");
    if (heading && clean3(heading)) {
      const h = document.createElement("h3");
      h.textContent = clean3(heading);
      body.push(h);
    }
    [...card.querySelectorAll('h2, h3, h4, h5, h6, p, ul, ol, a.btn, a[class*="btn--"]')].forEach((el) => {
      if (el === heading || skip && skip.contains(el) || !clean3(el)) return;
      if (el.parentElement && el.parentElement.closest("p, ul, ol") && card.contains(el.parentElement)) return;
      if (el.matches("a")) {
        if (!el.closest("p, li")) body.push(landingCta3(el, document));
        return;
      }
      if (/^H[2-6]$/.test(el.tagName)) {
        const p = document.createElement("p");
        p.textContent = clean3(el);
        body.push(p);
        return;
      }
      const out = document.createElement(el.tagName.toLowerCase());
      out.innerHTML = el.innerHTML.trim();
      out.querySelectorAll('a.btn, a[class*="btn--"]').forEach((a) => {
        const cta = landingCta3(a, document);
        a.replaceWith(...cta.childNodes);
      });
      out.querySelectorAll("*").forEach((c) => [...c.attributes].forEach((at) => {
        if (at.name !== "href") c.removeAttribute(at.name);
      }));
      out.querySelectorAll("span").forEach((sp) => sp.replaceWith(...sp.childNodes));
      if (clean3(out)) body.push(out);
    });
    return body;
  }
  function parseLanding3(element, document) {
    const rows = [];
    if (element.matches(".logo-listing") || element.querySelector(".logo-listing__item")) {
      element.querySelectorAll(".logo-listing__item").forEach((item) => {
        const img = landingIconCell(item.querySelector("img"), document);
        if (img) rows.push([[img]]);
      });
    } else if (element.matches("ul.document-list") || element.querySelector("ul.document-list")) {
      element.querySelectorAll("li").forEach((li) => {
        const img = landingIconCell(li.querySelector("figure > img, img"), document);
        const body = [];
        (li.querySelector("figcaption") || li).querySelectorAll("a[href]").forEach((a) => {
          const p = document.createElement("p");
          const link = document.createElement("a");
          link.href = a.getAttribute("href").trim();
          link.textContent = clean3(a);
          p.append(link);
          body.push(p);
        });
        if (!body.length && !img) return;
        rows.push(img ? [[img], body.length ? body : ""] : [body]);
      });
    } else {
      let cards = [...element.querySelectorAll(".card--fact, .card-focus, .section-alt__inner-flex-items")];
      if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell")];
      cards.forEach((card) => {
        const holder = card.querySelector(".section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left") || card.querySelector(":scope > img");
        const icon = card.matches(".card--fact") ? null : landingIconCell(holder, document);
        const body = landingBody(card, holder, document);
        if (!body.length && !icon) return;
        rows.push(icon ? [[icon], body.length ? body : ""] : [body]);
      });
    }
    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Cards (icon)", cells: rows }));
  }
  function isLanding(element) {
    if (element.closest('.course-content, .course-section__main, [data-test$="-page"]')) return false;
    return !!(element.closest(".ct-factscard, .ct-imagelisting, .ct-textthreecolumn, .ct-focusbox, .ct-documentlisting") || element.closest("#main > section#overview"));
  }
  function parse7(element, { document }) {
    if (isLanding(element)) {
      parseLanding3(element, document);
      return;
    }
    const course = !!element.closest('.course-content, .course-section__main, [data-test$="-page"]');
    let cards = [...element.querySelectorAll(".card")];
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > div")];
    const cells = [];
    cards.forEach((card) => {
      const body = [];
      const heading = card.querySelector(course ? "h2, h3, h4, h5, h6, .card__title" : "h2, h3, h4, .card__title");
      const title = clean3(heading);
      if (title) {
        const h = document.createElement(course ? "h5" : /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3");
        h.textContent = title;
        body.push(h);
      }
      card.querySelectorAll(".card__inner p, .card__meta").forEach((p, i, all) => {
        if (course && p === heading) return;
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
      if (course && !icon) {
        cells.push([body]);
        return;
      }
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
  function parseCourseQuote(root, document) {
    const cites = [...root.querySelectorAll("cite")];
    cites.forEach((c) => c.remove());
    const paras = [];
    let loose = document.createElement("p");
    const flush = () => {
      if (clean4(loose)) paras.push(loose);
      loose = document.createElement("p");
    };
    [...root.childNodes].forEach((n) => {
      if (n.nodeType === 8) return;
      if (n.nodeType === 1 && /^(P|DIV|UL|OL)$/.test(n.tagName)) {
        flush();
        if (!clean4(n)) return;
        if (n.tagName === "DIV") {
          const p = document.createElement("p");
          p.innerHTML = n.innerHTML.trim();
          paras.push(p);
          return;
        }
        [...n.attributes].forEach((a) => n.removeAttribute(a.name));
        paras.push(n);
        return;
      }
      if (n.nodeName === "BR") return;
      loose.append(n);
    });
    flush();
    const text = [...paras];
    cites.forEach((c) => {
      if (!clean4(c)) return;
      const p = document.createElement("p");
      c.querySelectorAll("br").forEach((b) => b.remove());
      p.append(...c.childNodes);
      const first = p.firstChild;
      if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s*[—–-]?\s*/, "");
      p.prepend("\u2014 ");
      text.push(p);
    });
    return text;
  }
  function bgPortrait(holder, document) {
    if (!holder) return null;
    const img = holder.querySelector("img");
    let src = (holder.getAttribute("data-excat-bg") || "").trim();
    if (!src && img) src = (img.getAttribute("src") || "").trim();
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document.createElement("img");
    out.src = src;
    out.alt = (holder.getAttribute("aria-label") || img && img.getAttribute("alt") || "").trim();
    return out;
  }
  function parseCardFocus(element, document) {
    const para = (t) => {
      const p = document.createElement("p");
      p.textContent = t;
      return p;
    };
    const text = [];
    let holder = null;
    const alumni = element.querySelector(".alumni");
    if (alumni) {
      const q = clean4(alumni.querySelector(".alumni__short-text"));
      if (q) text.push(para(q));
      const name = clean4(alumni.querySelector(".alumni__name"));
      if (name) text.push(para(`\u2014 ${name}`));
      const role = clean4(alumni.querySelector(".alumni__title"));
      if (role) text.push(para(role));
      holder = alumni.querySelector(".alumni__img");
    } else {
      const bq = element.querySelector("blockquote") || element;
      bq.querySelectorAll("p").forEach((p) => {
        if (!p.closest("cite") && clean4(p)) text.push(para(clean4(p)));
      });
      const name = clean4(bq.querySelector("cite"));
      if (name) text.push(para(`\u2014 ${name.replace(/^[—–-]\s*/, "")}`));
      const sub = clean4(bq.querySelector(".block-quotation__sub-cite"));
      if (sub) text.push(para(sub));
      holder = element.querySelector(".testimonials__img");
    }
    if (!text.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const image = bgPortrait(holder, document);
    const row = image ? [text, [image]] : [text];
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Quote", cells: [row] }));
  }
  function parse8(element, { document }) {
    if (element.matches(".card-focus") && element.querySelector(".testimonials, .alumni")) {
      parseCardFocus(element, document);
      return;
    }
    const root = element.matches("blockquote") ? element : element.querySelector("blockquote") || element;
    if (element.closest('.course-content, .course-section__main, [data-test$="-page"]')) {
      const text2 = parseCourseQuote(root, document);
      if (!text2.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, { name: "Quote", cells: [[text2]] });
      element.replaceWith(block2);
      return;
    }
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
