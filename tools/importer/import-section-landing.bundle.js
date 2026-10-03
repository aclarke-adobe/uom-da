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

  // tools/importer/import-section-landing.js
  var import_section_landing_exports = {};
  __export(import_section_landing_exports, {
    default: () => import_section_landing_default
  });

  // tools/importer/parsers/hero.js
  function clean(t) {
    return (t || "").replace(/​/g, "").replace(/\s+/g, " ").trim();
  }
  function text(el) {
    return clean(el ? el.textContent : "");
  }
  function ctaParagraph(a, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = text(a) || clean(a.getAttribute("aria-label"));
    const p = document2.createElement("p");
    const cls = a.className || "";
    if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
    else {
      const wrap = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      wrap.append(link);
      p.append(wrap);
    }
    return p;
  }
  function imageOf(element, document2) {
    const img = element.querySelector("picture img, img");
    let src = img ? img.getAttribute("src") || img.getAttribute("data-src") || "" : "";
    let alt = img ? img.getAttribute("alt") || "" : "";
    if (!src || /^(data|blob):/.test(src)) {
      const bg = element.hasAttribute("data-excat-bg") ? element : element.querySelector("[data-excat-bg]");
      if (bg) {
        src = bg.getAttribute("data-excat-bg");
        alt = bg.getAttribute("aria-label") || alt;
      }
    }
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document2.createElement("img");
    out.src = src.trim();
    out.alt = clean(alt);
    return out;
  }
  function isLaterBanner(element, document2) {
    return [...document2.querySelectorAll("h1")].some((h) => !element.contains(h) && h.compareDocumentPosition(element) & 4);
  }
  function parse(element, { document: document2 }) {
    const later = isLaterBanner(element, document2);
    const content2 = element.querySelector(".campaign-banner-alt__content, header.page-header, .page-header") || element;
    const textCell2 = [];
    let headingDone = false;
    content2.querySelectorAll('h1, h2, h3, p, a.btn, a[class*="btn--"]').forEach((el) => {
      if (el.matches("a")) {
        if (text(el)) textCell2.push(ctaParagraph(el, document2));
        return;
      }
      if (el.closest("a") || !text(el)) return;
      if (/^H[1-3]$/.test(el.tagName) && !headingDone) {
        const level = el.tagName === "H1" && later ? "h2" : el.tagName === "H1" ? "h1" : "h2";
        const h = document2.createElement(level);
        h.textContent = text(el);
        textCell2.push(h);
        headingDone = true;
        return;
      }
      const p = document2.createElement("p");
      p.textContent = text(el);
      textCell2.push(p);
    });
    const image = imageOf(element, document2);
    if (!textCell2.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = [];
    if (image) row.push([image]);
    if (textCell2.length) row.push(textCell2);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-split.js
  function imageFrom(container, document2) {
    if (!container) return null;
    const img = container.querySelector("img");
    if (!img) return null;
    const dataSrc = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
    const src = img.getAttribute("src") || "";
    const inline = (s) => !s || s.startsWith("data:") || s.startsWith("blob:");
    if (inline(src) && dataSrc) img.setAttribute("src", dataSrc);
    if (inline(img.getAttribute("src"))) return null;
    const clean12 = document2.createElement("img");
    clean12.src = img.getAttribute("src");
    clean12.alt = img.getAttribute("alt") || "";
    return clean12;
  }
  function splitParagraph(p, document2) {
    const out = [];
    let current = document2.createElement("p");
    const nodes = [...p.childNodes];
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.nodeName === "BR") {
        let j = i + 1;
        while (j < nodes.length && nodes[j].nodeType === 3 && !nodes[j].textContent.trim()) j += 1;
        if (j < nodes.length && nodes[j].nodeName === "BR") {
          if (current.textContent.trim()) out.push(current);
          current = document2.createElement("p");
          i = j;
          continue;
        }
      }
      current.append(node);
    }
    if (current.textContent.trim()) out.push(current);
    out.forEach((para3) => {
      if (para3.firstChild && para3.firstChild.nodeType === 3) para3.firstChild.textContent = para3.firstChild.textContent.replace(/^\s+/, "");
      if (para3.lastChild && para3.lastChild.nodeType === 3) para3.lastChild.textContent = para3.lastChild.textContent.replace(/\s+$/, "");
    });
    return out.length ? out : [p];
  }
  function ctaFrom(a, document2) {
    const link = document2.createElement("a");
    link.href = a.getAttribute("href");
    link.textContent = a.textContent.replace(/\s+/g, " ").trim();
    const p = document2.createElement("p");
    const wrap = document2.createElement(/btn--secondary/.test(a.className) ? "em" : "strong");
    wrap.append(link);
    p.append(wrap);
    return p;
  }
  var BLOCKED_IMAGES = [];
  function cleanText(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function courseImage(element, document2) {
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
    const out = document2.createElement("img");
    out.src = src;
    out.alt = img && img.getAttribute("alt") || holder.getAttribute("aria-label") || "";
    return out;
  }
  function parseCourseHeader(element, document2) {
    const textCell2 = [];
    const eyebrow = element.querySelector(".course-header__type, .course-header__tag");
    if (eyebrow && cleanText(eyebrow)) {
      const p = document2.createElement("p");
      const a = eyebrow.querySelector("a[href]");
      if (a) {
        const link = document2.createElement("a");
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
      const h1 = document2.createElement("h1");
      h1.textContent = cleanText(title);
      textCell2.push(h1);
    }
    const stats = [...element.querySelectorAll(".course-header__statistics > li, .course-header__stat")].filter((li, i, all) => all.indexOf(li) === i);
    if (stats.length) {
      const ul = document2.createElement("ul");
      stats.forEach((li) => {
        li.querySelectorAll(".screenreaders-only, .sr-only").forEach((s) => s.remove());
        const a = li.querySelector("a[href]");
        const text7 = cleanText(li.querySelector(".uom-link__text") || a || li);
        if (!text7) return;
        const item = document2.createElement("li");
        if (a) {
          const link = document2.createElement("a");
          link.href = a.getAttribute("href").trim();
          link.textContent = text7;
          item.append(link);
        } else {
          item.textContent = text7;
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
      const p = document2.createElement("p");
      const strong = document2.createElement("strong");
      strong.textContent = value;
      p.append(`${label}: `, strong);
      textCell2.push(p);
    });
    element.querySelectorAll(".course-header__btns a[href]").forEach((a) => {
      if (cleanText(a)) textCell2.push(ctaFrom(a, document2));
    });
    if (!textCell2.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const image = courseImage(element, document2);
    const cells = [image ? [textCell2, [image]] : [textCell2]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero (split)", cells });
    element.replaceWith(block);
  }
  function parsePageHeaderAlt(element, document2) {
    const content2 = element.querySelector(".page-header-alt__content-inner, .page-header-alt__content") || element;
    const textCell2 = [];
    const tag = content2.querySelector(".page-header-alt__title-tag, .title--overline");
    if (tag && cleanText(tag)) {
      const p = document2.createElement("p");
      if (tag.matches("a[href]")) {
        const a = document2.createElement("a");
        a.href = tag.getAttribute("href").trim();
        a.textContent = cleanText(tag);
        p.append(a);
      } else p.textContent = cleanText(tag);
      textCell2.push(p);
    }
    const title = content2.querySelector("h1, h2, .page-header-alt__title");
    if (title && cleanText(title)) {
      const later = [...document2.querySelectorAll("h1")].some((h2) => h2 !== title && !element.contains(h2) && h2.compareDocumentPosition(element) & 4);
      const h = document2.createElement(later ? "h2" : "h1");
      h.textContent = cleanText(title);
      textCell2.push(h);
    }
    content2.querySelectorAll("p").forEach((p) => {
      if (p === tag || p.closest(".page-header-alt__actions") || !cleanText(p)) return;
      const out = document2.createElement("p");
      out.innerHTML = p.innerHTML.trim();
      out.querySelectorAll("*").forEach((c) => [...c.attributes].forEach((a) => {
        if (a.name !== "href") c.removeAttribute(a.name);
      }));
      textCell2.push(out);
    });
    content2.querySelectorAll(".page-header-alt__actions a[href]").forEach((a) => {
      if (!cleanText(a)) return;
      if (/btn--text/.test(a.className) || !/\bbtn\b/.test(a.className)) {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href").trim();
        link.textContent = cleanText(a);
        const p = document2.createElement("p");
        p.append(link);
        textCell2.push(p);
      } else textCell2.push(ctaFrom(a, document2));
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
        image = document2.createElement("img");
        image.src = src.trim();
        image.alt = img && img.getAttribute("alt") || "";
      }
    }
    const cells = [image ? [textCell2, [image]] : [textCell2]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero (split)", cells });
    element.replaceWith(block);
  }
  function parse2(element, { document: document2 }) {
    if (element.matches(".page-header-alt")) {
      parsePageHeaderAlt(element, document2);
      return;
    }
    if (element.matches(".course-header") || element.querySelector(":scope > .course-header__inner")) {
      parseCourseHeader(element, document2);
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
      paragraphs.push(...splitParagraph(p, document2));
    });
    const ctas = [...contentRoot.querySelectorAll('a.btn, a[class*="btn--"], a.button')].filter((a, i, all) => all.indexOf(a) === i && a.getAttribute("href")).map((a) => ctaFrom(a, document2));
    const image = imageFrom(
      element.querySelector('.page-header-study__img, .card-article-large__img, [class*="__img"]') || element,
      document2
    );
    if (!heading && !paragraphs.length) {
      element.replaceWith(...element.childNodes, ...preserved);
      return;
    }
    const textCell2 = [];
    if (eyebrow && eyebrow.textContent.trim()) {
      const ep = document2.createElement("p");
      ep.textContent = eyebrow.textContent.replace(/\s+/g, " ").trim();
      textCell2.push(ep);
    }
    if (heading) textCell2.push(heading);
    textCell2.push(...paragraphs, ...ctas);
    const cells = [[textCell2, image ? [image] : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero (split)", cells });
    element.replaceWith(block);
    if (preserved.length) block.after(...preserved);
  }

  // tools/importer/parsers/hero-split-light.js
  function clean2(t) {
    return (t || "").replace(/​/g, "").replace(/\s+/g, " ").trim();
  }
  function text2(el) {
    return clean2(el ? el.textContent : "");
  }
  function ctaParagraph2(a, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim().replace(/^mailto:\s+/i, "mailto:");
    link.textContent = text2(a) || clean2(a.getAttribute("aria-label"));
    const p = document2.createElement("p");
    const cls = a.className || "";
    if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
    else {
      const wrap = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      wrap.append(link);
      p.append(wrap);
    }
    return p;
  }
  function parse3(element, { document: document2 }) {
    const content2 = element.querySelector(".card-article-large__content") || element;
    const heading = content2.querySelector("h1, h2, h3");
    const eyebrow = content2.querySelector('.card-article-large__category, [class*="__category"]');
    const hasEarlierH1 = [...document2.querySelectorAll("h1")].some((h) => !element.contains(h) && h.compareDocumentPosition(element) & 4);
    const cell = [];
    if (eyebrow && text2(eyebrow)) {
      const p = document2.createElement("p");
      p.textContent = text2(eyebrow);
      cell.push(p);
    }
    if (heading) {
      const h = document2.createElement(heading.tagName === "H1" && !hasEarlierH1 ? "h1" : "h2");
      h.textContent = text2(heading);
      cell.push(h);
    }
    content2.querySelectorAll("p, a[href]").forEach((el) => {
      if (el === eyebrow || el.closest(".card-article-large__img")) return;
      if (el.matches("a")) {
        if (text2(el)) cell.push(ctaParagraph2(el, document2));
        return;
      }
      if (el.querySelector('a.btn, a[class*="btn--"]') || !text2(el)) return;
      const p = document2.createElement("p");
      p.innerHTML = el.innerHTML.trim();
      p.querySelectorAll("*").forEach((c) => [...c.attributes].forEach((a) => {
        if (a.name !== "href") c.removeAttribute(a.name);
      }));
      cell.push(p);
    });
    const img = element.querySelector(".card-article-large__img img, img");
    let image = null;
    const src = img ? img.getAttribute("src") || img.getAttribute("data-src") || "" : "";
    if (src && !/^(data|blob):/.test(src)) {
      image = document2.createElement("img");
      image.src = src;
      image.alt = clean2(img.getAttribute("alt"));
    }
    if (!cell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = image ? [cell, [image]] : [cell];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero", variants: ["split-light"], cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/audience-switcher.js
  function cleanText2(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function slugify(text7) {
    return text7.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function parse4(element, { document: document2 }) {
    const label = cleanText2(element.querySelector(".uom-form-label__text, .uom-form-label, legend"));
    let options = [...element.querySelectorAll(".uom-radio")].map((radio) => {
      const input = radio.querySelector("input");
      const text7 = cleanText2(radio.querySelector("label") || radio);
      return { text: text7, key: input && input.getAttribute("value") || slugify(text7) };
    });
    if (!options.length) {
      options = [...element.querySelectorAll('input[type="radio"]')].map((input) => {
        const lbl = input.id ? element.querySelector(`label[for="${input.id}"]`) : input.closest("label");
        const text7 = cleanText2(lbl);
        return { text: text7, key: input.getAttribute("value") || slugify(text7) };
      });
    }
    const KEY_MAP = { b2c: "individuals", b2b: "organisations" };
    options = options.map((o) => __spreadProps(__spreadValues({}, o), { key: KEY_MAP[o.key] || o.key }));
    options = options.filter((o) => o.text && o.key);
    if (!options.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (label) cells.push([label]);
    options.forEach((o) => cells.push([o.text, o.key]));
    const block = WebImporter.Blocks.createBlock(document2, { name: "Audience Switcher", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/key-facts.js
  var ICONS = {
    duration: "clock",
    "mode (location)": "location",
    mode: "location",
    location: "location",
    intake: "calendar",
    intakes: "calendar",
    fees: "fees",
    "entry requirements": "entry-requirements",
    "entry schemes": "entry-schemes",
    "english language requirements": "english-language",
    // section-landing short courses / micro-credentials (not used on course pages)
    "start date": "calendar",
    "study mode": "location"
  };
  function cleanText3(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function linkFrom(a, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = cleanText3(a);
    return link;
  }
  function valueCell(value, document2) {
    const paras = [];
    let current = document2.createElement("p");
    const flush = () => {
      if (cleanText3(current) || current.querySelector("a, img")) {
        if (current.firstChild && current.firstChild.nodeType === 3) current.firstChild.textContent = current.firstChild.textContent.replace(/^\s+/, "");
        if (current.lastChild && current.lastChild.nodeType === 3) current.lastChild.textContent = current.lastChild.textContent.replace(/\s+$/, "");
        paras.push(current);
      }
      current = document2.createElement("p");
    };
    [...value.childNodes].forEach((node) => {
      if (node.nodeType === 8) return;
      if (node.nodeName === "BR") {
        flush();
        return;
      }
      if (node.nodeType === 1 && /^(P|DIV|UL|OL)$/.test(node.tagName)) {
        flush();
        if (/^(UL|OL)$/.test(node.tagName)) paras.push(node);
        else {
          [...node.childNodes].forEach((c) => current.append(c));
          flush();
        }
        return;
      }
      if (node.nodeType === 1) {
        node.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
        if (node.matches("a[href]")) node.setAttribute("href", node.getAttribute("href").trim());
      }
      current.append(node);
    });
    flush();
    return paras;
  }
  function parse5(element, { document: document2 }) {
    const cells = [];
    let items = [...element.querySelectorAll(".key-facts-section__main--item")];
    if (!items.length) items = [...element.querySelectorAll(".key-facts-section__main > div")];
    const landing = !!(element.parentElement && element.parentElement.id === "main");
    let logoRow = null;
    items.forEach((item) => {
      const label = cleanText3(item.querySelector('.key-facts-section__main--title, [class*="--title"]'));
      const value = item.querySelector('.key-facts-section__main--value, [class*="--value"]');
      const logoItem = landing && value && !cleanText3(value) && value.querySelector("img");
      if (logoItem && (label || logoRow)) {
        const logos = [...value.querySelectorAll("img")].map((img) => {
          const src = img.getAttribute("src") || "";
          if (!src || /^(data|blob):/.test(src)) return null;
          const out = document2.createElement("img");
          out.src = src;
          out.alt = img.getAttribute("alt") || "";
          const p = document2.createElement("p");
          p.append(out);
          return p;
        }).filter(Boolean);
        if (logos.length && !label) {
          logoRow.push(...logos);
        } else if (logos.length) {
          const labelP2 = document2.createElement("p");
          labelP2.textContent = label;
          logoRow = logos;
          cells.push([[labelP2], logoRow]);
        }
        return;
      }
      if (label) logoRow = null;
      if (!label || !value || !cleanText3(value)) return;
      const icon = ICONS[label.toLowerCase()];
      const labelP = document2.createElement("p");
      labelP.textContent = icon ? `:${icon}: ${label}` : label;
      const extras = [...item.children].filter((c) => c !== value && !c.matches('.key-facts-section__main--icon, .key-facts-section__main--title, [class*="--title"], [class*="--icon"]') && cleanText3(c));
      const valueParas = valueCell(value, document2);
      extras.forEach((c) => valueParas.push(...valueCell(c, document2)));
      cells.push([[labelP], valueParas]);
    });
    element.querySelectorAll("ul[data-excat-hero-codes] > li").forEach((li) => {
      const full = cleanText3(li);
      const valueEl = li.querySelector(".text-bold, strong, b");
      const value = cleanText3(valueEl) || full.split(":").slice(1).join(":").trim();
      const label = (full.includes(":") ? full.split(":")[0] : full.replace(value, "")).trim();
      if (!label || !value || /^course code$/i.test(label)) return;
      cells.push([label, value]);
    });
    const ctas = [...element.querySelectorAll(".key-facts-cta a[href]")].filter((a, i, all) => all.indexOf(a) === i && cleanText3(a));
    ctas.forEach((a) => {
      const p = document2.createElement("p");
      const link = linkFrom(a, document2);
      const cls = a.className || "";
      if (/btn--secondary/.test(cls)) {
        const em = document2.createElement("em");
        em.append(link);
        p.append(em);
      } else if (/btn--text/.test(cls) || !/btn/.test(cls)) {
        p.append(link);
      } else {
        const strong = document2.createElement("strong");
        strong.append(link);
        p.append(strong);
      }
      cells.push([[p]]);
    });
    element.querySelectorAll(".key-facts-cta .cta-panel-message, .key-facts-cta .key-facts-buttons-additional").forEach((m) => {
      if (!cleanText3(m) || m.querySelector("a")) return;
      const p = document2.createElement("p");
      p.textContent = cleanText3(m);
      cells.push([[p]]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Key Facts", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/notice.js
  function cleanText4(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      if (!el.attributes) return;
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|data-.*|aria-.*|_ms.*)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    return root;
  }
  function feeYear(year, document2) {
    const out = [];
    const title = cleanText4(year.querySelector(".fee-info-panel__year-title, h4, h5"));
    if (title) {
      const h5 = document2.createElement("h5");
      h5.textContent = title;
      out.push(h5);
    }
    const ul = document2.createElement("ul");
    year.querySelectorAll("li.fee-item, .fee-list > li").forEach((item, i, all) => {
      if ([...all].indexOf(item) !== i) return;
      const li = document2.createElement("li");
      const t = cleanText4(item.querySelector(".fee-item__title"));
      const price = cleanText4(item.querySelector(".fee-item__price"));
      const desc = cleanText4(item.querySelector(".fee-item__desc"));
      if (t) li.append(t);
      if (price) {
        if (t) li.append(" ");
        const strong = document2.createElement("strong");
        strong.textContent = price;
        li.append(strong);
      }
      if (desc) li.append(` ${desc}`);
      if (!t && !price && !desc) li.textContent = cleanText4(item);
      if (cleanText4(li)) ul.append(li);
    });
    if (ul.children.length) out.push(ul);
    [...year.children].forEach((c) => {
      if (c.matches(".fee-info-panel__year-title, h4, h5, ul.fee-list, .fee-list") || !cleanText4(c)) return;
      out.push(...content(c, document2));
    });
    return out;
  }
  function content(root, document2) {
    const out = [];
    [...root.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (cleanText4(n)) {
          const p = document2.createElement("p");
          p.textContent = cleanText4(n);
          out.push(p);
        }
        return;
      }
      if (n.nodeType !== 1) return;
      if (n.matches(".fee-info-panel__fees")) {
        [...n.children].forEach((c) => {
          if (c.matches(".fee-info-panel__year")) out.push(...feeYear(c, document2));
          else if (cleanText4(c)) out.push(...content(c.matches(".notice") ? c : { childNodes: [c] }, document2));
        });
        return;
      }
      if (n.matches(".fee-info-panel__year")) {
        out.push(...feeYear(n, document2));
        return;
      }
      if (n.matches("ul.fee-list, .fee-list")) {
        const holder = document2.createElement("div");
        holder.append(n.cloneNode(true));
        out.push(...feeYear(holder, document2));
        return;
      }
      if (!cleanText4(n) && !n.querySelector("img")) return;
      if (/^(DIV|SECTION|SPAN)$/.test(n.tagName) && n.querySelector("p, ul, ol, h1, h2, h3, h4, h5, h6, .fee-info-panel__year")) {
        out.push(...content(n, document2));
        return;
      }
      if (/^(DIV|SPAN)$/.test(n.tagName)) {
        const p = document2.createElement("p");
        p.innerHTML = n.innerHTML.trim();
        out.push(stripAttrs(p));
        return;
      }
      out.push(stripAttrs(n));
    });
    return out;
  }
  function dashLists(cell, document2) {
    const out = [];
    let ul = null;
    cell.forEach((el) => {
      const isDash = el.tagName === "P" && /^\s*[-–•]\s+/.test(el.textContent);
      if (!isDash) {
        ul = null;
        out.push(el);
        return;
      }
      if (!ul) {
        ul = document2.createElement("ul");
        out.push(ul);
      }
      const li = document2.createElement("li");
      li.innerHTML = el.innerHTML.replace(/^\s*[-–•]\s+/, "");
      ul.append(li);
    });
    return out;
  }
  function parse6(element, { document: document2, template }) {
    if (template === "section-landing" && !element.matches(".fee-info-panel")) {
      const root = element.matches(".notice") ? element : element.querySelector(".notice") || element;
      const cell2 = dashLists(content(root, document2), document2);
      if (!cell2.length || !cell2.some((el) => cleanText4(el))) {
        element.replaceWith(...element.childNodes);
        return;
      }
      element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "Notice", cells: [[cell2]] }));
      return;
    }
    const cell = [];
    if (element.matches(".fee-info-panel") || element.querySelector(".fee-info-panel__inner")) {
      const panel2 = element.matches(".fee-info-panel") ? element : element.querySelector(".fee-info-panel");
      const icon = panel2.matches('[data-test="has-csp"]') ? "check" : "dollar";
      const title = cleanText4(panel2.querySelector('.fee-info-panel__title h4, .fee-info-panel__title, [data-test="fee-panel-title"]'));
      const h4 = document2.createElement("h4");
      h4.textContent = title ? `:${icon}: ${title}` : `:${icon}:`;
      cell.push(h4);
      const text7 = panel2.querySelector('.fee-info-panel__text, [data-test="fee-info-panel-text"]');
      if (text7) cell.push(...content(text7, document2));
    } else {
      const root = element.matches(".notice") ? element : element.querySelector(".notice") || element;
      cell.push(...content(root, document2));
    }
    if (!cell.length || !cell.some((el) => cleanText4(el))) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Notice", cells: [[cell]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-overlap.js
  function clean3(t) {
    return (t || "").replace(/​/g, "").replace(/\s+/g, " ").trim();
  }
  function text3(el) {
    return clean3(el ? el.textContent : "");
  }
  function stripAttrs2(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      if (!el.attributes) return;
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|loading|data-.*|aria-(?!label$).*)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    return root;
  }
  function ctaParagraph3(a, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = text3(a);
    const p = document2.createElement("p");
    const cls = a.className || "";
    if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) {
      p.append(link);
    } else {
      const wrap = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      wrap.append(link);
      p.append(wrap);
    }
    return p;
  }
  function videoLink(iframe, document2) {
    const src = iframe.getAttribute("src") || "";
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/"]+)/);
    const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/);
    const href = yt ? `https://www.youtube.com/watch?v=${yt[1]}` : vm ? `https://vimeo.com/${vm[1]}` : src;
    if (!href) return null;
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = clean3(iframe.getAttribute("title")) || href;
    const p = document2.createElement("p");
    p.append(a);
    return p;
  }
  function splitParagraph2(p, document2) {
    const lines = [[]];
    [...p.childNodes].forEach((n) => {
      if (n.nodeName === "BR") lines.push([]);
      else lines[lines.length - 1].push(n);
    });
    const out = [];
    let para3 = null;
    let list2 = null;
    const lineText = (l) => clean3(l.map((x) => x.textContent).join(""));
    lines.forEach((line) => {
      const t = lineText(line);
      if (!t) {
        para3 = null;
        list2 = null;
        return;
      }
      if (/^\d+\.\s+/.test(t)) {
        if (!list2) {
          list2 = document2.createElement("ol");
          out.push(list2);
        }
        para3 = null;
        const li = document2.createElement("li");
        line.forEach((x) => li.append(x));
        const first = [...li.childNodes].find((x) => x.nodeType === 3 && x.textContent.trim());
        if (first) first.textContent = first.textContent.replace(/^\s*\d+\.\s+/, "");
        list2.append(li);
        return;
      }
      list2 = null;
      if (!para3) {
        para3 = document2.createElement("p");
        out.push(para3);
      } else para3.append(document2.createElement("br"));
      line.forEach((x) => para3.append(x));
    });
    out.forEach((el) => {
      const f = el.firstChild;
      if (f && f.nodeType === 3) f.textContent = f.textContent.replace(/^\s+/, "");
      const l = el.lastChild;
      if (l && l.nodeType === 3) l.textContent = l.textContent.replace(/\s+$/, "");
    });
    return out.length ? out : [p];
  }
  function panel(root, document2) {
    const out = [];
    [...root.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (clean3(n.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean3(n.textContent);
          out.push(p);
        }
        return;
      }
      if (n.nodeType !== 1) return;
      if (n.tagName === "IFRAME") {
        const v = videoLink(n, document2);
        if (v) out.push(v);
        return;
      }
      if (n.matches('a.btn, a[class*="btn--"]')) {
        if (text3(n)) out.push(ctaParagraph3(n, document2));
        return;
      }
      if (!text3(n) && !n.querySelector("img, iframe")) return;
      if (/^H[1-6]$/.test(n.tagName)) {
        const h = document2.createElement(n.tagName.toLowerCase());
        h.textContent = text3(n);
        out.push(h);
        return;
      }
      if (n.tagName === "P") {
        if (n.querySelector(":scope > iframe")) {
          n.querySelectorAll("iframe").forEach((f) => {
            const v = videoLink(f, document2);
            if (v) out.push(v);
            f.remove();
          });
          if (!text3(n)) return;
        }
        const btn = n.querySelector(':scope > a.btn, :scope > a[class*="btn--"]');
        if (btn && text3(n) === text3(btn)) {
          out.push(ctaParagraph3(btn, document2));
          return;
        }
        stripAttrs2(n);
        if (n.querySelector("br")) out.push(...splitParagraph2(n, document2));
        else out.push(n);
        return;
      }
      if (/^(UL|OL|TABLE|BLOCKQUOTE)$/.test(n.tagName)) {
        out.push(stripAttrs2(n));
        return;
      }
      out.push(...panel(n, document2));
    });
    return out;
  }
  function bannerImage(element, document2) {
    const holder = element.querySelector(":scope > .section-alt__img-wrapper, .section-alt__img-wrapper");
    if (!holder) return null;
    const img = holder.querySelector("img");
    let src = img ? img.getAttribute("src") || img.getAttribute("data-src") || "" : "";
    if (!src || /^(data|blob):/.test(src)) {
      const bg = holder.querySelector("[data-excat-bg]") || (holder.hasAttribute("data-excat-bg") ? holder : null);
      src = bg ? bg.getAttribute("data-excat-bg") : "";
    }
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document2.createElement("img");
    out.src = src.trim();
    out.alt = clean3(img && img.getAttribute("alt") || "").replace(/\^?empty:(banner image)?$/i, "").replace(/^\^?empty:/i, "").replace(/^banner image$/i, "");
    return out;
  }
  var ICON_HOLDERS = ".section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left";
  function dashLists2(cell, document2) {
    const out = [];
    let ul = null;
    cell.forEach((el) => {
      const isDash = el.tagName === "P" && /^\s*[-–•]\s+/.test(el.textContent);
      if (!isDash) {
        ul = null;
        out.push(el);
        return;
      }
      if (!ul) {
        ul = document2.createElement("ul");
        out.push(ul);
      }
      const li = document2.createElement("li");
      li.innerHTML = el.innerHTML.replace(/^\s*[-–•]\s+/, "");
      ul.append(li);
    });
    return out;
  }
  function noticeBlock(el, document2) {
    let cell;
    if (el.tagName === "P") {
      const p = document2.createElement("p");
      [...el.childNodes].forEach((n) => p.append(n));
      stripAttrs2(p);
      cell = p.querySelector("br") ? splitParagraph2(p, document2) : [p];
    } else {
      cell = dashLists2(textPanel(el, document2, null), document2);
    }
    if (!cell.some((c) => text3(c))) return null;
    return WebImporter.Blocks.createBlock(document2, { name: "Notice", cells: [[cell]] });
  }
  function tableCell(cell, document2, bold) {
    const hasBlocks = [...cell.children].some((c) => /^(P|UL|OL|DIV|H[1-6]|TABLE)$/.test(c.tagName));
    if (hasBlocks) {
      stripAttrs2(cell);
      cell.querySelectorAll("[headers]").forEach((c) => c.removeAttribute("headers"));
      const kids = [...cell.childNodes].filter((n) => n.nodeType === 1 || clean3(n.textContent));
      if (bold) {
        kids.filter((k) => k.tagName === "P" && !(k.children.length === 1 && /^(STRONG|B)$/.test(k.firstElementChild.tagName))).forEach((k) => {
          const strong = document2.createElement("strong");
          strong.append(...k.childNodes);
          k.append(strong);
        });
      }
      return kids;
    }
    const p = document2.createElement("p");
    p.innerHTML = cell.innerHTML.replace(/\s+/g, " ").trim();
    stripAttrs2(p);
    if (!text3(p) && !p.querySelector("img")) return "";
    if (bold) {
      const strong = document2.createElement("strong");
      strong.append(...p.childNodes);
      p.append(strong);
    }
    return [p];
  }
  function tableBlock(table, document2) {
    const rows = [...table.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr")];
    const cells = [];
    rows.forEach((tr) => {
      const highlighted = /table__row--info/.test(tr.className);
      const row = [];
      [...tr.children].filter((c) => /^(TD|TH)$/.test(c.tagName)).forEach((c) => {
        row.push(tableCell(c, document2, c.tagName === "TH" || highlighted));
        const span = parseInt(c.getAttribute("colspan") || "1", 10);
        for (let i = 1; i < span && i < 20; i += 1) row.push("");
      });
      if (row.some((c) => c && c.length)) cells.push(row);
    });
    if (!cells.length) return null;
    const width = Math.max(...cells.map((r) => r.length));
    cells.forEach((r) => {
      while (r.length < width) r.push("");
    });
    return WebImporter.Blocks.createBlock(document2, { name: "Table", cells });
  }
  function videoBlock(iframe, document2) {
    const src = (iframe.getAttribute("src") || iframe.getAttribute("data-src") || "").trim();
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
    const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (!yt && !vm) return null;
    const href = yt ? `https://www.youtube.com/watch?v=${yt[1]}` : `https://vimeo.com/${vm[1]}`;
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = clean3(iframe.getAttribute("title")) || href;
    const p = document2.createElement("p");
    p.append(a);
    const row = [[p]];
    if (yt) {
      const img = document2.createElement("img");
      img.src = `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
      img.alt = clean3(iframe.getAttribute("title"));
      row.push([img]);
    }
    return WebImporter.Blocks.createBlock(document2, { name: "Video", cells: [row] });
  }
  function imageParagraph(img, document2) {
    const src = (img.getAttribute("src") || img.getAttribute("data-src") || "").trim();
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = clean3(img.getAttribute("alt")).replace(/^\^?empty:.*$/i, "");
    const p = document2.createElement("p");
    p.append(out);
    return p;
  }
  function looseItem(li, document2) {
    const item = document2.createElement("li");
    const rest = [];
    let inline = true;
    [...li.childNodes].forEach((n) => {
      if (inline && n.nodeType === 1 && /^(P|DIV|UL|OL|H[1-6]|TABLE)$/.test(n.tagName)) inline = false;
      if (inline) item.append(n);
      else rest.push(n);
    });
    while (item.lastChild && (item.lastChild.nodeName === "BR" || item.lastChild.nodeType === 3 && !clean3(item.lastChild.textContent))) item.lastChild.remove();
    if (item.firstChild && item.firstChild.nodeType === 3) item.firstChild.textContent = item.firstChild.textContent.replace(/^\s+/, "");
    if (item.lastChild && item.lastChild.nodeType === 3) item.lastChild.textContent = item.lastChild.textContent.replace(/\s+$/, "");
    stripAttrs2(item);
    const holder = document2.createElement("div");
    rest.forEach((n) => holder.append(n));
    return { item: text3(item) ? item : null, holder };
  }
  function textPanel(root, document2, items) {
    const out = [];
    let looseList = null;
    [...root.childNodes].forEach((n) => {
      if (n.nodeType === 1 && n.tagName === "LI") {
        const { item, holder } = looseItem(n, document2);
        if (item) {
          if (!looseList) {
            looseList = document2.createElement("ul");
            out.push(looseList);
          }
          looseList.append(item);
        }
        const after = textPanel(holder, document2, items);
        if (after.length) {
          looseList = null;
          out.push(...after);
        }
        return;
      }
      if (n.nodeType === 1 || clean3(n.textContent)) looseList = null;
      if (n.nodeType === 3) {
        if (clean3(n.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean3(n.textContent);
          out.push(p);
        }
        return;
      }
      if (n.nodeType !== 1) return;
      if (n.matches(ICON_HOLDERS)) {
        const img = n.querySelector("img[data-excat-icon]");
        if (img) {
          const p = document2.createElement("p");
          p.textContent = `:uom-${img.getAttribute("data-excat-icon")}:`;
          out.push(p);
        }
        return;
      }
      if (n.matches("img")) {
        const p = imageParagraph(n, document2);
        if (p) out.push(p);
        return;
      }
      if (n.matches(".notice")) {
        const b = noticeBlock(n, document2);
        if (b) out.push(b);
        return;
      }
      if (n.tagName === "TABLE") {
        const b = tableBlock(n, document2);
        if (b) out.push(b);
        return;
      }
      if (n.tagName === "IFRAME") {
        const b = videoBlock(n, document2);
        if (b) out.push(b);
        return;
      }
      if (items && n.matches(".card-flat-list")) {
        n.querySelectorAll(":scope > .card-flat-list__item, :scope > .cell").forEach((cell) => {
          const content2 = textPanel(cell, document2, null);
          if (content2.some((c) => text3(c) || c.querySelector && c.querySelector("img") || c.tagName === "TABLE")) items.push(content2);
        });
        return;
      }
      if (n.matches('a.btn, a[class*="btn--"]')) {
        if (text3(n)) out.push(ctaParagraph3(n, document2));
        return;
      }
      if (n.matches("a")) {
        if (text3(n)) {
          const p = document2.createElement("p");
          p.append(stripAttrs2(n));
          out.push(p);
        }
        return;
      }
      if (!text3(n) && !n.querySelector("img, iframe, table")) return;
      if (/^H[1-6]$/.test(n.tagName)) {
        const h = document2.createElement(n.tagName.toLowerCase());
        h.textContent = text3(n);
        out.push(h);
        return;
      }
      if (n.tagName === "P") {
        if (n.querySelector("iframe")) {
          n.querySelectorAll("iframe").forEach((f) => {
            const b = videoBlock(f, document2);
            if (b) out.push(b);
            f.remove();
          });
          if (!text3(n)) return;
        }
        const btn = n.querySelector(':scope > a.btn, :scope > a[class*="btn--"]');
        if (btn && text3(n) === text3(btn)) {
          out.push(ctaParagraph3(btn, document2));
          return;
        }
        stripAttrs2(n);
        ["paraid", "paraeid"].forEach((a) => n.querySelectorAll(`[${a}]`).forEach((x) => x.removeAttribute(a)));
        n.removeAttribute("paraid");
        n.removeAttribute("paraeid");
        if (n.querySelector("br")) out.push(...splitParagraph2(n, document2));
        else out.push(n);
        return;
      }
      if (/^(UL|OL|BLOCKQUOTE)$/.test(n.tagName)) {
        out.push(stripAttrs2(n));
        return;
      }
      out.push(...textPanel(n, document2, items));
    });
    return out;
  }
  function parseTextColumn(element, document2) {
    const row = element.querySelector(".section-alt__row") || element;
    const left = row.querySelector(":scope > .section-alt__left");
    const right = row.querySelector(":scope > .section-alt__right");
    const items = [];
    const leftCell = left ? textPanel(left, document2, items) : [];
    const rightCell = right ? textPanel(right, document2, items) : [];
    if (!leftCell.length && !rightCell.length && !items.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[leftCell.length ? leftCell : "", rightCell.length ? rightCell : ""]];
    for (let i = 0; i < items.length; i += 2) cells.push(items.slice(i, i + 2));
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", variants: ["text-column"], cells });
    element.replaceWith(block);
  }
  function parse7(element, { document: document2 }) {
    if (!element.querySelector(".section-alt__img-wrapper") && element.closest(".ct-textcolumnlayout")) {
      parseTextColumn(element, document2);
      return;
    }
    const row = element.querySelector(".section-alt__row") || element;
    const left = row.querySelector(":scope > .section-alt__left");
    const right = row.querySelector(":scope > .section-alt__right");
    const leftCell = left ? panel(left, document2) : [];
    const rightCell = right ? panel(right, document2) : left ? [] : panel(row, document2);
    if (!leftCell.length && !rightCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const image = bannerImage(element, document2);
    if (image) cells.push([[image], ""]);
    cells.push([leftCell.length ? leftCell : "", rightCell.length ? rightCell : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", variants: ["overlap"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function cleanText5(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs3(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|data-.*|aria-.*)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    return root;
  }
  function linkList(list2, document2) {
    const ul = document2.createElement("ul");
    list2.querySelectorAll(":scope > li").forEach((li) => {
      const a = li.querySelector("a[href]");
      const text7 = cleanText5(li.querySelector(".card-course__name") || a || li);
      if (!text7) return;
      const item = document2.createElement("li");
      if (a) {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href").trim();
        link.textContent = text7;
        item.append(link);
      } else {
        item.textContent = text7;
      }
      ul.append(item);
    });
    return ul.children.length ? ul : null;
  }
  function sideContent(side, document2) {
    const out = [];
    if (!side) return out;
    [...side.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (cleanText5(n)) {
          const p = document2.createElement("p");
          p.textContent = cleanText5(n);
          out.push(p);
        }
        return;
      }
      if (n.nodeType !== 1 || !cleanText5(n) && !n.querySelector("img")) return;
      if (n.matches("ul.card-course-list, ul")) {
        const ul = n.matches(".card-course-list") ? linkList(n, document2) : stripAttrs3(n);
        if (ul) out.push(ul);
        return;
      }
      if (/^H[1-6]$/.test(n.tagName)) {
        const h = document2.createElement(n.tagName.toLowerCase());
        h.textContent = cleanText5(n);
        out.push(h);
        return;
      }
      if (n.tagName === "DIV" || n.tagName === "SECTION") {
        out.push(...sideContent(n, document2));
        return;
      }
      out.push(stripAttrs3(n));
    });
    return out;
  }
  function landingStrip(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      [...el.attributes].forEach((a) => {
        if (!["href", "src", "alt", "colspan", "rowspan"].includes(a.name)) el.removeAttribute(a.name);
      });
    });
    root.querySelectorAll("span").forEach((sp) => sp.replaceWith(...sp.childNodes));
    root.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
    return root;
  }
  function landingCta(a, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = cleanText5(a);
    const cls = a.className || "";
    const p = document2.createElement("p");
    if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) {
      p.append(link);
      return p;
    }
    const wrap = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
    wrap.append(link);
    p.append(wrap);
    return p;
  }
  function landingCourseList(list2, document2) {
    const ul = document2.createElement("ul");
    list2.querySelectorAll(":scope > li").forEach((li) => {
      const a = li.querySelector("a[href]");
      const name = cleanText5(li.querySelector(".card-course__name") || a || li);
      if (!name) return;
      const item = document2.createElement("li");
      if (a) {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href").trim();
        link.textContent = name;
        item.append(link);
      } else item.textContent = name;
      const type = cleanText5(li.querySelector(".card-course__type"));
      if (type) item.append(` (${type})`);
      ul.append(item);
    });
    return ul.children.length ? ul : null;
  }
  function landingImage(fig, document2) {
    const img = fig.matches("img") ? fig : fig.querySelector("img");
    if (!img) return [];
    const src = (img.getAttribute("src") || img.getAttribute("data-src") || "").trim();
    if (!src || /^(data|blob):/.test(src)) return [];
    const out = document2.createElement("img");
    out.src = src;
    out.alt = (img.getAttribute("alt") || "").trim();
    const p = document2.createElement("p");
    p.append(out);
    const res = [p];
    const cap = fig.querySelector && fig.querySelector("figcaption");
    if (cap && cleanText5(cap)) {
      const c = document2.createElement("p");
      c.innerHTML = cap.innerHTML.trim();
      res.push(landingStrip(c));
    }
    return res;
  }
  function landingSide(side, document2, figures) {
    const out = [];
    if (!side) return out;
    [...side.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (cleanText5(n)) {
          const p = document2.createElement("p");
          p.textContent = cleanText5(n);
          out.push(p);
        }
        return;
      }
      if (n.nodeType !== 1 || !cleanText5(n) && !n.querySelector("img") && !n.matches("img")) return;
      if (n.matches("figure") && figures) {
        figures.push(n);
        return;
      }
      if (n.matches("figure, img")) {
        out.push(...landingImage(n, document2));
        return;
      }
      if (n.matches("ul.card-course-list, ul.page-short-course__course-list")) {
        const ul = landingCourseList(n, document2);
        if (ul) out.push(ul);
        return;
      }
      if (n.matches("a")) {
        if (cleanText5(n)) out.push(landingCta(n, document2));
        return;
      }
      if (/^H[1-6]$/.test(n.tagName)) {
        const h = document2.createElement(n.tagName.toLowerCase());
        h.textContent = cleanText5(n);
        out.push(h);
        return;
      }
      if (n.tagName === "P" && n.querySelector('a.btn, a[class*="btn--"]') && cleanText5(n) === cleanText5(n.querySelector("a"))) {
        out.push(landingCta(n.querySelector("a"), document2));
        return;
      }
      if (/^(DIV|SECTION|ARTICLE)$/.test(n.tagName)) {
        out.push(...landingSide(n, document2, figures));
        return;
      }
      out.push(landingStrip(n));
    });
    return out;
  }
  function parseLanding(element, document2) {
    let sides = [...element.querySelectorAll(":scope > .section-alt__left, :scope > .section-alt__right")];
    let row;
    if (sides.length) {
      row = sides.map((s) => landingSide(s, document2)).filter((c) => c.length);
    } else if (element.matches(".grid") || element.querySelector(":scope > .cell")) {
      sides = [...element.querySelectorAll(":scope > .cell")];
      row = sides.map((s) => landingSide(s, document2)).filter((c) => c.length);
    } else {
      const figures = [];
      const text7 = landingSide(element, document2, figures);
      const images = figures.flatMap((f) => landingImage(f, document2));
      const left = figures.some((f) => /figure--inset-left/.test(f.className));
      row = [text7, images].filter((c) => c.length);
      if (left) row.reverse();
    }
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "Columns", cells: [row] }));
  }
  function parse8(element, { document: document2, template }) {
    if (template === "section-landing") {
      parseLanding(element, document2);
      return;
    }
    let sides = [...element.querySelectorAll(":scope > .section-alt__left, :scope > .section-alt__right")];
    if (!sides.length) sides = [...element.children];
    const row = sides.map((s) => sideContent(s, document2)).filter((c) => c.length);
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-split.js
  function clean4(el) {
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
  function imageCell(side, document2) {
    const out = document2.createElement("img");
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
  function textCell(side, document2) {
    const root = side.querySelector(".split-section__inner") || side;
    const content2 = [];
    [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, ul, ol, a.btn")].forEach((el) => {
      if (el.matches("a.btn")) {
        const href = (el.getAttribute("href") || "").trim();
        const text7 = clean4(el);
        if (!href || !text7) return;
        const link = document2.createElement("a");
        link.href = href;
        link.textContent = text7;
        const wrap = document2.createElement(/btn--secondary/.test(el.className) ? "em" : "strong");
        wrap.append(link);
        const p = document2.createElement("p");
        p.append(wrap);
        content2.push(p);
        return;
      }
      if (el.closest("a.btn") || !clean4(el)) return;
      if (el.parentElement && el.parentElement.closest("ul, ol, p") && root.contains(el.parentElement.closest("ul, ol, p"))) return;
      if (el.matches('.uom-title-overline, [class*="overline"], [class*="eyebrow"]')) {
        const p = document2.createElement("p");
        p.textContent = clean4(el);
        content2.push(p);
        return;
      }
      el.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
      content2.push(el);
    });
    return content2;
  }
  function landingCta2(a, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = clean4(a);
    const cls = a.className || "";
    const p = document2.createElement("p");
    if (/btn--text/.test(cls)) {
      p.append(link);
      return p;
    }
    const wrap = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
    wrap.append(link);
    p.append(wrap);
    return p;
  }
  function stripAttrs4(el) {
    [el, ...el.querySelectorAll("*")].forEach((c) => [...c.attributes].forEach((a) => {
      if (!["href", "src", "alt", "colspan", "rowspan"].includes(a.name)) c.removeAttribute(a.name);
    }));
    el.querySelectorAll("span").forEach((sp) => sp.replaceWith(...sp.childNodes));
    el.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
    return el;
  }
  var BR_BR = /<br\s*\/?>\s*(?:&nbsp;|\s)*<br\s*\/?>/i;
  function splitBrParagraph(p, document2) {
    if (!BR_BR.test(p.innerHTML)) return [p];
    return p.innerHTML.split(BR_BR).map((h) => {
      const q = document2.createElement("p");
      q.innerHTML = h.trim();
      return q;
    }).filter((q) => clean4(q) || q.querySelector("img"));
  }
  function landingTextCell(side, document2) {
    const root = side.querySelector(".split-section__inner, .section-image__content") || side;
    const content2 = [];
    [...root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, a.btn, a[class*="btn--"]')].forEach((el) => {
      if (el.matches("a")) {
        if (el.parentElement && el.parentElement.closest("ul, ol") && root.contains(el.parentElement)) return;
        if (clean4(el) && el.getAttribute("href")) content2.push(landingCta2(el, document2));
        return;
      }
      if (el.closest("a") || !clean4(el)) return;
      if (el.parentElement && el.parentElement.closest("ul, ol, p") && root.contains(el.parentElement.closest("ul, ol, p"))) return;
      if (el.matches("ul.uom-link-panel-list__items, .uom-link-panel-list ul")) {
        const ul = document2.createElement("ul");
        el.querySelectorAll("li").forEach((li) => {
          const a = li.querySelector("a[href]");
          const label = clean4(li.querySelector(".uom-link-panel__text") || a || li);
          if (!label) return;
          const item = document2.createElement("li");
          if (a) {
            const link = document2.createElement("a");
            link.href = a.getAttribute("href").trim();
            link.textContent = label;
            item.append(link);
          } else item.textContent = label;
          ul.append(item);
        });
        if (ul.children.length) content2.push(ul);
        return;
      }
      const copy = el.cloneNode(true);
      copy.querySelectorAll('a.btn, a[class*="btn--"]').forEach((a) => a.remove());
      if (!clean4(copy) && !copy.querySelector("img")) return;
      stripAttrs4(copy);
      if (copy.tagName === "P") content2.push(...splitBrParagraph(copy, document2));
      else content2.push(copy);
    });
    return content2;
  }
  function repairAlt(alt) {
    return (alt || "").replace(/^\s*Image for\s+/i, "").replace(/\}\s*$/, "").trim();
  }
  function parseLanding2(element, document2) {
    let sides;
    if (element.querySelector(".section-image__img")) {
      sides = [element.querySelector(".section-image__img"), element.querySelector(".section-image__content") || element.querySelector(".section-image__inner")];
    } else {
      sides = [...element.querySelectorAll(":scope > .split-section__side, :scope > div")];
      if (!sides.length) sides = [...element.children];
    }
    const row = [];
    sides.filter(Boolean).forEach((side) => {
      const isImage = side.matches('[class*="--with-image"], .section-image__img') || side.querySelector("img") && !clean4(side);
      if (isImage) {
        const cell = imageCell(side, document2);
        if (cell) {
          cell[0].alt = repairAlt(cell[0].alt);
          row.push(cell);
        }
      } else {
        const cell = landingTextCell(side, document2);
        if (cell.length) row.push(cell);
      }
    });
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "Columns (split)", cells: [row] }));
  }
  function parse9(element, { document: document2, template }) {
    if (template === "section-landing") {
      parseLanding2(element, document2);
      return;
    }
    let sides = [...element.querySelectorAll(":scope > .split-section__side, :scope > div")];
    if (!sides.length) sides = [...element.children];
    const row = [];
    sides.forEach((side) => {
      const isImage = side.matches('[class*="--with-image"]') || side.querySelector("img") && !clean4(side);
      if (isImage) {
        const cell = imageCell(side, document2);
        if (cell) row.push(cell);
      } else {
        const cell = textCell(side, document2);
        if (cell.length) row.push(cell);
      }
    });
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Columns (split)", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-people.js
  var BLOCKED_IMAGES2 = [];
  function cleanText6(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function portrait(card, name, document2) {
    const thumb = card.querySelector('.card__thumb, .card__image, [aria-label="Profile Image"]');
    const img = (thumb || card).querySelector("img");
    let src = img ? img.getAttribute("src") || img.getAttribute("data-src") || "" : "";
    if ((!src || /^(data|blob):/.test(src)) && thumb) {
      const m = (thumb.getAttribute("style") || "").match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      src = m ? m[2].trim() : "";
    }
    if (!src || /^(data|blob):/.test(src)) return null;
    if (BLOCKED_IMAGES2.some((frag) => src.includes(frag))) {
      console.warn(`[cards-people] image dropped (403): ${src}`);
      return null;
    }
    const out = document2.createElement("img");
    out.src = src;
    out.alt = img && img.getAttribute("alt") || name || "";
    return out;
  }
  function parseShortCourseProfiles(element, document2) {
    const cells = [];
    element.querySelectorAll(".page-short-course__profile").forEach((card) => {
      const content2 = card.querySelector(".page-short-course__profile-content") || card;
      const name = cleanText6(content2.querySelector("h1, h2, h3, h4, h5, h6"));
      const body = [];
      if (name) {
        const h = document2.createElement("h3");
        h.textContent = name;
        body.push(h);
      }
      content2.querySelectorAll("p, ul, ol").forEach((el) => {
        if (!cleanText6(el)) return;
        if (el.parentElement && el.parentElement.closest("p, ul, ol") && content2.contains(el.parentElement)) return;
        const out = document2.createElement(el.tagName.toLowerCase());
        out.innerHTML = el.innerHTML.trim();
        out.querySelectorAll("*").forEach((c) => [...c.attributes].forEach((a) => {
          if (!["href", "src", "alt"].includes(a.name)) c.removeAttribute(a.name);
        }));
        body.push(out);
      });
      content2.querySelectorAll(":scope > a[href]").forEach((a) => {
        const label = cleanText6(a);
        if (!label) return;
        const link = document2.createElement("a");
        link.href = a.getAttribute("href").trim();
        link.textContent = label;
        const p = document2.createElement("p");
        p.append(link);
        body.push(p);
      });
      const holder = card.querySelector(".page-short-course__profile-img") || card;
      const image = portrait(holder, name, document2);
      if (!body.length) {
        if (image) cells.push([[image]]);
        return;
      }
      cells.push(image ? [[image], body] : [body]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["people"], cells });
    element.replaceWith(block);
  }
  function parse10(element, { document: document2 }) {
    if (element.querySelector(".page-short-course__profile")) {
      parseShortCourseProfiles(element, document2);
      return;
    }
    let cards = [...element.querySelectorAll(".card--showcase-profile")];
    if (!cards.length) cards = [...element.querySelectorAll(".card")];
    const cells = [];
    cards.forEach((card) => {
      const inner = card.querySelector(".card__inner") || card;
      const titleEl = inner.querySelector(".card__title, h1, h2, h3, h4, h5, h6");
      const name = cleanText6(titleEl);
      const body = [];
      if (name) {
        const h = document2.createElement("h5");
        h.textContent = name;
        body.push(h);
      }
      [...inner.querySelectorAll("p, ul, ol")].forEach((el) => {
        if (el.closest(".card__thumb") || !cleanText6(el)) return;
        if (el.parentElement && el.parentElement.closest("p, ul, ol") && inner.contains(el.parentElement)) return;
        body.push(el);
      });
      if (!body.length) return;
      const image = portrait(card, name, document2);
      cells.push(image ? [[image], body] : [body]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const before = [];
    const after = [];
    let seenCards = false;
    [...element.children].forEach((child) => {
      const hasCard = child.matches(".card--showcase-profile") || child.querySelector(".card--showcase-profile");
      if (hasCard) {
        seenCards = true;
        return;
      }
      if (!child.textContent.trim() && !child.querySelector("img, iframe")) return;
      (seenCards ? after : before).push(child);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["people"], cells });
    element.replaceWith(...before, block, ...after);
  }

  // tools/importer/parsers/cards-tile.js
  function cleanText7(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function makeLink(a, text7, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = text7;
    return link;
  }
  function landingCta3(a, document2) {
    const link = makeLink(a, cleanText7(a) || cleanText7({ textContent: a.getAttribute("aria-label") || "" }), document2);
    const p = document2.createElement("p");
    const cls = a.className || "";
    if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
    else {
      const wrap = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
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
  function tileBody(root, document2, titleLink) {
    const body = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          if (cleanText7(n)) {
            const p = document2.createElement("p");
            p.textContent = cleanText7(n);
            body.push(p);
          }
          return;
        }
        if (n.nodeType !== 1) return;
        if (n.matches(".card__thumb, img, picture, svg")) return;
        if (n.matches('a.btn, a[class*="btn--"]')) {
          if (cleanText7(n)) body.push(landingCta3(n, document2));
          return;
        }
        if (!cleanText7(n)) return;
        if (/^H[1-6]$/.test(n.tagName) || n.matches(".card__header, .btn-card__label")) {
          const parts = n.querySelector("br") ? n.innerHTML.split(/<br\s*\/?>/i).map((s) => cleanText7({ textContent: s.replace(/<[^>]+>/g, " ") })).filter(Boolean) : [cleanText7(n)];
          const h = document2.createElement("h3");
          if (titleLink && !body.some((b) => b.tagName === "H3")) h.append(makeLink(titleLink, parts[0], document2));
          else h.textContent = parts[0];
          body.push(h);
          parts.slice(1).forEach((t) => {
            const p = document2.createElement("p");
            p.textContent = t;
            body.push(p);
          });
          return;
        }
        if (/^(P|UL|OL)$/.test(n.tagName)) {
          const only = n.querySelector(':scope > a.btn, :scope > a[class*="btn--"]');
          if (only && cleanText7(only) === cleanText7(n)) {
            body.push(landingCta3(only, document2));
            return;
          }
          body.push(stripAll(n));
          return;
        }
        walk(n);
      });
    };
    walk(root);
    if (titleLink && !body.some((b) => b.tagName === "H3" || b.querySelector && b.querySelector("a"))) {
      const first = body[0];
      if (first && first.tagName === "P" && cleanText7(first)) {
        const p = document2.createElement("p");
        p.append(makeLink(titleLink, cleanText7(first), document2));
        body[0] = p;
      }
    }
    return body;
  }
  function tileImage(card, document2) {
    const holder = card.querySelector(".card__thumb");
    if (!holder) return null;
    const img = holder.querySelector("img");
    let src = img ? img.getAttribute("src") || "" : "";
    if ((!src || /^(data|blob):/.test(src)) && holder.hasAttribute("data-excat-bg")) src = holder.getAttribute("data-excat-bg");
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document2.createElement("img");
    out.src = src.trim();
    out.alt = holder.getAttribute("aria-label") || img && img.getAttribute("alt") || "";
    return out;
  }
  function landingTiles(element, document2) {
    const cells = [];
    const btnCards = [...element.querySelectorAll(".btn-card__inner")];
    if (btnCards.length) {
      btnCards.forEach((inner) => {
        const a = inner.closest("a[href]");
        const label = cleanText7(inner.querySelector(".btn-card__label") || inner);
        if (!label) return;
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        if (a) strong.append(makeLink(a, label, document2));
        else strong.textContent = label;
        p.append(strong);
        const rest = [...inner.children].filter((c) => !c.matches(".btn-card__label") && cleanText7(c)).map((c) => {
          const q = document2.createElement("p");
          q.textContent = cleanText7(c);
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
            const p = document2.createElement("p");
            const strong = document2.createElement("strong");
            strong.append(makeLink(c, cleanText7(c), document2));
            p.append(strong);
            body.push(p);
          } else if (cleanText7(c)) body.push(stripAll(c));
        });
        if (body.length) cells.push([body]);
      });
      return cells;
    }
    const linkCards = [...element.querySelectorAll(":scope > .cell")].map((c) => c.querySelector(":scope > a.card[href]")).filter(Boolean);
    if (linkCards.length) {
      linkCards.forEach((card) => {
        const body = tileBody(card, document2, card);
        if (!body.length) return;
        const image = tileImage(card, document2);
        cells.push(image ? [[image], body] : [body]);
      });
      return cells;
    }
    let cols = [...element.querySelectorAll(":scope > .section__flex-items")];
    if (!cols.length && element.closest("#fees")) cols = [...element.querySelectorAll(":scope > .cell")];
    if (cols.length) {
      cols.forEach((col) => {
        const body = tileBody(col, document2, null);
        if (body.length) cells.push([body]);
      });
      return cells;
    }
    return cells;
  }
  function parse11(element, { document: document2 }) {
    const landingCells = landingTiles(element, document2);
    if (landingCells.length) {
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "Cards (tile)", cells: landingCells });
      element.replaceWith(block2);
      return;
    }
    const cells = [];
    let items = [...element.querySelectorAll(".pathfinder-today__link")];
    if (!items.length) items = [...element.querySelectorAll(".pathfinder-today__list-item")];
    items.forEach((item) => {
      const a = item.querySelector("a[href]");
      const titleEl = item.querySelector(".pathfinder-today__link-title") || a;
      const title = cleanText7(titleEl);
      if (!title) return;
      const body = [];
      const p = document2.createElement("p");
      const strong = document2.createElement("strong");
      if (a) strong.append(makeLink(a, title, document2));
      else strong.textContent = title;
      p.append(strong);
      body.push(p);
      const desc = cleanText7(item.querySelector('.pathfinder-today__link-description, [class*="description"]'));
      if (desc) {
        const dp = document2.createElement("p");
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
        const title = cleanText7(a && a.querySelector(".push-icon") || a || heading);
        if (!title) return;
        const body = [];
        const eyebrow = cleanText7(card.querySelector('.article-card__category, [class*="category"], [class*="eyebrow"]'));
        if (eyebrow) {
          const ep = document2.createElement("p");
          ep.textContent = eyebrow;
          body.push(ep);
        }
        const h = document2.createElement(heading && /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3");
        if (a) h.append(makeLink(a, title, document2));
        else h.textContent = title;
        body.push(h);
        cells.push([body]);
      });
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards (tile)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  function clean5(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function iconName(title) {
    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return slug ? `uom-${slug}` : "";
  }
  function pictogram(card, title, document2) {
    const holder = card.querySelector('.card__icons__left, [class*="card__icon"]');
    if (!holder || !holder.querySelector("img, svg")) return null;
    const name = iconName(title);
    if (!name) return null;
    const p = document2.createElement("p");
    p.textContent = `:${name}:`;
    return p;
  }
  var OVERVIEW_ICONS = { briefcase: "briefcase", handshake: "handshake", circlewavycheck: "verified-badge" };
  function landingIconCell(holder, document2) {
    if (!holder) return null;
    const img = holder.matches("img") ? holder : holder.querySelector("img");
    if (!img) return null;
    const tagged = img.getAttribute("data-excat-icon");
    const src = (img.getAttribute("src") || "").trim();
    const file = (src.split("/").pop() || "").replace(/\.svg$/i, "").toLowerCase();
    const name = tagged || /\.svg$/i.test(src) && OVERVIEW_ICONS[file];
    if (name) {
      const p = document2.createElement("p");
      p.textContent = `:uom-${name}:`;
      return p;
    }
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = clean5({ textContent: img.getAttribute("alt") || "" });
    return out;
  }
  function landingCta4(a, document2) {
    a.querySelectorAll(".screenreaders-only, .sr-only").forEach((x) => x.remove());
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = clean5(a) || (a.getAttribute("title") || "").trim();
    const cls = a.className || "";
    const p = document2.createElement("p");
    if (/\bbtn\b/.test(cls) && !/btn--text/.test(cls)) {
      const w = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      w.append(link);
      p.append(w);
    } else p.append(link);
    return p;
  }
  function landingBody(card, skip, document2) {
    const body = [];
    const heading = card.querySelector("h2, h3, h4, h5, h6");
    if (heading && clean5(heading)) {
      const h = document2.createElement("h3");
      h.textContent = clean5(heading);
      body.push(h);
    }
    [...card.querySelectorAll('h2, h3, h4, h5, h6, p, ul, ol, a.btn, a[class*="btn--"]')].forEach((el) => {
      if (el === heading || skip && skip.contains(el) || !clean5(el)) return;
      if (el.parentElement && el.parentElement.closest("p, ul, ol") && card.contains(el.parentElement)) return;
      if (el.matches("a")) {
        if (!el.closest("p, li")) body.push(landingCta4(el, document2));
        return;
      }
      if (/^H[2-6]$/.test(el.tagName)) {
        const p = document2.createElement("p");
        p.textContent = clean5(el);
        body.push(p);
        return;
      }
      const out = document2.createElement(el.tagName.toLowerCase());
      out.innerHTML = el.innerHTML.trim();
      out.querySelectorAll('a.btn, a[class*="btn--"]').forEach((a) => {
        const cta = landingCta4(a, document2);
        a.replaceWith(...cta.childNodes);
      });
      out.querySelectorAll("*").forEach((c) => [...c.attributes].forEach((at) => {
        if (at.name !== "href") c.removeAttribute(at.name);
      }));
      out.querySelectorAll("span").forEach((sp) => sp.replaceWith(...sp.childNodes));
      if (clean5(out)) body.push(out);
    });
    return body;
  }
  function parseLanding3(element, document2) {
    const rows = [];
    if (element.matches(".logo-listing") || element.querySelector(".logo-listing__item")) {
      element.querySelectorAll(".logo-listing__item").forEach((item) => {
        const img = landingIconCell(item.querySelector("img"), document2);
        if (img) rows.push([[img]]);
      });
    } else if (element.matches("ul.document-list") || element.querySelector("ul.document-list")) {
      element.querySelectorAll("li").forEach((li) => {
        const img = landingIconCell(li.querySelector("figure > img, img"), document2);
        const body = [];
        (li.querySelector("figcaption") || li).querySelectorAll("a[href]").forEach((a) => {
          const p = document2.createElement("p");
          const link = document2.createElement("a");
          link.href = a.getAttribute("href").trim();
          link.textContent = clean5(a);
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
        const imageParagraph2 = card.matches(".card-focus") ? [...card.querySelectorAll(":scope > p")].find((p) => !clean5(p) && p.querySelector(":scope > img")) : null;
        const holder = card.querySelector(".section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left") || card.querySelector(":scope > img") || imageParagraph2;
        const icon = card.matches(".card--fact") ? null : landingIconCell(holder, document2);
        const body = landingBody(card, holder, document2);
        if (!body.length && !icon) return;
        rows.push(icon ? [[icon], body.length ? body : ""] : [body]);
      });
    }
    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const name = element.closest(".ct-focusbox") ? "Cards (icon, boxed)" : "Cards (icon)";
    element.replaceWith(WebImporter.Blocks.createBlock(document2, { name, cells: rows }));
  }
  function isLanding(element) {
    if (element.closest('.course-content, .course-section__main, [data-test$="-page"]')) return false;
    return !!(element.closest(".ct-factscard, .ct-imagelisting, .ct-textthreecolumn, .ct-focusbox, .ct-documentlisting") || element.closest("#main > section#overview"));
  }
  function parse12(element, { document: document2 }) {
    if (isLanding(element)) {
      parseLanding3(element, document2);
      return;
    }
    const course = !!element.closest('.course-content, .course-section__main, [data-test$="-page"]');
    let cards = [...element.querySelectorAll(".card")];
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > div")];
    const cells = [];
    cards.forEach((card) => {
      const body = [];
      const heading = card.querySelector(course ? "h2, h3, h4, h5, h6, .card__title" : "h2, h3, h4, .card__title");
      const title = clean5(heading);
      if (title) {
        const h = document2.createElement(course ? "h5" : /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3");
        h.textContent = title;
        body.push(h);
      }
      card.querySelectorAll(".card__inner p, .card__meta").forEach((p, i, all) => {
        if (course && p === heading) return;
        if ([...all].indexOf(p) !== i || !clean5(p)) return;
        const para3 = document2.createElement("p");
        para3.textContent = clean5(p);
        body.push(para3);
      });
      const cta = card.querySelector(".card__footer a[href], a.btn[href]");
      if (cta) {
        cta.querySelectorAll(".screenreaders-only, .sr-only").forEach((s) => s.remove());
        const link = document2.createElement("a");
        link.href = cta.getAttribute("href").trim();
        link.textContent = clean5(cta);
        const p = document2.createElement("p");
        p.append(link);
        body.push(p);
      }
      if (!body.length) return;
      const icon = pictogram(card, title, document2);
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards (icon)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function clean6(el) {
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
  function pickImage(card, document2) {
    const out = document2.createElement("img");
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
  var BLOCKED_IMAGES3 = [];
  function landingLink(href, label, document2) {
    const a = document2.createElement("a");
    a.href = (href || "").trim();
    a.textContent = label;
    return a;
  }
  function landingPara(textOrNode, document2) {
    const p = document2.createElement("p");
    if (typeof textOrNode === "string") p.textContent = textOrNode;
    else p.append(textOrNode);
    return p;
  }
  function landingCard(card, document2) {
    card.querySelectorAll(".screenreaders-only, .sr-only").forEach((x) => x.remove());
    const body = [];
    const cardHref = card.matches("a[href]") ? card.getAttribute("href") : "";
    const heading = card.querySelector(".card__inner h1, .card__inner h2, .card__inner h3, .card__inner h4, .card__title, .card__header, h3");
    const title = clean6(heading);
    if (title) {
      const h = document2.createElement("h3");
      const wrapping = heading.parentElement && heading.parentElement.closest("a[href]");
      const titleLink = heading.matches("a[href]") ? heading : heading.querySelector("a[href]") || (wrapping && card.contains(wrapping) ? wrapping : null);
      const href = titleLink && titleLink.getAttribute("href") || cardHref;
      if (href) h.append(landingLink(href, title, document2));
      else h.textContent = title;
      body.push(h);
    }
    card.querySelectorAll(".card__sub-titles .sub-title, .card__sub-titles > :not(.sub-title)").forEach((st) => {
      if (clean6(st)) body.push(landingPara(clean6(st), document2));
    });
    const inner = card.querySelector(".card__inner") || card;
    inner.querySelectorAll(":scope > p, :scope > .card__meta, .card__excerpt").forEach((ex) => {
      if (heading && (ex === heading || ex.contains(heading))) return;
      const t = clean6(ex).replace(/\s*(\.{3,}|…)$/, "");
      if (t) body.push(landingPara(t, document2));
    });
    card.querySelectorAll(".card__tags .tags__item").forEach((tag) => {
      if (clean6(tag)) body.push(landingPara(clean6(tag), document2));
    });
    const titleHref = heading && (heading.matches("a") ? heading : heading.querySelector("a"));
    card.querySelectorAll(".card__links a[href], .card__footer a[href]").forEach((a) => {
      const label = clean6(a) || (a.getAttribute("aria-label") || "").trim();
      if (!label) return;
      const link = landingLink(a.getAttribute("href"), label, document2);
      const cls = a.className || "";
      if (/btn--cta|btn--secondary/.test(cls)) {
        const em = document2.createElement("em");
        em.append(link);
        body.push(landingPara(em, document2));
        return;
      }
      if (/\bbtn\b/.test(cls) && !/btn--text/.test(cls)) {
        const st = document2.createElement("strong");
        st.append(link);
        body.push(landingPara(st, document2));
        return;
      }
      body.push(landingPara(link, document2));
    });
    if (!titleHref && !body.some((b) => b.querySelector && b.querySelector("a"))) {
    }
    let image = pickImage(card, document2);
    const bgHolder = image ? null : [card, ...card.querySelectorAll("[data-excat-bg]")].find((el) => (el.getAttribute("data-excat-bg") || "").trim());
    if (bgHolder) {
      image = document2.createElement("img");
      image.src = bgHolder.getAttribute("data-excat-bg").trim();
      image.alt = (bgHolder.getAttribute("aria-label") || "").trim();
    }
    if (image && card.matches(".card--stafflist") && /^profile-image$/i.test(image.alt)) {
      const t = card.querySelector("[title]");
      image.alt = t && t.getAttribute("title").trim() || title;
    }
    if (!body.length && !image) return null;
    return image ? [[image], body.length ? body : ""] : [body];
  }
  function parseLanding4(element, document2, url) {
    let cards = [...element.querySelectorAll(".card")].filter((c) => !c.parentElement.closest(".card"));
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > li")];
    const newsroom = /\/news\/?$/.test(url ? new URL(url, "https://study.unimelb.edu.au").pathname : "");
    if (!newsroom) {
      cards = cards.filter((c) => {
        const hidden = c.closest(".hidden");
        return !hidden || !element.contains(hidden);
      });
    }
    const rows = cards.map((c) => landingCard(c, document2)).filter(Boolean);
    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const listing = cards.length && cards.every((c) => c.matches(".card--imagelisting"));
    element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: listing ? "Cards (listing)" : "Cards", cells: rows }));
  }
  function parse13(element, { document: document2, template, url }) {
    if (template === "section-landing") {
      parseLanding4(element, document2, url);
      return;
    }
    const course = !!element.closest('.course-content, .course-section__main, [data-test$="-page"]');
    let cards = [...element.querySelectorAll(".card")];
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > div")];
    const cells = [];
    cards.forEach((card) => {
      const body = [];
      const heading = card.querySelector("h2, h3, h4, h5, h6, .card__title, .card__header");
      if (heading && clean6(heading)) {
        let tag = /^H[2-6]$/.test(heading.tagName) ? heading.tagName.toLowerCase() : "h3";
        if (course) tag = "h5";
        const h = document2.createElement(tag);
        const br = course ? heading.querySelector(":scope > br") : null;
        if (br) {
          const rest = document2.createElement("p");
          let n = br.nextSibling;
          while (n) {
            const next = n.nextSibling;
            rest.append(n);
            n = next;
          }
          br.remove();
          h.textContent = clean6(heading);
          body.push(h);
          if (clean6(rest)) body.push(rest);
        } else {
          h.textContent = clean6(heading);
          body.push(h);
        }
      }
      if (course) {
        const walkInner = (node) => {
          [...node.childNodes].forEach((n) => {
            if (n.nodeType === 3) {
              if (clean6(n)) {
                const p = document2.createElement("p");
                p.textContent = clean6(n);
                body.push(p);
              }
              return;
            }
            if (n.nodeType !== 1 || n === heading) return;
            if (heading && n.contains(heading)) {
              walkInner(n);
              return;
            }
            if (!clean6(n) && !n.querySelector("img")) return;
            if (/^(P|UL|OL)$/.test(n.tagName)) {
              n.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
              body.push(n);
            } else if (/^(DIV|SECTION|BLOCKQUOTE|FIGURE)$/.test(n.tagName)) {
              if (n.querySelector("p, ul, ol, div, blockquote, h1, h2, h3, h4, h5, h6")) walkInner(n);
              else {
                const p = document2.createElement("p");
                p.innerHTML = n.innerHTML.trim();
                body.push(p);
              }
            } else if (/^H[1-6]$/.test(n.tagName) || /^(CITE|SPAN|STRONG|EM|A|SMALL)$/.test(n.tagName)) {
              const p = document2.createElement("p");
              p.innerHTML = n.innerHTML.trim();
              body.push(p);
            } else if (n.tagName !== "HR" && n.tagName !== "IMG") {
              const p = document2.createElement("p");
              p.textContent = clean6(n);
              body.push(p);
            }
          });
        };
        const inner = card.querySelector(".card__inner");
        if (inner) walkInner(inner);
        const footer = card.querySelector(".card__footer");
        if (footer && clean6(footer)) {
          const blocks = [...footer.children].filter((c) => /^(P|UL|OL)$/.test(c.tagName));
          if (blocks.length) body.push(...blocks);
          else {
            const p = document2.createElement("p");
            p.append(...footer.childNodes);
            body.push(p);
          }
        }
      } else {
        card.querySelectorAll(".card__inner p, .card__meta").forEach((p, i, all) => {
          if ([...all].indexOf(p) !== i || !clean6(p)) return;
          const para3 = document2.createElement("p");
          para3.textContent = clean6(p);
          body.push(para3);
        });
      }
      const cta = course ? null : card.querySelector(".card__footer a[href], a.btn[href]");
      if (cta) {
        cta.querySelectorAll(".screenreaders-only, .sr-only").forEach((s) => s.remove());
        const link = document2.createElement("a");
        link.href = cta.getAttribute("href").trim();
        link.textContent = clean6(cta);
        const p = document2.createElement("p");
        p.append(link);
        body.push(p);
      }
      if (!body.length) return;
      let image = pickImage(card, document2);
      if (course && image && BLOCKED_IMAGES3.some((frag) => image.src.includes(frag))) {
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stat.js
  function cleanText8(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function para(text7, document2) {
    const p = document2.createElement("p");
    p.textContent = text7;
    return p;
  }
  function descParas(desc, document2) {
    if (!desc || !cleanText8(desc) && !desc.querySelector("img")) return [];
    const blocks = [...desc.children].filter((c) => /^(P|UL|OL|H[1-6]|TABLE)$/.test(c.tagName));
    if (blocks.length) {
      const out = [];
      let loose = document2.createElement("p");
      [...desc.childNodes].forEach((n) => {
        if (n.nodeType === 1 && blocks.includes(n)) {
          if (cleanText8(loose)) out.push(loose);
          loose = document2.createElement("p");
          out.push(n);
        } else if (n.nodeType !== 8) {
          loose.append(n);
        }
      });
      if (cleanText8(loose)) out.push(loose);
      return out;
    }
    const p = document2.createElement("p");
    p.innerHTML = desc.innerHTML.trim();
    return [p];
  }
  function statRows(container, document2) {
    let cards = [...container.querySelectorAll(".info-card")];
    if (!cards.length) cards = [...container.querySelectorAll(":scope > li")];
    const rows = [];
    cards.forEach((card) => {
      const title = cleanText8(card.querySelector('.info-card__title, [data-test="info-card-title"]'));
      const value = cleanText8(card.querySelector('.info-card__value, [data-test="info-card-value"]'));
      const label = cleanText8(card.querySelector('.info-card__label, [data-test="info-card-label"]'));
      const desc = card.querySelector('.info-card__desc, [data-test="info-card-description"]');
      if (!title && !value) return;
      const stat = [];
      if (title) stat.push(para(title, document2));
      if (value) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = value;
        p.append(strong);
        stat.push(p);
      }
      if (label) stat.push(para(label, document2));
      const description = descParas(desc, document2);
      rows.push(description.length ? [stat, description] : [stat, ""]);
    });
    return rows;
  }
  function landingStatRows(container, document2) {
    const rows = [];
    container.querySelectorAll(".uom-stat").forEach((stat) => {
      const figure = cleanText8(stat.querySelector(".uom-stat__title"));
      const caption = cleanText8(stat.querySelector(".uom-stat__text"));
      if (!figure && !caption) return;
      const cell = [];
      if (figure) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = figure;
        p.append(strong);
        cell.push(p);
      }
      if (caption) cell.push(para(caption, document2));
      rows.push([cell]);
    });
    return rows;
  }
  function parse14(element, { document: document2 }) {
    if (element.querySelector(".uom-stat")) {
      const rows = landingStatRows(element, document2);
      if (!rows.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["stat"], cells: rows }));
      return;
    }
    const cells = statRows(element, document2);
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["stat"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-chips.js
  function cleanText9(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function landingChip(li, document2) {
    const a = li.querySelector("a[href]");
    const name = cleanText9(li.querySelector(".card-course__name") || a || li);
    if (!name) return null;
    const p = document2.createElement("p");
    if (a) {
      const link = document2.createElement("a");
      link.href = a.getAttribute("href").trim();
      link.textContent = name;
      p.append(link);
    } else p.textContent = name;
    const cell = [p];
    const type = cleanText9(li.querySelector(".card-course__type"));
    if (type) {
      const t = document2.createElement("p");
      t.textContent = type;
      cell.push(t);
    }
    return [cell];
  }
  function parse15(element, { document: document2, template }) {
    if (template === "section-landing") {
      let lis = [...element.querySelectorAll(":scope > li")];
      if (!lis.length) lis = [...element.querySelectorAll("li")];
      const rows = lis.map((li) => landingChip(li, document2)).filter(Boolean);
      if (!rows.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["chips"], cells: rows }));
      return;
    }
    let items = [...element.querySelectorAll(":scope > li")];
    if (!items.length) items = [...element.querySelectorAll(".card-course-list__item, li")];
    const cells = [];
    items.forEach((li) => {
      const a = li.querySelector("a[href]");
      const text7 = cleanText9(li.querySelector(".card-course__name") || a || li);
      if (!text7) return;
      const p = document2.createElement("p");
      if (a) {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href").trim();
        link.textContent = text7;
        p.append(link);
      } else {
        p.textContent = text7;
      }
      cells.push([p]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["chips"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-link-list.js
  function clean7(t) {
    return (t || "").replace(/​/g, "").replace(/\s+/g, " ").trim();
  }
  function parse16(element, { document: document2 }) {
    let items = [...element.querySelectorAll(".sublink-menu__item")];
    if (!items.length) items = [...element.querySelectorAll("li")];
    const cells = [];
    items.forEach((item) => {
      const a = item.querySelector("a[href]");
      const label = clean7((item.querySelector("a > div, a > span") || a || item).textContent);
      if (!label) return;
      const p = document2.createElement("p");
      if (a) {
        const link = document2.createElement("a");
        link.href = a.getAttribute("href").trim();
        link.textContent = label;
        p.append(link);
      } else {
        p.textContent = label;
      }
      cells.push([p]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["link-list"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/video.js
  function cleanText10(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function videoFrom(src) {
    if (!src) return null;
    let url;
    try {
      url = new URL(src, "https://study.unimelb.edu.au/");
    } catch (e) {
      return null;
    }
    if (/embedly\.com$/.test(url.hostname)) {
      const inner = url.searchParams.get("src") || url.searchParams.get("url");
      return inner ? videoFrom(inner) : null;
    }
    const host = url.hostname.replace(/^www\./, "");
    if (/youtube(-nocookie)?\.com$/.test(host)) {
      const id = url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : url.searchParams.get("v");
      if (!id) return null;
      return { href: `https://www.youtube.com/watch?v=${id}`, poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
    }
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? { href: `https://www.youtube.com/watch?v=${id}`, poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } : null;
    }
    if (/vimeo\.com$/.test(host)) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? { href: `https://vimeo.com/${id}`, poster: null } : null;
    }
    return null;
  }
  function parse17(element, { document: document2 }) {
    const iframes = [...element.matches("iframe") ? [element] : element.querySelectorAll("iframe")];
    const cells = [];
    iframes.forEach((iframe) => {
      const v = videoFrom(iframe.getAttribute("src") || iframe.getAttribute("data-src"));
      if (!v) return;
      const link = document2.createElement("a");
      link.href = v.href;
      link.textContent = (iframe.getAttribute("title") || "").replace(/\s+/g, " ").trim() || v.href;
      const p = document2.createElement("p");
      p.append(link);
      const row = [[p]];
      if (v.poster) {
        const img = document2.createElement("img");
        img.src = v.poster;
        img.alt = (iframe.getAttribute("title") || "").trim();
        row.push([img]);
      }
      const caption = cleanText10(element.querySelector("figcaption"));
      if (caption) {
        const cp = document2.createElement("p");
        cp.textContent = caption;
        if (!v.poster) row.push("");
        row.push([cp]);
      }
      cells.push(row);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const before = [];
    const after = [];
    let seen = false;
    let cur = document2.createElement("p");
    const flush = () => {
      if (cleanText10(cur)) (seen ? after : before).push(cur);
      cur = document2.createElement("p");
    };
    [...element.childNodes].forEach((n) => {
      if (n.nodeType === 8) return;
      if (n.nodeType === 1 && (n.tagName === "IFRAME" || n.querySelector("iframe"))) {
        flush();
        seen = true;
        return;
      }
      if (n.nodeType === 1 && n.tagName === "FIGCAPTION") return;
      if (n.nodeName === "BR") return;
      if (n.nodeType === 1 && /^(P|H[1-6]|UL|OL|BLOCKQUOTE|DIV)$/.test(n.tagName)) {
        flush();
        if (cleanText10(n)) (seen ? after : before).push(n);
        return;
      }
      cur.append(n);
    });
    flush();
    const width = Math.max(...cells.map((r) => r.length));
    cells.forEach((r) => {
      while (r.length < width) r.push("");
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Video", cells });
    element.replaceWith(...before, block, ...after);
  }

  // tools/importer/parsers/video-shorts.js
  function clean8(t) {
    return (t || "").replace(/​/g, "").replace(/\s+/g, " ").trim();
  }
  function text4(el) {
    return clean8(el ? el.textContent : "");
  }
  function watchUrl(src) {
    if (!src) return "";
    let u;
    try {
      u = new URL(src.trim(), "https://www.youtube.com/");
    } catch (e) {
      return "";
    }
    const host = u.hostname.replace(/^www\./, "");
    if (/youtube(-nocookie)?\.com$/.test(host)) {
      const id = u.pathname.startsWith("/embed/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
      return id ? `https://www.youtube.com/watch?v=${id}` : "";
    }
    if (host === "youtu.be") return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
    if (/vimeo\.com$/.test(host)) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://vimeo.com/${id}` : "";
    }
    return "";
  }
  function para2(t, document2) {
    const p = document2.createElement("p");
    p.textContent = t;
    return p;
  }
  function parse18(element, { document: document2 }) {
    let items = [...element.querySelectorAll(".card-portrait")];
    if (!items.length) items = [element];
    const cells = [];
    const leftovers = [];
    items.forEach((item) => {
      const title = text4(item.querySelector(".card-portrait__title, h3, h4"));
      const cite = text4(item.querySelector("cite, .card-portrait__description"));
      const root = item.querySelector("[data-excat-video-src]") || (item.hasAttribute("data-excat-video-src") ? item : null);
      const iframe = item.querySelector("iframe");
      const href = watchUrl(root && root.getAttribute("data-excat-video-src") || iframe && iframe.getAttribute("src"));
      const duration = text4(item.querySelector(".video__duration"));
      if (!href) {
        console.warn(`[video-shorts] video-url-missing: ${title || cite || "(untitled)"}`);
        if (title) {
          const h = document2.createElement("h3");
          h.textContent = title;
          leftovers.push(h);
        }
        if (cite) leftovers.push(para2(cite, document2));
        return;
      }
      const a = document2.createElement("a");
      a.href = href;
      a.textContent = title || cite || href;
      const link = document2.createElement("p");
      link.append(a);
      const caption = [];
      if (title) caption.push(para2(title, document2));
      if (cite) caption.push(para2(cite, document2));
      if (duration) caption.push(para2(duration, document2));
      cells.push([[link], caption.length ? caption : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...leftovers);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Video", variants: ["shorts"], cells });
    element.replaceWith(block, ...leftovers);
  }

  // tools/importer/parsers/video-split.js
  function clean9(t) {
    return (t || "").replace(/​/g, "").replace(/\s+/g, " ").trim();
  }
  function text5(el) {
    return clean9(el ? el.textContent : "");
  }
  function watchUrl2(src) {
    if (!src) return "";
    let u;
    try {
      u = new URL(src.trim(), "https://www.youtube.com/");
    } catch (e) {
      return "";
    }
    const host = u.hostname.replace(/^www\./, "");
    if (/youtube(-nocookie)?\.com$/.test(host)) {
      const id = u.pathname.startsWith("/embed/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
      return id ? `https://www.youtube.com/watch?v=${id}` : "";
    }
    if (host === "youtu.be") return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
    if (/vimeo\.com$/.test(host)) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://vimeo.com/${id}` : "";
    }
    return /\.mp4(\?|$)/i.test(u.pathname) ? u.href : "";
  }
  function videoInfo(root) {
    const iframe = root.matches("iframe") ? root : root.querySelector("iframe");
    const src = root.getAttribute("data-excat-video-src") || (root.querySelector("[data-excat-video-src]") || { getAttribute: () => "" }).getAttribute("data-excat-video-src") || (iframe ? iframe.getAttribute("src") : "");
    const href = watchUrl2(src);
    const posterImg = root.querySelector('.uom-video-overlay__poster img, .video__img img, img:not([src^="data:"]):not([src^="blob:"])');
    let poster = posterImg ? posterImg.getAttribute("src") || "" : "";
    if (/^(data|blob):/.test(poster)) poster = "";
    const btn = root.querySelector("button[aria-label]");
    const label = btn ? clean9(btn.getAttribute("aria-label")) : "";
    const m = /^Play\s+(.*?)\s+((?:\d+h\s*)?(?:\d+m\s*)?(?:\d+s)?)\s+video$/i.exec(label);
    const title = clean9((root.querySelector(".uom-video-overlay__poster") || { getAttribute: () => "" }).getAttribute("title")) || text5(root.querySelector(".video__label")) || m && clean9(m[1]) || clean9(posterImg && posterImg.getAttribute("alt")) || clean9(iframe && iframe.getAttribute("title"));
    const duration = text5(root.querySelector(".video__duration")) || (m ? clean9(m[2]) : "");
    const alt = clean9(posterImg && posterImg.getAttribute("alt")) || title;
    return { href, poster, title, duration, alt };
  }
  function videoRow(info, document2) {
    if (!info.href) return null;
    const a = document2.createElement("a");
    a.href = info.href;
    a.textContent = info.title || info.href;
    const p = document2.createElement("p");
    p.append(a);
    const row = [[p]];
    if (info.poster) {
      const img = document2.createElement("img");
      img.src = info.poster;
      img.alt = info.alt || "";
      row.push([img]);
    } else row.push("");
    const caption = [];
    if (info.title) {
      const t = document2.createElement("p");
      t.textContent = info.title;
      caption.push(t);
    }
    if (info.duration) {
      const d = document2.createElement("p");
      d.textContent = info.duration;
      caption.push(d);
    }
    row.push(caption.length ? caption : "");
    return row;
  }
  function ctaParagraph4(a, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = text5(a);
    const p = document2.createElement("p");
    const cls = a.className || "";
    if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
    else {
      const wrap = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      wrap.append(link);
      p.append(wrap);
    }
    return p;
  }
  function intro(left, document2) {
    const out = [];
    if (!left) return out;
    [...left.children].forEach((el) => {
      if (el.matches("a[href]")) {
        if (text5(el)) out.push(ctaParagraph4(el, document2));
        return;
      }
      if (!text5(el)) return;
      if (/^H[1-6]$/.test(el.tagName)) {
        const h = document2.createElement(el.tagName.toLowerCase());
        h.textContent = text5(el);
        out.push(h);
        return;
      }
      const btn = el.querySelector('a.btn, a[class*="btn--"]');
      if (btn && text5(el) === text5(btn)) {
        out.push(ctaParagraph4(btn, document2));
        return;
      }
      [...el.attributes].forEach((a) => el.removeAttribute(a.name));
      el.querySelectorAll("*").forEach((c) => [...c.attributes].forEach((a) => {
        if (a.name !== "href") c.removeAttribute(a.name);
      }));
      out.push(el);
    });
    return out;
  }
  function parse19(element, { document: document2 }) {
    const left = element.querySelector(":scope > .section-alt__left");
    const right = element.querySelector(":scope > .section-alt__right") || element;
    const roots = [...right.querySelectorAll("[data-excat-video-src], .uom-video, div.video")].filter((r, i, all) => !all.some((o) => o !== r && o.contains(r)));
    if (!roots.length) right.querySelectorAll("iframe").forEach((f) => roots.push(f));
    const cells = [];
    const introCell = intro(left, document2);
    if (introCell.length) cells.push([introCell, "", ""]);
    const leftovers = [];
    roots.forEach((root) => {
      const info = videoInfo(root);
      const row = videoRow(info, document2);
      if (row) cells.push(row);
      else {
        console.warn(`[video-split] video-url-missing: ${info.title || "(untitled)"}`);
        if (info.poster) {
          const img = document2.createElement("img");
          img.src = info.poster;
          img.alt = info.alt || "";
          const p = document2.createElement("p");
          p.append(img);
          leftovers.push(p);
        }
      }
    });
    if (cells.length < 1 || !roots.some((r) => videoInfo(r).href)) {
      element.replaceWith(...introCell, ...leftovers);
      return;
    }
    const plain = roots.length > 0 && roots.every((r) => r.matches(".uom-video") || !!r.querySelector(".uom-video-overlay"));
    const block = WebImporter.Blocks.createBlock(document2, { name: "Video", variants: plain ? ["split", "plain"] : ["split"], cells });
    element.replaceWith(block, ...leftovers);
  }

  // tools/importer/parsers/video-library.js
  var LOG = "[video-library]";
  var DEFAULT_ID_PATTERN = "^[A-Za-z0-9_-]{11}$";
  function readData(document2) {
    const tpl = document2.querySelector("template#excat-video-data");
    if (!tpl) return null;
    const raw = (tpl.content && tpl.content.textContent || tpl.textContent || "").trim();
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch (e) {
      console.warn(`${LOG} template#excat-video-data is not valid JSON: ${e.message}`);
      return null;
    }
  }
  function youtubeIdOf(entry) {
    const src = String(entry.src || entry.link || "").trim();
    const m = src.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([^/?#&]+)/);
    return m ? m[1] : "";
  }
  function normaliseDuration(d) {
    const t = String(d || "").trim();
    return /^\d{1,2}(?:[.:]\d{2}){1,2}$/.test(t) ? t.replace(/\./g, ":") : t;
  }
  function list(v) {
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    return v ? [String(v).trim()].filter(Boolean) : [];
  }
  function cleanVideos(data, rules = {}) {
    const idPattern = new RegExp(rules.youtubeIdPattern || DEFAULT_ID_PATTERN);
    const unavailable = rules.unavailableYoutubeIds || {};
    const topicMap = rules.topicMap || {};
    const levelMap = rules.studyLevelMap || {};
    const stats = {
      entries: data.length,
      unavailable: 0,
      truncated: 0,
      duplicate: 0,
      topicsMapped: 0,
      durationsNormalised: 0,
      videos: 0
    };
    const seen = /* @__PURE__ */ new Map();
    const videos = [];
    data.forEach((entry) => {
      const id = youtubeIdOf(entry);
      const title = String(entry.title || "").replace(/\s+/g, " ").trim();
      if (!id || !idPattern.test(id)) {
        stats.truncated += 1;
        return;
      }
      if (Object.prototype.hasOwnProperty.call(unavailable, id)) {
        stats.unavailable += 1;
        return;
      }
      const topics = [...new Set(list(entry.disciplines).map((t) => {
        if (Object.prototype.hasOwnProperty.call(topicMap, t)) {
          stats.topicsMapped += 1;
          return topicMap[t];
        }
        return t;
      }))];
      const levels = [...new Set(list(entry.study_levels).map((l) => levelMap[l] || l))];
      const key = `${id}\0${title}`;
      if (seen.has(key)) {
        const first = seen.get(key);
        first.topics = [.../* @__PURE__ */ new Set([...first.topics, ...topics])];
        first.levels = [.../* @__PURE__ */ new Set([...first.levels, ...levels])];
        stats.duplicate += 1;
        return;
      }
      const duration = normaliseDuration(entry.duration);
      if (duration !== String(entry.duration || "").trim()) stats.durationsNormalised += 1;
      const video = {
        id,
        title,
        levels,
        topics,
        duration,
        type: String(entry.type || "").trim(),
        thumb: String(entry.img_url || "").trim()
      };
      seen.set(key, video);
      videos.push(video);
    });
    stats.videos = videos.length;
    return { videos, stats };
  }
  function parse20(element, { document: document2, onDemandCleanup }) {
    const data = readData(document2);
    const { videos, stats } = data ? cleanVideos(data, onDemandCleanup || {}) : { videos: [], stats: null };
    if (!videos.length) {
      console.warn(`${LOG} video-data-missing: no template#excat-video-data entries; region removed`);
      element.remove();
      return;
    }
    const types = [...new Set(videos.map((v) => v.type).filter(Boolean))];
    if (types.length > 1) console.warn(`${LOG} ${types.length} video types (${types.join(", ")}): the block shows one group`);
    console.log(`${LOG} ${stats.entries} entries -> ${stats.videos} videos (dropped: unavailable ${stats.unavailable}, truncated ${stats.truncated}, duplicate ${stats.duplicate}; topics mapped ${stats.topicsMapped}; durations normalised ${stats.durationsNormalised})`);
    const cells = [
      ["Heading", types[0] || "On-demand"],
      ["Thumbnail", "Title", "Video", "Study level", "Topic", "Duration"]
    ];
    videos.forEach((v) => {
      let thumb = "";
      if (v.thumb) {
        thumb = document2.createElement("img");
        thumb.setAttribute("src", v.thumb);
        thumb.setAttribute("alt", "");
      }
      const href = `https://www.youtube.com/watch?v=${v.id}`;
      const a = document2.createElement("a");
      a.setAttribute("href", href);
      a.textContent = href;
      cells.push([thumb, v.title, a, v.levels.join("; "), v.topics.join("; "), v.duration]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "Video library", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  function clean10(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function parseCourseQuote(root, document2) {
    const cites = [...root.querySelectorAll("cite")];
    cites.forEach((c) => c.remove());
    const paras = [];
    let loose = document2.createElement("p");
    const flush = () => {
      if (clean10(loose)) paras.push(loose);
      loose = document2.createElement("p");
    };
    [...root.childNodes].forEach((n) => {
      if (n.nodeType === 8) return;
      if (n.nodeType === 1 && /^(P|DIV|UL|OL)$/.test(n.tagName)) {
        flush();
        if (!clean10(n)) return;
        if (n.tagName === "DIV") {
          const p = document2.createElement("p");
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
    const text7 = [...paras];
    cites.forEach((c) => {
      if (!clean10(c)) return;
      const p = document2.createElement("p");
      c.querySelectorAll("br").forEach((b) => b.remove());
      p.append(...c.childNodes);
      const first = p.firstChild;
      if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s*[—–-]?\s*/, "");
      p.prepend("\u2014 ");
      text7.push(p);
    });
    return text7;
  }
  function bgPortrait(holder, document2) {
    if (!holder) return null;
    const img = holder.querySelector("img");
    let src = (holder.getAttribute("data-excat-bg") || "").trim();
    if (!src && img) src = (img.getAttribute("src") || "").trim();
    if (!src || /^(data|blob):/.test(src)) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = (holder.getAttribute("aria-label") || img && img.getAttribute("alt") || "").trim();
    return out;
  }
  function inlinePara(el, document2) {
    const p = document2.createElement("p");
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 1 && n.matches("a[href]") && clean10(n)) {
        const a = document2.createElement("a");
        a.href = (n.getAttribute("href") || "").trim();
        a.textContent = clean10(n);
        p.append(a);
      } else if (n.nodeType === 1 && n.querySelector("a[href]")) {
        p.append(...inlinePara(n, document2).childNodes);
      } else {
        p.append(document2.createTextNode((n.textContent || "").replace(/\s+/g, " ")));
      }
    });
    if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, "");
    if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, "");
    return p;
  }
  function parseCardFocus(element, document2) {
    const para3 = (t) => {
      const p = document2.createElement("p");
      p.textContent = t;
      return p;
    };
    const text7 = [];
    let holder = null;
    let textEl = null;
    const alumni = element.querySelector(".alumni");
    if (alumni) {
      const q = clean10(alumni.querySelector(".alumni__short-text"));
      if (q) text7.push(para3(q));
      const name = clean10(alumni.querySelector(".alumni__name"));
      if (name) text7.push(para3(`\u2014 ${name}`));
      const roleEl = alumni.querySelector(".alumni__title");
      if (clean10(roleEl)) text7.push(inlinePara(roleEl, document2));
      holder = alumni.querySelector(".alumni__img");
      textEl = alumni.querySelector(".alumni__info");
    } else {
      const bq = element.querySelector("blockquote") || element;
      bq.querySelectorAll("p").forEach((p) => {
        if (!p.closest("cite") && clean10(p)) text7.push(para3(clean10(p)));
      });
      const name = clean10(bq.querySelector("cite"));
      if (name) text7.push(para3(`\u2014 ${name.replace(/^[—–-]\s*/, "")}`));
      const sub = clean10(bq.querySelector(".block-quotation__sub-cite"));
      if (sub) text7.push(para3(sub));
      holder = element.querySelector(".testimonials__img");
      textEl = element.querySelector(".testimonials__info") || bq;
    }
    if (!text7.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const image = bgPortrait(holder, document2);
    const imageFirst = !!(image && textEl && holder.compareDocumentPosition(textEl) & 4);
    let row = [text7];
    if (image) row = imageFirst ? [[image], text7] : [text7, [image]];
    element.replaceWith(WebImporter.Blocks.createBlock(document2, alumni ? { name: "Quote", variants: ["alumni"], cells: [row] } : { name: "Quote", cells: [row] }));
  }
  function parse21(element, { document: document2 }) {
    if (element.matches(".card-focus") && element.querySelector(".testimonials, .alumni")) {
      parseCardFocus(element, document2);
      return;
    }
    const root = element.matches("blockquote") ? element : element.querySelector("blockquote") || element;
    if (element.closest('.course-content, .course-section__main, [data-test$="-page"]')) {
      const text8 = parseCourseQuote(root, document2);
      if (!text8.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "Quote", cells: [[text8]] });
      element.replaceWith(block2);
      return;
    }
    const quoteParas = [...root.querySelectorAll("p")].filter((p) => !p.closest("cite") && clean10(p)).map((p) => {
      const out = document2.createElement("p");
      out.textContent = clean10(p);
      return out;
    });
    const citeEl = root.querySelector('cite, .testimonials-alt__name, [class*="__name"]');
    let attribution = null;
    if (citeEl && clean10(citeEl)) {
      attribution = document2.createElement("p");
      attribution.textContent = `\u2014 ${clean10(citeEl).replace(/^[—–-]\s*/, "")}`;
    }
    let image = null;
    const img = root.querySelector(".testimonials-alt__img img, .progressive-image img, img");
    if (img) {
      let src = img.getAttribute("src") || "";
      const dataSrc = img.getAttribute("data-src");
      const inline = (s) => !s || s.startsWith("data:") || s.startsWith("blob:");
      if (inline(src) && dataSrc) src = dataSrc;
      if (!inline(src)) {
        image = document2.createElement("img");
        image.src = src;
        image.alt = img.getAttribute("alt") || "";
      }
    }
    if (!quoteParas.length && !attribution) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const text7 = [...quoteParas];
    if (attribution) text7.push(attribution);
    const row = [text7];
    if (image) row.push([image]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Quote", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function cleanText11(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs5(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      if (!el.attributes) return;
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|headers|data-.*|aria-.*|paraid|paraeid)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
  }
  function cellContent(cell, document2, bold) {
    const hasBlocks = [...cell.children].some((c) => /^(P|UL|OL|DIV|H[1-6]|TABLE)$/.test(c.tagName));
    if (hasBlocks) {
      stripAttrs5(cell);
      return [...cell.childNodes].filter((n) => n.nodeType === 1 || cleanText11(n));
    }
    const p = document2.createElement("p");
    p.innerHTML = cell.innerHTML.replace(/\s+/g, " ").trim();
    stripAttrs5(p);
    if (!cleanText11(p) && !p.querySelector("img")) return "";
    if (bold && !(p.children.length === 1 && /^(STRONG|B)$/.test(p.firstElementChild.tagName) && cleanText11(p) === cleanText11(p.firstElementChild))) {
      const strong = document2.createElement("strong");
      strong.append(...p.childNodes);
      p.append(strong);
    }
    return [p];
  }
  function tableBlock2(table, document2) {
    const rows = [...table.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr")];
    const cells = [];
    rows.forEach((tr) => {
      const highlighted = /table__row--info/.test(tr.className);
      const row = [];
      [...tr.children].filter((c) => /^(TD|TH)$/.test(c.tagName)).forEach((c) => {
        row.push(cellContent(c, document2, c.tagName === "TH" || highlighted));
        const span = parseInt(c.getAttribute("colspan") || "1", 10);
        for (let i = 1; i < span && i < 20; i += 1) row.push("");
      });
      if (row.some((c) => c && (c.length ? true : false))) cells.push(row);
    });
    if (!cells.length) return null;
    const width = Math.max(...cells.map((r) => r.length));
    cells.forEach((r) => {
      while (r.length < width) r.push("");
    });
    return WebImporter.Blocks.createBlock(document2, { name: "Table", cells });
  }
  function statBlock(container, document2) {
    const cards = [...container.querySelectorAll(".info-card")];
    const cells = [];
    cards.forEach((card) => {
      const title = cleanText11(card.querySelector(".info-card__title"));
      const value = cleanText11(card.querySelector(".info-card__value"));
      const label = cleanText11(card.querySelector(".info-card__label"));
      const desc = card.querySelector(".info-card__desc");
      if (!title && !value) return;
      const stat = [];
      if (title) {
        const p = document2.createElement("p");
        p.textContent = title;
        stat.push(p);
      }
      if (value) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = value;
        p.append(strong);
        stat.push(p);
      }
      if (label) {
        const p = document2.createElement("p");
        p.textContent = label;
        stat.push(p);
      }
      let description = "";
      if (desc && cleanText11(desc)) {
        const p = document2.createElement("p");
        p.innerHTML = desc.innerHTML.trim();
        stripAttrs5(p);
        description = [p];
      }
      cells.push([stat, description]);
    });
    if (!cells.length) return null;
    return WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["stat"], cells });
  }
  function panelRoot(panel2) {
    let root = panel2;
    while (root.children.length === 1 && root.firstElementChild.tagName === "DIV" && !cleanText11({ textContent: [...root.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("") })) {
      root = root.firstElementChild;
    }
    return root;
  }
  function answerContent(root, document2) {
    const out = [];
    [...root.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        if (cleanText11(node)) {
          const p = document2.createElement("p");
          p.textContent = cleanText11(node);
          out.push(p);
        }
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node;
      if (el.matches("table")) {
        const t = tableBlock2(el, document2);
        if (t) out.push(t);
        return;
      }
      if (el.matches(".entry-reqs--language-reqs")) {
        const s = statBlock(el, document2);
        if (s) out.push(s);
        return;
      }
      if (el.matches("ul.toggleblock")) {
        const a = accordionBlock([el], document2);
        if (a) out.push(a);
        return;
      }
      if (el.matches("small")) {
        if (!cleanText11(el)) return;
        const p = document2.createElement("p");
        p.innerHTML = el.innerHTML.trim();
        stripAttrs5(p);
        out.push(p);
        return;
      }
      if (el.tagName === "DIV") {
        if (el.querySelector("table, .entry-reqs--language-reqs, ul.toggleblock, p, ul, ol, h1, h2, h3, h4, h5, h6")) {
          out.push(...answerContent(el, document2));
        } else if (cleanText11(el)) {
          const p = document2.createElement("p");
          p.innerHTML = el.innerHTML.trim();
          stripAttrs5(p);
          out.push(p);
        }
        return;
      }
      if (!cleanText11(el) && !el.querySelector("img, iframe")) return;
      if (el.querySelector("table, ul.toggleblock")) {
        out.push(...answerContent(el, document2));
        return;
      }
      stripAttrs5(el);
      out.push(el);
    });
    return out;
  }
  function accordionBlock(uls, document2) {
    const cells = [];
    uls.forEach((ul) => {
      const trigger = ul.querySelector(':scope > [data-testid="toggleblock-trigger"], :scope > .toggleblock__default');
      const panel2 = ul.querySelector(':scope > [data-testid="toggleblock-panel"], :scope > .toggleblock__hidden');
      const label = cleanText11(trigger && trigger.querySelector(".accordion__title") || trigger);
      if (!label) return;
      const answer = panel2 ? answerContent(panelRoot(panel2), document2) : [];
      cells.push([label, answer.length ? answer : ""]);
    });
    if (!cells.length) return null;
    return WebImporter.Blocks.createBlock(document2, { name: "Accordion", cells });
  }
  function landingButtons(root, document2) {
    root.querySelectorAll('a.btn, a[class*="btn--"]').forEach((a) => {
      const cls = a.className || "";
      const link = document2.createElement("a");
      link.href = (a.getAttribute("href") || "").trim();
      link.textContent = cleanText11(a) || (a.getAttribute("title") || "").trim();
      let node = link;
      if (!/btn--text/.test(cls) && /\bbtn\b/.test(cls)) {
        node = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
        node.append(link);
      }
      const parent = a.parentElement;
      if (parent && parent.tagName === "P") a.replaceWith(node);
      else {
        const p = document2.createElement("p");
        p.append(node);
        a.replaceWith(p);
      }
    });
  }
  function parseLandingAccordion(element, document2) {
    const cells = [];
    const left = element.querySelector(":scope > .section-alt__left");
    if (left) {
      const intro2 = [];
      [...left.children].forEach((c) => {
        if (!cleanText11(c) && !c.querySelector("img")) return;
        if (/^H[1-6]$/.test(c.tagName)) {
          const h = document2.createElement(c.tagName.toLowerCase());
          h.textContent = cleanText11(c);
          intro2.push(h);
          return;
        }
        landingButtons(c, document2);
        if (c.matches("a")) {
          intro2.push(...answerContent({ childNodes: [c] }, document2));
          return;
        }
        intro2.push(...answerContent({ childNodes: [c] }, document2));
      });
      if (intro2.length) cells.push([intro2]);
    }
    const items = [...element.querySelectorAll("details.uom-accordion-item")].filter((d) => !d.parentElement.closest("details.uom-accordion-item"));
    items.forEach((d) => {
      const label = cleanText11(d.querySelector(":scope > summary .uom-title-6") || d.querySelector(":scope > summary"));
      if (!label) return;
      const section = d.querySelector(":scope > section, :scope > .uom-accordion-item__section") || d;
      const root = section.querySelector(":scope > .uom-accordion-item__section-content") || section;
      if (root === d) d.querySelector(":scope > summary") && d.querySelector(":scope > summary").remove();
      landingButtons(root, document2);
      const answer = answerContent(root, document2);
      cells.push([label, answer.length ? answer : ""]);
    });
    if (!items.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Accordion", cells });
    element.replaceWith(block);
  }
  function parse22(element, { document: document2 }) {
    if (element.querySelector("details.uom-accordion-item") || element.matches(".uom-accordion")) {
      parseLandingAccordion(element, document2);
      return;
    }
    const uls = element.matches("ul.toggleblock") ? [element] : [...element.querySelectorAll(":scope > ul.toggleblock")];
    if (!uls.length) uls.push(...element.querySelectorAll("ul.toggleblock"));
    const before = [];
    const after = [];
    if (!element.matches("ul.toggleblock")) {
      let seen = false;
      [...element.children].forEach((child) => {
        if (uls.includes(child)) {
          seen = true;
          return;
        }
        if (!cleanText11(child) && !child.querySelector("img, iframe")) return;
        (seen ? after : before).push(child);
      });
    }
    const block = accordionBlock(uls.filter((u) => !u.parentElement.closest("ul.toggleblock")), document2);
    if (!block) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(...before, block, ...after);
  }

  // tools/importer/parsers/callout-photo.js
  function clean11(t) {
    return (t || "").replace(/​/g, "").replace(/\s+/g, " ").trim();
  }
  function text6(el) {
    return clean11(el ? el.textContent : "");
  }
  function ctaParagraph5(a, document2) {
    const link = document2.createElement("a");
    link.href = (a.getAttribute("href") || "").trim();
    link.textContent = text6(a);
    const p = document2.createElement("p");
    const cls = a.className || "";
    if (/btn--text/.test(cls) || !/\bbtn\b/.test(cls)) p.append(link);
    else {
      const wrap = document2.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      wrap.append(link);
      p.append(wrap);
    }
    return p;
  }
  function backgroundImage(element, document2) {
    const img = element.querySelector(":scope > img") || element.querySelector(":scope > picture img");
    let src = img ? img.getAttribute("src") || "" : "";
    let alt = img ? img.getAttribute("alt") || "" : "";
    if (!src || /^(data|blob):/.test(src)) {
      const bg = element.hasAttribute("data-excat-bg") ? element : element.querySelector(":scope > [data-excat-bg]");
      if (bg) {
        src = bg.getAttribute("data-excat-bg");
        alt = bg.getAttribute("aria-label") || alt;
      }
    }
    if (!src || /^(data|blob):/.test(src)) {
      const m = (element.getAttribute("style") || "").match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      src = m ? m[2] : "";
    }
    if (!src || /^(data|blob):/.test(src) || /^none$/i.test(src)) return null;
    const out = document2.createElement("img");
    out.src = src.trim();
    out.alt = clean11(alt);
    return out;
  }
  function parse23(element, { document: document2 }) {
    const card = element.querySelector(".card-focus") || element.querySelector(".section__inner") || element;
    const panel2 = [];
    [...card.children].forEach((el) => {
      if (el.matches("a[href]")) {
        if (text6(el)) panel2.push(ctaParagraph5(el, document2));
        return;
      }
      if (!text6(el)) return;
      if (/^H[1-6]$/.test(el.tagName)) {
        const h = document2.createElement(el.tagName.toLowerCase());
        h.textContent = text6(el);
        panel2.push(h);
        return;
      }
      const btns = [...el.querySelectorAll('a.btn, a[class*="btn--"]')];
      if (btns.length && text6(el) === btns.map(text6).join(" ")) {
        btns.forEach((b) => panel2.push(ctaParagraph5(b, document2)));
        return;
      }
      [...el.attributes].forEach((a) => el.removeAttribute(a.name));
      panel2.push(el);
    });
    if (!panel2.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const image = backgroundImage(element, document2);
    const cells = [image ? [[image], panel2] : [panel2]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Callout", variants: ["photo"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/search.js
  var DEFAULT_ORIGIN = "https://study.unimelb.edu.au";
  var DEFAULT_ACTION = "/find/";
  var DEFAULT_PARAM = "query";
  var DEFAULT_PLACEHOLDER = "Find a course, study area or major";
  function parse24(element, { document: document2, params }) {
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
    const link = document2.createElement("a");
    link.href = url.toString();
    link.textContent = placeholder;
    const p = document2.createElement("p");
    p.append(link);
    const left = element.querySelector(":scope > .section-alt__left");
    const heading = left && left.querySelector("h1, h2, h3, h4");
    const cell = [];
    if (heading && heading.textContent.trim()) {
      const h = document2.createElement("h2");
      h.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      cell.push(h);
    }
    cell.push(p);
    const cells = [cell];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Search", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table.js
  function cleanText12(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs6(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      if (!el.attributes) return;
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|headers|width|height|valign|align|data-.*|aria-.*)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    return root;
  }
  function cellContent2(cell, document2, bold) {
    const hasBlocks = [...cell.children].some((c) => /^(P|UL|OL|DIV|H[1-6]|TABLE)$/.test(c.tagName));
    if (hasBlocks) {
      stripAttrs6(cell);
      return [...cell.childNodes].filter((n) => n.nodeType === 1 || cleanText12(n));
    }
    const p = document2.createElement("p");
    p.innerHTML = cell.innerHTML.replace(/\s+/g, " ").trim();
    stripAttrs6(p);
    if (!cleanText12(p) && !p.querySelector("img")) return "";
    if (bold && !(p.children.length === 1 && /^(STRONG|B)$/.test(p.firstElementChild.tagName) && cleanText12(p) === cleanText12(p.firstElementChild))) {
      const strong = document2.createElement("strong");
      strong.append(...p.childNodes);
      p.append(strong);
    }
    return [p];
  }
  function parse25(element, { document: document2 }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rows = [...table.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr")];
    const cells = [];
    rows.forEach((tr) => {
      const highlighted = /table__row--info/.test(tr.className);
      const row = [];
      [...tr.children].filter((c) => /^(TD|TH)$/.test(c.tagName)).forEach((c) => {
        row.push(cellContent2(c, document2, c.tagName === "TH" || highlighted));
        const span = parseInt(c.getAttribute("colspan") || "1", 10);
        for (let i = 1; i < span && i < 20; i += 1) row.push("");
      });
      if (row.some((c) => c && c.length)) cells.push(row);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const width = Math.max(...cells.map((r) => r.length));
    cells.forEach((r) => {
      while (r.length < width) r.push("");
    });
    const before = [];
    const caption = table.querySelector(":scope > caption");
    if (caption && cleanText12(caption)) {
      const p = document2.createElement("p");
      p.textContent = cleanText12(caption);
      before.push(p);
    }
    const compact = /\btable--is-compacted\b/.test(table.className || "") && !table.closest('[data-test$="-page"]');
    const block = WebImporter.Blocks.createBlock(document2, compact ? { name: "Table", variants: ["compact"], cells } : { name: "Table", cells });
    element.replaceWith(...before, block);
  }

  // tools/importer/transformers/unimelb-landing-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var LOG2 = "[landing-cleanup]";
  var STUDY_ORIGIN = "https://study.unimelb.edu.au";
  var STUDY_HOST = /^https?:\/\/study\.unimelb\.edu\.au(?=[/?#]|$)/i;
  var FILE_HREF = /(?:\.(?:pdf|docx?|xlsx?|pptx?|zip)(?:[?#]|$))|\/__data\/assets\/(?:pdf_file|file|word_doc|excel_doc|powerpoint_doc)\//i;
  var ROOT = ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type)";
  var PICTOGRAM_HOLDERS = ".section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left";
  var HIDDEN_VARIANTS = "#main > .optimizely_experiment > span.optimizely_experiment__block:not(:first-of-type)";
  var DEFAULT_CHROME = [
    ".screen-reader-jump-to",
    "uom-ds-mega-menu",
    "uom-ds-font-loader-component",
    "#__nuxt header",
    "#ui > header",
    "#ui > nav.uom-breadcrumbs",
    'div.breadcrumbs-bar[data-test="breadcrumbs-bar"]',
    "footer.uom-page-footer",
    "#__tealiumGDPRecModal",
    ".tealium_privacy_prompt",
    "#teleports",
    'iframe[src*="optimizely"]',
    // "How can we help?": in #ui on 137 pages, in #main on 121
    ":is(#ui, #main) > section.uom-link-list-section",
    "dash-cart",
    "#main > div.stickyPanel",
    "#main div.in-page-nav-today",
    "#observerSensor",
    "#liveagent",
    HIDDEN_VARIANTS,
    "div.ct-inpagenav nav.in-page-navigation-v2__collapsed",
    "#main > link",
    "#main > meta",
    "#main style",
    "#main script",
    // empty anchor divs (after the anchor rewrite)
    "#main div[id]:not([class]):empty",
    "#main > div:not([class]):not([id]):empty",
    "#main > p[id]:empty",
    // empty live-feed listings (study-business, Instructional-Leadership-Spotlight-Series)
    // (the list is re-applied in afterTransform, when a parsed listing holds a block table instead)
    "div.ct-eventslisting:not(:has(li.event)):not(:has(table))",
    // decorative
    'img[src^="data:image/svg+xml"]:not(:is(.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left) img)',
    ".uom-link__icon",
    ".uom-icon",
    "span.screenreaders-only",
    ".sr-only",
    "span.togglerow__chevron",
    ".uom-video-controls",
    "#who-you-will-learn-from .page-short-course__profile-content > :empty",
    ".ct-textcolumnlayout .card-flat-list:not(:has(a, img, p, h3))",
    // non-authorable elements anywhere
    "script",
    "noscript",
    "style",
    "link"
  ];
  var DEFAULT_DROPS = [`${ROOT} > div.ct-focusboxpathfinder > img`];
  var DEFAULT_WIDGETS = [
    { section: "conversion-tool", selector: `${ROOT} > div.section:has(#conversion-tool-app)`, widget: "/widgets/grade-conversion-calculator.html" },
    { section: "course-listing", selector: `${ROOT} > div.CourseListing`, widget: "/widgets/online-course-listing.html", keep: ":scope > .content-block.bg-inverted" }
  ];
  var ANCHOR_SKIP = "#main > div.stickyPanel, #main div.in-page-nav-today, section.uom-link-list-section, dash-cart, #liveagent, nav.in-page-navigation-v2__collapsed";
  function toList(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      let nodes = [];
      try {
        nodes = root.querySelectorAll(sel);
      } catch (e) {
        nodes = [];
      }
      nodes.forEach((n) => {
        if (n.parentNode) n.remove();
      });
    });
  }
  function chromeList(template) {
    const fromTemplate = toList(template && template.chrome).filter((s) => !/^template\b/.test(s));
    return [.../* @__PURE__ */ new Set([...DEFAULT_CHROME, ...fromTemplate])];
  }
  function removeComments(root) {
    const doc = root.ownerDocument || root;
    const walker = doc.createTreeWalker(
      root,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
  }
  function unwrapOptimizely(root) {
    removeAll(root, [HIDDEN_VARIANTS]);
    root.querySelectorAll("#main > .optimizely_experiment").forEach((exp) => {
      const span = exp.querySelector(":scope > span.optimizely_experiment__block");
      if (span) exp.replaceWith(...span.childNodes);
      else if (!exp.textContent.trim() && !exp.querySelector("img, iframe")) exp.remove();
    });
  }
  function slugify2(text7) {
    return String(text7 || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^0-9a-z]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  function headingText(h) {
    const c = h.cloneNode(true);
    c.querySelectorAll("span.screenreaders-only, .sr-only, .uom-icon, svg, img").forEach((n) => n.remove());
    return c.textContent.replace(/\s+/g, " ").trim();
  }
  function pagePathOf(doc, payload) {
    const candidates = [
      payload && payload.params && payload.params.originalURL,
      (doc.querySelector('link[rel="canonical"]') || {}).href ? doc.querySelector('link[rel="canonical"]').getAttribute("href") : null,
      doc.querySelector('meta[property="og:url"]') ? doc.querySelector('meta[property="og:url"]').getAttribute("content") : null,
      payload && payload.url
    ];
    for (const raw of candidates) {
      if (!raw) continue;
      try {
        const u = new URL(String(raw).trim(), `${STUDY_ORIGIN}/`);
        if (/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && raw === (payload && payload.url) && candidates.some((c) => c && c !== raw)) continue;
        return u.pathname.replace(/\/+$/, "") || "/";
      } catch (e) {
      }
    }
    return null;
  }
  function findById(scope, doc, id) {
    if (!id) return null;
    const sel = `[id="${String(id).replace(/["\\]/g, "\\$&")}"]`;
    const pick = (root, s) => {
      let list2 = [];
      try {
        list2 = [...root.querySelectorAll(s)];
      } catch (e) {
        list2 = [];
      }
      return list2.find((e) => /^H[1-6]$/.test(e.tagName) && headingText(e)) || list2[0] || null;
    };
    let el = pick(scope, sel);
    if (!el && scope !== doc && doc) el = pick(doc, `#main ${sel}`);
    return el;
  }
  function targetHeading(target, mainRoot) {
    if (/^H[1-6]$/.test(target.tagName) && headingText(target)) return target;
    const inner = [...target.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((h) => headingText(h));
    if (inner) return inner;
    const all = [...mainRoot.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter((h) => !h.closest(ANCHOR_SKIP) && headingText(h));
    return all.find(
      (h) => target.compareDocumentPosition(h) & 4
      /* FOLLOWING */
    ) || null;
  }
  function rewriteAnchors(root, doc, path) {
    const mainRoot = root.matches && root.matches("#main") ? root : root.querySelector("#main") || root;
    const stats = { rewritten: 0, unresolved: 0 };
    mainRoot.querySelectorAll("a[href]").forEach((a) => {
      if (a.closest(ANCHOR_SKIP) && !a.closest("div.ct-inpagenav")) return;
      const href = a.getAttribute("href").trim();
      let frag = null;
      if (href.startsWith("#")) {
        frag = href.slice(1);
      } else if (path) {
        try {
          const u = new URL(href.startsWith("//") ? `https:${href}` : href, `${STUDY_ORIGIN}${path}`);
          if (u.origin === STUDY_ORIGIN && (u.pathname.replace(/\/+$/, "") || "/") === path && u.hash) frag = u.hash.slice(1);
        } catch (e) {
          frag = null;
        }
      }
      if (!frag) return;
      let id = frag;
      try {
        id = decodeURIComponent(frag);
      } catch (e) {
      }
      const target = findById(mainRoot, doc, id) || findById(mainRoot, doc, id.replace(/^navigation-/, ""));
      const heading = target ? targetHeading(target, mainRoot) : null;
      const slug = heading ? slugify2(headingText(heading)) : "";
      if (!slug) {
        stats.unresolved += 1;
        console.warn(`${LOG2} anchor unresolved, source href kept: ${href}`);
        return;
      }
      if (href !== `#${slug}`) {
        a.setAttribute("href", `#${slug}`);
        stats.rewritten += 1;
      }
    });
    return stats;
  }
  function fixLinks(root) {
    root.querySelectorAll("a").forEach((a) => {
      ["target", "rel"].forEach((attr) => a.removeAttribute(attr));
      if (a.getAttribute("tabindex") === "-1") a.removeAttribute("tabindex");
      if (!a.hasAttribute("href")) return;
      const raw = a.getAttribute("href");
      let href = raw.trim();
      if (href.startsWith("//")) href = `https:${href}`;
      if (STUDY_HOST.test(href) && !FILE_HREF.test(href)) {
        href = href.replace(STUDY_HOST, "") || "/";
      } else if (/^http:\/\/study\.unimelb\.edu\.au/i.test(href)) {
        href = href.replace(/^http:/i, "https:");
      }
      if (href.startsWith("/") && !href.startsWith("//")) {
        href = href.replace(/^(\/[^?#]*?)\/+(?=[?#]|$)/, "$1");
      }
      if (href !== raw) a.setAttribute("href", href);
    });
  }
  var INLINE_TAGS = /^(A|ABBR|B|BDI|BDO|BR|CITE|CODE|DATA|DFN|EM|I|IMG|KBD|MARK|Q|S|SAMP|SMALL|SPAN|STRONG|SUB|SUP|TIME|U|VAR|WBR|DEL|INS)$/;
  function normalizeInlineFormats(root) {
    root.querySelectorAll("u").forEach((u) => {
      if (u.parentNode) u.replaceWith(...u.childNodes);
    });
    const doc = root.ownerDocument || root;
    const containers = /* @__PURE__ */ new Set();
    root.querySelectorAll("sub, sup").forEach((el) => {
      const parent = el.parentElement;
      if (parent && /^(DIV|SECTION|ARTICLE|ASIDE|MAIN|TD|TH|LI|BLOCKQUOTE|FIGURE|BODY)$/.test(parent.tagName) && [...parent.children].some((c) => !INLINE_TAGS.test(c.tagName))) containers.add(parent);
    });
    containers.forEach((parent) => {
      let run = [];
      const flush = (before) => {
        if (run.some((n) => n.nodeType === 3 ? n.textContent.trim() : true)) {
          const p = doc.createElement("p");
          parent.insertBefore(p, before);
          run.forEach((n) => p.append(n));
        }
        run = [];
      };
      [...parent.childNodes].forEach((n) => {
        if (n.nodeType === 3 || n.nodeType === 1 && INLINE_TAGS.test(n.tagName)) run.push(n);
        else if (n.nodeType === 1) flush(n);
      });
      flush(null);
    });
  }
  function removeDecorativeImages(root) {
    root.querySelectorAll("img").forEach((img) => {
      const src = (img.getAttribute("src") || "").trim();
      if (/^(?:data:image\/svg\+xml|blob:)/i.test(src) && !img.closest(PICTOGRAM_HOLDERS)) img.remove();
    });
    root.querySelectorAll("svg").forEach((svg) => {
      if (svg.parentNode && !svg.closest(PICTOGRAM_HOLDERS)) svg.remove();
    });
  }
  var TRACKER_HOST = /(?:^|\.)(?:t\.co|analytics\.twitter\.com|ads-twitter\.com|static\.ads-twitter\.com|facebook\.com|facebook\.net|connect\.facebook\.net|doubleclick\.net|google-analytics\.com|googletagmanager\.com|googleadservices\.com|googlesyndication\.com|bat\.bing\.com|clarity\.ms|px\.ads\.linkedin\.com|snap\.licdn\.com|analytics\.tiktok\.com|ct\.pinterest\.com|tealiumiq\.com|tiqcdn\.com|hotjar\.com|quantserve\.com|demdex\.net|omtrdc\.net|adnxs\.com|everesttech\.net|optimizely\.com)$/i;
  function isTracker(raw) {
    if (!raw) return false;
    try {
      const u = new URL(String(raw).trim().replace(/&amp;/g, "&"), `${STUDY_ORIGIN}/`);
      if (TRACKER_HOST.test(u.hostname)) return true;
      return /\/i\/adsct|\/tr\/?\?id=|\/collect\?|\/pixel(?:\.gif)?(?:[?/]|$)/i.test(u.pathname + u.search);
    } catch (e) {
      return false;
    }
  }
  function removeTrackers(root) {
    root.querySelectorAll("img, iframe, source, embed, object").forEach((el) => {
      const refs = [
        el.getAttribute("src"),
        el.getAttribute("data-src"),
        el.getAttribute("data"),
        ...(el.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(/\s+/)[0])
      ];
      if (!refs.some(isTracker)) return;
      const wrap = el.parentElement && el.parentElement.tagName === "PICTURE" ? el.parentElement : el;
      const parent = wrap.parentElement;
      wrap.remove();
      if (parent && /^(P|A|SPAN)$/.test(parent.tagName) && !parent.textContent.trim() && !parent.querySelector("img, iframe, video")) parent.remove();
    });
    root.querySelectorAll('img[width="1"][height="1"], img[width="0"][height="0"]').forEach((img) => img.remove());
  }
  function imageKey(raw) {
    if (!raw) return "";
    let v = String(raw).trim().replace(/&amp;/g, "&").replace(/^['"]|['"]$/g, "");
    if (!v || /^(data|blob):/.test(v)) return "";
    if (v.startsWith("//")) v = `https:${v}`;
    try {
      const u = new URL(v, `${STUDY_ORIGIN}/`);
      u.hash = "";
      return u.href;
    } catch (e) {
      return "";
    }
  }
  function dropUnloadableImages(root, blocked, dropped) {
    root.querySelectorAll("img").forEach((img) => {
      const refs = [
        img.getAttribute("src"),
        img.getAttribute("data-src"),
        ...(img.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(/\s+/)[0])
      ];
      const hit = refs.map(imageKey).find((k) => k && blocked.has(k));
      if (!hit) return;
      dropped.add(hit);
      const target = img.closest("picture") || img;
      const parent = target.parentElement;
      target.remove();
      if (parent && /^(P|A|SPAN|FIGURE)$/.test(parent.tagName) && !parent.textContent.trim() && !parent.querySelector("img, iframe, video")) parent.remove();
    });
    root.querySelectorAll("[data-excat-bg]").forEach((el) => {
      const key = imageKey(el.getAttribute("data-excat-bg"));
      if (key && blocked.has(key)) {
        dropped.add(key);
        el.removeAttribute("data-excat-bg");
      }
    });
  }
  function templateRoots(doc) {
    return [...doc.querySelectorAll('template[id^="excat-"]')].map((tpl) => tpl.content && tpl.content.childNodes.length ? tpl.content : tpl);
  }
  function cleanRoot(root, doc, template, path) {
    unwrapOptimizely(root);
    const anchors = rewriteAnchors(root, doc, path);
    removeAll(root, chromeList(template));
    removeAll(root, toList(template && template.drops).map((d) => typeof d === "string" ? d : d.selector).concat(DEFAULT_DROPS));
    removeTrackers(root);
    removeDecorativeImages(root);
    removeSourceRulesAndEmptyHeadings(root);
    removeComments(root);
    normalizeInlineFormats(root);
    fixLinks(root);
    normalizeHeadings(root);
    markCrestButtons(root);
    return anchors;
  }
  function regionOf(el) {
    let top = el;
    while (top.parentElement && !top.parentElement.matches("#main, span.optimizely_experiment__block")) top = top.parentElement;
    return top.parentElement ? top : null;
  }
  function retag(el, tag) {
    const doc = el.ownerDocument;
    const h = doc.createElement(tag);
    [...el.attributes].forEach((a) => h.setAttribute(a.name, a.value));
    h.append(...el.childNodes);
    el.replaceWith(h);
    return h;
  }
  function normalizeHeadings(root) {
    root.querySelectorAll(":is(h1, h2, h3, h4, h5, h6):has(:is(h1, h2, h3, h4, h5, h6))").forEach((outer) => {
      if (!outer.isConnected && !outer.parentNode) return;
      const inner = outer.querySelector("h1, h2, h3, h4, h5, h6");
      if (!inner || outer.textContent.replace(/\s+/g, "") !== inner.textContent.replace(/\s+/g, "")) return;
      outer.replaceWith(inner);
    });
    root.querySelectorAll("h3.heading-section").forEach((h) => {
      const region = regionOf(h);
      if (!region || region.querySelector("h1, h2, h3, h4, h5, h6") !== h) return;
      retag(h, "h2");
    });
  }
  function markCrestButtons(root) {
    const doc = root.ownerDocument || root;
    root.querySelectorAll('.ct-section-crest a.btn, .ct-section-crest a[class*="btn--"]').forEach((a) => {
      const cls = a.className || "";
      if (/btn--text/.test(cls) || a.closest("strong, em")) return;
      const link = doc.createElement("a");
      link.setAttribute("href", (a.getAttribute("href") || "").trim());
      link.textContent = a.textContent.replace(/\s+/g, " ").trim();
      if (!link.textContent) return;
      const wrap = doc.createElement(/btn--secondary/.test(cls) ? "em" : "strong");
      wrap.append(link);
      const p = doc.createElement("p");
      p.append(wrap);
      const parent = a.parentElement;
      if (parent && /^(DIV|P)$/.test(parent.tagName) && parent.textContent.trim() === a.textContent.trim() && !parent.matches(".section__inner")) parent.replaceWith(p);
      else a.replaceWith(wrap);
    });
  }
  function removeSourceRulesAndEmptyHeadings(root) {
    root.querySelectorAll("hr:not([data-excat-landing-section])").forEach((hr) => hr.remove());
    root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (!h.textContent.trim() && !h.querySelector("img, picture, iframe")) h.remove();
    });
  }
  function replaceWidgets(element, template) {
    const doc = element.ownerDocument;
    const widgets = toList(template && template.widgets).length ? template.widgets : DEFAULT_WIDGETS;
    widgets.forEach((w) => {
      let nodes = [];
      try {
        nodes = element.querySelectorAll(w.selector);
      } catch (e) {
        nodes = [];
      }
      nodes.forEach((region) => {
        const wrap = doc.createElement("div");
        if (w.keep) {
          try {
            region.querySelectorAll(w.keep).forEach((k) => wrap.append(k));
          } catch (e) {
          }
        }
        const p = doc.createElement("p");
        const a = doc.createElement("a");
        const href = w.widget;
        a.setAttribute("href", href);
        a.textContent = href;
        p.append(a);
        wrap.append(p);
        region.replaceWith(wrap);
        console.log(`${LOG2} widget ${w.section || ""} -> ${href}`);
      });
    });
  }
  function materializeBackgrounds(element) {
    const doc = element.ownerDocument;
    element.querySelectorAll("[data-excat-bg]").forEach((el) => {
      const src = (el.getAttribute("data-excat-bg") || "").trim();
      if (src && el.style && el.style.backgroundImage) el.style.removeProperty("background-image");
      if (!src || el.querySelector("img")) return;
      const img = doc.createElement("img");
      img.setAttribute("src", src);
      const alt = (el.getAttribute("aria-label") || "").replace(/^[\s“”"']+|[\s“”"']+$/g, "");
      img.setAttribute("alt", alt);
      if (el.tagName === "TD" || el.closest("table")) el.prepend(img);
      else {
        const p = doc.createElement("p");
        p.append(img);
        el.prepend(p);
      }
    });
  }
  function materializeVideos(element) {
    const doc = element.ownerDocument;
    element.querySelectorAll("[data-excat-video-src]").forEach((el) => {
      if (el.closest("table")) return;
      const src = (el.getAttribute("data-excat-video-src") || "").trim();
      if (!src) return;
      const m = src.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
      const href = m ? `https://www.youtube.com/watch?v=${m[1]}` : src;
      if ([...el.querySelectorAll("a[href]")].some((a2) => a2.getAttribute("href") === href)) return;
      const p = doc.createElement("p");
      const a = doc.createElement("a");
      a.setAttribute("href", href);
      a.textContent = href;
      p.append(a);
      el.append(p);
    });
  }
  function stripExcatAttributes(element) {
    element.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (/^data-excat-/.test(attr.name) && !/^data-excat-landing-/.test(attr.name)) el.removeAttribute(attr.name);
      });
    });
  }
  function transform(hookName, element, payload) {
    const template = payload && payload.template || {};
    const doc = element.ownerDocument || document;
    if (hookName === TransformHook.beforeTransform) {
      const path = pagePathOf(doc, payload);
      const stats = cleanRoot(element, doc, template, path);
      if (stats.rewritten || stats.unresolved) console.log(`${LOG2} anchors rewritten ${stats.rewritten}, unresolved ${stats.unresolved}`);
      templateRoots(doc).forEach((frag) => cleanRoot(frag, doc, template, path));
      const list2 = new Set(payload && payload.unloadableImages || []);
      if (list2.size) {
        const dropped = new Set(doc.excatDroppedImages || []);
        dropUnloadableImages(element, list2, dropped);
        templateRoots(doc).forEach((frag) => dropUnloadableImages(frag, list2, dropped));
        if (doc.head) dropUnloadableImages(doc.head, list2, dropped);
        doc.excatDroppedImages = [...dropped];
        dropped.forEach((u) => console.warn(`${LOG2} image dropped (cannot be loaded on the source): ${u}`));
      }
    }
    if (hookName === TransformHook.afterTransform) {
      replaceWidgets(element, template);
      materializeBackgrounds(element);
      materializeVideos(element);
      doc.querySelectorAll('template[id^="excat-"]').forEach((t) => t.remove());
      element.querySelectorAll("template").forEach((t) => t.remove());
      removeAll(element, chromeList(template));
      removeTrackers(element);
      removeComments(element);
      normalizeInlineFormats(element);
      fixLinks(element);
      stripExcatAttributes(element);
    }
  }

  // tools/importer/transformers/unimelb-landing-audience.js
  var AUD_ATTR = "data-excat-audience";
  var START_ATTR = "data-excat-section-start";
  var FRAGMENT_LINK_ATTR = "data-excat-fragment-link";
  var ORG_SUFFIX = "--organisations";
  var LOG3 = "[landing-audience]";
  function toList2(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }
  function safeMatches(el, sel) {
    try {
      return el.matches(sel);
    } catch (e) {
      return false;
    }
  }
  function safeAll(root, sel) {
    try {
      return [...root.querySelectorAll(sel)];
    } catch (e) {
      return [];
    }
  }
  function contentRegions(root) {
    const main = root.matches && root.matches("#main") ? root : root.querySelector("#main");
    if (!main) return [];
    const out = [];
    [...main.children].forEach((c) => {
      if (c.matches(".optimizely_experiment")) {
        const span = c.querySelector(":scope > span.optimizely_experiment__block");
        if (span) out.push(...span.children);
      } else {
        out.push(c);
      }
    });
    return out;
  }
  function hasContent(el) {
    if (el.tagName === "HR") return false;
    return /\S/.test(el.textContent || "") || el.matches("img, iframe, video, picture, table, [data-excat-bg], [data-excat-video-src]") || !!el.querySelector("img, iframe, video, picture, table, [data-excat-bg], [data-excat-video-src]");
  }
  function sectionDefFor(el, sections) {
    const start = el.getAttribute(START_ATTR);
    if (start) {
      const id = start.replace(new RegExp(`${ORG_SUFFIX}$`), "");
      const def = sections.find((s) => s.id === id);
      if (def) return def;
    }
    return sections.find((s) => toList2(s.selector).some((sel) => safeMatches(el, sel))) || null;
  }
  function sectionUnits(root, template) {
    const sections = template && template.sections || [];
    const joins = toList2(template && template.sectionMatching && template.sectionMatching.joinWithPrevious);
    const units = [];
    const counts = {};
    let cur = null;
    const open = (el, def, fragmentLink) => {
      const id = fragmentLink ? `fragment:${el.getAttribute(FRAGMENT_LINK_ATTR)}` : def ? def.id : null;
      const key = id || "(none)";
      counts[key] = (counts[key] || 0) + 1;
      cur = { id, n: counts[key], def, els: [el], fragmentLink };
      units.push(cur);
    };
    contentRegions(root).forEach((el) => {
      const isLink = el.hasAttribute(FRAGMENT_LINK_ATTR);
      if (!isLink && !hasContent(el)) return;
      if (isLink) {
        open(el, null, true);
        return;
      }
      if (cur && !cur.fragmentLink && joins.some((j) => safeMatches(el, j))) {
        cur.els.push(el);
        return;
      }
      const def = sectionDefFor(el, sections);
      if (def || !cur || cur.fragmentLink) {
        open(el, def, false);
        return;
      }
      cur.els.push(el);
    });
    return units;
  }
  function signature(els) {
    return toList2(els).map((el) => {
      const copy = el.cloneNode(true);
      copy.querySelectorAll("svg, img, script, style").forEach((n) => n.remove());
      const text7 = (copy.textContent || "").replace(/\s+/g, " ").trim();
      const hrefs = [...copy.querySelectorAll("a[href]")].map((a) => a.getAttribute("href").trim().replace(/\/+$/, "")).join("\n");
      return `${text7}
--
${hrefs}`;
    }).join("\n==\n");
  }
  var CONSUMED_ATTR = "data-excat-consumed";
  function loadParts(doc, contract) {
    const tpl = doc.querySelector(contract.template || "template#excat-organisations");
    if (!tpl) return null;
    if (tpl.hasAttribute(CONSUMED_ATTR)) return null;
    tpl.setAttribute(CONSUMED_ATTR, "");
    const frag = tpl.content && tpl.content.childNodes.length ? tpl.content : tpl;
    const parts = {};
    frag.querySelectorAll("[data-excat-part]").forEach((p) => {
      const name = p.getAttribute("data-excat-part");
      if (!parts[name]) parts[name] = doc.importNode(p, true);
    });
    return parts;
  }
  function markLive(el, id) {
    el.setAttribute(AUD_ATTR, "individuals");
    el.setAttribute(START_ATTR, id);
  }
  function markCopy(el, id) {
    el.setAttribute(AUD_ATTR, "organisations");
    el.setAttribute(START_ATTR, `${id}${ORG_SUFFIX}`);
  }
  function insertAfter(ref, nodes) {
    let last = ref;
    nodes.forEach((n) => {
      last.after(n);
      last = n;
    });
    return last;
  }
  function unitTail(unit) {
    let tail = unit.els[unit.els.length - 1];
    while (tail.nextElementSibling && tail.nextElementSibling.getAttribute(AUD_ATTR) === "organisations") {
      tail = tail.nextElementSibling;
    }
    return tail;
  }
  function cloneUnit(unit, id) {
    const copies = unit.els.map((el) => doc0(el).importNode(el, true));
    markCopy(copies[0], id);
    copies.slice(1).forEach((c) => c.setAttribute(AUD_ATTR, "organisations"));
    return copies;
  }
  function doc0(el) {
    return el.ownerDocument || document;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template || {};
    const contract = template.audienceContract;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      doc.excatAudience = null;
      if (!contract) return;
      const parts = loadParts(doc, contract);
      if (!parts) return;
      const body = parts.body || null;
      const contractSections = contract.sections || {};
      const contractIds = new Set(Object.keys(contractSections));
      const liveUnits = sectionUnits(element, template).filter((u) => u.def);
      const orgUnits = body ? sectionUnits(body, template).filter((u) => u.def) : [];
      const key = (u) => `${u.id}#${u.n}`;
      const liveByKey = new Map(liveUnits.map((u) => [key(u), u]));
      const orgByKey = new Map(orgUnits.map((u) => [key(u), u]));
      const tally = { split: [], identical: [], individualsOnly: [], organisationsOnly: [], missing: [] };
      Object.entries(contractSections).forEach(([id, c]) => {
        const part = parts[c.part];
        const lives = liveUnits.filter((u) => u.id === id);
        const counterparts = part ? toList2(c.selector).map((s) => safeAll(part, s)).find((l) => l.length) || [] : [];
        lives.forEach((u, i) => {
          if (u.els[0].hasAttribute(AUD_ATTR)) return;
          const other = counterparts[i];
          if (!other) {
            if (c.whenMissing === "individuals-only" && part) {
              markLive(u.els[0], id);
              tally.individualsOnly.push(id);
            } else {
              tally.missing.push(id);
              console.warn(`${LOG3} audience-missing: ${id}`);
            }
            return;
          }
          if (signature(u.els[0]) === signature(other)) {
            tally.identical.push(id);
            return;
          }
          other.remove();
          markLive(u.els[0], id);
          markCopy(other, id);
          insertAfter(unitTail(u), [other]);
          tally.split.push(id);
        });
      });
      if (body) {
        liveUnits.forEach((u) => {
          if (contractIds.has(u.id) || u.els[0].hasAttribute(AUD_ATTR)) return;
          const o = orgByKey.get(key(u));
          if (!o) {
            tally.missing.push(u.id);
            console.warn(`${LOG3} audience-missing (kept shared): ${key(u)}`);
            return;
          }
          if (signature(u.els) === signature(o.els)) {
            tally.identical.push(u.id);
            return;
          }
          markLive(u.els[0], u.id);
          insertAfter(unitTail(u), cloneUnit(o, u.id));
          tally.split.push(u.id);
        });
        const lastInserted = /* @__PURE__ */ new Map();
        let prevCommon = null;
        orgUnits.forEach((o) => {
          if (contractIds.has(o.id)) {
            if (liveByKey.has(key(o))) prevCommon = liveByKey.get(key(o));
            return;
          }
          const live = liveByKey.get(key(o));
          if (live) {
            prevCommon = live;
            return;
          }
          const copies = cloneUnit(o, o.id);
          let ref = prevCommon ? lastInserted.get(prevCommon) || unitTail(prevCommon) : null;
          if (ref) {
            lastInserted.set(prevCommon, insertAfter(ref, copies));
          } else {
            const first = liveUnits[0] && liveUnits[0].els[0];
            if (!first) return;
            copies.forEach((c) => first.before(c));
          }
          tally.organisationsOnly.push(o.id);
        });
      }
      console.log(`${LOG3} split [${tally.split.join(", ")}] individuals-only [${tally.individualsOnly.join(", ")}] organisations-only [${tally.organisationsOnly.join(", ")}] identical [${tally.identical.join(", ")}]${tally.missing.length ? ` missing [${tally.missing.join(", ")}]` : ""}`);
      doc.excatAudience = tally;
    }
    if (hookName === "afterTransform") {
      doc.querySelectorAll("template#excat-organisations").forEach((t) => t.remove());
    }
  }

  // tools/importer/transformers/unimelb-landing-fragments.js
  var AUD_ATTR2 = "data-excat-audience";
  var START_ATTR2 = "data-excat-section-start";
  var FRAGMENT_ATTR = "data-excat-fragment";
  var FRAGMENT_PATH_ATTR = "data-excat-fragment-path";
  var FRAGMENT_LINK_ATTR2 = "data-excat-fragment-link";
  var ORG_SUFFIX2 = "--organisations";
  var STUDY_ORIGIN_RE = /^https?:\/\/study\.unimelb\.edu\.au/i;
  var LOG4 = "[landing-fragments]";
  function toList3(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }
  function safeMatches2(el, sel) {
    try {
      return el.matches(sel);
    } catch (e) {
      return false;
    }
  }
  function contentRegions2(root) {
    const main = root.matches && root.matches("#main") ? root : root.querySelector("#main");
    if (!main) return [];
    const out = [];
    [...main.children].forEach((c) => {
      if (c.matches(".optimizely_experiment")) {
        const span = c.querySelector(":scope > span.optimizely_experiment__block");
        if (span) out.push(...span.children);
      } else {
        out.push(c);
      }
    });
    return out;
  }
  function hasContent2(el) {
    if (el.tagName === "HR") return false;
    return /\S/.test(el.textContent || "") || el.matches("img, iframe, video, picture, table, [data-excat-bg], [data-excat-video-src]") || !!el.querySelector("img, iframe, video, picture, table, [data-excat-bg], [data-excat-video-src]");
  }
  function sectionDefFor2(el, sections) {
    const start = el.getAttribute(START_ATTR2);
    if (start) {
      const id = start.replace(new RegExp(`${ORG_SUFFIX2}$`), "");
      const def = sections.find((s) => s.id === id);
      if (def) return def;
    }
    return sections.find((s) => toList3(s.selector).some((sel) => safeMatches2(el, sel))) || null;
  }
  function sectionUnits2(root, template) {
    const sections = template && template.sections || [];
    const joins = toList3(template && template.sectionMatching && template.sectionMatching.joinWithPrevious);
    const units = [];
    const counts = {};
    let cur = null;
    const open = (el, def, fragmentLink) => {
      const id = fragmentLink ? `fragment:${el.getAttribute(FRAGMENT_LINK_ATTR2)}` : def ? def.id : null;
      const key = id || "(none)";
      counts[key] = (counts[key] || 0) + 1;
      cur = { id, n: counts[key], def, els: [el], fragmentLink };
      units.push(cur);
    };
    contentRegions2(root).forEach((el) => {
      const isLink = el.hasAttribute(FRAGMENT_LINK_ATTR2);
      if (!isLink && !hasContent2(el)) return;
      if (isLink) {
        open(el, null, true);
        return;
      }
      if (cur && !cur.fragmentLink && joins.some((j) => safeMatches2(el, j))) {
        cur.els.push(el);
        return;
      }
      const def = sectionDefFor2(el, sections);
      if (def || !cur || cur.fragmentLink) {
        open(el, def, false);
        return;
      }
      cur.els.push(el);
    });
    return units;
  }
  function djb2(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i += 1) h = (h * 33 ^ str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function identityOf(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll("svg, script, style").forEach((x) => x.remove());
    const text7 = (c.textContent || "").replace(/\s+/g, " ").trim();
    const links = [...c.querySelectorAll("a[href]")].map((a) => a.getAttribute("href").trim().replace(STUDY_ORIGIN_RE, "").replace(/\/$/, "")).join("|");
    const media = [...c.querySelectorAll('img[src]:not([src^="data:"]):not([src^="blob:"])')].map((i) => i.getAttribute("src")).join("|");
    return { text: djb2(text7), links: djb2(links), media: djb2(media), chars: text7.length };
  }
  function sameIdentity(a, b) {
    return !!b && a.text === b.text && a.links === b.links && a.media === b.media;
  }
  function requestedSlug(payload) {
    if (payload && payload.excatFragment) return String(payload.excatFragment);
    const urls = [payload && payload.params && payload.params.originalURL, payload && payload.url];
    for (const u of urls) {
      const m = u && /#excat-fragment=([\w-]+)/.exec(String(u));
      if (m) return m[1];
    }
    return null;
  }
  function pruneTo(element, main, keep) {
    const keepSet = new Set(keep);
    contentRegions2(main).forEach((r) => {
      if (!keepSet.has(r)) r.remove();
    });
    [...main.children].forEach((c) => {
      if (!keepSet.has(c) && !keep.some((k) => c.contains(k))) c.remove();
    });
    for (let node = main; node && node !== element; node = node.parentElement) {
      const parent = node.parentElement;
      if (!parent) break;
      [...parent.children].forEach((sib) => {
        if (sib !== node) sib.remove();
      });
    }
  }
  function transform3(hookName, element, payload) {
    const template = payload && payload.template || {};
    const contract = template.fragmentContract;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      doc.excatFragments = [];
      doc.excatFragmentMode = null;
      if (!contract || !toList3(contract.fragments).length) return;
      const fragments = contract.fragments;
      const slug = requestedSlug(payload);
      const bySection = {};
      fragments.forEach((f) => {
        (bySection[f.section] = bySection[f.section] || []).push(f);
      });
      const units = sectionUnits2(element, template);
      const matches = [];
      units.forEach((u) => {
        if (!u.def || !bySection[u.def.id]) return;
        const region = u.els[0];
        const id = identityOf(region);
        const f = bySection[u.def.id].find((x) => sameIdentity(id, x.identity) && toList3(x.selector).some((sel) => safeMatches2(region, sel)));
        if (!f) {
          console.log(`${LOG4} no identity match, kept inline: ${u.def.id} (text ${id.text}, links ${id.links}, media ${id.media}, ${id.chars} chars)`);
          return;
        }
        u.els.forEach((el) => el.setAttribute(FRAGMENT_ATTR, f.slug));
        region.setAttribute(FRAGMENT_PATH_ATTR, f.path);
        matches.push({ unit: u, fragment: f });
      });
      doc.excatFragments = matches.map(({ unit, fragment }) => ({
        slug: fragment.slug,
        path: fragment.path,
        section: unit.def.id,
        audience: unit.els[0].getAttribute(AUD_ATTR2) || null,
        regions: unit.els.length
      }));
      if (slug) {
        const f = fragments.find((x) => x.slug === slug);
        const hit = matches.find((m) => m.fragment.slug === slug);
        doc.excatFragmentMode = { slug, path: f ? f.path : null, found: !!hit, sourcePage: f ? f.sourcePage : null };
        if (!f) {
          console.warn(`${LOG4} fragment-missing: unknown slug ${slug}`);
          return;
        }
        if (!hit) {
          console.warn(`${LOG4} fragment-missing: band ${slug} not found (or identity mismatch) on this page`);
          return;
        }
        const main = element.querySelector("#main") || element;
        hit.unit.els.forEach((el) => {
          el.removeAttribute(AUD_ATTR2);
          el.removeAttribute(START_ATTR2);
        });
        pruneTo(element, main, hit.unit.els);
        console.log(`${LOG4} fragment mode: ${slug} -> ${f.path} (${hit.unit.els.length} region(s))`);
        return;
      }
      matches.forEach(({ unit, fragment }) => {
        const first = unit.els[0];
        const holder = doc.createElement("div");
        holder.setAttribute(FRAGMENT_LINK_ATTR2, fragment.slug);
        const audience = first.getAttribute(AUD_ATTR2);
        if (audience) holder.setAttribute(AUD_ATTR2, audience);
        const p = doc.createElement("p");
        const a = doc.createElement("a");
        a.setAttribute("href", fragment.path);
        a.textContent = fragment.path;
        p.append(a);
        holder.append(p);
        first.before(holder);
        unit.els.forEach((el) => el.remove());
        console.log(`${LOG4} ${unit.def.id} -> ${fragment.path}${unit.els.length > 1 ? ` (+${unit.els.length - 1} joined region(s))` : ""}${audience ? ` [${audience}]` : ""}`);
      });
    }
    if (hookName === "afterTransform") {
    }
  }

  // tools/importer/transformers/unimelb-landing-sections.js
  var MARK = "data-excat-landing-section";
  var META_STYLE = "data-excat-landing-style";
  var META_AUDIENCE = "data-excat-landing-audience";
  var META_FIRST = "data-excat-landing-first";
  var AUD_ATTR3 = "data-excat-audience";
  var START_ATTR3 = "data-excat-section-start";
  var FRAGMENT_LINK_ATTR3 = "data-excat-fragment-link";
  var ORG_SUFFIX3 = "--organisations";
  var LOG5 = "[landing-sections]";
  function toList4(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  }
  function safeMatches3(el, sel) {
    try {
      return el.matches(sel);
    } catch (e) {
      return false;
    }
  }
  function contentRegions3(root) {
    const main = root.matches && root.matches("#main") ? root : root.querySelector("#main");
    if (!main) return [];
    const out = [];
    [...main.children].forEach((c) => {
      if (c.matches(".optimizely_experiment")) {
        const span = c.querySelector(":scope > span.optimizely_experiment__block");
        if (span) out.push(...span.children);
      } else {
        out.push(c);
      }
    });
    return out;
  }
  function hasContent3(el) {
    if (el.tagName === "HR") return false;
    return /\S/.test(el.textContent || "") || el.matches("img, iframe, video, picture, table, [data-excat-bg], [data-excat-video-src]") || !!el.querySelector("img, iframe, video, picture, table, [data-excat-bg], [data-excat-video-src]");
  }
  function sectionDefFor3(el, sections) {
    const start = el.getAttribute(START_ATTR3);
    if (start) {
      const id = start.replace(new RegExp(`${ORG_SUFFIX3}$`), "");
      const def = sections.find((s) => s.id === id);
      if (def) return def;
    }
    return sections.find((s) => toList4(s.selector).some((sel) => safeMatches3(el, sel))) || null;
  }
  function sectionUnits3(root, template) {
    const sections = template && template.sections || [];
    const joins = toList4(template && template.sectionMatching && template.sectionMatching.joinWithPrevious);
    const units = [];
    const counts = {};
    let cur = null;
    const open = (el, def, fragmentLink) => {
      const id = fragmentLink ? `fragment:${el.getAttribute(FRAGMENT_LINK_ATTR3)}` : def ? def.id : null;
      const key = id || "(none)";
      counts[key] = (counts[key] || 0) + 1;
      cur = { id, n: counts[key], def, els: [el], fragmentLink };
      units.push(cur);
    };
    contentRegions3(root).forEach((el) => {
      const isLink = el.hasAttribute(FRAGMENT_LINK_ATTR3);
      if (!isLink && !hasContent3(el)) return;
      if (isLink) {
        open(el, null, true);
        return;
      }
      if (cur && !cur.fragmentLink && joins.some((j) => safeMatches3(el, j))) {
        cur.els.push(el);
        return;
      }
      const def = sectionDefFor3(el, sections);
      if (def || !cur || cur.fragmentLink) {
        open(el, def, false);
        return;
      }
      cur.els.push(el);
    });
    return units;
  }
  function hasMarkerBefore(el) {
    const prev = el.previousElementSibling;
    return !!(prev && prev.tagName === "HR" && prev.hasAttribute(MARK));
  }
  function insertBreak(el, id, style, audience, isFirst) {
    if (hasMarkerBefore(el)) return false;
    const hr = el.ownerDocument.createElement("hr");
    hr.setAttribute(MARK, id || "section");
    if (style) hr.setAttribute(META_STYLE, style);
    if (audience) hr.setAttribute(META_AUDIENCE, audience);
    if (isFirst) hr.setAttribute(META_FIRST, "");
    el.before(hr);
    return true;
  }
  var HEADING_SANS = "heading-sans";
  function blockElements(root, template) {
    const els = [];
    toList4(template && template.blocks).forEach((b) => toList4(b.instances).forEach((sel) => {
      try {
        els.push(...root.ownerDocument.querySelectorAll(sel));
      } catch (e) {
      }
    }));
    return els;
  }
  function hasDefaultSectionTitle(unit, blocks) {
    return unit.els.some((el) => [...el.querySelectorAll("h2.heading-section")].some((h) => !blocks.some((b) => b.contains(h))));
  }
  function withStyle(style, token) {
    const list2 = (style || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!list2.includes(token)) list2.push(token);
    return list2.join(", ");
  }
  function transform4(hookName, element, payload) {
    const template = payload && payload.template || {};
    if (hookName === "beforeTransform") {
      if (!toList4(template.sections).length) return;
      const units = sectionUnits3(element, template);
      const blocks = blockElements(element, template);
      units.forEach((u, i) => {
        const start = u.els[0];
        let style = u.fragmentLink ? null : u.def && u.def.style || null;
        if (!u.fragmentLink && hasDefaultSectionTitle(u, blocks)) style = withStyle(style, HEADING_SANS);
        const audience = start.getAttribute(AUD_ATTR3) || null;
        if (i === 0 && !style && !audience) return;
        insertBreak(start, u.id, style, audience, i === 0);
      });
      element.ownerDocument.excatSections = units.map((u) => `${u.id || "(none)"}${u.els[0].getAttribute(AUD_ATTR3) ? `[${u.els[0].getAttribute(AUD_ATTR3)}]` : ""}`);
      const unmatched = units.filter((u) => !u.def && !u.fragmentLink).length;
      console.log(`${LOG5} ${units.length} sections (${units.filter((u) => u.els.length > 1).length} with joined/continued regions${unmatched ? `, ${unmatched} without a section entry` : ""})`);
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(`hr[${MARK}]`).forEach((hr) => {
        const cells = {};
        const style = hr.getAttribute(META_STYLE);
        const audience = hr.getAttribute(META_AUDIENCE);
        if (style) cells.Style = style;
        if (audience) cells.Audience = audience;
        if (Object.keys(cells).length) {
          const metadata = WebImporter.Blocks.createBlock(element.ownerDocument, {
            name: "Section Metadata",
            cells
          });
          hr.after(metadata);
        }
        if (hr.hasAttribute(META_FIRST)) {
          hr.remove();
          return;
        }
        [MARK, META_STYLE, META_AUDIENCE, META_FIRST].forEach((a) => hr.removeAttribute(a));
      });
    }
  }

  // tools/importer/unloadable-images.js
  var unloadable_images_default = [
    "https://matrix-cms.unimelb.edu.au/?a=45131",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0010/111421/KannanSethuraman.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0011/155000/rehab11.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0012/155001/rehab12.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0013/155002/rehab13.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0014/155003/rehab14.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0017/420434/varieties/banner.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0017/422306/varieties/banner.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0028/46963/diploma-in-languages-banner.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0036/154998/rehab9.jpg",
    "https://matrix-cms.unimelb.edu.au/__data/assets/image/0037/154999/rehab10.jpg",
    "https://matrix-cms.unimelb.edu.au/study-fac/content/courses-by-academic-division/graduate/fam/profiles/academic/Leon-de-Bruin-300px.jpg",
    "https://matrix-cms.unimelb.edu.au/study-fac/content/courses-by-academic-division/obsolete-data-records/identifying-and-responding-to-domestic-and-family-violence/Domestic-and-Family-Violence.jpg",
    "https://matrix-cms.unimelb.edu.au/study-fac/data/courses/grad/doctor-of-optometry/90b137e1ce72197f51a63df0f6652311992e66a6.png",
    "https://matrix-cms.unimelb.edu.au/study-fac/data/courses/grad/graduate-certificate-in-adolescent-health-and-wellbeing/iStock-1488889438.jpg",
    "https://matrix-cms.unimelb.edu.au/study-fac/data/courses/incompatible-courses/doctoral-program-in-economics/22180_0175.jpg/300x240.jpg",
    "https://matrix-cms.unimelb.edu.au/study-fac/data/courses/incompatible-courses/doctoral-program-in-economics/tim-robinso.jpg/300.jpg",
    "https://matrix-cms.unimelb.edu.au/study-fac/data/non-award/short-courses/transition-to-mental-health-nursing/Cathy.jpg",
    "https://study.unimelb.edu.au/2362",
    "https://study.unimelb.edu.au/2592",
    "https://study.unimelb.edu.au/3456",
    "https://study.unimelb.edu.au/3543",
    "https://study.unimelb.edu.au/4024",
    "https://study.unimelb.edu.au/4732",
    "https://study.unimelb.edu.au/__data/assets/video_file/0020/475022/COP_hidden-gem_websiteHP.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0020/496100/Web-loop_UMEP-outcomes2.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0021/475023/COP_make-friends_websiteHP.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0024/268242/ClaraIntro_3.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0025/491236/Web-loop_Christine_9x16.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0030/476760/Web-loop_Little-Hall_9x16.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0031/476662/Web-loop_Lachlan-mentoring_9x16.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0031/478507/HSP_web-loop_Lachlan_9x16.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0034/485647/Website-loop_Crystal.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0035/485648/Website-loop_Gyan.mp4",
    "https://study.unimelb.edu.au/__data/assets/video_file/0039/495984/Web-loop_UMEP-experience.mp4",
    "https://study.unimelb.edu.au/accommodation/1961",
    "https://study.unimelb.edu.au/accommodation/2942",
    "https://study.unimelb.edu.au/accommodation/3686",
    "https://study.unimelb.edu.au/accommodation/6553",
    "https://study.unimelb.edu.au/accommodation/international-house/1200",
    "https://study.unimelb.edu.au/accommodation/international-house/800",
    "https://study.unimelb.edu.au/connect-with-us/3800",
    "https://study.unimelb.edu.au/connect-with-us/5697",
    "https://study.unimelb.edu.au/connect-with-us/high-school-programs/1333",
    "https://study.unimelb.edu.au/connect-with-us/high-school-programs/1334",
    "https://study.unimelb.edu.au/connect-with-us/high-school-programs/2000",
    "https://study.unimelb.edu.au/connect-with-us/high-school-programs/kwong-lee-dow-young-scholars-program/3800",
    "https://study.unimelb.edu.au/connect-with-us/high-school-programs/kwong-lee-dow-young-scholars-program/5697",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/534",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/800",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/1094",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/1363",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/1667",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/2000",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/2048",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/2085",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/2500",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/3000",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/3280",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/3744",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/4928",
    "https://study.unimelb.edu.au/connect-with-us/information-for-schools/Australia-and-New-Zealand/5616",
    "https://study.unimelb.edu.au/connect-with-us/international/1001",
    "https://study.unimelb.edu.au/connect-with-us/international/1102",
    "https://study.unimelb.edu.au/connect-with-us/international/1500",
    "https://study.unimelb.edu.au/connect-with-us/international/2000",
    "https://study.unimelb.edu.au/connect-with-us/international/827",
    "https://study.unimelb.edu.au/how-to-apply/equity-entry-schemes/3963",
    "https://study.unimelb.edu.au/how-to-apply/equity-entry-schemes/5956",
    "https://study.unimelb.edu.au/how-to-apply/equity-entry-schemes/access-melbourne-undergraduate/1007",
    "https://study.unimelb.edu.au/how-to-apply/equity-entry-schemes/access-melbourne-undergraduate/2000",
    "https://study.unimelb.edu.au/how-to-apply/graduate-coursework-study/1564",
    "https://study.unimelb.edu.au/how-to-apply/graduate-coursework-study/2262",
    "https://study.unimelb.edu.au/student-life/1000",
    "https://study.unimelb.edu.au/student-life/1120",
    "https://study.unimelb.edu.au/student-life/1200",
    "https://study.unimelb.edu.au/student-life/1637",
    "https://study.unimelb.edu.au/student-life/2000",
    "https://study.unimelb.edu.au/student-life/2456",
    "https://study.unimelb.edu.au/student-life/604",
    "https://study.unimelb.edu.au/student-life/800",
    "https://study.unimelb.edu.au/student-life/events/1000",
    "https://study.unimelb.edu.au/student-life/events/1333",
    "https://study.unimelb.edu.au/student-life/events/2000",
    "https://study.unimelb.edu.au/student-life/events/4002",
    "https://study.unimelb.edu.au/student-life/events/6000",
    "https://study.unimelb.edu.au/student-life/events/meet-melbourne/1373",
    "https://study.unimelb.edu.au/student-life/events/meet-melbourne/1940",
    "https://study.unimelb.edu.au/student-life/events/meet-melbourne/2001",
    "https://study.unimelb.edu.au/student-life/events/meet-melbourne/3000",
    "https://study.unimelb.edu.au/student-life/inside-melbourne/1200",
    "https://study.unimelb.edu.au/student-life/inside-melbourne/1250",
    "https://study.unimelb.edu.au/study-with-us/1000",
    "https://study.unimelb.edu.au/study-with-us/2000",
    "https://study.unimelb.edu.au/study-with-us/3800",
    "https://study.unimelb.edu.au/study-with-us/3963",
    "https://study.unimelb.edu.au/study-with-us/533",
    "https://study.unimelb.edu.au/study-with-us/568",
    "https://study.unimelb.edu.au/study-with-us/5697",
    "https://study.unimelb.edu.au/study-with-us/5956",
    "https://study.unimelb.edu.au/study-with-us/800",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/1080",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/1920",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/1029",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/2160",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/2576",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/2577",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/2578",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/3863",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/3864",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/4096",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/688",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/public-health/1000",
    "https://study.unimelb.edu.au/study-with-us/graduate-courses/health/public-health/667",
    "https://study.unimelb.edu.au/study-with-us/guaranteed-undergraduate-to-graduate-study-pathways/1333",
    "https://study.unimelb.edu.au/study-with-us/guaranteed-undergraduate-to-graduate-study-pathways/2000",
    "https://study.unimelb.edu.au/study-with-us/professional-development/1000",
    "https://study.unimelb.edu.au/study-with-us/professional-development/2000",
    "https://study.unimelb.edu.au/study-with-us/professional-development/400",
    "https://study.unimelb.edu.au/study-with-us/professional-development/600",
    "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/1900",
    "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/2849",
    "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/3800",
    "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/3937",
    "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/5697",
    "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/5906",
    "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/1000",
    "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/2000",
    "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/2899",
    "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/4588",
    "https://study.unimelb.edu.au/study-with-us/undergraduate-courses/1028",
    "https://study.unimelb.edu.au/study-with-us/undergraduate-courses/1200",
    "https://study.unimelb.edu.au/study-with-us/undergraduate-courses/421",
    "https://study.unimelb.edu.au/study-with-us/undergraduate-courses/800",
    "https://study.unimelb.edu.au/study-with-us/undergraduate-courses/change-of-preference/1366",
    "https://study.unimelb.edu.au/study-with-us/undergraduate-courses/change-of-preference/2048",
    "https://study.unimelb.edu.au/support/3024",
    "https://study.unimelb.edu.au/support/4032",
    "https://study.unimelb.edu.au/support/moving-support/2000",
    "https://study.unimelb.edu.au/support/moving-support/814"
  ];

  // tools/importer/pictogram-map.js
  var pictogram_map_default = {
    "1s8s4v1": "access-melbourne",
    "xkdb9b": "accommodation",
    "1gkoir8": "airport-transfer",
    "1135q5e": "australia-map",
    "y1paag": "award-ribbon",
    "hf9l5e": "briefcase",
    "xrajmd": "celebration",
    "133zqqz": "chat",
    "zb2ovq": "city-skyline",
    "1c4o622": "coaching",
    "1b4v5sq": "community-group",
    "1e2yme7": "devices",
    "1c2spzt": "employment",
    "vgzen2": "equivalence-cycle",
    "11faacm": "financial-support",
    "jnpqar": "flight",
    "h72ote": "global-connections",
    "12kr4p5": "globe",
    "s6qdfm": "globe-grid",
    "1eam3r": "graduate-degree-packages",
    "10x2o5k": "graduation-milestone",
    "1pmhnxo": "handshake",
    "qqcqby": "health-cross",
    "15c4tnn": "indigenous-gathering",
    "1q0xosv": "indigenous-meeting-place",
    "ja5oy7": "level-up",
    "1kqsx7z": "lightbulb",
    "wajq2l": "mobile-phone",
    "nhabmh": "network",
    "yhnt64": "number-one",
    "1yc6cwm": "online-graduate",
    "12iq2py": "online-learning",
    "18oqht6": "parkland",
    "32jq7o": "people-group",
    "1v1xmtx": "presentation",
    "5on4bn": "teamwork",
    "9d8wvs": "timetable",
    "x17dw8": "undergraduate-entry-pathways",
    "1i3y7p6": "university-building",
    "1myjilj": "verified-badge",
    "132c98e": "video-player"
  };

  // tools/importer/on-demand-cleanup.json
  var on_demand_cleanup_default = {
    description: "Clean-up rules applied by tools/importer/parsers/video-library.js to the on-demand video data (template#excat-video-data in the /study-with-us/on-demand snapshot) before the Video library block is written. User decision: authors maintain the list; start from a cleaned copy.",
    page: "/study-with-us/on-demand",
    rules: {
      dropUnavailable: "drop entries whose YouTube id is listed in unavailableYoutubeIds (YouTube oEmbed 404: private or removed)",
      dropTruncated: "drop entries whose YouTube id does not match youtubeIdPattern (truncated ids in the source data)",
      dropDuplicates: "drop an entry with the same YouTube id AND title as an earlier one; the first is kept and gets the duplicate's topics / study levels (the source repeats a video to list it under a second topic, e.g. Computing and Software Systems: Engineering + Information technology and computer science)",
      topicMap: "replace topic (discipline) names",
      durations: `normalise durations: '.' separator -> ':' ("21.59" -> "21:59")`
    },
    youtubeIdPattern: "^[A-Za-z0-9_-]{11}$",
    unavailableYoutubeIds: {
      "3vbjUOCIf9M": "oEmbed 404 on 2026-10-03 (Discover the Graphic Design major)",
      LvZEYx4AEcs: "oEmbed 404 on 2026-10-03 (Discover the Performance Design major)",
      uLdiBs4GmA0: "oEmbed 404 on 2026-10-03 (Discover the Digital Infrastructure Engineering major, 3 entries)",
      "0DlZCN35ICo": "oEmbed 404 on 2026-10-03 (Discover the Master of Digital Infrastructure Engineering)",
      "RHNN-rM89gs": "oEmbed 404 on 2026-10-03 (Discover the Geology major)"
    },
    truncatedYoutubeIdsSeen: {
      zmFDikODUI: "Discover the English Language Studies minor (10 characters; oEmbed 400)",
      efO8nZF9c4: "Discover the Master of Mechanical Engineering (10 characters; oEmbed 400)",
      d_f5dBbSm4: "Discover the Diploma in General Studies (10 characters; oEmbed 400)"
    },
    topicMap: {
      "Admissions and scholarships": "Applications and scholarships"
    },
    studyLevelMap: {}
  };

  // tools/importer/import-section-landing.js
  var parsers = {
    "hero-split": parse2,
    "hero": parse,
    "hero-split-light": parse3,
    "audience-switcher": parse4,
    "key-facts": parse5,
    "notice": parse6,
    "columns-overlap": parse7,
    // ct-textcolumnlayout without a banner: the same parser emits Columns (text-column)
    "columns-text-column": parse7,
    "columns": parse8,
    "columns-split": parse9,
    "cards-people": parse10,
    "cards-tile": parse11,
    "cards-icon": parse12,
    "cards": parse13,
    "cards-stat": parse14,
    "cards-chips": parse15,
    "cards-link-list": parse16,
    "video": parse17,
    "video-shorts": parse18,
    "video-split": parse19,
    "video-library": parse20,
    "quote": parse21,
    "accordion": parse22,
    "callout-photo": parse23,
    "search": parse24,
    "table": parse25
  };
  var PAGE_TEMPLATE = {
    "name": "section-landing",
    "description": "Long landing page with image hero, intro text with media, feature card grids, data table, promo banners, blog teaser cards and closing CTA panels",
    "coverageGaps": [],
    "blocks": [
      {
        "name": "hero-split",
        "instances": [
          "#main > div.page-header-alt",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner > div.page-header-alt"
        ]
      },
      {
        "name": "hero",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner > div.campaign-banner-alt",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner:has(> div[class*='page-header__darken'])"
        ]
      },
      {
        "name": "hero-split-light",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-searchbanner .card-article-large"
        ]
      },
      {
        "name": "audience-switcher",
        "instances": [
          "#main > div#page-short-course-audience-switcher"
        ]
      },
      {
        "name": "key-facts",
        "instances": [
          "#main > div.key-facts"
        ]
      },
      {
        "name": "notice",
        "instances": [
          "#main > div.section > .section__inner > div.notice",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.content-block div.notice"
        ]
      },
      {
        "name": "columns-overlap",
        "instances": [
          "#main > section#what-you-will-learn",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:has(.section-alt__img-wrapper) > section.section-alt"
        ]
      },
      {
        "name": "columns-text-column",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:not(:has(.section-alt__img-wrapper)) > section.section-alt"
        ]
      },
      {
        "name": "columns",
        "instances": [
          "#main > section#dates .section-alt__row",
          "#main > section.section-alt:not([id]):has(ul.page-short-course__course-list) .section-alt__row",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-texttwocolumn > .section__inner > div.grid",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textwithfigures > .section__inner",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:not([id]):not(.ct-searchbanner):has(ul.card-course-list) .section-alt__row"
        ]
      },
      {
        "name": "columns-split",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image.split-section",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section section.split-section",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu"
        ]
      },
      {
        "name": "cards-people",
        "instances": [
          "#main > section#who-you-will-learn-from .section-alt__right"
        ]
      },
      {
        "name": "cards-tile",
        "instances": [
          "#main > section#fees .grid.grid--lg",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-todolist .todo-list__button-cards",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-pathfinder .grid",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn.section .grid",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusboxpathfinder .grid",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(section.ct-searchbanner, section.section-alt.hardcode) .article-card-list",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.pathfinder-today ul.pathfinder-today__list",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.bg-inverted > div.pathfinder-today ul.pathfinder-today__list"
        ]
      },
      {
        "name": "cards-icon",
        "instances": [
          "#main > section#overview .grid.grid--lg",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-factscard div.grid",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-imagelisting div.logo-listing",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn.section-alt .grid",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusbox .grid",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-documentlisting ul.document-list"
        ]
      },
      {
        "name": "cards",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel div.grid:has(.card--features-panel)",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-profilelist div.grid:has(.card--stafflist)",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-pagelisting div.grid",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting div.grid.ctnews",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-eventslisting ul.grid:has(li.event)"
        ]
      },
      {
        "name": "cards-stat",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-statsrankings ul.uom-stats-and-rankings__stats"
        ]
      },
      {
        "name": "cards-chips",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursecards ul.course-list"
        ]
      },
      {
        "name": "cards-link-list",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section__inner:has(> div.grid .sublink-menu) > div.grid"
        ]
      },
      {
        "name": "video",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section :is(div.embed, div.uom-video, div.video)",
          ':is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div.content-block, section.content-block) :is(div, p):has(> iframe[src*="youtube.com/embed"], > iframe[src*="vimeo.com"])'
        ]
      },
      {
        "name": "video-shorts",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section-alt .section-alt__right div.testimonials-alt--video"
        ]
      },
      {
        "name": "video-split",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section-alt .section-alt__row:has(.uom-video, .video, iframe)"
        ]
      },
      {
        "name": "video-library",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.filter-category"
        ]
      },
      {
        "name": "quote",
        "instances": [
          "#main > section#hear-from-students .section-alt__right blockquote.testimonials-alt",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section-alt .section-alt__right blockquote.testimonials-alt",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section .card-focus"
        ]
      },
      {
        "name": "accordion",
        "instances": [
          "#main > section#course-specifics .section-alt__row:has(.uom-accordion)",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion.section-alt .section-alt__row:has(.uom-accordion)",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion.section .uom-accordion"
        ]
      },
      {
        "name": "callout-photo",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-sectionfocus"
        ]
      },
      {
        "name": "search",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursesearch .section-alt__row"
        ]
      },
      {
        "name": "table",
        "instances": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.content-block table:not(.uom-accordion table)"
        ]
      }
    ],
    "sections": [
      {
        "id": "sc-hero",
        "name": "Course hero (page-header-alt)",
        "selector": [
          "#main > div.page-header-alt"
        ],
        "style": null,
        "blocks": [
          "hero-split"
        ],
        "defaultContent": []
      },
      {
        "id": "sc-audience-switcher",
        "name": "Information for: Individuals | Organisations",
        "selector": [
          "#main > div#page-short-course-audience-switcher"
        ],
        "style": null,
        "blocks": [
          "audience-switcher"
        ],
        "defaultContent": []
      },
      {
        "id": "sc-b2b-notice",
        "name": "Organisations-only notice",
        "selector": [
          "#main > div.section:has(> .section__inner > div.notice)"
        ],
        "style": null,
        "blocks": [
          "notice"
        ],
        "defaultContent": []
      },
      {
        "id": "sc-key-facts",
        "name": "Key facts",
        "selector": [
          "#main > div.key-facts"
        ],
        "style": "grey",
        "blocks": [
          "key-facts"
        ],
        "defaultContent": []
      },
      {
        "id": "sc-overview",
        "name": "Level up with micro-credentials (benefits band)",
        "selector": [
          "#main > section#overview"
        ],
        "style": null,
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          "#overview > .section-alt__inner > h2"
        ]
      },
      {
        "id": "sc-what-you-will-learn",
        "name": "What you will learn (overlap banner)",
        "selector": [
          "#main > section#what-you-will-learn"
        ],
        "style": null,
        "blocks": [
          "columns-overlap"
        ],
        "defaultContent": []
      },
      {
        "id": "sc-who",
        "name": "Who you will learn from",
        "selector": [
          "#main > section#who-you-will-learn-from"
        ],
        "style": "grey",
        "blocks": [
          "cards-people"
        ],
        "defaultContent": [
          "#who-you-will-learn-from .section-alt__left > *"
        ]
      },
      {
        "id": "sc-hear",
        "name": "What people are saying",
        "selector": [
          "#main > section#hear-from-students"
        ],
        "style": null,
        "blocks": [
          "quote"
        ],
        "defaultContent": [
          "#hear-from-students .section-alt__left > *"
        ]
      },
      {
        "id": "sc-series",
        "name": "More from this series",
        "selector": [
          "#main > section.section-alt:not([id]):has(ul.page-short-course__course-list)"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "sc-fees",
        "name": "Fees",
        "selector": [
          "#main > section#fees"
        ],
        "style": null,
        "blocks": [
          "cards-tile"
        ],
        "defaultContent": [
          "#fees .section-alt__inner > h2"
        ]
      },
      {
        "id": "sc-dates",
        "name": "Dates",
        "selector": [
          "#main > section#dates"
        ],
        "style": "grey",
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "sc-course-details",
        "name": "Course details",
        "selector": [
          "#main > section#course-specifics"
        ],
        "style": null,
        "blocks": [
          "accordion"
        ],
        "defaultContent": [
          "#course-specifics .section-alt__left > *"
        ]
      },
      {
        "id": "banner-hero",
        "name": "Page banner (first ct-campaignbanner)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner:not(:is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner ~ div.ct-campaignbanner, #main > .optimizely_experiment:has(> span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner) ~ div.ct-campaignbanner, #main > div.ct-campaignbanner ~ .optimizely_experiment > span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner, #main > .optimizely_experiment:has(> span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner) ~ .optimizely_experiment > span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner)"
        ],
        "style": null,
        "blocks": [
          "hero-split",
          "hero"
        ],
        "defaultContent": []
      },
      {
        "id": "banner-feature",
        "name": "Later banner (in-content navy feature)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-campaignbanner ~ div.ct-campaignbanner",
          "#main > .optimizely_experiment:has(> span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner) ~ div.ct-campaignbanner",
          "#main > div.ct-campaignbanner ~ .optimizely_experiment > span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner",
          "#main > .optimizely_experiment:has(> span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner) ~ .optimizely_experiment > span.optimizely_experiment__block:first-of-type > div.ct-campaignbanner"
        ],
        "style": "navy",
        "blocks": [
          "hero-split",
          "hero"
        ],
        "defaultContent": []
      },
      {
        "id": "search-banner",
        "name": "Feature + link tiles (ct-searchbanner)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-searchbanner"
        ],
        "style": null,
        "blocks": [
          "hero-split-light",
          "cards-tile"
        ],
        "defaultContent": []
      },
      {
        "id": "content-white",
        "name": "Rich text (content-block)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block:not(.bg-alt):not(.bg-inverted):not(.nopadtop)"
        ],
        "style": null,
        "blocks": [
          "table",
          "notice",
          "video"
        ],
        "defaultContent": [
          ":scope > .content-block__inner > *"
        ]
      },
      {
        "id": "content-grey",
        "name": "Rich text on grey (content-block.bg-alt)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-alt:not(.nopadtop)"
        ],
        "style": "grey",
        "blocks": [
          "table",
          "notice",
          "video"
        ],
        "defaultContent": [
          ":scope > .content-block__inner > *"
        ]
      },
      {
        "id": "content-navy",
        "name": "Rich text on navy (content-block.bg-inverted)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-inverted:not(.nopadtop)"
        ],
        "style": "navy",
        "blocks": [
          "table",
          "notice",
          "video"
        ],
        "defaultContent": [
          ":scope > .content-block__inner > *"
        ]
      },
      {
        "id": "text-column-white",
        "name": "Heading | text (ct-textcolumnlayout, no banner)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:not(:has(.section-alt__img-wrapper)):not(:has(> section.bg-alt))"
        ],
        "style": null,
        "blocks": [
          "columns-text-column"
        ],
        "defaultContent": []
      },
      {
        "id": "text-column-grey",
        "name": "Heading | text on grey (ct-textcolumnlayout.bg-alt, no banner)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:not(:has(.section-alt__img-wrapper)):has(> section.bg-alt)"
        ],
        "style": "grey",
        "blocks": [
          "columns-text-column"
        ],
        "defaultContent": []
      },
      {
        "id": "text-column-overlap",
        "name": "Banner + overlap panel (ct-textcolumnlayout)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textcolumnlayout:has(.section-alt__img-wrapper)"
        ],
        "style": null,
        "blocks": [
          "columns-overlap"
        ],
        "defaultContent": []
      },
      {
        "id": "crest-navy",
        "name": "Centred call to action on navy (ct-section-crest)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-crest:is(.bg-inverted, .bg-inverted-dark)"
        ],
        "style": "navy, centered",
        "blocks": [],
        "defaultContent": [
          ":scope > .section__inner > *"
        ]
      },
      {
        "id": "crest-grey",
        "name": "Centred call to action on grey (ct-section-crest)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-crest.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [],
        "defaultContent": [
          ":scope > .section__inner > *"
        ]
      },
      {
        "id": "quicklinks",
        "name": "Subscribe / quick links strip",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.slimline-quicklinks"
        ],
        "style": "grey, centered",
        "blocks": [],
        "defaultContent": [
          ":scope .uom-link-list a"
        ]
      },
      {
        "id": "in-page-nav",
        "name": "On this page (ct-inpagenav)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-inpagenav"
        ],
        "style": "grey",
        "blocks": [],
        "defaultContent": [
          ":scope section .section-alt__left > *",
          ":scope section ul.in-page-navigation-v2__list"
        ]
      },
      {
        "id": "image-full-width",
        "name": "Full-width image",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-imagefullwidth",
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.full-width-image"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ":scope > div.full-width-image",
          ":scope > img"
        ]
      },
      {
        "id": "plain-div",
        "name": "Untyped text wrapper",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div:not([class]):has(> div > :is(h2, h3, p))"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ":scope > div > *"
        ]
      },
      {
        "id": "features-white",
        "name": "Feature cards (ct-featurespanel)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": "centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "features-grey",
        "name": "Feature cards on grey",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "features-navy",
        "name": "Feature cards on navy",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel:is(.bg-inverted, .bg-inverted-dark)"
        ],
        "style": "navy, centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "todolist",
        "name": "Looking for personalised advice? (ct-section-todolist)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-todolist"
        ],
        "style": "grey",
        "blocks": [
          "cards-tile"
        ],
        "defaultContent": [
          ":scope > .content-block > .content-block__inner > *",
          ":scope .todo-list__inner"
        ]
      },
      {
        "id": "pathfinder-white",
        "name": "Link tiles (ct-pathfinder)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-pathfinder:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": "centered",
        "blocks": [
          "cards-tile"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p, div:not(.grid))"
        ]
      },
      {
        "id": "pathfinder-grey",
        "name": "Link tiles on grey (ct-pathfinder)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-pathfinder.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards-tile"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p, div:not(.grid))"
        ]
      },
      {
        "id": "pathfinder-today",
        "name": "Link list tiles (pathfinder-today)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.pathfinder-today"
        ],
        "style": null,
        "blocks": [
          "cards-tile"
        ],
        "defaultContent": [
          ":scope [role=navigation] > :is(h2, h3)"
        ]
      },
      {
        "id": "pathfinder-today-navy",
        "name": "Link tiles on navy (PD category)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.bg-inverted:has(> div.pathfinder-today)"
        ],
        "style": "navy",
        "blocks": [
          "cards-tile"
        ],
        "defaultContent": [
          ":scope .pathfinder-today > div > div > :is(h2, h3, p)"
        ]
      },
      {
        "id": "sublink-menu",
        "name": "Browse other areas (sublink menus)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section__inner:has(> div.grid .sublink-menu)"
        ],
        "style": null,
        "blocks": [
          "cards-link-list"
        ],
        "defaultContent": [
          ":scope > :is(h2, h3, p)"
        ]
      },
      {
        "id": "three-col-white",
        "name": "Three columns (ct-textthreecolumn)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": "centered",
        "blocks": [
          "cards-icon",
          "cards-tile"
        ],
        "defaultContent": [
          ":scope > div > :is(h2, h3, p)"
        ]
      },
      {
        "id": "three-col-grey",
        "name": "Three columns on grey (ct-textthreecolumn)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards-icon",
          "cards-tile"
        ],
        "defaultContent": [
          ":scope > div > :is(h2, h3, p)"
        ]
      },
      {
        "id": "focusbox",
        "name": "Why study with us? (ct-focusbox)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusbox"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, p)"
        ]
      },
      {
        "id": "factscard",
        "name": "Facts / stat tiles (ct-factscard)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-factscard"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "imagelisting",
        "name": "Logo wall (ct-imagelisting)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-imagelisting"
        ],
        "style": "centered",
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "documentlisting",
        "name": "Resources + brochures (ct-documentlisting)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-documentlisting"
        ],
        "style": "grey",
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, div, h5)"
        ]
      },
      {
        "id": "profilelist-white",
        "name": "Experts (ct-profilelist)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-profilelist:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": "centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "profilelist-grey",
        "name": "Experts on grey (ct-profilelist)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-profilelist.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "pagelisting-white",
        "name": "Page cards (ct-pagelisting)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-pagelisting:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": "centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "pagelisting-grey",
        "name": "Page cards on grey (ct-pagelisting)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.ct-pagelisting.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "newslisting",
        "name": "News cards (ct-newslisting)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "eventslisting",
        "name": "Upcoming events (ct-eventslisting, static copy)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-eventslisting"
        ],
        "style": "centered",
        "blocks": [
          "cards"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "coursecards-white",
        "name": "Course cards (ct-coursecards)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursecards:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": "centered",
        "blocks": [
          "cards-chips"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, p)"
        ]
      },
      {
        "id": "coursecards-grey",
        "name": "Course cards on grey (ct-coursecards)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursecards.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "cards-chips"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, p)"
        ]
      },
      {
        "id": "statsrankings-navy",
        "name": "Stats and rankings on navy",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-statsrankings:is(.bg-inverted, .bg-inverted-dark)"
        ],
        "style": "navy",
        "blocks": [
          "cards-stat"
        ],
        "defaultContent": [
          ":scope .uom-stats-and-rankings__citation",
          ":scope > .section__inner > :is(h2, h3)"
        ]
      },
      {
        "id": "statsrankings-white",
        "name": "Stats and rankings",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-statsrankings:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": null,
        "blocks": [
          "cards-stat"
        ],
        "defaultContent": [
          ":scope .uom-stats-and-rankings__citation",
          ":scope > .section__inner > :is(h2, h3)"
        ]
      },
      {
        "id": "article-cards",
        "name": "You might also be interested in (article cards)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt.hardcode"
        ],
        "style": "grey",
        "blocks": [
          "cards-tile"
        ],
        "defaultContent": [
          ":scope > .section-alt__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "study-area-chips",
        "name": "Browse by study / skill area (heading | chips)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > section.section-alt:not([id]):not(.ct-searchbanner):has(ul.card-course-list)"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "split-navy",
        "name": "Image | text split on navy (ct-section-image)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:is(.bg-inverted, .bg-inverted-dark)"
        ],
        "style": "navy",
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "split-grey",
        "name": "Image | text split on grey (ct-section-image)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image.bg-alt"
        ],
        "style": "grey",
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "split-white",
        "name": "Image | text split (ct-section-image)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": null,
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "tile-split-navy",
        "name": "Split tile on navy (tile-split-section)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section:has(> div.bg-inverted)"
        ],
        "style": "navy",
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "tile-split-grey",
        "name": "Split tile on grey (tile-split-section)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section.bg-alt"
        ],
        "style": "grey",
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "tile-split-white",
        "name": "Split tile (tile-split-section)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.tile-split-section:not(.bg-alt):not(:has(> div.bg-inverted))"
        ],
        "style": null,
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "menu",
        "name": "Image | link panel (ct-menu)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-menu"
        ],
        "style": "grey",
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "texttwocolumn-white",
        "name": "Heading | text (ct-section-texttwocolumn)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-texttwocolumn:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "texttwocolumn-grey",
        "name": "Heading | text on grey (ct-section-texttwocolumn)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-texttwocolumn.bg-alt"
        ],
        "style": "grey",
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "textwithfigures-white",
        "name": "Text with inset figure",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textwithfigures:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "textwithfigures-grey",
        "name": "Text with inset figure on grey",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textwithfigures.bg-alt"
        ],
        "style": "grey",
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "video-split-white",
        "name": "Intro | video (ct-video.section-alt)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section-alt:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": null,
        "blocks": [
          "video-split"
        ],
        "defaultContent": []
      },
      {
        "id": "video-split-navy",
        "name": "Intro | video on navy (ct-video.section-alt)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section-alt:is(.bg-inverted, .bg-inverted-dark)"
        ],
        "style": "navy",
        "blocks": [
          "video-split"
        ],
        "defaultContent": []
      },
      {
        "id": "video-white",
        "name": "Centred video (ct-video.section)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": "centered",
        "blocks": [
          "video"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "video-grey",
        "name": "Centred video on grey (ct-video.section)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-video.section.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "video"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "testimonial-cols-white",
        "name": "Heading | testimonials (ct-testimonial.section-alt)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section-alt:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": null,
        "blocks": [
          "quote",
          "video-shorts"
        ],
        "defaultContent": [
          ":scope .section-alt__left > *"
        ]
      },
      {
        "id": "testimonial-cols-grey",
        "name": "Heading | testimonials on grey",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section-alt.bg-alt"
        ],
        "style": "grey",
        "blocks": [
          "quote",
          "video-shorts"
        ],
        "defaultContent": [
          ":scope .section-alt__left > *"
        ]
      },
      {
        "id": "testimonial-focus-white",
        "name": "Testimonial (ct-testimonial card-focus)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": "centered",
        "blocks": [
          "quote"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "testimonial-focus-grey",
        "name": "Testimonial on grey (ct-testimonial card-focus)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-testimonial.section.bg-alt"
        ],
        "style": "grey, centered",
        "blocks": [
          "quote"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "accordion-white",
        "name": "Intro | accordion (ct-accordion)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
        ],
        "style": null,
        "blocks": [
          "accordion"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "accordion-grey",
        "name": "Intro | accordion on grey (ct-accordion)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion.bg-alt"
        ],
        "style": "grey",
        "blocks": [
          "accordion"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "accordion-navy",
        "name": "Intro | accordion on navy (ct-accordion)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-accordion:is(.bg-inverted, .bg-inverted-dark)"
        ],
        "style": "navy",
        "blocks": [
          "accordion"
        ],
        "defaultContent": [
          ":scope > .section__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "sectionfocus",
        "name": "Photo + centred panel (ct-sectionfocus)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-sectionfocus"
        ],
        "style": null,
        "blocks": [
          "callout-photo"
        ],
        "defaultContent": []
      },
      {
        "id": "focusboxpathfinder",
        "name": "Two navy link panels (ct-focusboxpathfinder)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusboxpathfinder"
        ],
        "style": "navy",
        "blocks": [
          "cards-tile"
        ],
        "defaultContent": []
      },
      {
        "id": "coursesearch",
        "name": "Course search (ct-coursesearch)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-coursesearch"
        ],
        "style": "grey",
        "blocks": [
          "search"
        ],
        "defaultContent": []
      },
      {
        "id": "course-listing",
        "name": "Online course browser (widget)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.CourseListing"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ":scope > .content-block.bg-inverted > .content-block__inner > :is(h2, h3, p)"
        ]
      },
      {
        "id": "conversion-tool",
        "name": "Grade conversion calculator (widget)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section:has(#conversion-tool-app)"
        ],
        "style": "grey",
        "blocks": [],
        "defaultContent": []
      },
      {
        "id": "on-demand-library",
        "name": "On-demand video library (Video library block)",
        "selector": [
          ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.filter-category"
        ],
        "style": "navy",
        "blocks": [
          "video-library"
        ],
        "defaultContent": []
      }
    ],
    "sectionMatching": {
      "mode": "all",
      "rule": "Unlike course-detail (first match), each section selector is applied with querySelectorAll: EVERY matching element starts a section with that entry's style. Selectors are mutually exclusive by construction (bg-alt / bg-inverted / plain variants, :not(X ~ X) for first banners). Elements matching joinWithPrevious never start a section.",
      "root": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type)",
      "joinWithPrevious": [
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.content-block.nopadtop",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting + div.content-block",
        ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-textthreecolumn + div.ct-textthreecolumn:not(:has(> div > :is(h2, h3)))"
      ]
    },
    "audienceContract": {
      "key": "Audience",
      "values": [
        "individuals",
        "organisations"
      ],
      "defaultAudience": "individuals",
      "switcher": {
        "block": "audience-switcher",
        "rows": [
          [
            "Information for"
          ],
          [
            "Individuals",
            "individuals"
          ],
          [
            "Organisations",
            "organisations"
          ]
        ],
        "sourceValues": {
          "b2c": "individuals",
          "b2b": "organisations"
        }
      },
      "template": "template#excat-organisations",
      "pagesFlag": 'html[data-excat-views="individuals,organisations"]',
      "parts": [
        "body (main#main of the organisations view)",
        "hero (div.page-header-alt)",
        "key-facts (div.key-facts)"
      ],
      "sections": {
        "sc-hero": {
          "audience": "individuals",
          "part": "hero",
          "selector": [
            "div.page-header-alt"
          ]
        },
        "sc-key-facts": {
          "audience": "individuals",
          "part": "key-facts",
          "selector": [
            "div.key-facts"
          ]
        },
        "sc-fees": {
          "audience": "individuals",
          "part": "body",
          "selector": [
            "#main > section#fees"
          ],
          "whenMissing": "individuals-only"
        },
        "sc-dates": {
          "audience": "individuals",
          "part": "body",
          "selector": [
            "#main > section#dates"
          ],
          "whenMissing": "individuals-only"
        }
      },
      "compareRule": "Every other section is compared with its body-part counterpart (same selector inside the part). Identical text (after cleanup; svg/img/script/style removed) and hrefs = no split. Different = split (individuals copy + organisations clone). Present in the part but absent in the live DOM = organisations-only: insert the clone after the nearest preceding section that exists in both views and key it Audience=organisations.",
      "whenMissing": {
        "individuals-only": "Template present, counterpart absent in the organisations body part: key the live element Audience=individuals, insert no clone.",
        "organisations-only": "Element only in the organisations part: insert the clone (see compareRule), key it Audience=organisations.",
        "no-template": "No template#excat-organisations (227 of 258 pages, incl. the 11 b2b-only and 16 b2c-only micro-credentials): single view, no Audience keys, no switcher."
      }
    },
    "chrome": [
      ".screen-reader-jump-to",
      "uom-ds-mega-menu",
      "uom-ds-font-loader-component",
      "#__nuxt header",
      "#ui > header",
      "#ui > nav.uom-breadcrumbs",
      'div.breadcrumbs-bar[data-test="breadcrumbs-bar"]',
      "footer.uom-page-footer",
      "#__tealiumGDPRecModal",
      ".tealium_privacy_prompt",
      "#teleports",
      'iframe[src*="optimizely"]',
      ":is(#ui, #main) > section.uom-link-list-section",
      "dash-cart",
      "#main > div.stickyPanel",
      "#main div.in-page-nav-today",
      "#observerSensor",
      "#liveagent",
      "#main > .optimizely_experiment > span.optimizely_experiment__block:not(:first-of-type)",
      "div.ct-inpagenav nav.in-page-navigation-v2__collapsed",
      "#main > link",
      "#main > meta",
      "#main style",
      "#main script",
      "#main div[id]:not([class]):empty",
      "#main > div:not([class]):not([id]):empty",
      "#main > p[id]:empty",
      "div.ct-eventslisting:not(:has(li.event)):not(:has(table))",
      'img[src^="data:image/svg+xml"]:not(:is(.section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left) img)',
      ".uom-link__icon",
      ".uom-icon",
      "span.screenreaders-only",
      ".sr-only",
      "span.togglerow__chevron",
      ".uom-video-controls",
      "#who-you-will-learn-from .page-short-course__profile-content > :empty",
      ".ct-textcolumnlayout .card-flat-list:not(:has(a, img, p, h3))",
      "template#excat-organisations"
    ],
    "drops": [
      {
        "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-focusboxpathfinder > img",
        "reason": "ct-focusboxpathfinder background photo: Cards (tile) on navy keeps the two panels, not the photo (components analysis M.1)"
      }
    ],
    "widgets": [
      {
        "section": "conversion-tool",
        "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.section:has(#conversion-tool-app)",
        "widget": "/widgets/grade-conversion-calculator.html",
        "note": 'Vue eligibility calculator (#conversion-tool-app); no authorable content. The region becomes a <p><a href="/widgets/grade-conversion-calculator.html"> link, which scripts.js turns into a widget block.'
      },
      {
        "section": "course-listing",
        "selector": ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.CourseListing",
        "widget": "/widgets/online-course-listing.html",
        "keep": ":scope > .content-block.bg-inverted",
        "note": 'JS course browser (study area / duration filters, Load more). Keep the intro h3 + p as default content, replace the form and results with a <p><a href="/widgets/online-course-listing.html"> link (widget block); the ct-coursesearch Search block above already links to /find.'
      }
    ],
    "fragmentContract": {
      "rule": 'A region whose section is listed here becomes a fragment include when its identity matches: after the cleanup transformer, clone the region element, drop svg/script/style, then text = textContent with whitespace collapsed and trimmed; links = every a[href] trimmed, origin https://study.unimelb.edu.au and trailing slash removed, joined with "|"; media = every img[src] not starting with data:, joined with "|". Hash each string with djb2-xor (h = 5381; for each UTF-16 code unit c: h = ((h * 33) ^ c) >>> 0; result h.toString(36)). All three hashes must equal the fragment identity. Match: replace the region with a section holding only <p><a href="{path}">{path}</a></p> and NO Section Metadata (style lives in the fragment). No match: import the region inline as usual (that page keeps its own copy).',
      "fragmentDocument": 'Each fragment is imported once, from sourcePage, as its own document at {path} using the same section mapping (blocks, default content, Section Metadata style). scripts.js buildAutoBlocks loads every a[href*="/fragments/"] link and replaces its paragraph with the fragment content.',
      "threshold": "text+links+media identical on 3 or more pages. 2-page pairs stay inline (listed in mapping-notes).",
      "fragments": [
        {
          "slug": "personalised-advice",
          "path": "/fragments/section-landing/personalised-advice",
          "section": "todolist",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-todolist"
          ],
          "identity": {
            "text": "70ye8e",
            "links": "1jg5mz3",
            "media": "1y7ueht",
            "chars": 324,
            "startsWith": "Looking for personalised advice?Find out more about our grad"
          },
          "byteIdentical": false,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/career-pathways",
          "pageCount": 43
        },
        {
          "slug": "micro-credential-benefits",
          "path": "/fragments/section-landing/micro-credential-benefits",
          "section": "sc-overview",
          "selector": [
            "#main > section#overview"
          ],
          "identity": {
            "text": "353719",
            "links": "1r6hvfb",
            "media": "yv48qt",
            "chars": 447,
            "startsWith": "Level up with micro-credentialsIndustry-ready skillsDevelop "
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/acknowledgement-of-country",
          "pageCount": 33
        },
        {
          "slug": "organisations-only-notice",
          "path": "/fragments/section-landing/organisations-only-notice",
          "section": "sc-b2b-notice",
          "selector": [
            "#main > div.section:has(> .section__inner > div.notice)"
          ],
          "identity": {
            "text": "iuew8n",
            "links": "1nqhheo",
            "media": "45h",
            "chars": 81,
            "startsWith": "This course is available for organisations only. Explore ind"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/acknowledgement-of-country",
          "pageCount": 14
        },
        {
          "slug": "who-you-will-learn-from-belinda-allen",
          "path": "/fragments/section-landing/who-you-will-learn-from-belinda-allen",
          "section": "sc-who",
          "selector": [
            "#main > section#who-you-will-learn-from"
          ],
          "identity": {
            "text": "xqfy9z",
            "links": "45h",
            "media": "3j2zx4",
            "chars": 705,
            "startsWith": "Who you will learn fromLearn from skilled academics and prof"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/effective-leadership-communication",
          "pageCount": 5
        },
        {
          "slug": "who-you-will-learn-from-joseph-west",
          "path": "/fragments/section-landing/who-you-will-learn-from-joseph-west",
          "section": "sc-who",
          "selector": [
            "#main > section#who-you-will-learn-from"
          ],
          "identity": {
            "text": "1fhb4rr",
            "links": "45h",
            "media": "5j6h55",
            "chars": 669,
            "startsWith": "Who you will learn fromLearn from skilled academics and prof"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/build-custom-ai-tools-for-healthcare",
          "pageCount": 4
        },
        {
          "slug": "who-you-will-learn-from-matthew-campbell",
          "path": "/fragments/section-landing/who-you-will-learn-from-matthew-campbell",
          "section": "sc-who",
          "selector": [
            "#main > section#who-you-will-learn-from"
          ],
          "identity": {
            "text": "tabmvl",
            "links": "45h",
            "media": "ew4o4t",
            "chars": 315,
            "startsWith": "Who you will learn fromLearn from skilled academics and prof"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/find/microcredentials/indigenous-and-other-sovereignties",
          "pageCount": 4
        },
        {
          "slug": "executive-learning-insights-subscribe",
          "path": "/fragments/section-landing/executive-learning-insights-subscribe",
          "section": "quicklinks",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.slimline-quicklinks"
          ],
          "identity": {
            "text": "pnjcjb",
            "links": "o61hgn",
            "media": "45h",
            "chars": 40,
            "startsWith": "Subscribe to Executive Learning Insights"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations",
          "pageCount": 4
        },
        {
          "slug": "micro-credential-learning-features",
          "path": "/fragments/section-landing/micro-credential-learning-features",
          "section": "pathfinder-today-navy",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.bg-inverted:has(> div.pathfinder-today)"
          ],
          "identity": {
            "text": "1ehh6s3",
            "links": "11hxdh",
            "media": "45h",
            "chars": 376,
            "startsWith": "The freedom to choose when and how you learn Guided and self"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/creative-media",
          "pageCount": 4
        },
        {
          "slug": "international-students-resources",
          "path": "/fragments/section-landing/international-students-resources",
          "section": "sectionfocus",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-sectionfocus"
          ],
          "identity": {
            "text": "q5izlw",
            "links": "1l8ylxm",
            "media": "1nw80mp",
            "chars": 149,
            "startsWith": "Resources for international studentsExplore support, advice "
          },
          "byteIdentical": false,
          "sourcePage": "https://study.unimelb.edu.au/student-life/cost-of-living",
          "pageCount": 3
        },
        {
          "slug": "discuss-your-organisations-needs",
          "path": "/fragments/section-landing/discuss-your-organisations-needs",
          "section": "split-navy",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-section-image:is(.bg-inverted, .bg-inverted-dark)"
          ],
          "identity": {
            "text": "yrsbc8",
            "links": "qccicr",
            "media": "17efb2o",
            "chars": 139,
            "startsWith": "Discuss your organisation's needsWhether you're looking for "
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations",
          "pageCount": 3
        },
        {
          "slug": "pdo-featured-courses",
          "path": "/fragments/section-landing/pdo-featured-courses",
          "section": "content-grey",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-alt:not(.nopadtop)"
          ],
          "identity": {
            "text": "1i71131",
            "links": "45h",
            "media": "45h",
            "chars": 177,
            "startsWith": "Featured coursesBrowse a selection of our courses. We offer "
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/ai-cyber-and-digital",
          "pageCount": 3
        },
        {
          "slug": "pdo-learning-formats",
          "path": "/fragments/section-landing/pdo-learning-formats",
          "section": "features-white",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-featurespanel:not(.bg-alt):not(.bg-inverted):not(.bg-inverted-dark)"
          ],
          "identity": {
            "text": "5oehut",
            "links": "45h",
            "media": "45h",
            "chars": 483,
            "startsWith": "Choose the learning format that fits your needsChoose a sing"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/ai-cyber-and-digital",
          "pageCount": 3
        },
        {
          "slug": "pdo-how-we-partner",
          "path": "/fragments/section-landing/pdo-how-we-partner",
          "section": "factscard",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-factscard"
          ],
          "identity": {
            "text": "gzlc1x",
            "links": "45h",
            "media": "45h",
            "chars": 456,
            "startsWith": "How we partner with you1. Clarify your goalsWe listen, sharp"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/ai-cyber-and-digital",
          "pageCount": 3
        },
        {
          "slug": "pdo-newsroom",
          "path": "/fragments/section-landing/pdo-newsroom",
          "section": "newslisting",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > div.ct-newslisting"
          ],
          "identity": {
            "text": "uwiluh",
            "links": "1g4f4s9",
            "media": "1w4n86o",
            "chars": 728,
            "startsWith": "Professional development newsroomNew leadership immersion pr"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations/ai-cyber-and-digital",
          "pageCount": 3
        },
        {
          "slug": "why-micro-credentials",
          "path": "/fragments/section-landing/why-micro-credentials",
          "section": "content-navy",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-inverted:not(.nopadtop)"
          ],
          "identity": {
            "text": "5tukqq",
            "links": "45h",
            "media": "1g3wgyz",
            "chars": 294,
            "startsWith": "Why micro-credentials?Micro-credentials are innovative onlin"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/creative-media",
          "pageCount": 3
        },
        {
          "slug": "micro-credentials-and-short-courses",
          "path": "/fragments/section-landing/micro-credentials-and-short-courses",
          "section": "content-navy",
          "selector": [
            ":is(#main, #main > .optimizely_experiment > span.optimizely_experiment__block:first-of-type) > :is(div, section).content-block.bg-inverted:not(.nopadtop)"
          ],
          "identity": {
            "text": "uihhei",
            "links": "11hxdh",
            "media": "45h",
            "chars": 608,
            "startsWith": "Micro-credentialsShort coursesAdvance your knowledge, skills"
          },
          "byteIdentical": true,
          "sourcePage": "https://study.unimelb.edu.au/study-with-us/professional-development/micro-credentials-and-short-courses-for-individuals/data-and-digital-transformation",
          "pageCount": 3
        }
      ]
    },
    "anchorRewrite": {
      "rule": 'Run before cleanup (cleanup removes the empty anchor divs). For every a[href] in #main content whose fragment targets this page (href="#x", or an absolute/relative URL to the same path with #x): resolve the target by decoded id (also try without the "navigation-" prefix); target heading = the element itself if h1-h6, else its first descendant heading, else the first heading after it in document order (empty anchor divs such as div#benefits). New href = "#" + EDS slug of that heading text (lower-case, NFD accents stripped, non [0-9a-z] -> "-", collapse and trim "-"). Unresolved targets keep the source href and are logged.',
      "survey": "145 in-page links on 110 pages: 101 self-URL links into a section whose first heading slug already equals the id (rewritten to bare #id), 27 heading-id rewrites (#navigation-\u2026 Matrix ids), 11 anchor-div rewrites (#apply -> #how-to-apply), 4+2 self-URL rewrites, 2 unresolved (vietnam #trinity, high-school-guide #navigation-<h3>need-help-or-advice-</h3>)."
    },
    "liveFeeds": {
      "rule": "Import a static copy (user decision c).",
      "feeds": [
        {
          "section": "eventslisting",
          "selector": "div.ct-eventslisting:has(li.event)",
          "block": "cards",
          "note": 'UMEP: 2 events (20 Oct and 17 Nov 2026); flag "expires 17 Nov 2026" in the import report. Empty listings (study-business, Instructional-Leadership-Spotlight-Series) are removed by cleanup.'
        },
        {
          "section": "newslisting",
          "selector": "div.ct-newslisting",
          "block": "cards",
          "note": 'Latest-news grids (7 pages): static copy of the visible cards; .cell.news.hidden ("load more") items are not imported. The PD newsroom grid is also a fragment (pdo-newsroom), so it is refreshed in one place.'
        }
      ]
    },
    "snapshotContracts": {
      "organisationsView": 'template#excat-organisations (8 micro-credential pages; html[data-excat-views="individuals,organisations"]): parts body (main#main of the organisations view), hero (div.page-header-alt), key-facts (div.key-facts). See audienceContract.',
      "clickToPlayVideo": "[data-excat-video-src] on the click-to-play root (div.uom-video in ct-video, div.video.video--portrait in video testimonials; 37 roots on 30 pages): the captured embed URL. Video parsers take the id from it and emit https://www.youtube.com/watch?v=<id>; poster from the root img; caption from the overlay title / duration. Never emit a video row without a link: if the attribute is missing, log video-url-missing and keep the poster as default content.",
      "lazyBackground": '[data-excat-bg] on elements whose image is a CSS background (full-width-image, ct-section-imagefullwidth, alumni__img, testimonials__img; 23 on 17 pages): the trimmed absolute image URL. Parsers/transformers turn it into an <img> (alt from aria-label) instead of parsing style="background-image".',
      "optimizely": "5 pages contain .optimizely_experiment; only the first span.optimizely_experiment__block is the default variant. All region selectors use the ROOT form, so they match whether or not the cleanup unwraps or keeps that span; the other spans are removed by cleanup.",
      "videoData": 'template#excat-video-data (/study-with-us/on-demand; capture-course-snapshots.mjs): the full :data JSON array of the <cards-filter-category> component (the rendered region holds only 12 cards and no video URLs), as text (& < > escaped), data-source="cards-filter-category:data". parsers/video-library.js reads it and applies tools/importer/on-demand-cleanup.json.'
    },
    "representativeUrls": [
      "https://study.unimelb.edu.au/find/short-courses/applied-learning-health-system",
      "https://study.unimelb.edu.au/find/microcredentials/leading-teams",
      "https://study.unimelb.edu.au/study-with-us/graduate-courses/study-education/positive-psychology-and-wellbeing-courses",
      "https://study.unimelb.edu.au/study-with-us/professional-development/for-organisations",
      "https://study.unimelb.edu.au/connect-with-us/international/vietnam"
    ]
  };
  var transformers = [
    transform,
    transform2,
    transform3,
    transform4
  ];
  var PICTOGRAM_HOLDERS2 = ".section-alt__inner-svg-icon, .card--focus-box__icon, .card__icons__left";
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE, unloadableImages: unloadable_images_default });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [];
        try {
          elements = document2.querySelectorAll(selector);
        } catch (e) {
          console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
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
  function removeCommentNodes(root, doc) {
    const walker = doc.createTreeWalker(
      root,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
    root.querySelectorAll("template").forEach((t) => {
      if (t.content) removeCommentNodes(t.content, doc);
    });
  }
  function djb22(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i += 1) h = (h * 33 ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function svgFromDataUri(src) {
    try {
      const b64 = /^data:image\/svg\+xml;base64,(.*)$/i.exec(src);
      if (b64) {
        const bin = atob(b64[1]);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        return new TextDecoder("utf-8").decode(bytes);
      }
      const raw = /^data:image\/svg\+xml(?:;charset=[^,]*)?,(.*)$/i.exec(src);
      return raw ? decodeURIComponent(raw[1]) : "";
    } catch (e) {
      return "";
    }
  }
  function tagCardThumbBackgrounds(document2) {
    document2.querySelectorAll('#main .card a.card__thumb[style*="background-image"]').forEach((a) => {
      const m = (a.getAttribute("style") || "").match(/url\(\s*["']?\s*([^"')]+?)\s*["']?\s*\)/);
      const card = a.closest(".card");
      if (m && !/^(none|data:|blob:)/i.test(m[1]) && card && !card.hasAttribute("data-excat-bg")) {
        card.setAttribute("data-excat-bg", m[1]);
      }
    });
  }
  function tagPictograms(root) {
    root.querySelectorAll(`:is(${PICTOGRAM_HOLDERS2}) img[src^="data:image/svg+xml"]`).forEach((img) => {
      const svg = svgFromDataUri(img.getAttribute("src") || "");
      if (!svg) return;
      const key = djb22(svg.replace(/\s+/g, " ").replace(/> </g, "><").trim());
      const name = pictogram_map_default[key];
      if (name) img.setAttribute("data-excat-icon", name);
      else console.warn(`[import] pictogram not in pictogram-map.json: ${key}`);
    });
    root.querySelectorAll(`img[src^="data:image/svg+xml"]:not(:is(${PICTOGRAM_HOLDERS2}) img)`).forEach((img) => img.remove());
    root.querySelectorAll("template").forEach((t) => {
      if (t.content) tagPictograms(t.content);
    });
  }
  function finishInlineImages(main, document2) {
    main.querySelectorAll("img[data-excat-icon]").forEach((img) => {
      const p = document2.createElement("p");
      p.textContent = `:uom-${img.getAttribute("data-excat-icon")}:`;
      const holder = img.closest(PICTOGRAM_HOLDERS2) || img;
      holder.replaceWith(p);
    });
    main.querySelectorAll('img[src^="blob:"], img[src^="data:"]').forEach((img) => {
      console.warn("[import] inline image dropped (no URL to import)");
      const holder = img.closest(PICTOGRAM_HOLDERS2);
      (holder || img).remove();
    });
  }
  function fragmentSlugOf(url) {
    const m = /#excat-fragment=([a-z0-9-]+)$/i.exec(url || "");
    return m ? m[1] : null;
  }
  var import_section_landing_default = {
    preprocess: ({ document: document2 }) => {
      removeCommentNodes(document2.documentElement, document2);
      tagPictograms(document2.documentElement);
      tagCardThumbBackgrounds(document2);
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      const slug = fragmentSlugOf(params.originalURL) || fragmentSlugOf(url);
      const tPayload = slug ? __spreadProps(__spreadValues({}, payload), { excatFragment: slug }) : payload;
      executeTransformers("beforeTransform", main, tPayload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      const trace = typeof window !== "undefined" && window.__excatTrace || null;
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode || !block.element.isConnected) return;
        const parser = parsers[block.name];
        if (!parser) {
          console.warn(`No parser found for block: ${block.name}`);
          return;
        }
        let start = null;
        let end = null;
        let srcHtml = "";
        if (trace) {
          srcHtml = block.element.outerHTML;
          start = document2.createComment("excat-trace");
          end = document2.createComment("excat-trace");
          block.element.before(start);
          block.element.after(end);
        }
        try {
          parser(block.element, {
            document: document2,
            url,
            params,
            template: PAGE_TEMPLATE.name,
            onDemandCleanup: on_demand_cleanup_default
          });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
        if (trace) {
          let out = "";
          for (let n = start.nextSibling; n && n !== end; n = n.nextSibling) out += n.outerHTML || n.textContent || "";
          trace.push({ name: block.name, selector: block.selector, src: srcHtml, out });
          start.remove();
          end.remove();
        }
      });
      finishInlineImages(main, document2);
      executeTransformers("afterTransform", main, tPayload);
      const mode = document2.excatFragmentMode;
      if (slug) {
        if (!mode || !mode.found) {
          console.warn(`[import] fragment-missing: ${slug} on ${params.originalURL}`);
          return [];
        }
        WebImporter.rules.transformBackgroundImages(main, document2);
        WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
        return [{
          element: main,
          path: WebImporter.FileUtils.sanitizePath(mode.path),
          report: { title: `fragment ${slug}`, template: PAGE_TEMPLATE.name, fragment: slug, sourcePage: mode.sourcePage || params.originalURL }
        }];
      }
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name),
          fragments: (document2.excatFragments || []).map((f) => f.slug).join(" "),
          droppedImages: (document2.excatDroppedImages || []).join(" ")
        }
      }];
    }
  };
  return __toCommonJS(import_section_landing_exports);
})();
