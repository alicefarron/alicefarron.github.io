# 004: Tasks

- [ ] T01 Emit one HTML file per route
  Files: astro.config.ts, tests/build/pages.test.ts, tests/build/seo.test.ts, tests/build/markers.test.ts, tests/build/digest-render-check.test.ts, tests/build/sitemap.test.ts, tests/unit/js-budget.test.ts, tests/unit/seo.test.ts, scripts/digest/render-check.ts, tests/build/output-format.test.ts
  Verify: `output-format.test.ts` over the fixtures build: no `index.html` below the root, `digest/012.html` and `404.html` exist (AC3, AC4); `seo.test.ts` maps `/about.html` to `/about`; `pnpm check` and `pnpm test:e2e` pass

- [ ] T02 Read the site URL only from SITE_URL
  Files: src/lib/seo.ts, tests/unit/seo.test.ts, tests/build/seo.test.ts
  Verify: `seo.test.ts`: `SITE_URL` wins, empty falls back to `https://domain.invalid`, invalid fails, `RAILWAY_PUBLIC_DOMAIN` is ignored (AC6); build test with `SITE_URL=https://alicefarron.github.io` finds that origin in sitemap, feeds and canonicals and no `domain.invalid` in `dist/` (AC2)

- [ ] T03 Add the GitHub Pages workflow
  Files: .github/workflows/deploy.yml
  Verify: actions pinned to commit SHAs; `pnpm check` before `pnpm build`; build env sets `SITE_URL` and `CONTENT_STRICT=true`; deploy job `needs: build` (R1, R2); `actionlint` if available, otherwise manual read

- [ ] T04 [P] Remove the Railway setup
  Files: Dockerfile, Caddyfile, .dockerignore, railway.json, scripts/docker-smoke.sh, tests/unit/deploy-config.test.ts
  Verify: files gone; `pnpm check` passes; `grep -ri railway` outside `specs/`, `docs/decisions.md` and `src/lib/site.ts` is empty (AC6)

- [ ] T05 [P] Update docs for Pages and local review
  Files: docs/deploy.md, docs/publishing.md, README.md, docs/decisions.md
  Verify: manual: deploy.md covers the Pages source setting, the workflow, checking and rerunning a deploy; publishing.md review step uses `pnpm dev` and has no preview step; Buttondown URL is `https://alicefarron.github.io/digest/rss.xml` (AC5)

- [ ] T06 [P] Mark Railway requirements in 001 and 002 as replaced
  Files: specs/001-site-v1/spec.md, specs/001-site-v1/tasks.md, specs/002-digest-agent/spec.md
  Verify: manual: 001 R17 and AC19 say "Replaced by 004."; T35 and T36 removed, T39 and the AC table no longer mention AC19 or Railway; 002 R12 and R14 name the Pages workflow and local review (AC7)

- [ ] T07 First deploy and live checks
  Files: specs/004-github-pages/tasks.md (tick boxes)
  Verify: manual, after the first issue and note are on `main` and Alina has set Pages source to GitHub Actions: workflow green (AC1); `curl -I` on `/`, `/digest`, `/writing`, `/digest/<latest>`, `/writing/<slug>`, `/about`, `/digest/rss.xml` returns 200 with no 301 (AC3); `/no-such-page` returns 404 with the alert window (AC4); `lhci` against the live URL keeps 95+ in all four categories

## AC coverage

| AC | Tasks |
| --- | --- |
| AC1 | T03, T07 |
| AC2 | T02 |
| AC3 | T01, T07 |
| AC4 | T01, T07 |
| AC5 | T05 |
| AC6 | T02, T04 |
| AC7 | T06 |
