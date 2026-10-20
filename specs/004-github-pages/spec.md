# 004: GitHub Pages hosting

Status: approved
Owner: Alina

## Why

Alina wants the site on GitHub Pages at https://alicefarron.github.io instead of Railway. The repository is renamed to `alicefarron.github.io`, so Pages serves it from the root path and no `base` path is needed. This replaces 001 R17 and the Railway parts of 002.

## Users and goals

Readers get the same site at a stable public address. Alina publishes by merging to `main`, with nothing to run or pay for outside GitHub, and reviews digest pull requests locally with `pnpm dev`.

## Scope

Building and publishing the site to GitHub Pages from `main`, the production site URL, removing the Railway setup, and updating the specs and docs that describe Railway.

## Out of scope

A custom domain (a later spec). Pull request previews. Changes to page content, design or routes.

## Requirements

R1. Every push to `main` builds the site and publishes it to GitHub Pages at https://alicefarron.github.io. `pnpm check` runs first, and nothing is published if it or the production build fails.

R2. The production build uses `SITE_URL=https://alicefarron.github.io` and `CONTENT_STRICT=true`. Canonical links, Open Graph URLs, feeds and the sitemap use that origin.

R3. Every existing URL keeps working at the same path without a redirect, for example `/digest/012`, `/writing/<slug>`, `/about`, the RSS feeds and the sitemap.

R4. An unknown path returns the site's 404 page with HTTP status 404.

R5. There are no pull request previews. Alina reviews a digest pull request by checking out its branch and running `pnpm dev`, where author markers render highlighted as before.

R6. The Railway setup is removed: `Dockerfile`, `Caddyfile`, `.dockerignore`, `railway.json`, `scripts/docker-smoke.sh`, the tests that read them, and the Railway fallback in the site URL. Docs describe the Pages deploy and the local review instead.

R7. Earlier specs stay consistent: 001 R17 and AC19 are marked "replaced by 004", 001 T35 and T36 are removed, and 002 R12 and R14 name GitHub Pages and local review instead of Railway.

## Acceptance criteria

AC1 (R1). Given a merge to `main` with passing checks, then the Pages workflow succeeds and https://alicefarron.github.io/ returns 200 with the new build. Given a failing `pnpm check`, then the deploy job does not run. Manual check on the first deploy.

AC2 (R2). Given a production build with `SITE_URL=https://alicefarron.github.io`, then the sitemap, every feed and every page's canonical link start with `https://alicefarron.github.io` and no file in `dist/` contains `domain.invalid`. Build test.

AC3 (R3). Given a build, then every route is emitted as `<path>.html` (home as `index.html`), so GitHub Pages serves `/digest/012` directly. Given the deployed site, then `curl -I` on `/digest/<latest>`, `/writing/<any slug>`, `/about` and `/digest/rss.xml` returns 200 with no 301. Build test plus manual step.

AC4 (R4). Given a build, then `dist/404.html` exists. Given the deployed site, then `curl -I https://alicefarron.github.io/no-such-page` returns 404 and the body is the system alert window. Build test plus manual step.

AC5 (R5). Given a fixture issue with an `[ALINA:` marker and `CONTENT_STRICT` unset, when the site is built, then the marker renders highlighted (existing markers test). `docs/publishing.md` describes the local review and does not mention previews. Test plus doc check.

AC6 (R6). Given the repository, then none of the files listed in R6 exist, `resolveSiteUrl` reads only `SITE_URL`, and `grep -ri railway` finds nothing outside `specs/`, `docs/decisions.md` (history) and the About side project. Unit test for `resolveSiteUrl` plus grep.

AC7 (R7). Given specs 001 and 002, then R17 and AC19 in 001 say "replaced by 004", T35 and T36 are gone from 001 tasks, and 002 R12 and R14 do not mention Railway. Manual doc check.

## Open questions

None.
