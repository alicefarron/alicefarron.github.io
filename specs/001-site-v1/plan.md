# 001: Plan

Spec: `specs/001-site-v1/spec.md` (Status: draft). Nothing in this plan gets implemented until Alina sets the spec to `approved` and approves this plan and `tasks.md` together.

## 1. Summary

Build alina.os as a fully static Astro 7 site. Content lives in two content collections (`digest`, `notes`) as MDX, validated by Zod schemas plus two whole-collection checks in a custom loader (one pinned note, issue number matches file name). Every page is prerendered `.astro` markup styled with Tailwind v4 utilities that resolve only to tokens in `src/styles/tokens.css`. Pixel sprites are string grids rendered at build time to inline SVG with merged runs. Four small islands add state: the pet button, the two filters, the view toggle and the subscribe form states. Each island server-renders a usable no-JS state. Feeds, sitemap and OG images (Satori to PNG) are generated at build. The built `dist/` is served on Railway by Caddy from a two-stage Dockerfile, with immutable caching for `/_astro/*`, a real 404 status and PR environments as previews.

Three things in this plan need a decision from Alina before the matching tasks start (details in section 17):

1. Islands framework: React 19 alone is about 69 KB gzipped, which breaks the 30 KB per page budget. The plan uses Preact (`@astrojs/preact`), about 5.6 KB gzipped.
2. Newsletter: Buttondown's docs say not to post to the embed endpoint with `fetch`, so R10 and AC12 as written cannot be met reliably. The plan uses a native form post into a new tab plus local states, and proposes rewording AC12.
3. Series: R5 renders series, but Out of scope says nothing renders `series`. The plan follows Out of scope.

## 2. Verified stack versions

Checked with `npm view <pkg> version` on 2026-10-06. Pin all of these exactly (`save-exact=true` in `.npmrc`, no `^`).

| Package | Version | Role |
|---|---|---|
| astro | 7.3.6 | Framework, static output. Requires Node >= 22.12.0. Ships Vite 8 and Zod 4 |
| @astrojs/mdx | 8.0.3 | MDX in collections (peer astro ^7.2.10) |
| @astrojs/react | 7.0.1 | Only if Alina keeps React (see 17.1) |
| @astrojs/preact | 6.0.6 | Proposed islands integration (peer preact ^10.6.5) |
| preact | 10.29.8 | Proposed islands runtime. Preact 11.0.0 is out but outside the integration's peer range |
| react, react-dom, @types/react | 19.3.0 | Only if Alina keeps React |
| @astrojs/rss | 4.0.19 | Feeds |
| @astrojs/sitemap | 3.7.4 | Sitemap |
| @astrojs/check | 0.9.10 | `astro check` (peer typescript ^5 or ^6) |
| typescript | 6.0.3 | Latest is 7.0.2, but @astrojs/check 0.9.10 only accepts ^5 or ^6. Pin 6.0.3 |
| tailwindcss | 4.3.3 | Utilities from `@theme` tokens |
| @tailwindcss/vite | 4.3.3 | Tailwind via Vite plugin (the old `@astrojs/tailwind` integration is not used) |
| @biomejs/biome | 2.5.15 | Lint and format |
| vitest | 5.0.3 | Unit tests (peer vite ^6, ^7 or ^8) |
| @playwright/test | 1.63.0 | E2E, visual snapshots |
| @axe-core/playwright | 4.13.0 | Accessibility checks |
| @lhci/cli | 0.15.1 | Lighthouse CI |
| satori | 0.35.0 | OG image markup to SVG |
| @resvg/resvg-js | 2.6.2 | SVG to PNG |
| @fontsource/pixelify-sans | 5.3.0 | Display face (400, 600, 700 present; woff and woff2) |
| @fontsource/silkscreen | 5.3.0 | Labels |
| @fontsource/space-mono | 5.3.0 | UI and code |
| @fontsource/atkinson-hyperlegible-next | 5.3.0 | Body face. Exists, OFL-1.1, static 400, 600, 700 in woff and woff2 |
| @fontsource-variable/atkinson-hyperlegible-next | 5.3.0 | Exists, not used: two static weights are smaller than the variable file |
| fast-xml-parser | 5.11.2 | Dev only: parse feeds in tests. Already a dependency of @astrojs/rss |
| pnpm | 12.9.1 | Package manager, set in `packageManager` |
| Node | 24 LTS | Runtime for build. Local machine has 22.22.0, which also meets Astro's minimum |

New dependency reasons (CLAUDE.md asks for one): `@astrojs/preact` and `preact` to meet the JS budget; `satori` and `@resvg/resvg-js` for R12 and R16; `fast-xml-parser` (dev) to check RSS structure in tests (AC15); `@types/node` (dev) because `astro check` type-checks `playwright.config.ts`, which reads `process.env`. No reading-time library: a 15 line function over `entry.body` is enough. No font metrics library: the Astro Fonts API generates metric fallbacks.

Not pinned in npm, pinned at implementation: `caddy` and `node` Docker image tags (see Risks).

## 3. Project structure

