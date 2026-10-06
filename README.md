# alina.os

A weekly AI digest and long-form notes on building software, by Alina Shaimieva. Static site with a retro desktop look: classic Mac OS windows, pixel type and pixel sprites.

Built with Astro, TypeScript, Preact islands and Tailwind CSS v4. Every page is prerendered HTML; the few interactive parts (the cat, filters, view toggles, subscribe states) are small islands that work without JavaScript too.

## Status

Spec 001 (site v1) is implemented. Playwright, Lighthouse and the Railway deploy still need a first run on a machine that can download a browser and Docker images. Open tasks are listed in [`specs/001-site-v1/tasks.md`](specs/001-site-v1/tasks.md).

## Quick start

Requires Node 24 (see `.nvmrc`, 22.12 or newer works) and pnpm 12.

```sh
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

`src/content/` starts empty, so `pnpm dev` and `pnpm build` have nothing to show on the home page. To see the site with sample content, run `pnpm build:fixtures && pnpm preview`, or start the dev server with `CONTENT_DIR=tests/fixtures/content pnpm dev`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build from `src/content/` |
| `pnpm build:fixtures` | Build from the sample content in `tests/fixtures/content/` |
| `pnpm preview` | Serve the last build |
| `pnpm test` | Unit and build tests (Vitest) |
| `pnpm test:e2e` | Playwright with axe and visual snapshots at 390, 820 and 1280 px |
| `pnpm check` | Biome, `astro check`, Vitest, fixture build and the JS budget. Run before every commit |
| `pnpm budget` | Client JS per page, gzipped. Fails above 30 KB |
| `pnpm lhci` | Lighthouse CI |

## Writing content

All content is MDX in the repo. Frontmatter is validated at build time, and a broken field fails the build with the file name.

### Digest issue

`src/content/digest/014.mdx`, file name is the three-digit issue number:

```mdx
---
number: 14
title: "Headline of the issue"
date: 2026-10-12
lede: "One or two sentences on the week."
topics: [Models, Agents]
quote:
  text: "Quote of the week"
  author: "Name"
  role: "Role"
draft: false
---

Intro in your own voice.

<Section title="Models" color="sky">
<Item headline="What happened" source={{ name: "Publication", url: "https://..." }}>
The one line a busy engineer should remember.
</Item>
</Section>

<TriedIt>
What I tried this week.

```sh title="terminal"
command you ran
```
</TriedIt>
```

- `topics`: one or more of Models, Tooling, Agents, Papers.
- `quote` is optional; without it the quote window is not rendered.
- `Section` colors: sky, yellow, pink, lime, lavender.

### Note

`src/content/notes/my-note-slug.mdx`, file name becomes the URL `/writing/my-note-slug`:

```mdx
---
title: "Title of the note"
date: 2026-10-12
tag: Architecture
dek: "One-line summary for lists."
tldr:
  - "Key takeaway"
cover:
  src: ./my-note-cover.png
  alt: "What the image shows"
pinned: false
draft: false
---

Body in Markdown. Use `<Figure>`, `<Callout>`, `<PullQuote>` and fenced code
blocks with `title="file.ts"` for the terminal-style header.
```

- `tag`: Architecture, AI in production, Agents, Side projects or Backend.
- `tldr`: one to five lines.
- `cover` is optional, but when present `alt` is required.
- Only one note can be `pinned: true`; two pinned notes fail the build.
- `draft: true` shows the entry in dev and hides it from production, feeds and the sitemap.

## Before the first deploy

- Add at least one published issue and one published note. The production build fails on purpose until both exist.
- Fill the placeholders in `src/lib/site.ts`: `description`, `domain`, `digestDay`, `email`, `linkedin`, `buttondownUsername`, plus the `[RESULT]` and `[STACK]` values in the About data.
- Set `SITE_URL` in Railway once the domain is known.

## Deploy

Railway builds the `Dockerfile` (Node build, Caddy serve) on every push to `main` and creates a preview environment for each pull request. Setup steps and checks are in [`docs/deploy.md`](docs/deploy.md). Why the site is built the way it is: [`docs/decisions.md`](docs/decisions.md).

## How work happens here

This repo is built spec-first. Specs in `specs/NNN-slug/` (spec, plan, tasks) are the source of truth, and nothing is implemented until a spec is approved. Agent instructions live in `CLAUDE.md`, `.claude/rules/` and the `spec-driven` skill in `.claude/skills/`.

## Project structure

```
specs/            spec, plan and tasks per feature
docs/             deploy guide
src/content/      digest issues and notes (MDX)
src/lib/          schemas, site config, content queries
src/components/   Astro components, mdx/ for content components
src/islands/      Preact islands
src/sprites/      pixel sprite grids
src/styles/       tokens and global CSS
src/pages/        routes, RSS and OG images
tests/            unit, build and e2e tests, fixtures
scripts/          JS budget and Docker smoke test
```
