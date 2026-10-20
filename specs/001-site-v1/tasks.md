# 001: Tasks

Before T01: Alina sets the spec to `Status: approved` and approves `plan.md` and this file together, including the decisions in plan section 17 (Preact for islands, newsletter flow and AC12 wording, no series rendering, `sprite-green` token). If a decision goes the other way, the affected tasks are rewritten before work starts.

Every task ends with `pnpm check` passing and one commit, for example `feat(001): window component [T08]`. E2E tests named in Verify run with `pnpm test:e2e` against the fixture content.

## Setup

- [x] T01 Initialize the Astro project with pinned versions
  Files: package.json, pnpm-lock.yaml, .npmrc, .nvmrc, tsconfig.json, astro.config.ts, biome.json, .gitignore, src/pages/index.astro (temporary "[HOME]" placeholder)
  Verify: `pnpm check` passes; `package.json` has no `^` or `~` ranges; versions match plan section 2

- [ ] T02 Add Vitest and Playwright with axe and the route list
  Files: vitest.config.ts, playwright.config.ts, tests/e2e/helpers/axe.ts, tests/e2e/helpers/routes.ts, tests/e2e/routes.spec.ts, tests/unit/smoke.test.ts
  Verify: `pnpm test:e2e` runs `routes.spec.ts` on `/` in the phone, tablet and desktop projects with the overflow check and zero axe violations

- [x] T03 [P] Add the JS budget script and Lighthouse CI config
  Files: scripts/js-budget.ts, lighthouserc.json, package.json (scripts)
  Verify: `tsx scripts/js-budget.ts` reports 0 KB for the placeholder page and exits non-zero on a test HTML file over 30 KB (`tests/unit/js-budget.test.ts`)

## Foundation

- [x] T04 Define design tokens in tokens.css with Tailwind v4
  Files: src/styles/tokens.css, src/styles/global.css, astro.config.ts, tests/unit/tokens.test.ts, tests/unit/no-vw.test.ts
  Verify: `tokens.test.ts` checks all 14 spec colors plus `sprite-green` with exact hex values, and that built CSS contains no Tailwind default palette names; `no-vw.test.ts` finds no `vw` units in `src/`