```
alina-os/
  astro.config.ts
  biome.json
  tsconfig.json
  package.json  .npmrc  .nvmrc
  vitest.config.ts
  playwright.config.ts
  lighthouserc.json
  Dockerfile  Caddyfile  .dockerignore  railway.json
  scripts/
    js-budget.ts               gzipped JS per page from dist/
    docker-smoke.sh            AC19 checks with curl
  src/
    content.config.ts          collections, loaders, CONTENT_DIR switch
    content/
      digest/NNN.mdx           real issues (Alina writes these)
      notes/slug.mdx           real notes
    lib/
      schemas.ts               Zod schemas (exported for unit tests)
      collection-checks.ts     pinned and number checks
      content.ts               published queries, sorting, prev/next, reading time
      reading-time.ts
      sprite.ts                grid to rects with run merging
      tokens.ts                reads hex values from tokens.css (for Satori)
      og.ts                    Satori element trees and PNG render
      seo.ts                   title, description, canonical helpers
      site.ts                  nav items, placeholders ([EMAIL], [DAY]...)
    sprites/
      cat.ts folder.ts document.ts floppy.ts speech-bubble.ts radar.ts clock.ts
    styles/
      tokens.css               @theme tokens, the only source of colors, type, spacing
      global.css               @import "tailwindcss"; tokens; base element styles
    layouts/
      BaseLayout.astro         head, MenuBar, main container, Dock
    components/
      Window.astro DesktopIcon.astro PixelSprite.astro PixelStairs.astro
      TagChip.astro Terminal.astro Callout.astro MenuBar.astro Dock.astro
      SubscribeForm.astro Seo.astro PetWindow.astro
      mdx/Section.astro mdx/Item.astro mdx/TriedIt.astro
      mdx/CodeBlock.astro mdx/Figure.astro mdx/PullQuote.astro mdx/TableWrap.astro
    islands/
      PetButton.tsx FilterList.tsx ViewToggle.tsx SubscribeEnhancer.tsx
      IssueListItem.tsx NoteListItem.tsx   view only, also rendered static without a client directive
    pages/
      index.astro
      digest/index.astro digest/[number].astro digest/rss.xml.ts
      writing/index.astro writing/[slug].astro writing/rss.xml.ts
      about.astro 404.astro rss.xml.ts
      og/[...path].png.ts
  tests/
    unit/  *.test.ts
    build/ build-fails.test.ts
    e2e/   routes.spec.ts home.spec.ts digest.spec.ts writing.spec.ts about.spec.ts
           islands.spec.ts subscribe.spec.ts dock.spec.ts feeds.spec.ts og.spec.ts
           helpers/axe.ts helpers/routes.ts
    fixtures/
      content/                 sample content for tests (placeholders only)
      content-two-pinned/
      content-missing-alt/
```

## 4. Design tokens

`src/styles/tokens.css` holds one `@theme` block. `global.css` does `@import "tailwindcss";` then `@import "./tokens.css";`.

- Reset Tailwind defaults so only our tokens exist: `--color-*: initial;`, `--font-*: initial;`, `--shadow-*: initial;`. A stray `bg-blue-500` then produces no CSS, and a unit test checks that no default palette names appear in built CSS.
- Colors: the 14 spec tokens as `--color-ink: #111111;` through `--color-terminal-dim: #6F6F6F;`. Add `--color-sprite-green: #7BC86C;` because the sprite key uses `G #7BC86C` and the principle says colors come only from tokens (see 17.4). Pink is the single `#FF9BD6`; the canvas `#FF8AD8` is not used.
- Fonts: `--font-display`, `--font-label`, `--font-ui`, `--font-body`, each `var(--font-pixelify)` etc. (variables set by the Astro Fonts API) followed by the generated fallback and a generic family.
- Type scale: `--text-label-sm: 11px` to `--text-label-lg: 16px`, `--text-ui-sm: 13px` to `--text-ui-lg: 17px`, `--text-body: 18px`, `--leading-body: 1.7`, `--leading-ui: 1.6` and `1.85`. Display sizes use `clamp()` with `cqi`, defined as tokens too: `--text-title: clamp(56px, 10cqi, 150px)`, plus smaller `--text-h1`, `--text-h2`.
- Measure: `--container-measure: 68ch` (inside 65 to 72).
- Shape: `--border-window: 3px`, `--radius-dialog-button: 10px`, `--shadow-hard-sm: 4px 4px 0 0 var(--color-ink)`, `-md` 6 px, `-lg` 10 px. Colored shadows use the same offsets with `var(--shadow-color)` so the Window can set a pink shadow on About.
- Spacing: Tailwind's `--spacing: 4px` base so `p-2` is 8 px; all spacing utilities resolve from it.
- Container sizes: `--container-dock: 40rem` (640 px) so `@dock:` works as a container query variant.

Custom CSS rules (each needs a reason):

- Title bar stripes: `repeating-linear-gradient` with ink 2 px every 5 px. No utility expresses this.
- Dot patterns for sky and lavender: `radial-gradient` background. Same reason.
- Dock bottom padding with `env(safe-area-inset-bottom)`. Arbitrary value utilities could do it but a named rule is clearer.
- Prose styles for MDX body (headings, lists, `mark`) inside `.prose-note`, because MDX output has no class hooks.
- Default dialog button double outline (`ring-default`): two stacked box-shadows, white gap then ink ring, as on classic Mac OS alerts. Tailwind's ring utilities need the default shadow tokens, which are reset.
- Section numbers for digest sections and note headings: a CSS counter (`counter-sections`, `counter-section`, `section-number`). MDX components do not know their index, and no utility expresses counters.

Fonts and metric fallbacks: use the Astro Fonts API (`fonts` in `astro.config.ts`) with `fontProviders.npm({ remote: false })` reading the four installed `@fontsource/*` packages, so nothing is fetched from a CDN at build or run time. Weights: Pixelify Sans 600, 700; Silkscreen 400; Space Mono 400, 700; Atkinson Hyperlegible Next 400, 700. Subset `latin`, `font-display: swap`, formats woff2. `optimizedFallbacks` stays on (default) so Astro generates `size-adjust`, `ascent-override` and `descent-override` fallback faces from the local system font named last in each `fallbacks` list (`monospace` for the pixel and mono faces, `sans-serif` for Atkinson). `<Font cssVariable="--font-pixelify" preload />` and the same for Atkinson on article and issue pages only, to keep preloads to two files.

## 5. Content collections

