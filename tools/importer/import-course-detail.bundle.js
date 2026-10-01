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

  // tools/importer/import-course-detail.js
  var import_course_detail_exports = {};
  __export(import_course_detail_exports, {
    default: () => import_course_detail_default
  });

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
    const clean5 = document2.createElement("img");
    clean5.src = img.getAttribute("src");
    clean5.alt = img.getAttribute("alt") || "";
    return clean5;
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
    const link2 = document2.createElement("a");
    link2.href = a.getAttribute("href");
    link2.textContent = a.textContent.replace(/\s+/g, " ").trim();
    const p = document2.createElement("p");
    const wrap = document2.createElement(/btn--secondary/.test(a.className) ? "em" : "strong");
    wrap.append(link2);
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
        const link2 = document2.createElement("a");
        link2.href = a.getAttribute("href").trim();
        link2.textContent = cleanText(a);
        p.append(link2);
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
        const text = cleanText(li.querySelector(".uom-link__text") || a || li);
        if (!text) return;
        const item = document2.createElement("li");
        if (a) {
          const link2 = document2.createElement("a");
          link2.href = a.getAttribute("href").trim();
          link2.textContent = text;
          item.append(link2);
        } else {
          item.textContent = text;
        }
        ul.append(item);
      });
      if (ul.children.length) textCell2.push(ul);
    }
    element.querySelectorAll(".course-header__codes > li, .course-header__code").forEach((li) => {
      const spans = [...li.children];
      const label = cleanText(spans[0] || li).replace(/:\s*$/, "");
      if (!/^course code$/i.test(label)) return;
      const value = cleanText(li.querySelector(".text-bold, strong, b") || spans[1]);
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
  function parse(element, { document: document2 }) {
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
    const heading2 = element.querySelector("h1, h2, h3");
    if (heading2) heading2.textContent = heading2.textContent.replace(/\s+/g, " ").trim();
    const eyebrow = element.querySelector('.card-article-large__category, [class*="__category"], [class*="eyebrow"]');
    const contentRoot = element.querySelector(
      '.page-header-study__content-inner, .card-article-large__content, [class*="__content"]'
    ) || element;
    const paragraphs2 = [];
    [...contentRoot.querySelectorAll("p")].forEach((p) => {
      if (p === eyebrow || !p.textContent.trim()) return;
      if (p.closest("a, .btn")) return;
      paragraphs2.push(...splitParagraph(p, document2));
    });
    const ctas = [...contentRoot.querySelectorAll('a.btn, a[class*="btn--"], a.button')].filter((a, i, all) => all.indexOf(a) === i && a.getAttribute("href")).map((a) => ctaFrom(a, document2));
    const image = imageFrom(
      element.querySelector('.page-header-study__img, .card-article-large__img, [class*="__img"]') || element,
      document2
    );
    if (!heading2 && !paragraphs2.length) {
      element.replaceWith(...element.childNodes, ...preserved);
      return;
    }
    const textCell2 = [];
    if (eyebrow && eyebrow.textContent.trim()) {
      const ep = document2.createElement("p");
      ep.textContent = eyebrow.textContent.replace(/\s+/g, " ").trim();
      textCell2.push(ep);
    }
    if (heading2) textCell2.push(heading2);
    textCell2.push(...paragraphs2, ...ctas);
    const cells = [[textCell2, image ? [image] : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero (split)", cells });
    element.replaceWith(block);
    if (preserved.length) block.after(...preserved);
  }

  // tools/importer/parsers/hero-aside.js
  function cleanText2(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function link(a, document2) {
    const out = document2.createElement("a");
    out.href = (a.getAttribute("href") || "").trim();
    out.textContent = cleanText2(a);
    return out;
  }
  function parse2(element, { document: document2 }) {
    const main = element.querySelector(".course-section__main") || element;
    const aside = element.querySelector(".course-section__aside, .at-a-glance");
    const mainCell = [];
    [...main.children].forEach((child) => {
      if (!cleanText2(child) && !child.querySelector("img")) return;
      if (/^H[1-6]$/.test(child.tagName)) {
        const h = document2.createElement(child.tagName.toLowerCase());
        h.textContent = cleanText2(child);
        mainCell.push(h);
      } else {
        mainCell.push(child);
      }
    });
    const asideCell = [];
    if (aside) {
      const title = aside.querySelector('.parent-courses__title, [data-test="parent-courses-title"]');
      if (cleanText2(title)) {
        const p = document2.createElement("p");
        p.textContent = cleanText2(title);
        asideCell.push(p);
      }
      const courses = [...aside.querySelectorAll('.parent-courses a[href], a[data-test="parent-courses-link"]')].filter((a, i, all) => all.indexOf(a) === i && cleanText2(a));
      if (courses.length) {
        const ul = document2.createElement("ul");
        courses.forEach((a) => {
          const li = document2.createElement("li");
          li.append(link(a, document2));
          ul.append(li);
        });
        asideCell.push(ul);
      }
      const actions = [...aside.querySelectorAll(".qual-actions a[href], .quals-actions--padded a[href]")].filter((a, i, all) => all.indexOf(a) === i && cleanText2(a) && !courses.includes(a));
      actions.forEach((a, i) => {
        const p = document2.createElement("p");
        const l = link(a, document2);
        if (i === 0) {
          const strong = document2.createElement("strong");
          strong.append(l);
          p.append(strong);
        } else if (/btn--secondary/.test(a.className)) {
          const em = document2.createElement("em");
          em.append(l);
          p.append(em);
        } else {
          p.append(l);
        }
        asideCell.push(p);
      });
    }
    if (!mainCell.length && !asideCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = [mainCell];
    if (asideCell.length) row.push(asideCell);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Hero (aside)", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/audience-switcher.js
  function cleanText3(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function slugify(text) {
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function parse3(element, { document: document2 }) {
    const label = cleanText3(element.querySelector(".uom-form-label__text, .uom-form-label, legend"));
    let options = [...element.querySelectorAll(".uom-radio")].map((radio) => {
      const input = radio.querySelector("input");
      const text = cleanText3(radio.querySelector("label") || radio);
      return { text, key: input && input.getAttribute("value") || slugify(text) };
    });
    if (!options.length) {
      options = [...element.querySelectorAll('input[type="radio"]')].map((input) => {
        const lbl = input.id ? element.querySelector(`label[for="${input.id}"]`) : input.closest("label");
        const text = cleanText3(lbl);
        return { text, key: input.getAttribute("value") || slugify(text) };
      });
    }
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
    "english language requirements": "english-language"
  };
  function cleanText4(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function linkFrom(a, document2) {
    const link2 = document2.createElement("a");
    link2.href = (a.getAttribute("href") || "").trim();
    link2.textContent = cleanText4(a);
    return link2;
  }
  function valueCell(value, document2) {
    const paras = [];
    let current = document2.createElement("p");
    const flush = () => {
      if (cleanText4(current) || current.querySelector("a, img")) {
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
  function parse4(element, { document: document2 }) {
    const cells = [];
    let items = [...element.querySelectorAll(".key-facts-section__main--item")];
    if (!items.length) items = [...element.querySelectorAll(".key-facts-section__main > div")];
    items.forEach((item) => {
      const label = cleanText4(item.querySelector('.key-facts-section__main--title, [class*="--title"]'));
      const value = item.querySelector('.key-facts-section__main--value, [class*="--value"]');
      if (!label || !value || !cleanText4(value)) return;
      const icon = ICONS[label.toLowerCase()];
      const labelP = document2.createElement("p");
      labelP.textContent = icon ? `:${icon}: ${label}` : label;
      const extras = [...item.children].filter((c) => c !== value && !c.matches('.key-facts-section__main--icon, .key-facts-section__main--title, [class*="--title"], [class*="--icon"]') && cleanText4(c));
      const valueParas = valueCell(value, document2);
      extras.forEach((c) => valueParas.push(...valueCell(c, document2)));
      cells.push([[labelP], valueParas]);
    });
    element.querySelectorAll("ul[data-excat-hero-codes] > li").forEach((li) => {
      const parts = [...li.children];
      const label = cleanText4(parts[0] || li).replace(/:\s*$/, "");
      const value = cleanText4(li.querySelector(".text-bold, strong, b") || parts[1]);
      if (!label || !value || /^course code$/i.test(label)) return;
      cells.push([label, value]);
    });
    const ctas = [...element.querySelectorAll(".key-facts-cta a[href]")].filter((a, i, all) => all.indexOf(a) === i && cleanText4(a));
    ctas.forEach((a) => {
      const p = document2.createElement("p");
      const link2 = linkFrom(a, document2);
      const cls = a.className || "";
      if (/btn--secondary/.test(cls)) {
        const em = document2.createElement("em");
        em.append(link2);
        p.append(em);
      } else if (/btn--text/.test(cls) || !/btn/.test(cls)) {
        p.append(link2);
      } else {
        const strong = document2.createElement("strong");
        strong.append(link2);
        p.append(strong);
      }
      cells.push([[p]]);
    });
    element.querySelectorAll(".key-facts-cta .cta-panel-message").forEach((m) => {
      if (!cleanText4(m) || m.querySelector("a")) return;
      const p = document2.createElement("p");
      p.textContent = cleanText4(m);
      cells.push([[p]]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Key Facts", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/residency-notice.js
  var TITLES = { domestic: "Domestic student", international: "International student" };
  function cleanText5(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function strongP(text, document2) {
    const p = document2.createElement("p");
    const strong = document2.createElement("strong");
    strong.textContent = text;
    p.append(strong);
    return p;
  }
  function infoParas(info, document2) {
    if (!info) return [];
    const paras = info.tagName === "P" ? [info] : [...info.querySelectorAll("p")];
    if (!paras.length && cleanText5(info)) {
      const p = document2.createElement("p");
      p.textContent = cleanText5(info);
      return [p];
    }
    return paras.filter((p) => cleanText5(p)).map((p) => {
      const out = document2.createElement("p");
      out.innerHTML = p.innerHTML;
      return out;
    });
  }
  function audienceCell(root, audience, select, document2) {
    const titleEl = root.querySelector('[data-test="profile-residency--title"]');
    let title = cleanText5(titleEl);
    if (!title && select) {
      const opt = select.querySelector(`option[value="${audience}"]`);
      title = cleanText5(opt);
    }
    if (!title) title = TITLES[audience] || "";
    const info = root.querySelector('[data-test="profile-residency--info"]');
    const cell = [];
    if (title) cell.push(strongP(title, document2));
    cell.push(...infoParas(info, document2));
    return cell;
  }
  function parse5(element, { document: document2 }) {
    const intlWrap = element.querySelector(':scope > [data-excat-residency], :scope > [data-excat-audience="international"]');
    if (intlWrap) intlWrap.remove();
    const select = element.querySelector('select#profile-residency, select[data-test="profile-residency"]');
    const selected = select && select.querySelector("option[selected]");
    const domesticKey = selected && selected.getAttribute("value") || "domestic";
    const cells = [];
    const domestic = audienceCell(element, domesticKey, select, document2);
    if (domestic.length) cells.push([domesticKey, domestic]);
    if (intlWrap) {
      const intl = audienceCell(intlWrap, "international", select, document2);
      if (intl.length) cells.push(["international", intl]);
    } else {
      console.warn("[residency-notice] no international residency copy (audience-missing): domestic row only");
    }
    element.querySelectorAll("p.text-inline").forEach((p) => {
      if (!cleanText5(p)) return;
      const out = document2.createElement("p");
      out.innerHTML = p.innerHTML;
      cells.push([[out]]);
    });
    const entry = element.querySelector("#selectpgentry");
    if (entry) {
      const cell = [];
      const label = cleanText5(entry.querySelector(".uom-form-label__text, legend"));
      const options = [...entry.querySelectorAll("#program-select-radio-group label, .uom-radio label")].filter((l, i, all) => all.indexOf(l) === i && !l.closest(".uom-form-label")).map((l) => cleanText5(l)).filter(Boolean);
      if (label) cell.push(strongP(label, document2));
      if (options.length) {
        const ul = document2.createElement("ul");
        options.forEach((t) => {
          const li = document2.createElement("li");
          li.textContent = t;
          ul.append(li);
        });
        cell.push(ul);
      }
      entry.querySelectorAll("p").forEach((p) => {
        if (!cleanText5(p)) return;
        const out = document2.createElement("p");
        const small = p.querySelector(":scope > small");
        out.innerHTML = (small || p).innerHTML.trim();
        cell.push(out);
      });
      if (cell.length) cells.push([cell]);
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Residency Notice", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stat.js
  function cleanText6(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function para(text, document2) {
    const p = document2.createElement("p");
    p.textContent = text;
    return p;
  }
  function descParas(desc, document2) {
    if (!desc || !cleanText6(desc) && !desc.querySelector("img")) return [];
    const blocks = [...desc.children].filter((c) => /^(P|UL|OL|H[1-6]|TABLE)$/.test(c.tagName));
    if (blocks.length) {
      const out = [];
      let loose = document2.createElement("p");
      [...desc.childNodes].forEach((n) => {
        if (n.nodeType === 1 && blocks.includes(n)) {
          if (cleanText6(loose)) out.push(loose);
          loose = document2.createElement("p");
          out.push(n);
        } else if (n.nodeType !== 8) {
          loose.append(n);
        }
      });
      if (cleanText6(loose)) out.push(loose);
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
      const title = cleanText6(card.querySelector('.info-card__title, [data-test="info-card-title"]'));
      const value = cleanText6(card.querySelector('.info-card__value, [data-test="info-card-value"]'));
      const label = cleanText6(card.querySelector('.info-card__label, [data-test="info-card-label"]'));
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
  function parse6(element, { document: document2 }) {
    const cells = statRows(element, document2);
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["stat"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-chips.js
  function cleanText7(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function parse7(element, { document: document2 }) {
    let items = [...element.querySelectorAll(":scope > li")];
    if (!items.length) items = [...element.querySelectorAll(".card-course-list__item, li")];
    const cells = [];
    items.forEach((li) => {
      const a = li.querySelector("a[href]");
      const text = cleanText7(li.querySelector(".card-course__name") || a || li);
      if (!text) return;
      const p = document2.createElement("p");
      if (a) {
        const link2 = document2.createElement("a");
        link2.href = a.getAttribute("href").trim();
        link2.textContent = text;
        p.append(link2);
      } else {
        p.textContent = text;
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

  // tools/importer/parsers/cards-people.js
  var BLOCKED_IMAGES2 = [];
  function cleanText8(el) {
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
  function parse8(element, { document: document2 }) {
    let cards = [...element.querySelectorAll(".card--showcase-profile")];
    if (!cards.length) cards = [...element.querySelectorAll(".card")];
    const cells = [];
    cards.forEach((card) => {
      const inner = card.querySelector(".card__inner") || card;
      const titleEl = inner.querySelector(".card__title, h1, h2, h3, h4, h5, h6");
      const name = cleanText8(titleEl);
      const body = [];
      if (name) {
        const h = document2.createElement("h5");
        h.textContent = name;
        body.push(h);
      }
      [...inner.querySelectorAll("p, ul, ol")].forEach((el) => {
        if (el.closest(".card__thumb") || !cleanText8(el)) return;
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

  // tools/importer/parsers/cards.js
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
  function backgroundUrl(el) {
    if (!el) return "";
    const attr = el.getAttribute("data-bg") || el.getAttribute("data-background-image");
    if (attr) return absolute(attr.trim());
    const m = (el.getAttribute("style") || "").match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    return m && m[2] && !m[2].startsWith("data:") ? absolute(m[2].trim()) : "";
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
    const thumb = thumbs.find((el) => backgroundUrl(el));
    if (!thumb) return null;
    out.src = backgroundUrl(thumb);
    out.alt = thumb.getAttribute("aria-label") || "";
    return out;
  }
  var BLOCKED_IMAGES3 = [];
  function parse9(element, { document: document2 }) {
    const course = !!element.closest('.course-content, .course-section__main, [data-test$="-page"]');
    let cards = [...element.querySelectorAll(".card")];
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > div")];
    const cells = [];
    cards.forEach((card) => {
      const body = [];
      const heading2 = card.querySelector("h2, h3, h4, h5, h6, .card__title, .card__header");
      if (heading2 && clean(heading2)) {
        let tag = /^H[2-6]$/.test(heading2.tagName) ? heading2.tagName.toLowerCase() : "h3";
        if (course) tag = "h5";
        const h = document2.createElement(tag);
        const br = course ? heading2.querySelector(":scope > br") : null;
        if (br) {
          const rest = document2.createElement("p");
          let n = br.nextSibling;
          while (n) {
            const next = n.nextSibling;
            rest.append(n);
            n = next;
          }
          br.remove();
          h.textContent = clean(heading2);
          body.push(h);
          if (clean(rest)) body.push(rest);
        } else {
          h.textContent = clean(heading2);
          body.push(h);
        }
      }
      if (course) {
        const parts = [...card.querySelectorAll(".card__inner p, .card__inner ul, .card__inner ol, .card__meta")].filter((p, i, all) => all.indexOf(p) === i && clean(p) && !p.parentElement.closest("p, ul, ol"));
        parts.forEach((p) => {
          p.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", a.getAttribute("href").trim()));
          body.push(p);
        });
        const footer = card.querySelector(".card__footer");
        if (footer && clean(footer)) {
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
          if ([...all].indexOf(p) !== i || !clean(p)) return;
          const para3 = document2.createElement("p");
          para3.textContent = clean(p);
          body.push(para3);
        });
      }
      const cta = course ? null : card.querySelector(".card__footer a[href], a.btn[href]");
      if (cta) {
        cta.querySelectorAll(".screenreaders-only, .sr-only").forEach((s) => s.remove());
        const link2 = document2.createElement("a");
        link2.href = cta.getAttribute("href").trim();
        link2.textContent = clean(cta);
        const p = document2.createElement("p");
        p.append(link2);
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

  // tools/importer/parsers/cards-icon.js
  function clean2(el) {
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
  function parse10(element, { document: document2 }) {
    const course = !!element.closest('.course-content, .course-section__main, [data-test$="-page"]');
    let cards = [...element.querySelectorAll(".card")];
    if (!cards.length) cards = [...element.querySelectorAll(":scope > .cell, :scope > div")];
    const cells = [];
    cards.forEach((card) => {
      const body = [];
      const heading2 = card.querySelector("h2, h3, h4, .card__title");
      const title = clean2(heading2);
      if (title) {
        const h = document2.createElement(course ? "h5" : /^H[2-6]$/.test(heading2.tagName) ? heading2.tagName.toLowerCase() : "h3");
        h.textContent = title;
        body.push(h);
      }
      card.querySelectorAll(".card__inner p, .card__meta").forEach((p, i, all) => {
        if (course && p === heading2) return;
        if ([...all].indexOf(p) !== i || !clean2(p)) return;
        const para3 = document2.createElement("p");
        para3.textContent = clean2(p);
        body.push(para3);
      });
      const cta = card.querySelector(".card__footer a[href], a.btn[href]");
      if (cta) {
        cta.querySelectorAll(".screenreaders-only, .sr-only").forEach((s) => s.remove());
        const link2 = document2.createElement("a");
        link2.href = cta.getAttribute("href").trim();
        link2.textContent = clean2(cta);
        const p = document2.createElement("p");
        p.append(link2);
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

  // tools/importer/parsers/cards-course-link.js
  function parse11(element, { document: document2 }) {
    let items = [...element.querySelectorAll(":scope > li, :scope > .uom-link-list__item")];
    if (!items.length) items = [...element.querySelectorAll("li")];
    const cells = [];
    items.forEach((li) => {
      const a = li.querySelector("a[href]");
      if (!a) return;
      const textEl = a.querySelector(".uom-link__text") || a;
      const text = textEl.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const link2 = document2.createElement("a");
      link2.href = a.getAttribute("href").trim();
      link2.textContent = text;
      const p = document2.createElement("p");
      p.append(link2);
      cells.push([p]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["course-link"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function cleanText9(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs(root) {
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
      stripAttrs(cell);
      return [...cell.childNodes].filter((n) => n.nodeType === 1 || cleanText9(n));
    }
    const p = document2.createElement("p");
    p.innerHTML = cell.innerHTML.replace(/\s+/g, " ").trim();
    stripAttrs(p);
    if (!cleanText9(p) && !p.querySelector("img")) return "";
    if (bold && !(p.children.length === 1 && /^(STRONG|B)$/.test(p.firstElementChild.tagName) && cleanText9(p) === cleanText9(p.firstElementChild))) {
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
      const title = cleanText9(card.querySelector(".info-card__title"));
      const value = cleanText9(card.querySelector(".info-card__value"));
      const label = cleanText9(card.querySelector(".info-card__label"));
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
      if (desc && cleanText9(desc)) {
        const p = document2.createElement("p");
        p.innerHTML = desc.innerHTML.trim();
        stripAttrs(p);
        description = [p];
      }
      cells.push([stat, description]);
    });
    if (!cells.length) return null;
    return WebImporter.Blocks.createBlock(document2, { name: "Cards", variants: ["stat"], cells });
  }
  function panelRoot(panel) {
    let root = panel;
    while (root.children.length === 1 && root.firstElementChild.tagName === "DIV" && !cleanText9({ textContent: [...root.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("") })) {
      root = root.firstElementChild;
    }
    return root;
  }
  function answerContent(root, document2) {
    const out = [];
    [...root.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        if (cleanText9(node)) {
          const p = document2.createElement("p");
          p.textContent = cleanText9(node);
          out.push(p);
        }
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node;
      if (el.matches("table")) {
        const t = tableBlock(el, document2);
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
        if (!cleanText9(el)) return;
        const p = document2.createElement("p");
        p.innerHTML = el.innerHTML.trim();
        stripAttrs(p);
        out.push(p);
        return;
      }
      if (el.tagName === "DIV") {
        if (el.querySelector("table, .entry-reqs--language-reqs, ul.toggleblock, p, ul, ol, h1, h2, h3, h4, h5, h6")) {
          out.push(...answerContent(el, document2));
        } else if (cleanText9(el)) {
          const p = document2.createElement("p");
          p.innerHTML = el.innerHTML.trim();
          stripAttrs(p);
          out.push(p);
        }
        return;
      }
      if (!cleanText9(el) && !el.querySelector("img, iframe")) return;
      if (el.querySelector("table, ul.toggleblock")) {
        out.push(...answerContent(el, document2));
        return;
      }
      stripAttrs(el);
      out.push(el);
    });
    return out;
  }
  function accordionBlock(uls, document2) {
    const cells = [];
    uls.forEach((ul) => {
      const trigger = ul.querySelector(':scope > [data-testid="toggleblock-trigger"], :scope > .toggleblock__default');
      const panel = ul.querySelector(':scope > [data-testid="toggleblock-panel"], :scope > .toggleblock__hidden');
      const label = cleanText9(trigger && trigger.querySelector(".accordion__title") || trigger);
      if (!label) return;
      const answer = panel ? answerContent(panelRoot(panel), document2) : [];
      cells.push([label, answer.length ? answer : ""]);
    });
    if (!cells.length) return null;
    return WebImporter.Blocks.createBlock(document2, { name: "Accordion", cells });
  }
  function parse12(element, { document: document2 }) {
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
        if (!cleanText9(child) && !child.querySelector("img, iframe")) return;
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

  // tools/importer/parsers/tabs.js
  var SEP = " \xB7 ";
  function cleanText10(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs2(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      if (!el.attributes) return;
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|data-.*|aria-.*|target|rel)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    return root;
  }
  function para2(text, document2) {
    const p = document2.createElement("p");
    p.textContent = text;
    return p;
  }
  function heading(tag, text, document2) {
    const h = document2.createElement(tag);
    h.textContent = text;
    return h;
  }
  function paragraphs(el, document2) {
    if (!el || !cleanText10(el)) return [];
    const blocks = [...el.children].filter((c) => /^(P|UL|OL|H[1-6]|TABLE)$/.test(c.tagName));
    if (!blocks.length) {
      const p = document2.createElement("p");
      p.innerHTML = el.innerHTML.trim();
      return [stripAttrs2(p)];
    }
    const out = [];
    let loose = document2.createElement("p");
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 1 && blocks.includes(n)) {
        if (cleanText10(loose)) out.push(loose);
        loose = document2.createElement("p");
        if (cleanText10(n) || n.querySelector("img")) out.push(stripAttrs2(n));
      } else if (n.nodeType === 3 || n.nodeType === 1 && n.tagName !== "DIV") {
        loose.append(n);
      } else if (n.nodeType === 1) {
        if (cleanText10(loose)) out.push(loose);
        loose = document2.createElement("p");
        out.push(...paragraphs(n, document2));
      }
    });
    if (cleanText10(loose)) out.push(loose);
    return out;
  }
  function optionParts(document2, part) {
    const tpl = document2.querySelector("template#excat-options");
    if (!tpl) return [];
    const frag = tpl.content && tpl.content.childNodes.length ? tpl.content : tpl;
    return [...frag.querySelectorAll(`[data-excat-part="${part}"]`)];
  }
  function selectInfo(select) {
    if (!select) return { labels: [], selected: -1 };
    const opts = [...select.querySelectorAll("option")];
    const labels = opts.map((o) => cleanText10(o)).filter(Boolean);
    let selected = opts.findIndex((o) => o.hasAttribute("selected"));
    if (selected < 0) selected = 0;
    return { labels, selected };
  }
  function rootForOption(document2, part, rootSel, label, isSelected, live) {
    if (isSelected) return live;
    const match = optionParts(document2, part).find((p) => cleanText10({ textContent: p.getAttribute("data-option-label") || "" }) === label);
    if (!match) return null;
    const copy = document2.importNode(match, true);
    return copy.querySelector(rootSel) || copy.firstElementChild || copy;
  }
  function subjectAccordion(list, document2) {
    const items = [...list.querySelectorAll(":scope > ul.toggleblock, :scope > ul.subject-programs-list__item")];
    if (!items.length) items.push(...list.querySelectorAll("ul.toggleblock"));
    const cells = [];
    items.forEach((ul) => {
      const titleEl = ul.querySelector(".subject-programs-list__title") || ul.querySelector('[data-testid="toggleblock-trigger"]');
      if (!titleEl) return;
      const t = titleEl.cloneNode(true);
      t.querySelectorAll(".subject-programs-list__sub-title, .subject-programs-list__points, .togglerow__chevron").forEach((s) => s.remove());
      const title = cleanText10(t);
      if (!title) return;
      const points = cleanText10(ul.querySelector(".subject-programs-list__points"));
      const label = points ? `${title}${SEP}${points}` : title;
      const body = [];
      const content2 = ul.querySelector(".subject-programs-list-inner__content");
      if (content2) {
        [...content2.children].forEach((c) => body.push(...paragraphs(c, document2)));
      }
      ul.querySelectorAll(".subject-programs-list-inner__link a[href], a.subject-programs-list__link[href]").forEach((a, i, all) => {
        if ([...all].indexOf(a) !== i || !cleanText10(a)) return;
        const link2 = document2.createElement("a");
        link2.href = a.getAttribute("href").trim();
        link2.textContent = cleanText10(a);
        const p = document2.createElement("p");
        p.append(link2);
        body.push(p);
      });
      cells.push([label, body.length ? body : ""]);
    });
    if (!cells.length) return null;
    return WebImporter.Blocks.createBlock(document2, { name: "Accordion", cells });
  }
  function subjectPanel(section, document2) {
    const inner = section.querySelector(".app-tab__inner") || section;
    const out = [];
    inner.querySelectorAll(":scope > .subject-programs__description").forEach((d) => out.push(...paragraphs(d, document2)));
    const groups = [...inner.querySelectorAll(".subject-programs__group")];
    if (groups.length) {
      inner.querySelectorAll(":scope > .subject-programs-list").forEach((l) => {
        const a = subjectAccordion(l, document2);
        if (a) out.push(a);
      });
      groups.forEach((g) => {
        const title = cleanText10(g.querySelector(".subject-programs__group-title"));
        if (title && title !== "-") out.push(heading("h4", title, document2));
        g.querySelectorAll(":scope > .subject-programs__group-description, :scope > p").forEach((d) => out.push(...paragraphs(d, document2)));
        g.querySelectorAll(".subject-programs-list").forEach((l) => {
          const a = subjectAccordion(l, document2);
          if (a) out.push(a);
        });
      });
    } else {
      inner.querySelectorAll(".subject-programs-list").forEach((l) => {
        const a = subjectAccordion(l, document2);
        if (a) out.push(a);
      });
    }
    return out;
  }
  function subjectTabs(root, document2) {
    const tabsRoot = root.querySelector(".app-tabs") || root;
    const buttons = [...tabsRoot.querySelectorAll('button.app-tabs__tab, [role="tab"]')].filter((b, i, all) => all.indexOf(b) === i);
    const cells = [];
    buttons.forEach((btn) => {
      const label = cleanText10(btn.querySelector(".app-tabs__tab-title") || btn);
      const id = btn.getAttribute("aria-controls");
      const section = id ? tabsRoot.querySelector(`[id="${id}"]`) : null;
      if (!label || !section) return;
      const panel = subjectPanel(section, document2);
      cells.push([label, panel.length ? panel : ""]);
    });
    if (!cells.length) {
      const panel = subjectPanel(root, document2);
      if (!panel.length) return null;
      return { flat: panel };
    }
    return WebImporter.Blocks.createBlock(document2, { name: "Tabs", cells });
  }
  function parseSubjectPrograms(element, document2) {
    const select = element.querySelector(".subject-programs__dropdown select");
    const { labels, selected } = selectInfo(select);
    const extra = paragraphs(element.querySelector(".subject-programs__available-description"), document2);
    const out = [];
    if (labels.length > 1) {
      const missing = [];
      labels.forEach((label, i) => {
        const root = rootForOption(document2, "subject-programs", ".subject-programs", label, i === selected, element);
        if (!root) {
          missing.push(label);
          return;
        }
        const tabs = subjectTabs(root, document2);
        if (!tabs) return;
        out.push(heading("h4", label, document2));
        if (i === selected) out.push(...extra);
        else out.push(...paragraphs(root.querySelector(".subject-programs__available-description"), document2));
        if (tabs.flat) out.push(...tabs.flat);
        else out.push(tabs);
      });
      if (missing.length) console.warn(`[tabs] dropdown-options-not-captured (subject-programs): ${missing.join(" | ")}`);
    } else {
      out.push(...extra);
      const tabs = subjectTabs(element, document2);
      if (tabs) {
        if (tabs.flat) out.push(...tabs.flat);
        else out.push(tabs);
      }
    }
    return out;
  }
  function subjectLine(card, document2) {
    const li = document2.createElement("li");
    const parts = [];
    const title = cleanText10(card.querySelector(".sample-plan-card__title"));
    const type = cleanText10(card.querySelector(".sample-plan-card__type"));
    const codeA = card.querySelector(".sample-plan-card__link-label, .sample-plan-card__footer a");
    const points = cleanText10(card.querySelector(".sample-plan-card__points"));
    if (title) {
      const s = document2.createElement("strong");
      s.textContent = title;
      parts.push(s);
    }
    if (type) parts.push(type);
    if (codeA && cleanText10(codeA)) {
      if (codeA.getAttribute("href")) {
        const a = document2.createElement("a");
        a.href = codeA.getAttribute("href").trim();
        a.textContent = cleanText10(codeA);
        parts.push(a);
      } else {
        parts.push(cleanText10(codeA));
      }
    }
    if (points) parts.push(points);
    if (!parts.length) {
      const text = cleanText10(card);
      if (!text) return null;
      parts.push(text);
    }
    parts.forEach((p, i) => {
      if (i) li.append(" \u2013 ");
      li.append(p);
    });
    return li;
  }
  function yearAccordion(section, document2) {
    const cells = [];
    const year = cleanText10(section.querySelector(".sample-plan-section__year-label"));
    const yearPoints = cleanText10(section.querySelector(".sample-plan-section__year-points"));
    if (year || yearPoints) {
      const intro = [];
      if (year) intro.push(heading("h4", year, document2));
      if (yearPoints) intro.push(para2(yearPoints, document2));
      cells.push([intro]);
    }
    section.querySelectorAll("ul.sample-plan-section-accordion, .sample-plan-section__year-accordions > ul.toggleblock").forEach((ul, i, all) => {
      if ([...all].indexOf(ul) !== i) return;
      const sem = cleanText10(ul.querySelector(".sample-plan-semester__title"));
      const pts = cleanText10(ul.querySelector(".sample-plan-semester__points"));
      const label = [sem, pts].filter(Boolean).join(SEP) || cleanText10(ul.querySelector('[data-testid="toggleblock-trigger"]'));
      if (!label) return;
      const list = document2.createElement("ul");
      let subjects = [...ul.querySelectorAll(".sample-plan-card")];
      if (!subjects.length) subjects = [...ul.querySelectorAll(".sample-plan__subject")];
      subjects.forEach((card) => {
        const li = subjectLine(card, document2);
        if (li) list.append(li);
      });
      const body = [];
      if (list.children.length) body.push(list);
      const panel = ul.querySelector('[data-testid="toggleblock-panel"]');
      if (panel) {
        panel.querySelectorAll("p:not(.sample-plan-card *)").forEach((p) => {
          if (cleanText10(p)) body.push(stripAttrs2(p));
        });
      }
      cells.push([label, body.length ? body : ""]);
    });
    if (!cells.length) return null;
    return WebImporter.Blocks.createBlock(document2, { name: "Accordion", cells });
  }
  function planPanel(root, document2) {
    const out = [];
    root.querySelectorAll(":scope > .sample-plan__note, :scope > p").forEach((p) => {
      if (cleanText10(p)) out.push(para2(cleanText10(p), document2));
    });
    const sections = [...root.querySelectorAll(".sample-plan-section")];
    sections.forEach((s) => {
      const a = yearAccordion(s, document2);
      if (a) out.push(a);
    });
    return out;
  }
  function parseSamplePlan(element, document2) {
    const scope = element.closest("#sample-plans") || element.parentElement || element;
    const dropdown = element.querySelector(".sample-plan__dropdown") || scope.querySelector(".sample-plan__dropdown");
    const { labels, selected } = selectInfo(dropdown && dropdown.querySelector("select"));
    if (dropdown) dropdown.remove();
    if (labels.length <= 1) return planPanel(element, document2);
    const cells = [];
    const missing = [];
    labels.forEach((label, i) => {
      const root = rootForOption(document2, "sample-plan", ".sample-plan", label, i === selected, element);
      if (!root) {
        missing.push(label);
        return;
      }
      const panel = planPanel(root, document2);
      if (panel.length) cells.push([label, panel]);
    });
    if (missing.length) console.warn(`[tabs] dropdown-options-not-captured (sample-plan): ${missing.join(" | ")}`);
    if (!cells.length) return planPanel(element, document2);
    return [WebImporter.Blocks.createBlock(document2, { name: "Tabs", cells })];
  }
  function parse13(element, { document: document2 }) {
    let out = [];
    if (element.matches(".sample-plan") || element.querySelector(":scope > .sample-plan-section")) {
      out = parseSamplePlan(element, document2);
    } else {
      out = parseSubjectPrograms(element, document2);
    }
    if (!out.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = out.length === 1 ? out[0] : null;
    if (block) {
      element.replaceWith(block);
      return;
    }
    element.replaceWith(...out);
  }

  // tools/importer/parsers/notice.js
  function cleanText11(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs3(root) {
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
    const title = cleanText11(year.querySelector(".fee-info-panel__year-title, h4, h5"));
    if (title) {
      const h5 = document2.createElement("h5");
      h5.textContent = title;
      out.push(h5);
    }
    const ul = document2.createElement("ul");
    year.querySelectorAll("li.fee-item, .fee-list > li").forEach((item, i, all) => {
      if ([...all].indexOf(item) !== i) return;
      const li = document2.createElement("li");
      const t = cleanText11(item.querySelector(".fee-item__title"));
      const price = cleanText11(item.querySelector(".fee-item__price"));
      const desc = cleanText11(item.querySelector(".fee-item__desc"));
      if (t) li.append(t);
      if (price) {
        if (t) li.append(" ");
        const strong = document2.createElement("strong");
        strong.textContent = price;
        li.append(strong);
      }
      if (desc) li.append(` ${desc}`);
      if (!t && !price && !desc) li.textContent = cleanText11(item);
      if (cleanText11(li)) ul.append(li);
    });
    if (ul.children.length) out.push(ul);
    [...year.children].forEach((c) => {
      if (c.matches(".fee-info-panel__year-title, h4, h5, ul.fee-list, .fee-list") || !cleanText11(c)) return;
      out.push(...content(c, document2));
    });
    return out;
  }
  function content(root, document2) {
    const out = [];
    [...root.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (cleanText11(n)) {
          const p = document2.createElement("p");
          p.textContent = cleanText11(n);
          out.push(p);
        }
        return;
      }
      if (n.nodeType !== 1) return;
      if (n.matches(".fee-info-panel__fees")) {
        [...n.children].forEach((c) => {
          if (c.matches(".fee-info-panel__year")) out.push(...feeYear(c, document2));
          else if (cleanText11(c)) out.push(...content(c.matches(".notice") ? c : { childNodes: [c] }, document2));
        });
        return;
      }
      if (n.matches(".fee-info-panel__year")) {
        out.push(...feeYear(n, document2));
        return;
      }
      if (!cleanText11(n) && !n.querySelector("img")) return;
      if (/^(DIV|SECTION|SPAN)$/.test(n.tagName) && n.querySelector("p, ul, ol, h1, h2, h3, h4, h5, h6, .fee-info-panel__year")) {
        out.push(...content(n, document2));
        return;
      }
      if (/^(DIV|SPAN)$/.test(n.tagName)) {
        const p = document2.createElement("p");
        p.innerHTML = n.innerHTML.trim();
        out.push(stripAttrs3(p));
        return;
      }
      out.push(stripAttrs3(n));
    });
    return out;
  }
  function parse14(element, { document: document2 }) {
    const cell = [];
    if (element.matches(".fee-info-panel") || element.querySelector(".fee-info-panel__inner")) {
      const panel = element.matches(".fee-info-panel") ? element : element.querySelector(".fee-info-panel");
      const icon = panel.matches('[data-test="has-csp"]') ? "check" : "dollar";
      const title = cleanText11(panel.querySelector('.fee-info-panel__title h4, .fee-info-panel__title, [data-test="fee-panel-title"]'));
      const h4 = document2.createElement("h4");
      h4.textContent = title ? `:${icon}: ${title}` : `:${icon}:`;
      cell.push(h4);
      const text = panel.querySelector('.fee-info-panel__text, [data-test="fee-info-panel-text"]');
      if (text) cell.push(...content(text, document2));
    } else {
      const root = element.matches(".notice") ? element : element.querySelector(".notice") || element;
      cell.push(...content(root, document2));
    }
    if (!cell.length || !cell.some((el) => cleanText11(el))) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Notice", cells: [[cell]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/callout.js
  function cleanText12(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs4(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|data-.*|aria-.*)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    return root;
  }
  function ctaParagraph(a, document2) {
    const link2 = document2.createElement("a");
    link2.href = (a.getAttribute("href") || "").trim();
    link2.textContent = cleanText12(a);
    const wrap = document2.createElement(/btn--secondary/.test(a.className || "") ? "em" : "strong");
    wrap.append(link2);
    const p = document2.createElement("p");
    p.append(wrap);
    return p;
  }
  function parse15(element, { document: document2 }) {
    const cell = [];
    const ctas = [...element.querySelectorAll('a.btn[href], a[data-test="callout-panel-button"][href]')].filter((a, i, all) => all.indexOf(a) === i && cleanText12(a));
    const titles = [...element.querySelectorAll('.callout-panel__title, [data-test="callout-panel-title"], #eligibility-calculator-description')].filter((t, i, all) => all.indexOf(t) === i);
    if (titles.length) {
      titles.forEach((t) => {
        if (!cleanText12(t)) return;
        const p = document2.createElement("p");
        p.innerHTML = t.innerHTML.trim();
        cell.push(stripAttrs4(p));
      });
    } else {
      element.querySelectorAll("h2, h3, h4, h5, p").forEach((t) => {
        if (!cleanText12(t) || ctas.some((a) => t.contains(a) && cleanText12(t) === cleanText12(a))) return;
        cell.push(stripAttrs4(t));
      });
    }
    ctas.forEach((a) => cell.push(ctaParagraph(a, document2)));
    if (!cell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Callout", cells: [[cell]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/timeline-key-dates.js
  function cleanText13(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function parse16(element, { document: document2 }) {
    const cells = [];
    const alt = element.matches(".date-list--alt") || !!element.closest("#key-application-dates");
    const label = cleanText13(element.querySelector('.date-list__label, [data-test="date-list-label"]'));
    const title = cleanText13(element.querySelector('.date-list__title, [data-test="date-list-title"]'));
    const header = [];
    if (alt) {
      if (title) {
        const h4 = document2.createElement("h4");
        h4.textContent = title;
        header.push(h4);
      } else if (label) {
        const h4 = document2.createElement("h4");
        h4.textContent = label;
        header.push(h4);
      }
    } else {
      if (label) {
        const p = document2.createElement("p");
        p.textContent = label;
        header.push(p);
      }
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        header.push(h3);
      }
    }
    if (header.length) cells.push([header]);
    let items = [...element.querySelectorAll(".date-list__list > li")];
    if (!items.length) items = [...element.querySelectorAll("li.date-entry, li.date-list--no-date-msg")];
    items.forEach((li) => {
      if (li.matches(".date-list--no-date-msg") || !li.querySelector(".date-entry__title, .date-entry__date")) {
        const text = cleanText13(li);
        if (!text) return;
        const p = document2.createElement("p");
        p.textContent = text;
        cells.push([[p]]);
        return;
      }
      const date = cleanText13(li.querySelector('.date-entry__date, [data-test="date-entry-date"]'));
      const entry = cleanText13(li.querySelector('.date-entry__title, [data-test="date-entry-title"]'));
      const dateP = document2.createElement("p");
      dateP.textContent = date;
      const bodyP = document2.createElement("p");
      if (entry) {
        const strong = document2.createElement("strong");
        strong.textContent = entry;
        bodyP.append(strong);
      }
      const extra = [...li.querySelectorAll(".date-entry__inner > p, .date-entry__desc")].map((e) => cleanText13(e)).filter(Boolean);
      const body = [bodyP];
      extra.forEach((t) => {
        const p = document2.createElement("p");
        p.textContent = t;
        body.push(p);
      });
      cells.push([date ? [dateP] : "", body]);
    });
    [...element.children].forEach((c) => {
      if (c.matches(".date-list__header, .date-list__list, ul") || !cleanText13(c)) return;
      const p = document2.createElement("p");
      p.innerHTML = c.innerHTML.trim();
      cells.push([[p]]);
    });
    if (!cells.length || cells.length === 1 && header.length) {
      if (header.length) {
        element.replaceWith(...header);
        return;
      }
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Timeline", variants: ["key-dates"], cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/video.js
  function cleanText14(el) {
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
      const link2 = document2.createElement("a");
      link2.href = v.href;
      link2.textContent = (iframe.getAttribute("title") || "").replace(/\s+/g, " ").trim() || v.href;
      const p = document2.createElement("p");
      p.append(link2);
      const row = [[p]];
      if (v.poster) {
        const img = document2.createElement("img");
        img.src = v.poster;
        img.alt = (iframe.getAttribute("title") || "").trim();
        row.push([img]);
      }
      const caption = cleanText14(element.querySelector("figcaption"));
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
      if (cleanText14(cur)) (seen ? after : before).push(cur);
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
        if (cleanText14(n)) (seen ? after : before).push(n);
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

  // tools/importer/parsers/quote-profile.js
  var BLOCKED_IMAGES4 = [];
  function cleanText15(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs5(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|data-.*|aria-.*)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    return root;
  }
  function portrait2(element, name, document2) {
    const holder = element.querySelector(".alumniprofile__image .img, .alumniprofile__image");
    if (!holder) return null;
    const img = holder.querySelector("img");
    let src = img ? img.getAttribute("src") || img.getAttribute("data-src") || "" : "";
    if (!src || /^(data|blob):/.test(src)) {
      const styled = [holder, ...holder.querySelectorAll("[style]")].find((el) => /url\(/.test(el.getAttribute("style") || ""));
      const m = styled && styled.getAttribute("style").match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      src = m ? m[2].trim() : "";
    }
    if (!src || /^(data|blob):/.test(src)) return null;
    if (BLOCKED_IMAGES4.some((frag) => src.includes(frag))) {
      console.warn(`[quote-profile] image dropped (403): ${src}`);
      return null;
    }
    const out = document2.createElement("img");
    out.src = src;
    out.alt = img && img.getAttribute("alt") || name || "";
    return out;
  }
  function videoLink(iframe, document2) {
    const src = iframe.getAttribute("src") || "";
    let href = "";
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/"]+)/);
    const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (yt) href = `https://www.youtube.com/watch?v=${yt[1]}`;
    else if (vm) href = `https://vimeo.com/${vm[1]}`;
    else if (src) href = src;
    if (!href) return null;
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = (iframe.getAttribute("title") || "").trim() || href;
    const p = document2.createElement("p");
    p.append(a);
    return p;
  }
  function attribution(cite, document2) {
    const p = document2.createElement("p");
    cite.querySelectorAll("br").forEach((b) => b.remove());
    p.append(...cite.childNodes);
    stripAttrs5(p);
    const first2 = p.firstChild;
    if (first2 && first2.nodeType === 3) first2.textContent = first2.textContent.replace(/^\s*[—–-]?\s*/, "");
    p.prepend("\u2014 ");
    return p;
  }
  function lowerContent(root, document2) {
    const out = [];
    [...root.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (cleanText15(n)) {
          const p = document2.createElement("p");
          p.textContent = cleanText15(n);
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
      if (n.tagName === "BLOCKQUOTE") {
        const cites = [...n.querySelectorAll("cite")];
        cites.forEach((c) => c.remove());
        out.push(...lowerContent(n, document2));
        cites.forEach((c) => {
          if (!cleanText15(c)) return;
          out.push(attribution(c, document2));
        });
        return;
      }
      if (/^(DIV|SECTION|SPAN)$/.test(n.tagName)) {
        out.push(...lowerContent(n, document2));
        return;
      }
      if (n.querySelector("iframe")) {
        n.querySelectorAll("iframe").forEach((f) => {
          const v = videoLink(f, document2);
          f.remove();
          if (v) out.push(v);
        });
      }
      if (n.tagName === "P" && n.querySelector("cite")) {
        const cites = [...n.querySelectorAll("cite")];
        cites.forEach((c) => c.remove());
        if (cleanText15(n)) out.push(stripAttrs5(n));
        cites.forEach((c) => {
          if (!cleanText15(c)) return;
          out.push(attribution(c, document2));
        });
        return;
      }
      if (!cleanText15(n) && !n.querySelector("img")) return;
      out.push(stripAttrs5(n));
    });
    return out;
  }
  function parse18(element, { document: document2 }) {
    const text = [];
    const caption = cleanText15(element.querySelector(".alumniprofile__caption"));
    const name = cleanText15(element.querySelector(".alumniprofile__name"));
    if (caption) {
      const p = document2.createElement("p");
      p.textContent = caption;
      text.push(p);
    }
    if (name) {
      const h4 = document2.createElement("h4");
      h4.textContent = name;
      text.push(h4);
    }
    const upper = element.querySelector(".alumniprofile__upper");
    if (upper) {
      [...upper.children].forEach((c) => {
        if (c.matches(".alumniprofile__caption, .alumniprofile__name, button, .alumniprofile__trigger") || !cleanText15(c)) return;
        text.push(stripAttrs5(c));
      });
    }
    const lower = element.querySelector(".alumniprofile__lower") || element.querySelector('[data-testid="toggleblock-panel"]');
    if (lower) text.push(...lowerContent(lower, document2));
    if (!text.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const image = portrait2(element, name, document2);
    const row = image ? [text, [image]] : [text];
    const block = WebImporter.Blocks.createBlock(document2, { name: "Quote", variants: ["profile"], cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  function clean3(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function parseCourseQuote(root, document2) {
    const cites = [...root.querySelectorAll("cite")];
    cites.forEach((c) => c.remove());
    const paras = [];
    let loose = document2.createElement("p");
    const flush = () => {
      if (clean3(loose)) paras.push(loose);
      loose = document2.createElement("p");
    };
    [...root.childNodes].forEach((n) => {
      if (n.nodeType === 8) return;
      if (n.nodeType === 1 && /^(P|DIV|UL|OL)$/.test(n.tagName)) {
        flush();
        if (!clean3(n)) return;
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
    const text = [...paras];
    cites.forEach((c) => {
      if (!clean3(c)) return;
      const p = document2.createElement("p");
      c.querySelectorAll("br").forEach((b) => b.remove());
      p.append(...c.childNodes);
      const first2 = p.firstChild;
      if (first2 && first2.nodeType === 3) first2.textContent = first2.textContent.replace(/^\s*[—–-]?\s*/, "");
      p.prepend("\u2014 ");
      text.push(p);
    });
    return text;
  }
  function parse19(element, { document: document2 }) {
    const root = element.matches("blockquote") ? element : element.querySelector("blockquote") || element;
    if (element.closest('.course-content, .course-section__main, [data-test$="-page"]')) {
      const text2 = parseCourseQuote(root, document2);
      if (!text2.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "Quote", cells: [[text2]] });
      element.replaceWith(block2);
      return;
    }
    const quoteParas = [...root.querySelectorAll("p")].filter((p) => !p.closest("cite") && clean3(p)).map((p) => {
      const out = document2.createElement("p");
      out.textContent = clean3(p);
      return out;
    });
    const citeEl = root.querySelector('cite, .testimonials-alt__name, [class*="__name"]');
    let attribution2 = null;
    if (citeEl && clean3(citeEl)) {
      attribution2 = document2.createElement("p");
      attribution2.textContent = `\u2014 ${clean3(citeEl).replace(/^[—–-]\s*/, "")}`;
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
    if (!quoteParas.length && !attribution2) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const text = [...quoteParas];
    if (attribution2) text.push(attribution2);
    const row = [text];
    if (image) row.push([image]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "Quote", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function cleanText16(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs6(root) {
    [root, ...root.querySelectorAll("*")].forEach((el) => {
      [...el.attributes].forEach((a) => {
        if (/^(style|class|id|tabindex|role|data-.*|aria-.*)$/i.test(a.name)) el.removeAttribute(a.name);
      });
    });
    return root;
  }
  function linkList(list, document2) {
    const ul = document2.createElement("ul");
    list.querySelectorAll(":scope > li").forEach((li) => {
      const a = li.querySelector("a[href]");
      const text = cleanText16(li.querySelector(".card-course__name") || a || li);
      if (!text) return;
      const item = document2.createElement("li");
      if (a) {
        const link2 = document2.createElement("a");
        link2.href = a.getAttribute("href").trim();
        link2.textContent = text;
        item.append(link2);
      } else {
        item.textContent = text;
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
        if (cleanText16(n)) {
          const p = document2.createElement("p");
          p.textContent = cleanText16(n);
          out.push(p);
        }
        return;
      }
      if (n.nodeType !== 1 || !cleanText16(n) && !n.querySelector("img")) return;
      if (n.matches("ul.card-course-list, ul")) {
        const ul = n.matches(".card-course-list") ? linkList(n, document2) : stripAttrs6(n);
        if (ul) out.push(ul);
        return;
      }
      if (/^H[1-6]$/.test(n.tagName)) {
        const h = document2.createElement(n.tagName.toLowerCase());
        h.textContent = cleanText16(n);
        out.push(h);
        return;
      }
      if (n.tagName === "DIV" || n.tagName === "SECTION") {
        out.push(...sideContent(n, document2));
        return;
      }
      out.push(stripAttrs6(n));
    });
    return out;
  }
  function parse20(element, { document: document2 }) {
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
  var SOURCE_ORIGIN2 = "https://study.unimelb.edu.au";
  function absolute2(src) {
    try {
      return new URL(src, `${SOURCE_ORIGIN2}/`).href;
    } catch (e) {
      return src;
    }
  }
  function backgroundUrl2(side) {
    const els = [side, ...side.querySelectorAll('[style*="background"], [data-bg], [data-background-image]')];
    for (const el of els) {
      const attr = el.getAttribute("data-bg") || el.getAttribute("data-background-image");
      if (attr) return absolute2(attr.trim());
      const m = (el.getAttribute("style") || "").match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      if (m && m[2] && !m[2].startsWith("data:")) return absolute2(m[2].trim());
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
      src = backgroundUrl2(side);
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
    [...root.querySelectorAll("p, h1, h2, h3, h4, a.btn")].forEach((el) => {
      if (el.matches("a.btn")) {
        const href = (el.getAttribute("href") || "").trim();
        const text = clean4(el);
        if (!href || !text) return;
        const link2 = document2.createElement("a");
        link2.href = href;
        link2.textContent = text;
        const wrap = document2.createElement(/btn--secondary/.test(el.className) ? "em" : "strong");
        wrap.append(link2);
        const p = document2.createElement("p");
        p.append(wrap);
        content2.push(p);
        return;
      }
      if (el.closest("a.btn") || !clean4(el)) return;
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
  function parse21(element, { document: document2 }) {
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

  // tools/importer/parsers/table.js
  function cleanText17(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }
  function stripAttrs7(root) {
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
      stripAttrs7(cell);
      return [...cell.childNodes].filter((n) => n.nodeType === 1 || cleanText17(n));
    }
    const p = document2.createElement("p");
    p.innerHTML = cell.innerHTML.replace(/\s+/g, " ").trim();
    stripAttrs7(p);
    if (!cleanText17(p) && !p.querySelector("img")) return "";
    if (bold && !(p.children.length === 1 && /^(STRONG|B)$/.test(p.firstElementChild.tagName) && cleanText17(p) === cleanText17(p.firstElementChild))) {
      const strong = document2.createElement("strong");
      strong.append(...p.childNodes);
      p.append(strong);
    }
    return [p];
  }
  function parse22(element, { document: document2 }) {
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
    if (caption && cleanText17(caption)) {
      const p = document2.createElement("p");
      p.textContent = cleanText17(caption);
      before.push(p);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "Table", cells });
    element.replaceWith(...before, block);
  }

  // tools/importer/transformers/unimelb-course-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var COURSE_CHROME_SELECTORS = [
    // Sticky CTA bar + tab sub-nav (#main > div > div.stickyPanel)
    "#main > div > div.stickyPanel",
    "div.stickyPanel",
    // Prev/next pager. On UG it is a child of B; on graduate ER/HTA it is a sibling of B.
    // In the international body part it sits inside [data-excat-part=body].
    "#main nav.bg-alt[aria-label='pagination links']",
    "[data-excat-part=body] nav.bg-alt",
    // "How can we help?" band
    "#main > div > div.slimline-cta",
    "div.slimline-cta",
    // Observer sentinel
    "#observerSensor",
    // Live-agent chat placeholder (bulk sweep)
    "#liveagent",
    // Breadcrumbs, saved courses
    "div.breadcrumbs-bar[data-test='breadcrumbs-bar']",
    "dash-cart",
    // Header / mega menu / skip links / font loader
    "#__nuxt header",
    "uom-ds-mega-menu",
    ".screen-reader-jump-to",
    "uom-ds-font-loader-component",
    // Footer (holds the only social/share icons on course pages)
    "footer.uom-page-footer",
    // Consent UI
    "#__tealiumGDPRecModal",
    ".tealium_privacy_prompt",
    "#teleports",
    // Optimizely client-storage iframe
    "iframe[src*='optimizely']",
    // Fees subtitle "(showing fees for domestic students - change)"
    "#fees span.header-icon__subtitle[data-test='fees-overview-subtitle']",
    "span.header-icon__subtitle[data-test='fees-overview-subtitle']",
    // UG entry-requirements qualification / start-year selects
    "#admission-requirements .user-profile__select:has(select[data-test='profile-qualification'])",
    "#admission-requirements .user-profile__select:has(select[data-test='profile-year'])",
    // Graduate residency "Change" link and the fees "change" link
    "a.btn--toggle[data-test=profile-toggle]",
    "a.btn--toggle[data-test=profile-toggle-fees]",
    // Key-facts "Save" widget
    "div.key-facts .key-facts-cta .cell:has(> dash-save-button)",
    "dash-save-button",
    // Decorative
    "#available-subjects .loading-overlay",
    "span.togglerow__chevron",
    "button[data-test='alumni-button']",
    ".date-entry__icon",
    ".push-icon img",
    "#main .uom-link__icon",
    ".uom-link__icon",
    "span.screenreaders-only",
    "img[src^='data:image/svg+xml']",
    // Non-authorable elements
    "script",
    "noscript",
    "style",
    "link"
  ];
  var AFTER_PARSE_SELECTORS = [
    "#sample-plans .sample-plan__dropdown",
    "#sample-plans .sample-plan-controls",
    // "Collapse all" / "Expand all"
    ".sample-plan-controls",
    "#available-subjects .subject-programs__dropdown",
    "#program-select-radio-group input[type=radio]",
    "#available-subjects .loading-overlay",
    "template#excat-international",
    "template#excat-options",
    'template[id^="excat-"]'
  ];
  var STUDY_HOST = /^https?:\/\/study\.unimelb\.edu\.au(?=[/?#]|$)/i;
  var ANCHOR_REWRITES = {
    "#explained": "#your-fees-explained",
    "#available-subjects": "#explore-this-course",
    "#available-pathways": "#graduate-pathways",
    "#sample-plans": "#sample-course-plan"
  };
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      let nodes = [];
      try {
        nodes = root.querySelectorAll(sel);
      } catch (e) {
        nodes = [];
      }
      nodes.forEach((n) => {
        if (n.isConnected || n.parentNode) n.remove();
      });
    });
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
  function fixCourseLinks(root) {
    root.querySelectorAll("a").forEach((a) => {
      ["target", "rel"].forEach((attr) => a.removeAttribute(attr));
      if (a.getAttribute("tabindex") === "-1") a.removeAttribute("tabindex");
      [...a.attributes].forEach((attr) => {
        if (/^(originalsrc|shash|data-auth|data-linkindex|data-ogsc|data-ogab)$/i.test(attr.name)) {
          a.removeAttribute(attr.name);
        }
      });
      if (!a.hasAttribute("href")) return;
      let href = a.getAttribute("href").trim();
      if (href.startsWith("//")) href = `https:${href}`;
      if (ANCHOR_REWRITES[href]) href = ANCHOR_REWRITES[href];
      if (STUDY_HOST.test(href)) {
        href = href.replace(STUDY_HOST, "") || "/";
        href = href.replace(/#nav$/, "");
        href = href.replace(/\/entry-requirement(?=[/?#]|$)/, "/entry-requirements");
        if (/[?&]fac=undefined/.test(href)) {
          console.warn(`[course-cleanup] source href with fac=undefined kept: ${href}`);
        }
      }
      if (href.startsWith("/") && !href.startsWith("//")) {
        href = href.replace(/^(\/[^?#]*?)\/+(?=[?#]|$)/, "$1");
      }
      if (href !== a.getAttribute("href")) a.setAttribute("href", href);
    });
  }
  function cleanCourseChrome(root) {
    removeAll(root, COURSE_CHROME_SELECTORS);
    root.querySelectorAll("svg").forEach((svg) => {
      if (svg.parentNode) svg.remove();
    });
    root.querySelectorAll("img").forEach((img) => {
      const src = (img.getAttribute("src") || "").trim();
      if (/^(?:data:image\/svg\+xml|blob:)/i.test(src)) img.remove();
    });
    root.querySelectorAll("table").forEach((t) => {
      if (!t.querySelector("td, th")) t.remove();
    });
    root.querySelectorAll(".course-content > div.ct-factscard-border").forEach((card) => {
      if (!card.querySelector("img, p, h1, h2, h3, h4, h5, h6, li, a")) card.remove();
    });
    removeComments(root);
    normalizeInlineFormats(root);
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
      if (parent && /^(DIV|SECTION|ARTICLE|ASIDE|MAIN|TD|TH|LI|BLOCKQUOTE|FIGURE|BODY)$/.test(parent.tagName) && [...parent.children].some((c) => !INLINE_TAGS.test(c.tagName))) {
        containers.add(parent);
      }
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
  function imageKey(raw) {
    if (!raw) return "";
    let v = String(raw).trim().replace(/&amp;/g, "&").replace(/^['"]|['"]$/g, "");
    if (!v || /^(data|blob):/.test(v)) return "";
    if (v.startsWith("//")) v = `https:${v}`;
    try {
      const u = new URL(v, "https://study.unimelb.edu.au/");
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
        img.getAttribute("data-lazy-src"),
        ...(img.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(/\s+/)[0])
      ];
      const hit = refs.map(imageKey).find((k) => k && blocked.has(k));
      if (!hit) return;
      dropped.add(hit);
      let target = img;
      const picture = img.closest("picture");
      if (picture) target = picture;
      const parent = target.parentElement;
      target.remove();
      if (parent && /^(P|A|SPAN|FIGURE)$/.test(parent.tagName) && !parent.textContent.trim() && !parent.querySelector("img, iframe, video")) parent.remove();
    });
    root.querySelectorAll('[style*="url("]').forEach((el) => {
      const style = el.getAttribute("style");
      const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      const key = m && imageKey(m[2]);
      if (key && blocked.has(key)) {
        dropped.add(key);
        el.setAttribute("style", style.replace(/background(?:-image)?\s*:[^;]*url\([^)]*\)[^;]*;?/gi, ""));
      }
    });
    root.querySelectorAll("meta[content]").forEach((meta) => {
      const key = imageKey(meta.getAttribute("content"));
      if (key && blocked.has(key)) {
        dropped.add(key);
        meta.remove();
      }
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      cleanCourseChrome(element);
      fixCourseLinks(element);
      const doc = element.ownerDocument || document;
      doc.querySelectorAll('template[id^="excat-"]').forEach((tpl) => {
        const frag = tpl.content && tpl.content.childNodes.length ? tpl.content : tpl;
        cleanCourseChrome(frag);
        fixCourseLinks(frag);
      });
      const blocked = new Set(payload && payload.unloadableImages || []);
      if (blocked.size) {
        const dropped = new Set(doc.excatDroppedImages || []);
        dropUnloadableImages(element, blocked, dropped);
        doc.querySelectorAll('template[id^="excat-"]').forEach((tpl) => {
          dropUnloadableImages(tpl.content && tpl.content.childNodes.length ? tpl.content : tpl, blocked, dropped);
        });
        if (doc.head) dropUnloadableImages(doc.head, blocked, dropped);
        doc.excatDroppedImages = [...dropped];
        dropped.forEach((u) => console.warn(`[course-cleanup] image dropped (cannot be loaded on the source): ${u}`));
      }
    }
    if (hookName === TransformHook.afterTransform) {
      removeAll(element, AFTER_PARSE_SELECTORS);
      removeAll(element, COURSE_CHROME_SELECTORS);
      fixCourseLinks(element);
      removeComments(element);
      element.querySelectorAll("[data-excat-audience], [data-excat-section-start], [data-excat-section-skip], [data-excat-hero-codes], [data-excat-residency], [data-excat-part]").forEach((el) => {
        ["data-excat-audience", "data-excat-section-start", "data-excat-section-skip", "data-excat-hero-codes", "data-excat-residency", "data-excat-part"].forEach((attr) => el.removeAttribute(attr));
      });
    }
  }

  // tools/importer/transformers/unimelb-course-audience.js
  var AUD_ATTR = "data-excat-audience";
  var START_ATTR = "data-excat-section-start";
  var SKIP_ATTR = "data-excat-section-skip";
  var HERO_CODES_ATTR = "data-excat-hero-codes";
  var RESIDENCY_ATTR = "data-excat-residency";
  var LOG = "[course-audience]";
  var DEFAULT_RESIDENCY_INSTANCES = [
    "#admission-requirements div.user-profile[data-test='entry-reqs-user-profile']",
    "#main div[data-test$='-page'] div.user-profile-toggle"
  ];
  function toList(selectors) {
    if (!selectors) return [];
    return Array.isArray(selectors) ? selectors : [selectors];
  }
  function first(root, selectors) {
    if (!root) return null;
    for (const sel of toList(selectors)) {
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
  function signature(el) {
    const copy = el.cloneNode(true);
    copy.querySelectorAll("svg, img, script, style").forEach((n) => n.remove());
    copy.querySelectorAll(`[${HERO_CODES_ATTR}]`).forEach((n) => n.removeAttribute(HERO_CODES_ATTR));
    const text = (copy.textContent || "").replace(/\s+/g, " ").trim();
    const hrefs = [...copy.querySelectorAll("a[href]")].map((a) => a.getAttribute("href").trim().replace(/\/+$/, "")).join("\n");
    return `${text}
--
${hrefs}`;
  }
  function loadParts(doc, contract) {
    const tpl = doc.querySelector(contract.template || "template#excat-international");
    if (!tpl) return null;
    const frag = tpl.content && tpl.content.childNodes.length ? tpl.content : tpl;
    const parts = {};
    frag.querySelectorAll("[data-excat-part]").forEach((p) => {
      const name = p.getAttribute("data-excat-part");
      if (!parts[name]) parts[name] = doc.importNode(p, true);
    });
    return parts;
  }
  function heroCodesCopy(ul) {
    const copy = ul.cloneNode(true);
    copy.removeAttribute("class");
    copy.removeAttribute("data-test");
    copy.setAttribute(HERO_CODES_ATTR, "");
    return copy;
  }
  function appendHeroCodes(keyFacts, codesUl) {
    if (!keyFacts || !codesUl) return;
    if (keyFacts.querySelector(`:scope > [${HERO_CODES_ATTR}]`)) return;
    keyFacts.append(heroCodesCopy(codesUl));
  }
  function markSplit(d, clone, id) {
    d.setAttribute(AUD_ATTR, "domestic");
    d.setAttribute(START_ATTR, id);
    clone.setAttribute(AUD_ATTR, "international");
    clone.setAttribute(START_ATTR, `${id}--international`);
    d.after(clone);
  }
  function addInternationalResidency(element, template, inBlock, bodyPart) {
    if (!inBlock || !bodyPart) return;
    const blockDef = (template.blocks || []).find((b) => b.name === "residency-notice");
    const instances = blockDef ? blockDef.instances : DEFAULT_RESIDENCY_INSTANCES;
    const doc = element.ownerDocument;
    toList(instances).forEach((sel) => {
      let blocks = [];
      try {
        blocks = element.querySelectorAll(sel);
      } catch (e) {
        blocks = [];
      }
      blocks.forEach((block) => {
        if (block.closest(`[${AUD_ATTR}="international"]`)) return;
        if (block.querySelector(`:scope > [${RESIDENCY_ATTR}]`)) return;
        const isGrad = block.matches("div.user-profile-toggle");
        const infoSel = toList(inBlock.selector).filter((s) => isGrad ? /user-profile-toggle/.test(s) : !/user-profile-toggle/.test(s));
        const info = first(bodyPart, infoSel);
        if (!info) {
          console.warn(`${LOG} audience-missing: residency-notice (${sel})`);
          return;
        }
        const wrap = doc.createElement("div");
        wrap.setAttribute(AUD_ATTR, "international");
        wrap.setAttribute(RESIDENCY_ATTR, "international");
        if (isGrad) {
          const title = first(bodyPart, inBlock.titleSelector);
          if (title) wrap.append(title.cloneNode(true));
        }
        wrap.append(info.cloneNode(true));
        block.append(wrap);
      });
    });
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template || {};
    const contract = template.audienceContract;
    if (hookName === "beforeTransform") {
      if (!contract || !contract.sections) return;
      const doc = element.ownerDocument || document;
      const sectionDefs = template.sections || [];
      const liveSelector = (id) => {
        const def = sectionDefs.find((s) => s.id === id);
        return def ? def.selector : contract.sections[id].selector;
      };
      const domesticKeyFacts = first(element, liveSelector("key-facts"));
      const domesticCodes = first(element, ["#main > div > div.course-header ul.course-header__codes", "div.course-header ul.course-header__codes"]);
      appendHeroCodes(domesticKeyFacts, domesticCodes);
      if (!element.querySelector("#user-profile-audience-switcher")) return;
      const parts = loadParts(doc, contract);
      if (!parts) {
        console.warn(`${LOG} audience-missing: no ${contract.template || "template#excat-international"} (domestic only, no Audience keys)`);
        return;
      }
      const split = {};
      Object.entries(contract.sections).forEach(([id, c]) => {
        const d = first(element, liveSelector(id));
        if (!d) return;
        if (d.hasAttribute(START_ATTR) || d.closest(`[${AUD_ATTR}]`)) return;
        const part = parts[c.part];
        const i = part ? first(part, c.selector) : null;
        if (id === "key-facts" && i && parts["hero-codes"]) {
          const intlCodes = first(parts["hero-codes"], contract.inBlock && contract.inBlock["key-facts"] && contract.inBlock["key-facts"].selector || "ul.course-header__codes");
          appendHeroCodes(i, intlCodes);
        }
        if (!i) {
          if (c.whenMissing === "domestic-only" && part) {
            d.setAttribute(AUD_ATTR, "domestic");
            d.setAttribute(START_ATTR, id);
            console.log(`${LOG} domestic-only: ${id}`);
          } else {
            console.warn(`${LOG} audience-missing: ${id}`);
          }
          return;
        }
        if (signature(d) === signature(i)) {
          console.log(`${LOG} identical (not split): ${id}`);
          return;
        }
        i.remove();
        markSplit(d, i, id);
        split[id] = { d, clone: i };
        console.log(`${LOG} split: ${id}`);
      });
      Object.entries(contract.sharedTails || {}).forEach(([tailId, ownerId]) => {
        const owner = split[ownerId];
        if (!owner) return;
        const tailSel = liveSelector(tailId);
        const dHead = first(owner.d, tailSel);
        const iHead = first(owner.clone, tailSel);
        const dTail = dHead ? [dHead, dHead.nextElementSibling].filter(Boolean) : [];
        const iTail = iHead ? [iHead, iHead.nextElementSibling].filter(Boolean) : [];
        const sig = (els) => els.map((e) => signature(e)).join("\n");
        if (dTail.length && iTail.length && sig(dTail) === sig(iTail)) {
          iTail.forEach((e) => e.remove());
          const wrap = doc.createElement("div");
          wrap.setAttribute(START_ATTR, tailId);
          dTail.forEach((e) => wrap.append(e));
          owner.clone.after(wrap);
        } else {
          const skip = (owner.d.getAttribute(SKIP_ATTR) || "").split(/\s+/).filter(Boolean);
          if (!skip.includes(tailId)) skip.push(tailId);
          owner.d.setAttribute(SKIP_ATTR, skip.join(" "));
        }
      });
      addInternationalResidency(element, template, contract.inBlock && contract.inBlock["residency-notice"], parts.body);
    }
    if (hookName === "afterTransform") {
      const doc = element.ownerDocument || document;
      doc.querySelectorAll("template#excat-international, template#excat-options").forEach((t) => t.remove());
    }
  }

  // tools/importer/transformers/unimelb-course-sections.js
  var MARK = "data-excat-course-section";
  var META_STYLE = "data-excat-meta-style";
  var META_AUDIENCE = "data-excat-meta-audience";
  var META_FIRST = "data-excat-meta-first";
  var AUD_ATTR2 = "data-excat-audience";
  var START_ATTR2 = "data-excat-section-start";
  var SKIP_ATTR2 = "data-excat-section-skip";
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
  function hasMarkerBefore(el) {
    const prev = el.previousElementSibling;
    return !!(prev && prev.tagName === "HR" && prev.hasAttribute(MARK));
  }
  function insertBreak(el, id, style, audience, isFirst) {
    if (hasMarkerBefore(el)) return;
    const hr = el.ownerDocument.createElement("hr");
    hr.setAttribute(MARK, id);
    if (style) hr.setAttribute(META_STYLE, style);
    if (audience) hr.setAttribute(META_AUDIENCE, audience);
    if (isFirst) hr.setAttribute(META_FIRST, "");
    el.before(hr);
  }
  function transform3(hookName, element, payload) {
    const allSections = payload && payload.template && payload.template.sections || [];
    const sections = allSections.length > 1 ? allSections : [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const { id } = section;
        if (element.querySelector(`[${SKIP_ATTR2}~="${id}"]`)) continue;
        const el = element.querySelector(`[${START_ATTR2}="${id}"]`) || querySection(element, section.selector);
        if (!el) continue;
        const style = section.style || null;
        const audience = el.getAttribute(AUD_ATTR2) || null;
        const intl = element.querySelector(`[${START_ATTR2}="${id}--international"]`);
        if (intl) insertBreak(intl, `${id}--international`, style, "international", false);
        if (i === 0 && !style && !audience) continue;
        insertBreak(el, id, style, audience, i === 0);
      }
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
  var unloadable_images_default = [];

  // tools/importer/import-course-detail.js
  var parsers = {
    "hero-split": parse,
    "hero-aside": parse2,
    "audience-switcher": parse3,
    "key-facts": parse4,
    "residency-notice": parse5,
    "cards-stat": parse6,
    "cards-chips": parse7,
    "cards-people": parse8,
    "cards": parse9,
    "cards-icon": parse10,
    "cards-course-link": parse11,
    "accordion": parse12,
    "tabs": parse13,
    "notice": parse14,
    "callout": parse15,
    "timeline-key-dates": parse16,
    "video": parse17,
    "quote-profile": parse18,
    "quote": parse19,
    "columns": parse20,
    "columns-split": parse21,
    "table": parse22
  };
  var PAGE_TEMPLATE = {
    "name": "course-detail",
    "description": "Course page with dark course-title hero, domestic/international toggle, key-facts panel with CTAs, sticky tab sub-navigation, long-form rich text sections, related-links pills and next-tab CTA",
    "blocks": [
      {
        "name": "hero-split",
        "instances": [
          "#main > div > div.course-header"
        ]
      },
      {
        "name": "hero-aside",
        "instances": [
          "#main div[data-test$='-page'] > #page-title:has(.course-section__aside .at-a-glance)"
        ]
      },
      {
        "name": "audience-switcher",
        "instances": [
          "#user-profile-audience-switcher"
        ]
      },
      {
        "name": "key-facts",
        "instances": [
          "#main > div > div.key-facts"
        ]
      },
      {
        "name": "residency-notice",
        "instances": [
          "#admission-requirements div.user-profile[data-test='entry-reqs-user-profile']",
          "#main div[data-test$='-page'] div.user-profile-toggle"
        ]
      },
      {
        "name": "cards-stat",
        "instances": [
          "#admission-requirements ul.entry-reqs__list"
        ]
      },
      {
        "name": "cards-chips",
        "instances": [
          "#available-pathways ul.card-course-list.course-list--inline"
        ]
      },
      {
        "name": "cards-people",
        "instances": [
          "#main div[data-test$='-page'] .course-content > div:has(.card--showcase-profile)"
        ]
      },
      {
        "name": "cards",
        "instances": [
          "#main div[data-test$='-page'] .course-section__main > .course-content > div.grid:has(> .cell > .card):not(:has(.card--showcase-profile))"
        ]
      },
      {
        "name": "cards-icon",
        "instances": [
          "#main div[data-test$='-page'] .course-content div.ct-factscard-border div.grid.grid--center",
          "#main div[data-test$='-page'] .course-content section.accreditations"
        ]
      },
      {
        "name": "cards-course-link",
        "instances": [
          "#main div[data-test$='-page'] .course-content ul.course-list.course-list--inline"
        ]
      },
      {
        "name": "accordion",
        "instances": [
          "#main div[data-test$='-page'] .course-section__main > div:has(> ul.toggleblock.togglerow)",
          "#main div[data-test$='-page'] #admission-criteria .section-bordered ul.toggleblock.togglerow"
        ]
      },
      {
        "name": "tabs",
        "instances": [
          "#main div[data-test$='-page'] #available-subjects div.subject-programs",
          "#main div[data-test$='-page'] #sample-plans div.sample-plan"
        ]
      },
      {
        "name": "notice",
        "instances": [
          "#fees .fee-info-panel",
          "#main div[data-test$='-page'] .course-section__main > .course-content > div.notice"
        ]
      },
      {
        "name": "callout",
        "instances": [
          "#main div[data-test$='-page'] div.callout-panel",
          "#main div[data-test$='-page'] #admission-criteria section#eligibility-calculator"
        ]
      },
      {
        "name": "timeline-key-dates",
        "instances": [
          ".course-section--title .course-section__aside .date-list",
          "#main div[data-test$='-page'] #key-application-dates div.date-list"
        ]
      },
      {
        "name": "video",
        "instances": [
          "#main div[data-test$='-page'] .course-content > div.embed:not(.alumniprofile *)",
          "#main div[data-test$='-page'] .course-content > p:has(> iframe):not(.alumniprofile *)",
          "#main div[data-test$='-page'] .course-content > figure.figure--embed:not(.alumniprofile *)"
        ]
      },
      {
        "name": "quote-profile",
        "instances": [
          "#main div[data-test$='-page'] div.toggleblock.alumniprofile"
        ]
      },
      {
        "name": "quote",
        "instances": [
          "#main div[data-test$='-page'] .course-section__main > .course-content > blockquote"
        ]
      },
      {
        "name": "columns",
        "instances": [
          "#what-can-i-study div.section-alt__row"
        ]
      },
      {
        "name": "columns-split",
        "instances": [
          "#main div[data-test$='-page'] .course-content > section.split-section"
        ]
      },
      {
        "name": "table",
        "instances": [
          "#main div[data-test$='-page'] table.table:not(.toggleblock table)"
        ]
      }
    ],
    "sections": [
      {
        "id": "course-header",
        "name": "Course title hero",
        "selector": [
          "#main > div > div.course-header"
        ],
        "style": null,
        "blocks": [
          "hero-split"
        ],
        "defaultContent": []
      },
      {
        "id": "audience-toggle",
        "name": "Audience toggle (Showing information for)",
        "selector": [
          "#main > div > div:has(> #user-profile-audience-switcher)"
        ],
        "style": null,
        "blocks": [
          "audience-switcher"
        ],
        "defaultContent": []
      },
      {
        "id": "key-facts",
        "name": "Key facts panel (audience-keyed)",
        "selector": [
          "#main > div > div.key-facts"
        ],
        "style": "grey",
        "blocks": [
          "key-facts"
        ],
        "defaultContent": []
      },
      {
        "id": "title-band-aside",
        "name": "Major title band + At a glance panel",
        "selector": [
          "#main div[data-test$='-page'] > #page-title:has(.course-section__aside .at-a-glance)",
          "#page-title:has(.course-section__aside .at-a-glance)"
        ],
        "style": null,
        "blocks": [
          "hero-aside"
        ],
        "defaultContent": []
      },
      {
        "id": "title-band-key-dates",
        "name": "How to apply title band + key dates (audience-keyed)",
        "selector": [
          "#main div[data-test$='-page'] > #page-title:has(.course-section__aside .date-list)",
          "#page-title:has(.course-section__aside .date-list)"
        ],
        "style": "sage",
        "blocks": [
          "timeline-key-dates"
        ],
        "defaultContent": [
          "#page-title h2#page-subheader"
        ]
      },
      {
        "id": "title-band",
        "name": "Tab title band (h2 + optional in-page anchor list)",
        "selector": [
          "#main div[data-test$='-page'] > #page-title:not(:has(.course-section__aside .at-a-glance, .course-section__aside .date-list))",
          "#page-title:not(:has(.course-section__aside .at-a-glance, .course-section__aside .date-list))"
        ],
        "style": "sage",
        "blocks": [],
        "defaultContent": [
          "#page-title h2#page-subheader",
          "#page-title nav.in-page-vertical-nav ul.in-page-vertical-nav__container"
        ]
      },
      {
        "id": "course-overview",
        "name": "Overview body",
        "selector": [
          "#main div[data-test$='-page'] > section#course-overview",
          "section#course-overview"
        ],
        "style": null,
        "blocks": [
          "video",
          "notice",
          "quote",
          "cards",
          "cards-icon",
          "cards-course-link"
        ],
        "defaultContent": [
          "#course-overview .course-section__main > h3.header-icon",
          "#course-overview .course-section__main > p",
          "#course-overview .course-content > :is(h2, h3, h4, h5, h6, p:not(:has(> iframe)), ul, ol, figure.figure:not(.figure--embed))",
          "#course-overview .course-content > div:not(.embed, .notice, .grid) > p"
        ]
      },
      {
        "id": "related-study-areas",
        "name": "Related study areas",
        "selector": [
          "#main div[data-test$='-page'] > section#what-can-i-study",
          "section#what-can-i-study"
        ],
        "style": null,
        "blocks": [
          "columns"
        ],
        "defaultContent": []
      },
      {
        "id": "admission-requirements",
        "name": "Admission requirements heading + residency panel",
        "selector": [
          "#main div[data-test$='-page'] > section#admission-requirements",
          "section#admission-requirements"
        ],
        "style": "grey",
        "blocks": [
          "residency-notice"
        ],
        "defaultContent": [
          "#admission-requirements .course-section__main > h3.header-icon"
        ]
      },
      {
        "id": "admission-requirements-stats",
        "name": "Admission requirements stat cards (audience-keyed)",
        "selector": [
          "#admission-requirements ul.entry-reqs__list"
        ],
        "style": "grey",
        "blocks": [
          "cards-stat"
        ],
        "defaultContent": []
      },
      {
        "id": "admission-requirements-essential",
        "name": "Essential requirements (prerequisites, English language)",
        "selector": [
          "#admission-requirements .page-entry-requirements__additional-info"
        ],
        "style": "grey",
        "blocks": [],
        "defaultContent": [
          ".page-entry-requirements__additional-info > h4",
          ".page-entry-requirements__pre-reqs > :is(h5, div.course-content, div.well--info)",
          ".page-entry-requirements__language > :is(h5, div.course-content)",
          ".page-entry-requirements__additional-info > div.course-content"
        ]
      },
      {
        "id": "grad-residency-toggle",
        "name": "Graduate residency panel (+ entry points)",
        "selector": [
          "#main div[data-test$='-page'] > div.section:has(> .section__inner > .user-profile-toggle)",
          "#entryReqGradEnhanced > div.section:has(> .section__inner > .user-profile-toggle)",
          "#how-to-apply-grad > div.section:has(> .section__inner > .user-profile-toggle)"
        ],
        "style": null,
        "blocks": [
          "residency-notice"
        ],
        "defaultContent": []
      },
      {
        "id": "admission-criteria",
        "name": "Admission criteria",
        "selector": [
          "#main div[data-test$='-page'] > #admission-criteria",
          "#admission-criteria"
        ],
        "style": null,
        "blocks": [
          "accordion",
          "callout"
        ],
        "defaultContent": [
          "#admission-criteria .course-section__main > h3.header-icon",
          "#admission-criteria .course-section__main > p",
          "#admission-criteria .section__inner > div.shim-mt2",
          "#admission-criteria > .section__inner > h3.header-icon",
          "#admission-criteria .section-bordered > div.well--light",
          "#admission-criteria .section-bordered > p",
          "#admission-criteria .section-bordered > div.shim-mt1 > :is(h4, p, div)"
        ]
      },
      {
        "id": "additional-information",
        "name": "Additional information",
        "selector": [
          "#main div[data-test$='-page'] > #additional-information"
        ],
        "style": null,
        "blocks": [
          "accordion",
          "table"
        ],
        "defaultContent": [
          "#additional-information .course-section__main > h3.header-icon",
          "#additional-information > .section__inner > h3.header-icon",
          "#additional-information .section-bordered > div.well--light"
        ]
      },
      {
        "id": "additional-information-gam",
        "name": "Graduate Access Melbourne (domestic only)",
        "selector": [
          "#main div[data-test$='-page'] #additional-information .section-bordered > div.course-section__main:has(> h4.additional-information__heading):not(:has(> h4[data-test='advanced-standing-title']))"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "#additional-information .section-bordered > div.course-section__main:not(:has(> h4[data-test='advanced-standing-title'])) > :is(h4, div)"
        ]
      },
      {
        "id": "additional-information-tail",
        "name": "Advanced Standing + handbook line + general-requirements callout",
        "selector": [
          "#main div[data-test$='-page'] #additional-information .section-bordered > div.course-section__main:has(> h4[data-test='advanced-standing-title'])"
        ],
        "style": null,
        "blocks": [
          "callout"
        ],
        "defaultContent": [
          "#additional-information div.course-section__main:has(> h4[data-test='advanced-standing-title']) > :is(h4, p, div.well--light)",
          "#additional-information .section__inner > div.course-section__main.text-smaller"
        ]
      },
      {
        "id": "overview",
        "name": "Overview (structure / career outcomes body)",
        "selector": [
          "#main div[data-test$='-page'] > section#overview",
          "section#overview"
        ],
        "style": null,
        "blocks": [
          "video",
          "quote-profile",
          "cards",
          "cards-icon",
          "notice",
          "quote",
          "columns-split",
          "table"
        ],
        "defaultContent": [
          "#overview .course-section__main > h3.header-icon",
          "#overview .course-section__main > p",
          "#overview .course-content > :is(h2, h3, h4, h5, h6, p:not(:has(> iframe)), ul, ol, figure.figure:not(.figure--embed))",
          "#overview .course-content > div:not(.embed, .notice, .grid, .ct-factscard-border) > :is(p, ul, ol)"
        ]
      },
      {
        "id": "sample-plans",
        "name": "Sample course plan (plan tabs > per-year accordions)",
        "selector": [
          "#main div[data-test$='-page'] > section#sample-plans",
          "#sample-plans"
        ],
        "style": "grey",
        "blocks": [
          "tabs"
        ],
        "defaultContent": [
          "#sample-plans .course-section__main > :is(h3, p)"
        ]
      },
      {
        "id": "explore-this-course",
        "name": "Explore this course (subject tabs; one h4 + tabs per program)",
        "selector": [
          "#main div[data-test$='-page'] > section#available-subjects",
          "section#available-subjects"
        ],
        "style": null,
        "blocks": [
          "tabs"
        ],
        "defaultContent": [
          "#available-subjects .course-section__main > :is(h3, p)"
        ]
      },
      {
        "id": "graduate-pathways",
        "name": "Graduate pathways",
        "selector": [
          "#main div[data-test$='-page'] > section#available-pathways",
          "section#available-pathways"
        ],
        "style": "sage",
        "blocks": [
          "cards-chips"
        ],
        "defaultContent": [
          "#available-pathways .course-section__main > h3.header-icon",
          "#available-pathways .shim-mb1 > p"
        ]
      },
      {
        "id": "student-experience",
        "name": "Student experience body",
        "selector": [
          "#main div[data-test$='-page'] > section#student-experience",
          "section#student-experience"
        ],
        "style": null,
        "blocks": [
          "video",
          "cards-people",
          "quote",
          "cards"
        ],
        "defaultContent": [
          "#student-experience .course-section__main > h3.header-icon",
          "#student-experience .course-content > :is(h2, h3, h4, h5, h6, p:not(:has(> iframe)), ul, ol, figure.figure:not(.figure--embed))"
        ]
      },
      {
        "id": "profile",
        "name": "Student/alumni profile section",
        "selector": [
          "#main div[data-test$='-page'] > div.course-section:has(.toggleblock.alumniprofile)"
        ],
        "style": null,
        "blocks": [
          "quote-profile"
        ],
        "defaultContent": []
      },
      {
        "id": "fees",
        "name": "Fees heading",
        "selector": [
          "#main div[data-test$='-page'] > section#fees",
          "section#fees"
        ],
        "style": null,
        "blocks": [
          "notice"
        ],
        "defaultContent": [
          "#fees h3#fees-panel-title"
        ]
      },
      {
        "id": "fee-panels",
        "name": "Fee panel(s) (audience-keyed)",
        "selector": [
          "#fees .fee-panel > div:has(.fee-info-panel)",
          "#fees .fee-panel > h3#fees-panel-title ~ div"
        ],
        "style": null,
        "blocks": [
          "notice"
        ],
        "defaultContent": []
      },
      {
        "id": "fees-explained-band",
        "name": "Your fees explained band",
        "selector": [
          "#explained > div.bg-alt"
        ],
        "style": "grey",
        "blocks": [],
        "defaultContent": [
          "#explained > div.bg-alt h3#explained-title"
        ]
      },
      {
        "id": "fees-explained",
        "name": "Fees explained body (audience-keyed)",
        "selector": [
          "#explained > div.course-section"
        ],
        "style": null,
        "blocks": [
          "callout",
          "notice"
        ],
        "defaultContent": [
          "#explained [data-test='fee-explanation-content'] > :is(h4, h5, p, ul, ol)"
        ]
      },
      {
        "id": "other-financial-assistance",
        "name": "Other financial assistance (shared tail of fees explained)",
        "selector": [
          "#explained [data-test='fee-explanation-content'] > h4:nth-last-child(2):has(+ p:last-child)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "#explained [data-test='fee-explanation-content'] > h4:nth-last-child(2)",
          "#explained [data-test='fee-explanation-content'] > h4:nth-last-child(2) + p"
        ]
      },
      {
        "id": "scholarships",
        "name": "Scholarships",
        "selector": [
          "#main div[data-test$='-page'] > section#scholarships",
          "section#scholarships"
        ],
        "style": null,
        "blocks": [
          "callout",
          "table"
        ],
        "defaultContent": [
          "#scholarships h3#scholarships-title",
          "#scholarships .course-section__main > p"
        ]
      },
      {
        "id": "key-application-dates",
        "name": "Key application dates (audience-keyed)",
        "selector": [
          "#main div[data-test$='-page'] > #key-application-dates",
          "#key-application-dates"
        ],
        "style": null,
        "blocks": [
          "timeline-key-dates",
          "table"
        ],
        "defaultContent": [
          "#key-application-dates > .section__inner > h3.header-icon",
          "#key-application-dates .section-bordered > div.well",
          "#key-application-dates .section-bordered > div:not(.date-list, .well)"
        ]
      },
      {
        "id": "how-to-apply",
        "name": "How to apply body (audience-keyed)",
        "selector": [
          "#main div[data-test$='-page'] > #how-to-apply",
          "#how-to-apply"
        ],
        "style": null,
        "blocks": [
          "callout",
          "notice",
          "table"
        ],
        "defaultContent": [
          "#how-to-apply .course-section__main > h3.header-icon",
          "#how-to-apply .course-section__main > div.course-content > :is(h4, h5, p, ul, ol, div)",
          "#how-to-apply .course-section__main > div:has(> ol) > :is(h4, ol)",
          "#how-to-apply > .section__inner > h3.header-icon",
          "#how-to-apply .section-bordered > div:not(.callout-panel) > :is(h4, h5, p, ul, ol, small, div.well)"
        ]
      },
      {
        "id": "after-you-apply",
        "name": "After you apply",
        "selector": [
          "#main div[data-test$='-page'] > #after-you-apply",
          "#after-you-apply"
        ],
        "style": null,
        "blocks": [
          "callout"
        ],
        "defaultContent": [
          "#after-you-apply > .section__inner > h3.header-icon",
          "#after-you-apply > .section__inner > div.section-bordered > div > :is(ul, ol, p, div.well)",
          "#after-you-apply #additional-information > :is(h3.header-icon, .section-bordered)",
          "#after-you-apply > .section__inner > div.course-section__main.text-smaller"
        ]
      },
      {
        "id": "postgrad-entry-text",
        "name": "Graduate entry requirements text (unanalysed)",
        "selector": [
          "#main div[data-test$='-page'] > #postgradentrytext:not(.section-bordered *)"
        ],
        "style": null,
        "blocks": [
          "notice"
        ],
        "defaultContent": []
      }
    ],
    "audienceContract": {
      "template": "template#excat-international",
      "parts": [
        "body",
        "key-facts",
        "hero-codes",
        "page-title (optional; falls back to body > #page-title)"
      ],
      "defaultAudience": "domestic",
      "sections": {
        "key-facts": {
          "audience": "domestic",
          "part": "key-facts",
          "selector": [
            "div.key-facts"
          ]
        },
        "title-band-key-dates": {
          "audience": "domestic",
          "part": "body",
          "selector": [
            "div[data-test$='-page'] > #page-title"
          ]
        },
        "admission-requirements-stats": {
          "audience": "domestic",
          "part": "body",
          "selector": [
            "#admission-requirements ul.entry-reqs__list"
          ]
        },
        "additional-information-gam": {
          "audience": "domestic",
          "part": "body",
          "selector": [
            "#additional-information .section-bordered > div.course-section__main:has(> h4.additional-information__heading):not(:has(> h4[data-test='advanced-standing-title']))"
          ],
          "whenMissing": "domestic-only"
        },
        "fee-panels": {
          "audience": "domestic",
          "part": "body",
          "selector": [
            "#fees .fee-panel > div:has(.fee-info-panel)",
            "#fees .fee-panel > h3#fees-panel-title ~ div"
          ]
        },
        "fees-explained": {
          "audience": "domestic",
          "part": "body",
          "selector": [
            "#explained > div.course-section"
          ]
        },
        "key-application-dates": {
          "audience": "domestic",
          "part": "body",
          "selector": [
            "div[data-test$='-page'] > #key-application-dates"
          ]
        },
        "how-to-apply": {
          "audience": "domestic",
          "part": "body",
          "selector": [
            "div[data-test$='-page'] > #how-to-apply"
          ]
        }
      },
      "sharedTails": {
        "other-financial-assistance": "fees-explained"
      },
      "whenMissing": {
        "domestic-only": "If the template body part exists but the international counterpart is absent, key the domestic element Audience=domestic and insert no clone. Without a template (no international render), log audience-missing and leave the section unkeyed."
      },
      "inBlock": {
        "key-facts": {
          "part": "hero-codes",
          "selector": [
            "ul.course-header__codes"
          ],
          "use": "code rows (VTAC / International VTAC / CRICOS) appended to the matching audience key-facts block; Course code stays in hero"
        },
        "residency-notice": {
          "part": "body",
          "selector": [
            "#admission-requirements [data-test='profile-residency--info']",
            "div.user-profile-toggle [data-test='profile-residency--info']"
          ],
          "titleSelector": [
            "div.user-profile-toggle [data-test='profile-residency--title']"
          ],
          "use": "international row of the single audience-keyed residency-notice block (no section split); undergraduate = div.user-profile, graduate = div.user-profile-toggle"
        }
      },
      "notes": "See migration-work/course-detail/mapping-notes.md#audience-contract"
    },
    "boundaryOnlySections": [
      "postgrad-entry-text"
    ],
    "urls": [
      "https://study.unimelb.edu.au/find/courses/graduate/diploma-in-languages-gshss",
      "https://study.unimelb.edu.au/find/courses/graduate/diploma-in-languages-gshss/career-outcomes",
      "https://study.unimelb.edu.au/find/courses/graduate/diploma-in-languages-gshss/entry-requirements"
    ]
  };
  var transformers = [
    transform,
    transform2,
    transform3
  ];
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
  var import_course_detail_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
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
          // images dropped by the cleanup transformer because they cannot be loaded on the source
          droppedImages: (document2.excatDroppedImages || []).join(" ")
        }
      }];
    }
  };
  return __toCommonJS(import_course_detail_exports);
})();
