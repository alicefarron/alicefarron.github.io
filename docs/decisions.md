# How alina.os got here

What was decided while building v1, and why. Written on 2026-10-06, the day the design, specs and first implementation were done. Newer decisions belong in specs; this file explains the starting point.

## 1. Purpose of the site

The first brief was a personal brand site: an AI digest, articles and a portfolio tab. After seeing the first designs, Alina asked for a site that is less about selling herself. The result:

- The site is about the content: the weekly AI digest and long-form notes.
- Everything about Alina lives on one page, About. Portfolio work (two case studies and four side projects) moved there.
- "Hire me" calls to action were removed. About ends with a plain "Say hi" and contact links.
- The name alina.os stayed. It keeps a personal touch without putting a full name in the hero.

## 2. Design direction

Two directions were drawn on the design canvas:

- A, calm editorial: light grey background, Geist type, one blue accent. Clean but generic.
- B, retro desktop: classic Mac OS windows, pixel type, sky blue and yellow, hard shadows.

B was chosen. It came from Alina's references (a Susan Kare longread, a Tamagotchi poster, a pixel-UI portfolio) and fits the content: an engineer's notebook that looks like an operating system. Details that came out of it:

- Home is a desktop. Icons (digest.txt, writing/, archive/, feed.rss, about.txt) are navigation.
- The meow.app window with a pixel cat you can pet is the site's mascot. It nods to sudo-meow, Alina's real desktop pet project, without making the page about her.
- Each section has its own color: sky for the digest, yellow for writing, pink for articles, lavender for About.
- Writing got its own index (writing/) and an article template after the first retro pass, because the home page table alone had no room for a growing archive.

## 3. Phone and tablet

Phone (390 px) and tablet (820 px) views were checked on the canvas before writing specs. Two fixes came from that:

- Large titles scale with the page width through container query units (`cqi`), not the viewport (`vw`). This keeps them correct in any container, including device previews.
- Desktop icons become a grid above the title on phones, like a home screen, instead of a long column.

Phone navigation became a bottom dock with four items. Five links wrapping onto two lines looked broken, and a dock matches the OS metaphor.

## 4. Spec-driven development

Alina asked for spec-driven development. The workflow:

1. Specify, 2. Clarify, 3. Plan, 4. Tasks, 5. Implement, 6. Verify.

Alina approves twice: after the spec, and after the plan with tasks. Nothing is implemented from an unapproved spec. If code and spec disagree, the spec is changed first. The folder layout (`specs/NNN-slug/spec.md`, `plan.md`, `tasks.md`) matches GitHub Spec Kit, so its commands can be added later without moving files.

## 5. Agent instructions: why they are split

The first CLAUDE.md was 118 lines. Claude Code loads CLAUDE.md into every session, and the docs advise keeping it under 200 lines because long files cost context and lower adherence. Multi-step procedures belong in skills, and rules for part of the code belong in path-scoped rules. So the instructions were split:

- `CLAUDE.md` (37 lines): what the site is, the spec gate, principles, stack, commands, always-rules. Loaded every session.
- `.claude/skills/spec-driven/SKILL.md`: the workflow and templates. Loaded only when working on specs or features.
- `.claude/rules/code.md`: code rules, loaded when files in `src/` or `tests/` are opened.
- `.claude/rules/content.md`: copy rules, loaded for content, pages and components.

One rule is Alina's standing preference: no comments in code at all, including "why" comments. The reasoning lives in specs and in this file instead.

## 6. Stack

- Astro, static output. The site is content, so every page is prerendered HTML. Content collections with Zod schemas catch broken frontmatter at build time.
- MDX for issues and notes, kept in the repo. No CMS: one author, and Git is enough.
- Preact islands, not React. The spec first said React, but the planning agent measured a one-button React island at about 69 KB gzipped against a 30 KB per page budget. Preact is about 6 KB and keeps the React-style API. Alina approved the switch.
- Tailwind CSS v4 with tokens in `@theme`, so colors and type have one source.
- Self-hosted fonts through Fontsource: no requests to Google, no layout shift. Pixelify Sans for display, Silkscreen for labels, Space Mono for UI and code.
- Atkinson Hyperlegible Next for article and issue body text. The design used Space Mono everywhere, but long text in a monospace face is tiring. Pixel and mono faces stay for headings, UI and code.
- Biome, Vitest, Playwright with axe, Lighthouse CI: one fast linter, unit and build tests, e2e with accessibility checks, and a performance gate.

## 7. Product decisions from the clarification round

| Question | Decision | Reason |
|---|---|---|
| Phone navigation | Bottom dock | Fits the OS metaphor, no wrapped menu |
| Newsletter | Buttondown | Simple, Markdown-based, accepts a form post from a static site |
| Hosting | GitHub Pages (spec 004; was Railway) | Free, no container to maintain, the user-site repo serves from the root path. Railway with Caddy and PR previews was the v1 choice and was dropped in 004 together with previews |
| Article font | Proportional reading face | Readability of long text |
| Series pages | Out of v1 | Not enough content yet; the `series` field exists for later |
| Domain, email, LinkedIn, digest day | Placeholders | Not decided yet; visible as `[DOMAIN]` and similar |

## 8. Conflicts the planning agent found, and how they were settled

- React vs the JS budget: switched to Preact (see Stack).
- Newsletter errors: Buttondown asks not to post to its embed endpoint with `fetch`, so the page cannot read its response. The form does a native POST into a new tab and handles only local states: invalid email, offline, sent. AC12 was reworded to match. The alternatives were worse: our own server with an API key breaks "static first", and Buttondown's iframe cannot use our design.
- Series: one requirement rendered them while scope excluded them. Scope won.
- A sprite green that was not a token became the `sprite-green` token.

## 9. How it was built

Three implementation agents worked in sequence, each on one phase group, one commit per task:

- A: setup, foundation (tokens, fonts, sprites, window, layout, dock, 404) and content (schemas, collections, fixtures).
- B: components, pages and islands.
- C: SEO, feeds, OG images, newsletter states and deploy config.

Changes they made to the plan, all recorded in `plan.md`:

- Fonts load through Astro's local font provider pointing at the installed Fontsource files, because the npm provider still fetched from a CDN.
- `@types/node` was added as a dev dependency so `astro check` can type-check the Playwright config.
- Images use Astro's passthrough image service, so `sharp` is not needed.
- `pnpm check` builds the site from test fixtures (`tests/fixtures/content`), because real content is empty. Production builds read only `src/content`, so fixtures never ship.
- The production build fails on purpose until at least one issue and one note exist.
- Without `SITE_URL` the build falls back to `https://domain.invalid` (it also used the Railway domain until spec 004); an invalid `SITE_URL` fails the build.
- RSS items have no author field until a real email exists, because RSS 2.0 expects an email there.
- OG images draw the sky dots as an SVG pattern, because Satori ignores CSS dot backgrounds.

## 10. What is not verified yet

The sandboxes used for the build could not download a Playwright browser or Docker images, and have no Railway access. So:

- e2e tests, visual baselines, axe runs and Lighthouse are written but have not run (tasks T37 to T39 and the Playwright-only checks in earlier tasks).
- Superseded by spec 004: the Docker image tags and the manual Railway setup no longer apply.

Next step after those runs: a spec for empty states, so the site can deploy before the first issue is written.