`src/content.config.ts` defines `digest` and `notes`, both via a glob loader over `${CONTENT_DIR}/digest` and `${CONTENT_DIR}/notes` with pattern `*.mdx`. `CONTENT_DIR` defaults to `src/content`; tests set it to a fixture folder. Schemas live in `src/lib/schemas.ts` so Vitest can import them without Astro.

Digest schema (Zod 4 via `astro/zod`):

```ts
z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  date: z.coerce.date(),
  lede: z.string().min(1),
  topics: z.array(z.enum(["Models", "Tooling", "Agents", "Papers"])).min(1),
  quote: z.object({ text: z.string().min(1), author: z.string().min(1), role: z.string().min(1) }).optional(),
  draft: z.boolean().default(false),
})
```

Notes schema (function form to get `image()`):

```ts
({ image }) => z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tag: z.enum(["Architecture", "AI in production", "Agents", "Side projects", "Backend"]),
  dek: z.string().min(1),
  tldr: z.array(z.string().min(1)).min(1).max(5),
  cover: z.object({ src: image(), alt: z.string().trim().min(1) }).optional(),
  pinned: z.boolean().default(false),
  series: z.string().regex(/^[a-z0-9-]+$/).optional(),
  draft: z.boolean().default(false),
})
```

Build failures:

- AC16: a cover with missing or empty `alt` fails the Zod schema, which fails `astro build` and `astro sync`. The schema error names the entry.
- AC7: the notes loader wraps the glob loader: `load(ctx)` awaits `glob(...).load(ctx)`, then calls `assertSinglePinned([...ctx.store.values()])` from `collection-checks.ts`. Two or more notes with `pinned: true` throw `Error("Only one note can be pinned. Pinned: src/content/notes/a.mdx, src/content/notes/b.mdx")` using each entry's `filePath`. Draft notes are included in the check, so the rule holds in dev and prod alike.
- The digest loader runs `assertIssueNumbers`: each entry's `number` must equal its file name (`012.mdx` is 12) and be unique; the error names the files.
- If the Content Layer store API shape differs from this at implementation, the fallback is the same functions called from `getPublishedNotes()` in `src/lib/content.ts`, which every page uses, so the build still fails.

Drafts: `src/lib/content.ts` exposes `getPublishedIssues()` and `getPublishedNotes()`, which filter `draft === true` out when `import.meta.env.PROD` is true. Pages, feeds, OG endpoints and `getStaticPaths` all use these functions and nothing else, so drafts never reach production pages, feeds or the sitemap (the sitemap only lists built pages).

Reading time: `readingTime(body: string)` strips import and export lines, JSX tags and the fence lines of code blocks (code text still counts), counts words, divides by 220 wpm, rounds up, minimum 1. Unit tested. It reads `entry.body`, which glob-loaded entries expose as the raw source.

Other helpers in `content.ts`: `latestIssue`, `newestNotes(n)`, `pinnedOrNewest`, `prevNextNote(slug)` (by date, ties by title), `prevIssue(number)`, `issuePath(number)` using `String(n).padStart(3, "0")`.

Production content: `src/content/` starts empty of facts. Alina adds the first real issue and note. Until then a production build has zero published entries; Home cannot render R1 without an issue, so `getPublishedIssues` used by Home throws a clear error ("No published digest issues") rather than rendering an empty window (see Risks).

## 6. Routes and page composition

All pages use `BaseLayout` (Seo head, skip link, MenuBar, `<main>` as `@container`, Dock, closing `PixelStairs` where the design has them).

- `/` `index.astro`: desktop with sky dot background. `DesktopIcon` x5 (digest.txt to `issuePath(latest)`, writing/ to `/writing`, archive/ to `/digest`, feed.rss to `/rss.xml`, about.txt to `/about`); title "alina.os" in display type; one-line description; `Window` "this_week_in_ai.md" (number, date, reading time, title, lede, topic `TagChip`s, link); `Window` "latest_note.txt" (newest note, `NoteListItem`); `PetWindow`; writing list `Window` with five newest notes; `SubscribeForm variant="dialog"` with `id="subscribe"`. Layout: grid with the icon column on the left at `@5xl` and wider; icons in a grid above the title below that.
- `/digest` `digest/index.astro`: archive `Window` with count and `FilterList` island fed with `{number, date, title, topics, href}` for all published issues, newest first. Subscribe band at the end.
- `/digest/NNN` `digest/[number].astro`: `getStaticPaths` from published issues, param `012`. Sky hero (issue number "#012", date, reading time, "This week in AI", issue title with `<mark>` highlight), contents `Window` built from the issue's `Section` headings (`render(entry)` returns `headings`; `Section` renders an `h2` with a slug id), the MDX body with digest components, quote `Window` only when `quote` exists, `TriedIt` comes from the body, "previous" link to the prior issue when one exists, link to `/digest`, subscribe band.
- `/writing` `writing/index.astro`: yellow background, "pinned.md" `Window` with `pinnedOrNewest`, "all_notes/" `Window` with count and `FilterList` island grouped by tag. The pinned note also appears in all_notes/ (AC7).
- `/writing/slug` `writing/[slug].astro`: pink hero (back link "writing/", `TagChip`, title, date, `updated` when present, reading time, author "Alina Shaimieva"), cover `Figure` when present, tl;dr `Window` with the bullet list, MDX body in `.prose-note` with the note components map, previous and next links (each omitted when absent), subscribe band.
- `/about` `about.astro`: lavender dot background, "About.txt" title, `Terminal` window with bio placeholder `[BIO]`, case study `Window`s with placeholders, "side_projects/" `Window` with `ViewToggle` island, contacts: `mailto:[EMAIL]`, `https://github.com/alicefarron`, `[LINKEDIN_URL]`. Placeholders render visibly in square brackets. Placeholder hrefs are not rendered as links until real values exist (a link to `[EMAIL]` would be broken); they render as text.
- `/404` `404.astro`: system alert `Window` with "The page could not be found." and a link home. `noindex` meta.
- Feeds and OG endpoints: see section 11.

