# Site Migration Plan: study.unimelb.edu.au → AEM Edge Delivery Services (Document Authoring)

## ⚠️ Status: site discovery still can't start. The chat is still in Plan mode.
Sending "start site discovery" again won't start it while the chat is in Plan mode. Plan mode only lets me edit this plan. I can't fetch the sitemap, crawl the site or save anything.

**To start, pick one:**
1. **Execute Plan:** click the **Execute Plan** button below the chat input. It runs this plan from Phase 1.
2. **Quick mode:** switch the **Quick / Plan** toggle below the chat input to **Quick**, then send "start site discovery".

**If you can't see Execute Plan:** use option 2. The Quick / Plan toggle is always next to the Send button.

## Overview
Move the University of Melbourne "Study" site (https://study.unimelb.edu.au/) onto this Edge Delivery Services project. Its content source is Document Authoring (DA) under **aclarke-adobe / uom-da**. The work covers the whole site: finding all its pages, grouping them into templates, building the blocks and styling, rebuilding the header and footer, bulk-importing the content, checking the result, and uploading pages to DA.

**Settings confirmed**
- **Source:** https://study.unimelb.edu.au/
- **Scope:** whole site
- **Also included:** design and styling, header and navigation, footer, upload to DA
- **Optional add-ons:** none for now. Commerce, forms and handover can be turned on later if needed.
- **Project type:** DA, based on the existing project config. The project starts with the standard block set: cards, columns, hero, header, footer, fragment and widget.

**Assumptions and risks**
- This site is probably large, since course and degree pages alone could run to thousands of URLs. After discovery I'll show the page and template counts and check with you before any bulk import.
- Course search, filters and forms that rely on live data may not carry over as static content. I'll flag them during analysis rather than guess.
- If the site blocks automated scraping, the scraper falls back to a proxy fetch.
- Uploading to DA needs the Adobe credentials opt-in to be turned on (Settings → Agent Permissions). If an upload fails with a permission error, I'll stop and ask you to turn it on.

## Phases

### 1. Site discovery and scope (runs first)
- Find all URLs from `https://study.unimelb.edu.au/sitemap.xml` and robots.txt, or by crawling if there's no sitemap.
- Remove duplicates and exclude non-page URLs (PDFs, files, redirects, links to other sites).
- Group pages into templates such as homepage, course or degree detail, landing or hub, article or news, and utility pages.
- Produce a scope report covering templates, pages per template, blocks that recur across pages, and complexity flags such as live data or forms.
- **Checkpoint:** you review the templates and page counts and confirm the final scope. Nothing past this phase runs until you do.

### 2. Global design system
- Pull the design tokens from the source site (fonts, colours, spacing, breakpoints) into the global styles.
- Set up web fonts under the fonts folder, where the licence allows.

### 3. Header and footer
- Rebuild the header, main nav and any mega menu for desktop and mobile, including how items behave on hover and click.
- Rebuild the footer: its sections, links, social links and legal text.
- Author both as nav and footer fragments.

### 4. Template-by-template migration
Starting with the homepage, then each template in order of priority:
- Analyse one representative page: its sections, authoring decisions and block variants.
- Map blocks to page selectors, reusing existing block variants where they're similar enough.
- Generate or extend the blocks, using defensive decoration and CSS scoped to each block.
- Style each block to match the source, checking it visually for up to 3 rounds.
- Build the import infrastructure: block parsers, page transformers and the bundled import script.
- Test-import the representative page and check it in the preview.

### 5. Bulk import
- Run the bulk import for every URL in each confirmed template.
- Track failures and retry or fix parsers as needed.

### 6. Validation
- Score each imported page for content completeness against the source.
- Run a visual critique on flagged pages and fix block or parser issues.
- Run lint and block tests.

### 7. Publish
- Upload the verified pages to DA at `https://admin.da.live/source/aclarke-adobe/uom-da/{path}.html`.
- Commit the code on a feature branch and open a PR with a `{branch}--uom-da--aclarke-adobe.aem.page/{path}` preview link. The PR is only opened when you ask for it.

## Checklist
- [ ] Discover all URLs on study.unimelb.edu.au (sitemap, or crawling if there isn't one) **← first step once you click Execute Plan or switch to Quick**
- [ ] Remove duplicate and non-page URLs
- [ ] Catalog the pages into templates and produce the site scope report
- [ ] Review the template and page counts with you and confirm the final scope
- [ ] Extract and apply the global design tokens (fonts, colours, spacing)
- [ ] Migrate the header and navigation (desktop, mobile, mega menu)
- [ ] Migrate the footer
- [ ] Analyse the homepage and map its blocks
- [ ] Generate and style the homepage blocks
- [ ] Build the homepage import script and test-import it
- [ ] Repeat analysis, block mapping, block generation and styling for each other template
- [ ] Build parsers and transformers for each other template
- [ ] Test-import one representative page per template and check it in the preview
- [ ] Bulk import all URLs in scope
- [ ] Validate the import (completeness scoring and visual critique of flagged pages)
- [ ] Fix the issues found and re-import the affected pages
- [ ] Run lint and block tests
- [ ] Upload the verified pages to DA
- [ ] Commit the code on a feature branch and open a PR with a preview link (when you ask)

## Next step
Click **Execute Plan**, or switch the toggle to **Quick** and send "start site discovery". Discovery and cataloguing will then run on their own and stop at the scope review, so you can confirm before any content is built or imported.
