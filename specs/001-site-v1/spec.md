# 001: Site v1

Status: approved
Owner: Alina

## Why

Alina wants one place to publish a weekly AI digest and long-form notes on building software, so that readers subscribe for the content. The site should be memorable without selling its author: everything about her lives on a single About page.

## Users and goals

- An engineer who ships AI features wants this week's useful AI news in under ten minutes, and wants it by email.
- A reader arriving from a shared link wants to read one note comfortably on a phone, then find related notes.
- Someone curious about the author wants a short About page with work history, side projects and contacts.

## Scope

Home, digest archive and issue pages, writing index and article pages, About, 404, RSS feeds, sitemap, Open Graph images, newsletter signup, responsive layouts for phone, tablet and desktop.

## Out of scope

Comments, site search, a CMS, dark mode, multiple languages, analytics, series pages (all candidates for later specs). The `series` frontmatter field exists in v1 but nothing renders it.

## Decisions

- Hosting: Railway (Alina's paid account). The static `dist/` is served by a minimal web server in a container, with correct cache headers for hashed assets and a custom 404. Pull requests get Railway PR environments as previews.
- Newsletter: Buttondown, via its public embed subscribe endpoint posted from the browser. No API key in the client.
- Phone navigation: a bottom dock below 640 px (see `Dock`).
- Islands: Preact, written with the React-style API through `preact/compat` where useful. A React island alone is about 69 KB gzipped, over the 30 KB budget.
- Newsletter errors: Buttondown asks not to post to its embed endpoint with `fetch`, so the form does a native POST into a new tab and the page handles only local states (invalid email, offline, sent).
- Article body: a proportional reading face. Pixel and mono faces stay for display, UI, labels and code.
- Unknown copy stays as visible placeholders: domain `[DOMAIN]`, digest day `[DAY]`, email `[EMAIL]`, LinkedIn `[LINKEDIN_URL]`.

## Design source

The approved design is the "B: retro desktop" row of the "Personal site" canvas (pages Home, Digest issue, Writing, Article, About, plus phone and tablet views). Where this spec and the canvas disagree, this spec wins; raise the conflict.

### Tokens

Colors:

| Token | Value | Use |
|---|---|---|
| ink | #111111 | text, borders, hard shadows |
| paper | #F4F3EF | reading backgrounds |
| white | #FFFFFF | window bodies |
| sky | #9FD3F7 | desktop background, digest hero |
| sky-dot | #7BB8E3 | dot pattern on sky |
| yellow | #FFE45C | highlights, writing background |
| pink | #FF9BD6 | article hero, tags, About shadows |
| lime | #B8F28B | tags, terminal prompt |
| lavender | #E9E6F7 | About background |
| lavender-dot | #C9C3E6 | dot pattern on lavender |
| sprite-blue | #3B6FE0 | pixel sprites only |
| sprite-green | #7BC86C | pixel sprites only |
| link-hover | #2348C4 | link hover |
| terminal-text | #E8E8E8 | text on ink |
| terminal-dim | #6F6F6F | terminal borders |

The canvas uses #FF8AD8 for About shadows; use the single pink token instead.

Type:

- Display: Pixelify Sans 600 and 700, uppercase. Fluid sizes with container query units, for example `clamp(56px, 10cqi, 150px)` for page titles.
- Labels, window titles, tags: Silkscreen 400, 11 to 16 px.
- UI, lists and short copy: Space Mono 400 and 700, 13 to 17 px, line height 1.6 to 1.85.
- Article and digest issue body text: Atkinson Hyperlegible Next 400 and 700 (via Fontsource; if unavailable there, raise it in the plan), 18 px, line height 1.7, measure 65 to 72 characters. Code stays Space Mono.

Shape: 3 px ink borders on windows and controls, square corners (dialog buttons 10 px radius), hard offset shadows of 4, 6 or 10 px with no blur, pixel "stairs" edges between colored sections.

### Components

- `MenuBar`: site name alina.os on the left with a small pixel cat, links Digest, Writing, About, and a Subscribe link on the right. Current page is shown inverted (ink background, white text) and marked `aria-current="page"`. Below 640 px the links move to the `Dock` and the menu bar keeps only the site name.
- `Dock`: fixed bottom bar below 640 px, white with a 3 px ink top border, four items (Digest, Writing, About, Subscribe), each a pixel sprite over a Silkscreen label, at least 44 px tall. Current item inverted and marked `aria-current="page"`. Respects the safe-area inset. Page content gets bottom padding so the dock never covers it. Hidden at 640 px and wider.
- `Window`: white body, striped title bar (2 px ink lines every 5 px), close box, centered title in Silkscreen, optional colored variant, configurable shadow offset and color. Title is a heading when the window is a section.
- `DesktopIcon`: pixel sprite plus a label in a bordered white chip, as a link.
- `PixelSprite`: renders a sprite grid to inline SVG.
- `PixelStairs`: decorative stepped edge between two section colors, `aria-hidden`.
- `TagChip`, `FilterBar` (toggle buttons with `aria-pressed`), `ViewToggle` (Icons or List).
- `Terminal`: ink panel with a lime label, monospaced content.
- `Callout`: bordered note with a "!" mark.
- `SubscribeForm`: labeled email input and submit button. Variants: dialog (system alert style with "Not now" and default "Subscribe" buttons), inline band.
- `PetWindow`: the meow.app window with the cat sprite, a status line and a "Pet the cat" button.

Sprites: cat, folder, document, floppy, speech bubble, radar, clock. Grids are in the appendix; copy them exactly.

## Content model

Digest issue (`src/content/digest/NNN.mdx`):

- `number`: positive integer, unique, matches file name
- `title`: string
- `date`: date
- `lede`: string, one or two sentences
- `topics`: one or more of Models, Tooling, Agents, Papers
- `quote`: optional object with `text`, `author`, `role`
- `draft`: boolean, default false
- Body uses MDX components `Section` (title, color), `Item` (headline, `source` name and URL, highlighted takeaway as children or prop), `TriedIt` (text plus a `Terminal` block).

Note (`src/content/notes/slug.mdx`):

- `title`, `date`, optional `updated`
- `tag`: one of Architecture, AI in production, Agents, Side projects, Backend
- `dek`: one line
- `tldr`: one to five strings
- `cover`: optional `src` and required `alt` when present
- `pinned`: boolean, default false, at most one pinned note at a time
- `series`: optional series slug
- `draft`: boolean, default false

Reading time is computed at build time from the body. Drafts are visible in dev and excluded from production builds, feeds and the sitemap.

## Routes

- `/` home
- `/digest` archive of issues
- `/digest/NNN` one issue (three-digit number)
- `/writing` index of notes
- `/writing/slug` one note
- `/about`
- `/rss.xml` combined feed, `/digest/rss.xml`, `/writing/rss.xml`
- `/sitemap-index.xml`, `/404`

## Requirements

R1. Home shows the alina.os title, a one-line description of the site, a "this_week_in_ai.md" window with the latest issue (number, date, reading time, title, lede, its topic items, link to the issue), a "latest_note.txt" window with the newest note, the meow.app window, a writing list of the five newest notes, and the subscribe dialog.

R2. Home shows desktop icons digest.txt, writing/, archive/, feed.rss and about.txt linking to `/digest/latest issue`, `/writing`, `/digest`, `/rss.xml` and `/about`. On wide screens they form a column left of the content; on narrow screens a grid above the title.

R3. The digest issue page shows a sky hero with issue number, date, reading time, the title "This week in AI", the issue title with a highlighted line, and a contents window linking to each section; then the issue body, the quote window when present, the Tried it section, links to the previous issue and the archive, and the subscribe band.

R4. The digest archive lists all published issues newest first with number, date, title and topics, filterable by topic.

R5. The writing index shows the pinned note (or the newest when none is pinned) in a "pinned.md" window, then all notes in an "all_notes/" window with a count, filterable by tag.

R6. The article page shows a pink hero with back link to writing/, tags, title, date, reading time and author; a tl;dr window; the MDX body with styled headings, highlights, figures with captions, code in a Terminal-style block, callouts and pull quotes; previous and next notes by date; and the subscribe band.

R7. The About page shows an About.txt title, a terminal window with a short bio, case studies as windows, side projects in a "side_projects/" window with Icons and List views, and contact links (email, GitHub, LinkedIn).

R8. The meow.app window responds to "Pet the cat" by advancing through five status lines and stays on the last one. Without JavaScript the button is hidden and the window shows the idle line.

R9. Filters (R4, R5) and the view toggle (R7) work as islands. Without JavaScript all items show and the controls are hidden.

R10. Signup forms post to Buttondown without a server of our own, show a success and an error state, and never lose the typed email on error.

R11. Every page works at 390, 820 and 1280 px with no horizontal page scroll. Wide tables scroll inside their own box. Windows stack in one column below 640 px.

R12. Each page has a unique title and description, canonical URL, Open Graph and Twitter tags, and a generated OG image in the retro style (window frame, page title in Pixelify Sans).

R13. Feeds include full content for notes and issues and are valid RSS 2.0.

R14. The 404 page is a system alert window ("The page could not be found.") with a link home.

R15. On screens narrower than 640 px, navigation is the bottom dock; the top menu bar shows only the site name.

R16. Issue pages get an OG image that shows the issue number.

R17. Replaced by 004. (Was: the site deploys to Railway from the main branch, and every pull request gets a preview environment.)

## Acceptance criteria

AC1 (R1). Given three published issues and six notes, when Home is built, then it shows the highest-numbered issue and the five newest notes, newest first.
AC2 (R1, R2). Given Home at 390 px, then desktop icons appear in a grid above the title and every window is full width.
AC3 (R2). Given Home at 1280 px, then desktop icons form a single column to the left of the title.
AC4 (R3). Given issue 012 with a quote and issue 011, when `/digest/012` loads, then the contents links scroll to each section, the quote window is shown, and "previous" links to `/digest/011`.
AC5 (R3). Given an issue without a quote, then no quote window renders.
AC6 (R4, R9). Given the archive with JavaScript on, when Agents is pressed, then only issues with the Agents topic show, the button has `aria-pressed="true"`, and the count updates. With JavaScript off, all issues show and no filter buttons render.
AC7 (R5). Given one note with `pinned: true`, then it appears in pinned.md and also in all_notes/. Given two pinned notes, the build fails with a message naming both files.
AC8 (R6). Given a note with a code block, then the block renders in the Terminal style with the file name label and is horizontally scrollable at 390 px.
AC9 (R6). Given the first note by date, then no "previous" link renders.
AC10 (R7, R9). Given About with JavaScript on, when List is pressed, then side projects render as a table and the List button has `aria-pressed="true"`.
AC11 (R8). Given meow.app, when the button is pressed four times, then the status line is the fifth line; pressing again keeps it there.
AC12 (R10). Given an invalid email or no network, when the form is submitted, then an error message is announced to screen readers and the email field keeps its value. Given a valid email, then the form posts to Buttondown in a new tab and the page shows the sent state with the email still in the field.
AC13 (R11). Given every route at 390, 820 and 1280 px, then Playwright finds no horizontal overflow on `document.documentElement` and visual snapshots match the approved baseline.
AC14 (Principles). Given every route, then axe reports no violations and Lighthouse mobile scores are 95 or higher in all four categories.
AC15 (R13). Given a production build, then all three feeds validate and contain no drafts.
AC16 (Content model). Given a note whose cover has no alt text, then the build fails.
AC17 (R15). Given any route at 390 px, then the dock is visible with four items, the current one has `aria-current="page"`, the menu bar has no nav links, and the last element of the page is not covered by the dock. At 820 px the dock is not rendered visibly.
AC18 (R16). Given issue 012, then its OG image contains the text "#012".
AC19 (R17). Replaced by 004. (Was: given the Dockerfile or Railway config, when built locally with `docker build` and run, then `/` returns 200, `/missing` returns the custom 404 with status 404, and hashed assets under `/_astro/` are served with a one-year immutable cache header.)

## Open questions

None. Placeholders listed under Decisions are accepted for v1.

## Appendix: sprite grids

Key: `K` ink, `W` white, `Y` yellow, `B` sprite-blue, `P` pink, `G` sprite-green, `.` transparent.

cat (14 x 12)
```
..K.......K...
.KWK.....KWK..
.KWWKKKKKWWK..
.KWWWWWWWWWK..
KWWKWWWWWKWWK.
KWWKWWWWWKWWK.
KWWWWWPWWWWWK.
KWPWWWWWWWPWK.
.KWWWKWKWWWK..
.KWWWWWWWWWK.K
.KWWKWWWKWWKKK
..KKK.KK.KKK..
```

folder (12 x 12)
```
............
.KKKK.......
.KYYYK......
.KYYYYKKKKK.
.KYYYYYYYYK.
.KKKKKKKKKK.
.KYYYYYYYYK.
.KYYYYYYYYK.
.KYYYYYYYYK.
.KYYYYYYYYK.
.KKKKKKKKKK.
............
```

document (12 x 12)
```
.KKKKKKK....
.KWWWWWKK...
.KWWWWWKWK..
.KWWWWWKKKK.
.KWKKKKKWWK.
.KWWWWWWWWK.
.KWKKKKKKWK.
.KWWWWWWWWK.
.KWKKKKKWWK.
.KWWWWWWWWK.
.KKKKKKKKKK.
............
```

floppy (12 x 12)
```
KKKKKKKKKKK.
KBBWWWWWBBK.
KBBWWWKWBBK.
KBBWWWKWBBK.
KBBWWWWWBBK.
KBBBBBBBBBK.
KBWWWWWWWBK.
KBWKKKKKWBK.
KBWWWWWWWBK.
KBWKKKKKWBK.
KKKKKKKKKKK.
............
```

speech bubble (12 x 12)
```
............
.KKKKKKKKKK.
KBBBBBBBBBBK
KBWWBBBBWWBK
KBWWBBBBWWBK
KBBBBBBBBBBK
KBBWWWWWWBBK
KBBBBBBBBBBK
.KKKKKBBKKK.
.....KBK....
.....KK.....
............
```

radar (12 x 12)
```
....KKKK....
..KKGGGGKK..
.KGGGKGGGGK.
.KGGGKGGGGK.
KGGGGKGGGGGK
KKKKKKGGGKGK
KGGGGGKGGGGK
KGGGGGGKGGGK
.KGGGGGGKGK.
.KGGGGGGGGK.
..KKGGGGKK..
....KKKK....
```

clock (12 x 12)
```
....KKKK....
..KKYYYYKK..
.KYYYYKYYYK.
.KYYYYKYYYK.
KYYYYYKYYYYK
KYYYYYKKKYYK
KYYYYYYYYYYK
KYYYYYYYYYYK
.KYYYYYYYYK.
.KYYYYYYYYK.
..KKYYYYKK..
....KKKK....
```

Pet status lines, in order: "zzz... (idle)", "purr", "purr purr", "PURR. cpu usage: 0.4%", "ok that is enough".