- [ ] T05 Self-host the four fonts with metric fallbacks
  Files: astro.config.ts (fonts), src/styles/tokens.css (font tokens), package.json (@fontsource/*)
  Verify: built CSS has `@font-face` rules for Pixelify Sans 600/700, Silkscreen 400, Space Mono 400/700, Atkinson Hyperlegible Next 400/700 and fallback faces with `size-adjust`; `routes.spec.ts` asserts no request leaves localhost

- [x] T06 [P] Add the seven sprite grids and run-merging renderer
  Files: src/sprites/*.ts, src/lib/sprite.ts, tests/unit/sprite.test.ts
  Verify: `sprite.test.ts` checks each grid against the spec appendix dimensions and characters, and that a row `KKWW..K` yields three rects

- [x] T07 Build PixelSprite and PixelStairs
  Files: src/components/PixelSprite.astro, src/components/PixelStairs.astro, tests/unit/pixel-sprite.test.ts
  Verify: container render test: cat SVG has `shape-rendering="crispEdges"`, no `<div>`, `aria-hidden` without title and `role="img"` with title; PixelStairs has `aria-hidden="true"`

- [x] T08 Build the Window component
  Files: src/components/Window.astro, tests/unit/window.test.ts
  Verify: container render test: title is an `h2` when `as="section"`, close box is `aria-hidden`, variant and shadow props map to token classes only

- [ ] T09 Build BaseLayout, the Seo head stub and MenuBar
  Files: src/layouts/BaseLayout.astro, src/components/Seo.astro, src/components/MenuBar.astro, src/lib/site.ts, src/pages/index.astro
  Verify: `routes.spec.ts` on `/`: skip link first in tab order, MenuBar link for the current page has `aria-current="page"` at 1280 px

- [ ] T10 Build the Dock for screens under 640 px
  Files: src/components/Dock.astro, src/layouts/BaseLayout.astro, src/styles/global.css, tests/e2e/dock.spec.ts
  Verify: `dock.spec.ts` (AC17) on every route in the route list: at 390 px dock visible with four items each at least 44 px tall, current item `aria-current="page"`, MenuBar shows no nav links, last element not covered; at 820 px dock not visible

- [ ] T11 [P] Build the 404 page
  Files: src/pages/404.astro, tests/e2e/helpers/routes.ts
  Verify: `routes.spec.ts` on `/404`: alert window with "The page could not be found." and a link to `/`, axe clean at three widths (R14)

## Content

- [x] T12 Write Zod schemas for digest and notes
  Files: src/lib/schemas.ts, tests/unit/schemas.test.ts
  Verify: `schemas.test.ts`: valid samples pass; cover without alt or with empty alt fails (AC16); topics outside the enum fail; tldr of 0 or 6 items fails; `draft` and `pinned` default to false

- [x] T13 Add content collections with pinned and issue number checks
  Files: src/content.config.ts, src/lib/collection-checks.ts, tests/unit/collection-checks.test.ts
  Verify: `collection-checks.test.ts`: two pinned notes throw a message naming both file paths (AC7); `012.mdx` with `number: 11` throws; duplicate numbers throw

- [x] T14 Add placeholder fixture content for tests
  Files: tests/fixtures/content/**, tests/fixtures/content-two-pinned/**, tests/fixtures/content-missing-alt/**
  Verify: `CONTENT_DIR=tests/fixtures/content pnpm build` succeeds; review that every text value is a square-bracket placeholder or marked sample filler, with no real names, sources or claims

- [x] T15 Add build failure tests for broken content
  Files: tests/build/build-fails.test.ts, vitest.config.ts
  Verify: `build-fails.test.ts`: two-pinned fixture exits non-zero with both file names in output (AC7); missing-alt fixture exits non-zero (AC16)

- [x] T16 Add content queries and reading time
  Files: src/lib/content.ts, src/lib/reading-time.ts, tests/unit/content.test.ts, tests/unit/reading-time.test.ts
  Verify: `content.test.ts`: latest issue is the highest number and five newest notes are newest first (AC1); first note has no previous (AC9); drafts excluded when PROD; pinned or newest selection; `reading-time.test.ts` known word counts

## Components

- [x] T17 [P] Build TagChip, DesktopIcon, Terminal and Callout
  Files: src/components/TagChip.astro, src/components/DesktopIcon.astro, src/components/Terminal.astro, src/components/Callout.astro, tests/unit/components.test.ts
  Verify: container render tests: DesktopIcon is one `<a href>` with visible label; Callout is an `<aside>` with a screen reader label; Terminal uses only token classes

- [x] T18 [P] Build digest MDX components Section, Item and TriedIt
  Files: src/components/mdx/Section.astro, src/components/mdx/Item.astro, src/components/mdx/TriedIt.astro, tests/unit/digest-mdx.test.ts
  Verify: container render test: Section renders an `h2` with a slug id; Item renders headline, source link and highlighted takeaway; TriedIt includes a Terminal

- [x] T19 [P] Build note MDX components CodeBlock, Figure, PullQuote and TableWrap
  Files: src/components/mdx/CodeBlock.astro, src/components/mdx/Figure.astro, src/components/mdx/PullQuote.astro, src/components/mdx/TableWrap.astro, src/lib/mdx-components.ts
  Verify: first confirm in the Astro 7 docs whether fence meta reaches the `pre` override (else use the explicit CodeBlock fallback from plan section 7); container render test: CodeBlock shows the file name label and its scroll box has `tabindex="0"` and `role="region"`

- [x] T20 Build SubscribeForm without JavaScript
  Files: src/components/SubscribeForm.astro, src/lib/site.ts
  Verify: container render test: `<form method="post" target="_blank">` posts to the Buttondown embed URL with `[BUTTONDOWN_USERNAME]`, has a labeled required email input and hidden `embed=1`; dialog and band variants render

## Pages

- [ ] T21 Build the Home page
  Files: src/pages/index.astro, src/islands/NoteListItem.tsx, src/islands/IssueListItem.tsx, tests/e2e/home.spec.ts, tests/e2e/helpers/routes.ts
  Verify: `home.spec.ts`: shows issue 012 and the five newest notes in order (AC1); at 390 px icons in a grid above the title and every window full width (AC2); at 1280 px icons in one column left of the title (AC3); icon hrefs match R2

- [ ] T22 Build the digest issue page
  Files: src/pages/digest/[number].astro, tests/e2e/digest.spec.ts, tests/e2e/helpers/routes.ts
  Verify: `digest.spec.ts`: `/digest/012` contents links scroll to each section, quote window shown, previous links to `/digest/011` (AC4); `/digest/011` has no quote window (AC5)

- [ ] T23 Build the digest archive without filters
  Files: src/pages/digest/index.astro, tests/e2e/digest.spec.ts
  Verify: `digest.spec.ts`: archive lists all published issues newest first with number, date, title and topics, and no draft issue 013 (R4)

- [ ] T24 Build the writing index without filters
  Files: src/pages/writing/index.astro, tests/e2e/writing.spec.ts
  Verify: `writing.spec.ts`: the pinned fixture note is in pinned.md and also in all_notes/, count matches published notes (AC7)

- [ ] T25 Build the article page
  Files: src/pages/writing/[slug].astro, src/styles/global.css (prose rules), tests/e2e/writing.spec.ts
  Verify: `writing.spec.ts`: code block shows the Terminal style with "example.ts" label and scrolls horizontally at 390 px with no page overflow (AC8); oldest note has no previous link (AC9); hero, tl;dr and next link render

- [ ] T26 Build the About page with placeholders
  Files: src/pages/about.astro, src/lib/site.ts
  Verify: `routes.spec.ts` on `/about` at three widths; manual: bio, case studies and contacts show `[BIO]`, `[EMAIL]`, `[LINKEDIN_URL]` placeholders and no invented facts

## Islands

- [ ] T27 Add the Preact integration and the PetButton island
  Files: astro.config.ts, package.json, src/islands/PetButton.tsx, src/components/PetWindow.astro, src/pages/index.astro, tests/e2e/islands.spec.ts
  Verify: `islands.spec.ts`: four presses show "ok that is enough", a fifth keeps it (AC11); with JS off the button is hidden and "zzz... (idle)" shows (R8); `js-budget.ts` under 30 KB on `/`

- [ ] T28 Add the FilterList island to the archive and writing index
  Files: src/islands/FilterList.tsx, src/pages/digest/index.astro, src/pages/writing/index.astro, tests/e2e/islands.spec.ts
  Verify: `islands.spec.ts`: pressing Agents on `/digest` shows only Agents issues, sets `aria-pressed="true"` and updates the count; with JS off all issues show and no filter buttons render (AC6); same checks for tags on `/writing`

- [ ] T29 Add the ViewToggle island to About
  Files: src/islands/ViewToggle.tsx, src/pages/about.astro, tests/e2e/islands.spec.ts
  Verify: `islands.spec.ts`: pressing List renders a table and List has `aria-pressed="true"`; with JS off the Icons view shows all items and no toggle (AC10)

## SEO and feeds

- [x] T30 Complete Seo tags for every route
  Files: src/components/Seo.astro, src/lib/seo.ts, astro.config.ts (site), tests/unit/seo.test.ts
  Verify: `seo.test.ts` over built `dist/`: every page has a unique title and description, canonical, og:* and twitter:* tags, absolute og:image (R12)

- [x] T31 Add the three RSS feeds with full content
  Files: src/pages/rss.xml.ts, src/pages/digest/rss.xml.ts, src/pages/writing/rss.xml.ts, src/lib/feed.ts, tests/unit/feeds.test.ts
  Verify: `feeds.test.ts` over a production build of fixtures: three feeds parse as RSS 2.0 with required channel and item fields, items have full HTML content, no draft titles appear (AC15)

- [x] T32 [P] Add the sitemap
  Files: astro.config.ts, tests/unit/sitemap.test.ts
  Verify: `sitemap.test.ts`: `sitemap-index.xml` lists every published route, excludes `/404` and draft entries

- [ ] T33 Generate OG images with Satori, including the issue number variant
  Files: src/lib/og.ts, src/lib/tokens.ts, src/pages/og/[...path].png.ts, src/components/Seo.astro, tests/unit/og.test.ts, tests/e2e/og.spec.ts
  Verify: `og.test.ts`: issue 012 tree contains the text "#012" and output is a 1200x630 PNG (AC18); `og.spec.ts` snapshot of `/og/digest/012.png`; manual: Alina approves the OG look once

## Newsletter

- [ ] T34 Add SubscribeEnhancer states to the form
  Files: src/islands/SubscribeEnhancer.tsx, src/components/SubscribeForm.astro, tests/e2e/subscribe.spec.ts
  Verify: `subscribe.spec.ts`: invalid email and offline submits show an error in an assertive live region and keep the typed value (AC12 as reworded in plan 12); a valid submit opens the intercepted Buttondown URL in a new tab and shows the sent state with the email kept; "Not now" hides the dialog

## Deploy

Replaced by spec 004: T35 (Dockerfile, Caddyfile, smoke script) and T36 (Railway deploys and PR environments) were removed. Deployment tasks are in `specs/004-github-pages/tasks.md`.

## Verification

- [ ] T37 Run the full route sweep and approve visual baselines
  Files: tests/e2e/routes.spec.ts, tests/e2e/helpers/routes.ts, tests/e2e/__snapshots__/**
  Verify: every route at 390, 820 and 1280 px has no horizontal overflow and zero axe violations with JS on and off (AC13, AC14); manual: Alina reviews and approves the snapshot baselines, after which `toHaveScreenshot` passes

- [ ] T38 Run Lighthouse CI and the JS budget on every route
  Files: lighthouserc.json, package.json (scripts)
  Verify: `lhci autorun` mobile scores 95 or higher in performance, accessibility, best practices and SEO on every route (AC14); `js-budget.ts` under 30 KB on every page

- [ ] T39 Walk every acceptance criterion and check the live deploy
  Files: specs/001-site-v1/tasks.md (tick boxes)
  Verify: manual: paste the three production feeds into validator.w3.org/feed (AC15); walk AC1 to AC18 at 390, 820 and 1280 px and report each as pass or fail

## AC coverage

| AC | Tasks |
|---|---|
| AC1 | T16, T21 |
| AC2 | T21 |
| AC3 | T21 |
| AC4 | T22 |
| AC5 | T22 |
| AC6 | T28 |
| AC7 | T13, T15, T24 |
| AC8 | T19, T25 |
| AC9 | T16, T25 |
| AC10 | T29 |
| AC11 | T27 |
| AC12 | T34 |
| AC13 | T02, T37 |
| AC14 | T02, T11, T37, T38 |
| AC15 | T31, T39 |
| AC16 | T12, T15 |
| AC17 | T10 |
| AC18 | T33 |
| AC19 | Replaced by 004 |