Subscribe link in MenuBar and Dock: points to `#subscribe` on pages that have a form (home, issue, article, archive) and to `/#subscribe` elsewhere. It never gets `aria-current`.

## 7. Components mapped to spec

| Component | File | Spec | Requirements |
|---|---|---|---|
| MenuBar | components/MenuBar.astro | MenuBar | R15, R11 |
| Dock | components/Dock.astro | Dock | R15, AC17 |
| Window | components/Window.astro | Window | R1, R3, R5, R6, R7, R14 |
| DesktopIcon | components/DesktopIcon.astro | DesktopIcon | R2 |
| PixelSprite | components/PixelSprite.astro | PixelSprite | R2, R8, R15 |
| PixelStairs | components/PixelStairs.astro | PixelStairs | design |
| TagChip | components/TagChip.astro | TagChip | R1, R4, R5, R6 |
| FilterList | islands/FilterList.tsx | FilterBar | R4, R5, R9 |
| ViewToggle | islands/ViewToggle.tsx | ViewToggle | R7, R9 |
| Terminal | components/Terminal.astro | Terminal | R6, R7, digest TriedIt |
| Callout | components/Callout.astro | Callout | R6 |
| SubscribeForm | components/SubscribeForm.astro + islands/SubscribeEnhancer.tsx | SubscribeForm | R1, R3, R6, R10 |
| PetWindow | components/PetWindow.astro + islands/PetButton.tsx | PetWindow | R1, R8 |
| Seo | components/Seo.astro | none | R12, R16 |
| Section, Item, TriedIt | components/mdx/*.astro | Content model | R3 |
| CodeBlock, Figure, PullQuote, TableWrap | components/mdx/*.astro | R6 body | R6, R11 |
| IssueListItem, NoteListItem | islands/*.tsx (rendered static on Home, no hydration) | none | R1, R4, R5 |

Notes per component:

- Window: props `title`, `as` ("section" makes the title an `h2`, or `h1`/`h3` via `headingLevel`), `variant` (white, sky, yellow, pink, lavender, alert), `shadow` (sm, md, lg), `shadowColor` (ink or pink). Close box is decorative (`aria-hidden`, not a button), since closing is not in the spec.
- CodeBlock: overrides `pre` in the MDX components map. Renders the `Terminal` frame, a Silkscreen file name label, and an inner `overflow-x: auto` box with `tabindex="0"` and `role="region"` plus `aria-label` (scrollable regions must be keyboard reachable for axe). File name comes from the fence meta `title="file.ts"`. Fallback if the Sätteri pipeline does not expose meta: wrap fences in an explicit `<CodeBlock title="file.ts">` in MDX (see Risks). Checked at T19 against astro 7.3.6 source: Sätteri passes fence meta only to Shiki, so `src/lib/code-meta.ts` adds a Shiki transformer (in `markdown.shikiConfig.transformers`) that copies `title=` to `data-title` on `pre` and strips Shiki's inline colors so the Terminal style comes from tokens. The fallback is not needed.
- TableWrap: overrides `table` with a scrolling wrapper, same `tabindex` and `role="region"` pattern (R11).
- Callout: `<aside>` with a visually decorative "!" and a text label for screen readers ("Note").
- PullQuote: overrides `blockquote` inside notes.
- MenuBar: `<header>` with site name link and cat sprite; `<nav aria-label="Main">` with links, hidden below 640 px (`max-dock:hidden` on the nav, so the bar keeps only the name). Current link gets inverted classes and `aria-current="page"`.
- Dock: `<nav aria-label="Main">`, rendered once in the layout, `fixed bottom-0`, shown only below 640 px (`dock:hidden` media variant, see section 9). Four links, each sprite plus Silkscreen label, `min-h-11` (44 px). Only one of MenuBar nav and Dock is visible at a time, so the duplicate landmark label is not exposed twice; axe will confirm.

## 8. Islands and no-JS fallback

Islands are `.tsx` in `src/islands/`, hydrated with `client:visible` (pet, view toggle, subscribe) or `client:idle` (filters, which sit near the top of their pages). Each island checks hydration with a `mounted` state set in `useEffect`; controls render with the `hidden` attribute until then. The SSR HTML is therefore the no-JS state.

- PetButton (R8, AC11): props `lines: string[]` (the five status lines). SSR: status line "zzz... (idle)", button hidden. After mount: button "Pet the cat" visible; each press sets `index = Math.min(index + 1, 4)`. The status line is a `<p aria-live="polite">`. PetWindow.astro renders the window, cat sprite and the island inside.
- FilterList (R4, R5, R9, AC6): props `items: { id, href, title, date, labels: string[] }[]`, `filters: string[]`, `noun` ("issues" or "notes"). SSR: full list, count "N issues", filter bar hidden. After mount: a `role="group"` with `aria-label="Filter by topic"` (or "Filter by tag") of `<button aria-pressed>` toggles plus "All". One active filter at a time (pressing the active one returns to All). Count updates in an `aria-live="polite"` element. The island renders the list itself so it can filter, so `IssueListItem` and `NoteListItem` markup is written once as small `.tsx` view components in `src/islands/`. The island uses them, and Home renders them as static components with no client directive, so they ship no JS there.
- ViewToggle (R7, AC10): props `projects: { name, description, href?, year? }[]`. SSR: Icons view (grid of `DesktopIcon`-like chips) with all items, toggle hidden. After mount: two buttons "Icons" and "List" with `aria-pressed`; List renders a `<table>` with header row inside a scroll wrapper. Project data are placeholders.
- SubscribeEnhancer (R10, AC12): see section 12.

Budget: with Preact the shared runtime is about 5.6 KB gzipped (measured with esbuild on 2026-10-06), and each island adds roughly 1 to 3 KB. `scripts/js-budget.ts` sums gzipped size of every `<script type="module">` and island component URL referenced by each built HTML file and fails above 30 KB. It runs in `pnpm check` after the build.

## 9. Sprites and responsive strategy

Sprites: each file in `src/sprites/` exports `{ name, width, height, rows: string[] }` copied exactly from the spec appendix. `src/lib/sprite.ts`:

- `parseSprite(sprite)`: asserts every row length equals `width`, row count equals `height`, and every character is in the key `K W Y B P G .`.
- `toRects(sprite)`: for each row, scan left to right and merge consecutive equal non-transparent characters into one `{ x, y, w, h: 1, color }`. No vertical merging (keeps the rule simple and deterministic).
- Color map: `K` ink, `W` white, `Y` yellow, `B` sprite-blue, `P` pink, `G` sprite-green, each as `var(--color-...)`.

`PixelSprite.astro` renders `<svg viewBox="0 0 w h" width height shape-rendering="crispEdges">` with one `<rect>` per run, `fill` set to the CSS variable. Props: `sprite`, `scale` (pixel size), `title` (if given, `role="img"` and `<title>`; otherwise `aria-hidden="true"`). For OG images, `og.ts` uses the same `toRects` with hex values from `tokens.ts`.

Responsive:

- `<main>` and each `Window` body are `@container` (inline-size). Display type uses `cqi` tokens. No `vw` anywhere (Biome cannot check this; a unit test greps `src/` for `vw` units).
- Windows stack in one column when their container is under 40 rem: layouts use `grid grid-cols-1 @dock:grid-cols-[...]`.
- Desktop icon column (AC3): at the `@5xl` container width the home grid is `[icons] [content]`; below it the icons are a wrapping grid above the title (AC2).
- The Dock and the MenuBar nav switch on the viewport, not a container, because the dock is fixed to the viewport. This is the one media query: Tailwind's `max-sm` / `sm` (40 rem = 640 px), exposed as named variants `max-dock` and `dock` in `global.css` via `@custom-variant`.
- Bottom padding: `body` gets `padding-bottom: calc(var(--dock-height) + env(safe-area-inset-bottom))` below 640 px; `--dock-height` is a token.
- Overflow: code blocks and tables scroll in their own box; long URLs in items use `overflow-wrap: anywhere`.

## 10. Accessibility

- Skip link to `#main` as the first focusable element.
- Visible focus ring token: 3 px ink outline with 2 px offset on all controls.
- Contrast: link text is ink with underline; hover `link-hover` #2348C4 (passes on white, paper and yellow; to check on sky, see Risks). Terminal text #E8E8E8 on #111111 passes. `terminal-dim` #6F6F6F is used only for borders, never for text.
- Pixel sprites are decorative unless they are the only content of a link, in which case the link has a text label (Dock and DesktopIcon labels are always visible text).
- Headings: one `h1` per page; Window titles become `h2` when the window is a section.
- `prefers-reduced-motion`: no animations are planned; contents link scrolling uses `scroll-behavior: smooth` only inside `@media (prefers-reduced-motion: no-preference)`.

## 11. SEO, feeds, sitemap, OG images

- `site` in `astro.config.ts`: `process.env.SITE_URL`, falling back to `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` and then to `http://localhost:4321` for tests. The real domain is `[DOMAIN]` until known. `trailingSlash: "never"`, `build.format: "directory"`.
- `Seo.astro` props: `title`, `description`, `ogImage`, `type` ("website" or "article"), `noindex`. Renders `<title>` ("Page | alina.os", Home is "alina.os"), meta description, `<link rel="canonical">` from `new URL(Astro.url.pathname, Astro.site)`, `og:title`, `og:description`, `og:url`, `og:image` (absolute, 1200x630), `og:type`, `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`, and `<link rel="alternate" type="application/rss+xml">` for the three feeds. A unit test over built HTML checks titles and descriptions are unique across routes.
- Descriptions: issues use `lede`, notes use `dek`, static pages use fixed strings in `site.ts`.
- Sitemap: `@astrojs/sitemap` with `filter` excluding `/404`. Drafts are never built in production so they never appear.
- Feeds: `@astrojs/rss`. `/rss.xml` combines issues and notes by date; `/digest/rss.xml` and `/writing/rss.xml` per collection. Full content: render each entry's MDX to HTML with the Astro Container API (`experimental_AstroContainer.create()` then `renderToString(Content)`), passing the same MDX components map, then make relative URLs absolute. Items carry `title`, `link`, `pubDate`, `description` (lede or dek) and `content`. If the Container API has changed in Astro 7, fall back to rendering via `@astrojs/mdx`'s compiled component the same way the RSS docs describe for that version (see Risks).
- OG images: `src/pages/og/[...path].png.ts` with `getStaticPaths` for every route (home, archive, writing, about, 404, each issue, each note). `og.ts` builds a Satori element tree: sky dot background (simple pattern of absolutely positioned squares), a white window with 3 px ink border, striped title bar (stacked 2 px ink bars), title in Pixelify Sans 700, uppercase, site name "alina.os", the cat sprite as rects. Issue variant adds a large "#012" label and "This week in AI". Fonts passed to Satori as the `.woff` files from `node_modules/@fontsource/pixelify-sans/files/` and Space Mono (Satori accepts ttf, otf and woff, not woff2). Satori SVG goes to `@resvg/resvg-js` for PNG at 1200x630. Colors come from `tokens.ts`, which parses `tokens.css` so there is still one source.

## 12. Newsletter (Buttondown)

Verified from Buttondown docs (docs.buttondown.com, "Building your subscriber base" and "Embed form CORS/CSP"):

- Endpoint: `POST https://buttondown.com/api/emails/embed-subscribe/<username>`, form fields `email` (required) and `embed=1` (hidden), optional `tag` and `metadata__<key>`.
- The docs say: "Do not send requests to it with JavaScript's fetch API: subscribers sometimes need to follow Buttondown's response to complete CAPTCHA verification or correct a validation error." The CORS policy and the response format (redirect, HTML or JSON) are not documented; I could not probe the endpoint from this environment.

So the spec's reading of R10 ("show a success and an error state" for provider responses) cannot be built reliably without a server of our own. Proposed flow (needs Alina's approval, section 17.2):

1. `SubscribeForm.astro` is a real `<form method="post" action="https://buttondown.com/api/emails/embed-subscribe/[BUTTONDOWN_USERNAME]" target="_blank">` with a visible `<label for>`, `<input type="email" name="email" required autocomplete="email">`, hidden `embed=1`, and a submit button. Without JS it works: a new tab opens on Buttondown, which handles CAPTCHA, validation and confirmation. The page and the typed email stay put.
2. `SubscribeEnhancer.tsx` (island inside the form) adds:
   - Client validation on submit: empty or invalid email blocks submit and shows "Enter a valid email address." in an `aria-live="assertive"` region, sets `aria-invalid` and `aria-describedby`; the value stays.
   - Offline check: if `navigator.onLine` is false, block and show "You seem to be offline. Your email is still here, try again when connected."
   - After a valid submit: state "sent", message "Almost done. Finish in the Buttondown tab, then confirm the email we send to [EMAIL ADDRESS]." The field keeps the email.
3. States: idle, invalid, offline, sent. There is no "provider error" state because the provider's response is not readable. Provider-side errors are shown by Buttondown in its tab.
4. Variants: `dialog` (Home: system alert style, "Not now" secondary button, which hides the dialog with JS and is a link to `#main` without JS; default "Subscribe" button with 10 px radius and thick border) and `band` (issue, article, archive).
5. Privacy: the email goes to Buttondown only on submit, which the spec approves. No scripts or iframes from Buttondown load on our pages.

Proposed AC12 rewording: "Given an invalid email or no network, when the form is submitted, then an error message is announced to screen readers and the email field keeps its value. Given a valid email, then the form posts to Buttondown in a new tab and the page shows the sent state with the email still in the field."

If Alina prefers to keep AC12 as written, the only reliable options need something not in the spec: a server endpoint (breaks "static first" and needs an API key on the server), or Buttondown's iframe embed (loads a third party frame on our pages and cannot use our design).

## 13. Railway deployment

Why a Dockerfile and not Railpack: the repo has a `package.json`, so Railpack would detect a Node app rather than its static Caddy provider, and AC19 requires `docker build` to work locally. A Dockerfile is explicit and testable.

`Dockerfile` (two stages):

1. `FROM node:24-alpine AS build`: `npm i -g pnpm@12.9.1`, copy `package.json` and `pnpm-lock.yaml`, `pnpm install --frozen-lockfile`, copy source, `ARG SITE_URL`, `ARG RAILWAY_PUBLIC_DOMAIN`, `pnpm build`.
2. `FROM caddy:2-alpine`: copy `Caddyfile` to `/etc/caddy/Caddyfile` and `dist/` to `/srv`. Exact tags pinned by digest at implementation.

`Caddyfile`:

```
{
  admin off
  auto_https off
}
:{$PORT:8080} {
  root * /srv
  encode zstd gzip
  header /_astro/* Cache-Control "public, max-age=31536000, immutable"
  header /og/* Cache-Control "public, max-age=86400"
  @html path *.html / */
  header @html Cache-Control "public, max-age=0, must-revalidate"
  header X-Robots-Tag {$X_ROBOTS_TAG:all}
  header X-Content-Type-Options nosniff
  header Referrer-Policy strict-origin-when-cross-origin
  try_files {path} {path}/index.html {path}.html
  file_server
  handle_errors 404 {
    rewrite * /404.html
    file_server
  }
}
```

`handle_errors` keeps the 404 status while serving `404.html`. Railway sets `PORT`.

`railway.json`: `{"build": {"builder": "DOCKERFILE", "dockerfilePath": "Dockerfile", "watchPatterns": ["src/**", "public/**", "package.json", "pnpm-lock.yaml", "astro.config.ts", "Dockerfile", "Caddyfile"]}, "deploy": {"healthcheckPath": "/"}}`.

PR environments (manual steps, documented in the task): link the GitHub repo to the Railway service, set the production environment to deploy from `main`, enable PR Environments in Project Settings > Environments, give the base service a Railway domain (PR environments only get domains when the base service has one), and set `X_ROBOTS_TAG=noindex` on PR environments so previews are not indexed. Railway deletes PR environments when the PR is merged or closed.

`scripts/docker-smoke.sh` (AC19): `docker build -t alina-os .`, run with `-p 8080:8080`, then curl: `/` is 200; `/missing` is 404 and the body contains "The page could not be found."; the first `/_astro/*.css` link from `/` returns `Cache-Control: public, max-age=31536000, immutable`. Stops the container at the end.

## 14. Testing strategy

Commands: `pnpm check` = `biome check . && astro check && vitest run && astro build && tsx scripts/js-budget.ts`. `pnpm test:e2e` = build with `CONTENT_DIR=tests/fixtures/content`, `astro preview`, Playwright projects `phone` (390x844), `tablet` (820x1180), `desktop` (1280x800). Lighthouse CI runs `lhci autorun` against `dist/` built from fixtures.

Every route gets an axe check and visual snapshots at all three widths in `tests/e2e/routes.spec.ts`, driven by `tests/e2e/helpers/routes.ts` (one list, extended as pages land).

| AC | Test | Kind |
|---|---|---|
| AC1 | `tests/unit/content.test.ts` "latestIssue picks the highest number" and "newestNotes returns five, newest first"; `tests/e2e/home.spec.ts` "home shows issue 012 and the five newest notes in order" | unit + e2e |
| AC2 | `home.spec.ts` "phone: icons grid above title, windows full width" (icon boxes above the h1 box; each window width equals main content width within 1 px) | e2e (phone) |
| AC3 | `home.spec.ts` "desktop: icons in one column left of title" (all icons share x, right edge left of h1) | e2e (desktop) |
| AC4 | `digest.spec.ts` "issue 012 contents links scroll to sections" (click each, hash matches, section in viewport), "quote window shown", "previous links to /digest/011" | e2e |
| AC5 | `digest.spec.ts` "issue 011 has no quote window" | e2e |
| AC6 | `islands.spec.ts` "archive filter Agents" (JS on) and "archive without JS shows all, no buttons" (`javaScriptEnabled: false` context) | e2e |
| AC7 | `tests/unit/collection-checks.test.ts` "two pinned notes throw naming both files"; `tests/build/build-fails.test.ts` "two pinned fixture fails build with both file names"; `writing.spec.ts` "pinned note in pinned.md and all_notes/" | unit + build + e2e |
| AC8 | `writing.spec.ts` "code block renders as terminal with file label and scrolls at 390" (label visible, `scrollWidth > clientWidth` on the inner box, page has no overflow) | e2e (phone) |
| AC9 | `tests/unit/content.test.ts` "first note has no previous"; `writing.spec.ts` "oldest note has no previous link" | unit + e2e |
| AC10 | `islands.spec.ts` "about List view renders table, aria-pressed true" | e2e |
| AC11 | `islands.spec.ts` "pet four times shows fifth line, fifth press keeps it"; also no-JS "button hidden, idle line" | e2e |
| AC12 | `subscribe.spec.ts` "invalid email: alert announced, value kept", "offline: alert, value kept" (`context.setOffline(true)`), "valid email: form posts to Buttondown in new tab, sent state" (`page.route` intercepts the Buttondown URL and fulfills a 200 so no real request leaves). As written in the spec ("provider returns an error"), not testable: see 17.2 | e2e |
| AC13 | `routes.spec.ts` "no horizontal overflow" (`scrollWidth <= clientWidth` on `document.documentElement`) and `toHaveScreenshot` per route and width. Baselines approved manually by Alina once (T37) | e2e + manual |
| AC14 | `routes.spec.ts` axe with tags wcag2a, wcag2aa, wcag21aa, wcag22aa, zero violations, JS on and off; `lighthouserc.json` asserts 0.95 minimum for performance, accessibility, best-practices, seo with mobile preset for every route | e2e + lhci |
| AC15 | `tests/unit/feeds.test.ts` over `dist/` "three feeds parse as RSS 2.0 with required channel and item fields, include content:encoded, contain no draft titles"; manual: paste each feed into validator.w3.org/feed once (T39) | build test + manual |
| AC16 | `tests/unit/schemas.test.ts` "cover without alt fails"; `tests/build/build-fails.test.ts` "missing alt fixture fails build" | unit + build |
| AC17 | `dock.spec.ts` "phone: dock visible, four items, aria-current, menu bar has no visible nav links, last element above dock" (last element's bottom <= dock top after scrolling to end) on every route; "tablet: dock not visible" | e2e |
| AC18 | `tests/unit/og.test.ts` "issue OG tree contains #012" (walks the Satori element tree) plus "renders a 1200x630 PNG"; `tests/e2e/og.spec.ts` screenshot snapshot of `/og/digest/012.png` approved manually | unit + e2e + manual |
| AC19 | `scripts/docker-smoke.sh` run locally (T35); manual check on the first Railway deploy and on one PR preview (T36, T39) | script + manual |

Extra checks: `tests/unit/tokens.test.ts` (spec colors exact, no default palette), `tests/unit/sprite.test.ts` (grids match spec dimensions, run merging), `tests/unit/no-vw.test.ts`, `tests/unit/reading-time.test.ts`, `scripts/js-budget.ts`.

Build failure tests (`tests/build/`) run `astro build` in a child process with `CONTENT_DIR` pointing at a broken fixture and an `outDir` in a temp folder, and assert a non-zero exit code and the expected text in stderr. They run in Vitest under a separate `build` project so `pnpm check` includes them.

## 15. Sample content for tests

All under `tests/fixtures/content/`, never in `src/content/`. Text is placeholders in square brackets or neutral lorem-style filler clearly marked as sample. No real news, sources, people or claims.

- Digest: `010.mdx` (topics Models, Papers; no quote), `011.mdx` (topics Tooling; no quote; used by AC5 and as "previous" for 012), `012.mdx` (topics Agents, Models; with `quote` `{ text: "[QUOTE]", author: "[AUTHOR]", role: "[ROLE]" }`; three `Section`s with two `Item`s each, `source` name "[SOURCE]" and URL `https://example.com/[SOURCE]`; one `TriedIt` with a `Terminal` block). `013.mdx` with `draft: true` (AC15).
- Notes: seven files, dates spread over seven weeks: one `pinned: true` (not the newest, so AC7 proves pinned beats newest), one with a fenced code block with `title="example.ts"` and a line longer than 120 characters (AC8), one with a cover image `tests/fixtures/content/notes/cover.png` (a 2x2 px placeholder) and `alt: "[COVER ALT]"`, one with a `series: "sample-series"`, one with a wide table, one with a callout and a pull quote, and one `draft: true` (AC15). Six are published (AC1).
- `content-two-pinned/`: two minimal notes both `pinned: true`, one issue.
- `content-missing-alt/`: one note with `cover: { src: ./cover.png }` and no alt, one issue.

## 16. Principles check

| Principle | Status |
|---|---|
| Static first | Met. All routes prerendered; Caddy serves files. Newsletter uses a native form post, no server. |
| Zero JS by default, islands only for state | Met. Four islands, each with a no-JS state. |
| Every page readable and navigable with JS off | Met. Nav is plain links; filters and toggle show all items; subscribe form posts without JS. |
| WCAG 2.2 AA | Planned via axe on every route, keyboard focus styles, scrollable regions focusable. Manual check needed for sky background contrast of link hover. |
| Lighthouse mobile 95+ | Planned via lhci. Risk: four web fonts. Mitigation: two preloads, subset latin, metric fallbacks. |
| Under 30 KB client JS per page | Conflict with the Stack line "React islands": React 19 runtime measures about 69 KB gzipped. Resolved only by switching islands to Preact (17.1). |
| No trackers, cookies or third party data without an approved spec | Met. Buttondown receives an email only on submit, approved by the spec. Fonts are self-hosted from npm packages, no CDN. |
| Colors, type, spacing only from tokens | Conflict: sprite key color `G #7BC86C` is not a spec token. Plan adds `sprite-green` (17.4). |
| No comments in code | Applies to all tasks. |
| Ask before adding a dependency | This plan names each new dependency and its reason; approval of the plan is that ask. |

## 17. Decisions needed and spec conflicts

17.1 Islands framework. CLAUDE.md says "React islands" and "under 30 KB client JS per page". React 19.3 plus react-dom client measures 69,275 bytes gzipped for a one-button island (esbuild, minified, production). Preact 10 via `@astrojs/preact` measures 5,609 bytes for the same island. Proposal: use Preact with `.tsx` islands and hooks from `preact/hooks`, and update the Stack line in CLAUDE.md. If Alina keeps React, the JS budget task will fail on every page with an island.

17.2 Newsletter. Spec R10 and AC12 assume the browser can read Buttondown's response. Buttondown's docs say not to use `fetch` on the embed endpoint, and its CORS behavior is undocumented. Proposal in section 12 with reworded AC12. This changes the spec, so it needs Alina's approval.

17.3 Series. R5 says the writing index shows "series when at least one series exists"; Out of scope says "nothing renders it". The plan follows Out of scope and does not render series. Proposal: remove "then series when at least one series exists" from R5.

17.4 Sprite green. The sprite key uses `G #7BC86C`, which is not in the token table. Proposal: add `sprite-green | #7BC86C | pixel sprites only` to the token table.

17.5 Spec status. The spec is `Status: draft`. Per CLAUDE.md nothing is implemented until it is `approved`.

## 18. Risks

- Could not verify Buttondown's CORS headers or the response format of the embed endpoint (outbound requests to buttondown.com were blocked from this environment, and the docs do not document it). Section 12 avoids depending on either.
- Could not verify a Buttondown username; the form action uses `[BUTTONDOWN_USERNAME]` until Alina provides it. Submitting with the placeholder fails on Buttondown's side.
- Astro 7 is new: it renders Markdown and MDX with Sätteri instead of remark/rehype by default, and its docs did not confirm (a) whether code fence meta such as `title="example.ts"` reaches the `pre` override, (b) the exact Content Layer `ctx.store` API used for the pinned check, (c) the status of the Container API used for full-content feeds. Each has a fallback in this plan (explicit `CodeBlock` MDX component; check in `getPublishedNotes()`; render path per the current `@astrojs/rss` docs). Verify each at the start of its task against the docs.
- Image optimization (found at T25): Astro's default image service needs `sharp`, which is not a dependency, and the build fails on any cover image without it. v1 uses `passthroughImageService()` so covers are served as authored with width and height set. Adding `sharp` later (with a plan entry) would add resizing and modern formats if Lighthouse needs them.
- Astro 7 sets `compressHTML: 'jsx'`, which removes whitespace between inline elements. Components must use explicit `{" "}` where a space matters (for example between date and reading time).
- Astro Fonts API with `fontProviders.npm({ remote: false })`: docs confirm the provider reads `@fontsource/*` packages and that fallbacks are generated, but I did not confirm the exact option names in 7.3.6. Fallback: `@fontsource/*` CSS imports plus hand-written fallback `@font-face` rules with `size-adjust`, which needs one more dev dependency (`@capsizecss/metrics` 4.3.0) to read metrics.
- Caddy and Node Docker image versions could not be checked (Docker Hub and GitHub were blocked from this environment). Pin exact tags and digests in T35 when they can be read. Node 24 LTS chosen; Node 26 may become LTS this month.
- Railway variable names (`RAILWAY_PUBLIC_DOMAIN`, passing build args) and the `builder` value for Dockerfiles: the config docs list `DOCKERFILE`; confirm in the dashboard on first deploy.
- `[DOMAIN]` is unknown, so canonical URLs and feed links point at the Railway domain until it is set. Changing it later changes every canonical URL; acceptable for v1 per the spec decisions.
- Production builds fail until Alina adds at least one published issue and one published note, because Home requires them. This is intended (no fake content). Recorded at T21: `pnpm check` therefore builds with `CONTENT_DIR=tests/fixtures/content` (`pnpm build:fixtures`), so the check and the JS budget run over real pages; `pnpm build` keeps using `src/content` and fails until real content lands.
- Lighthouse mobile performance with four font families and inline SVG sprites is untested. Mitigation listed in section 16.
- `hover` color #2348C4 on sky #9FD3F7 and on pink #FF9BD6 needs a contrast check; if it fails AA, hover changes underline thickness instead of color on those backgrounds.
- Visual snapshot baselines depend on the OS font rendering; generate and compare them in the same Playwright Docker image (`mcr.microsoft.com/playwright:v1.63.0-noble`) locally and in CI.
- Satori 0.35 now depends on harfbuzzjs; build time for many OG images is unknown. With under 100 pages it should be seconds.
