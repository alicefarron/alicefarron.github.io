# alina.os

Weekly AI digest and long-form notes by Alina Shaimieva, plus one About page. The site is about the content, not the author. Retro desktop look: classic Mac OS windows, pixel type and sprites, sky blue and yellow.

## Specs come first

- Specs in `specs/NNN-slug/` are the source of truth. Follow the `spec-driven` skill for any change that adds or alters behavior.
- Never implement a spec whose status is not `approved`, or one with open `[NEEDS CLARIFICATION]` markers.
- If code and spec disagree, stop and propose a spec change. Do not let them drift.

## Principles

- Static first: every page prerendered, no server runtime unless a spec approves one.
- Zero JS by default. Small Preact islands only where a spec needs state. Every page readable and navigable with JS off.
- WCAG 2.2 AA. Lighthouse mobile 95+ in all four categories. Under 30 KB client JS per page, gzipped.
- No trackers, no cookies, no data sent to third parties without an approved spec.
- Colors, type and spacing come only from tokens in `src/styles/tokens.css`.

## Stack

Astro (static output, content collections, MDX), TypeScript strict, Preact islands, Tailwind CSS v4 with `@theme` tokens, Fontsource, Biome, Vitest, Playwright with axe, Lighthouse CI, pnpm. Pin exact versions. Check current docs for version-specific APIs instead of relying on memory. Any new dependency needs a reason in the plan.

## Commands

- `pnpm dev`
- `pnpm check`: Biome, `astro check`, Vitest, build. Must pass before every commit.
- `pnpm test:e2e`: Playwright with axe and visual snapshots at 390, 820, 1280 px.

## Always

- No comments in code, including "why" comments and TODOs.
- Conventional Commits with spec and task, for example `feat(001): window component [T07]`.
- Ask before changing an existing URL, deleting content, or adding a dependency.

## Layout

`specs/` features · `src/content/` MDX · `src/content.config.ts` schemas · `src/components/` · `src/islands/` · `src/sprites/` · `src/styles/` · `src/pages/` · `tests/unit/`, `tests/e2e/`
