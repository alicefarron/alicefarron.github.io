# 004: Plan

## Approach

One GitHub Actions workflow builds and publishes `dist/` with the official Pages actions. Astro switches to `build.format: "file"` so each route is a single `<path>.html` file: GitHub Pages serves `/digest/012` from `digest/012.html` with status 200, while the current `directory` format would make Pages answer `/digest/012` with a 301 to `/digest/012/`, which breaks R3 and the `trailingSlash: "never"` canonicals. Railway files, tests and docs go; specs 001 and 002 get short edits.

## 1. Astro output format

- `astro.config.ts`: `build.format: "file"`. `trailingSlash: "never"` stays.
- `normalizePath` in `src/lib/seo.ts` already strips `.html`, so canonicals, OG paths and the sitemap filter need no change. A unit case for `/about.html` is added next to the existing `/about/index.html` one.
- Home stays `index.html`. `404.astro` builds to `404.html`, which Pages serves with status 404 for any unknown path.
- Index routes (`/digest`, `/writing`) build to `digest.html` and `writing.html`. Their feeds (`digest/rss.xml`) live in the `digest/` folder next to `digest/012.html`; Pages resolves `/digest` to the file before the folder, checked in AC3.

Code that reads `dist/` by path moves from `<path>/index.html` to `<path>.html`:

- `tests/build/pages.test.ts` (`page()` helper), `tests/build/seo.test.ts`, `tests/build/markers.test.ts`, `tests/build/digest-render-check.test.ts`, `tests/build/sitemap.test.ts`, `tests/unit/js-budget.test.ts`.
- `scripts/digest/render-check.ts` (`digest/NNN/index.html` becomes `digest/NNN.html`).
- A new build test lists `dist/` and asserts no route folder contains an `index.html` except the root (AC3), and that `404.html` exists (AC4).

## 2. Workflow

`.github/workflows/deploy.yml`, on push to `main` and `workflow_dispatch`:

- `permissions: contents: read, pages: write, id-token: write`; `concurrency: group: pages, cancel-in-progress: false`.
- Job `build`: `actions/checkout`, `pnpm/action-setup` (version from `packageManager`), `actions/setup-node` with `node-version-file: .nvmrc` and pnpm cache, `pnpm install --frozen-lockfile`, `pnpm check`, then `pnpm build` with `SITE_URL=https://alicefarron.github.io` and `CONTENT_STRICT=true`, `actions/configure-pages`, `actions/upload-pages-artifact` with `path: dist`.
- Job `deploy`: `needs: build`, environment `github-pages`, `actions/deploy-pages`.
- Actions are pinned to full commit SHAs of the current releases (checkout v7.0.1, pnpm/action-setup v6.1.0, setup-node v7.1.0, configure-pages v6.0.0, upload-pages-artifact v5.0.0, deploy-pages v5.0.1), with the tag in the `uses` line only via the SHA lookup, no comments in the file per CLAUDE.md.
- `pnpm check` runs `build:fixtures`, which writes `dist/` from fixtures; the real `pnpm build` runs after it and overwrites `dist/`.

No new npm dependency. The workflow uses only GitHub's own actions plus `pnpm/action-setup`.

One manual step for Alina: Settings, Pages, Source: GitHub Actions.

## 3. Site URL

`resolveSiteUrl` drops `RAILWAY_PUBLIC_DOMAIN`: `SITE_URL` or the `https://domain.invalid` placeholder, invalid URLs still fail the build. `SiteEnv` loses the field. `tests/unit/seo.test.ts` loses the two Railway cases. The URL lives in the workflow, not in `astro.config.ts`, so local and fixture builds keep the placeholder and tests stay unaffected.

## 4. Railway removal

Delete `Dockerfile`, `Caddyfile`, `.dockerignore`, `railway.json`, `scripts/docker-smoke.sh`, `tests/unit/deploy-config.test.ts`. `site.ts` keeps "Hermes Agent, Railway" in the schedule-agent side project; that is content, not hosting.

## 5. Docs and specs

- `docs/deploy.md`: rewritten for Pages (one-time Pages source setting, what the workflow does, how to check a deploy, how to rerun it, how a failed `CONTENT_STRICT` build shows up in the Actions log).
- `docs/publishing.md`: step 2 and 5 become "check out `digest/NNN`, run `pnpm dev`, open `/digest/NNN`"; section 4 "Railway variables" is replaced by a note that the workflow sets `CONTENT_STRICT=true`; the Buttondown feed URL becomes `https://alicefarron.github.io/digest/rss.xml`.
- `README.md`: Deploy section and "Before the first deploy" point to Pages.
- `docs/decisions.md`: Hosting row becomes GitHub Pages with the reason (free, no container, root-path user site); Railway notes move under a "Superseded" line rather than being deleted.
- `specs/001-site-v1/spec.md`: R17 and AC19 get "Replaced by 004." `tasks.md`: T35 and T36 removed, T39 and the AC coverage table drop AC19 and the Railway URL.
- `specs/002-digest-agent/spec.md`: R12 says `CONTENT_STRICT` is set by the Pages workflow; R14 names the Pages workflow; the line about the Railway PR preview says Alina reviews locally.

## Principles check

- Static first, no server runtime: unchanged, and simpler than before (no Caddy).
- No trackers or third parties: GitHub already hosts the repo; Pages adds no client-side code.
- Lighthouse 95+: see Risks on caching.
- Ask before changing an existing URL: no URL changes; that is the point of `build.format: "file"`.
- Ask before deleting content: only infrastructure files are deleted, and Alina asked for it.
- CLAUDE.md global rule: changing CI/CD config needs explicit confirmation; approving this plan is that confirmation for `deploy.yml`.

## Risks

- **No content yet.** `src/content/` does not exist and the production build fails on purpose until at least one issue and one note are published. The workflow will be red until then. AC1 can only be checked after the first content lands. The `[BUTTONDOWN_USERNAME]` placeholder in `site.ts` also still needs a real value before launch; not part of this spec.
- **Cache headers.** Pages sends `Cache-Control: max-age=600` for everything and it cannot be changed, so hashed `/_astro/*` assets lose the one-year immutable cache Caddy gave them. Lighthouse's cache audit is informational in current versions; T07 runs `lhci` against the deployed site to confirm all four scores stay at 95+.
- **`astro preview` and Playwright** must serve `/digest/012` from `digest/012.html`. Astro's preview server does this for `format: "file"`; `pnpm test:e2e` confirms it.
- **Pages resolution of `/digest` vs the `digest/` folder.** Both `digest.html` and a `digest/` folder exist. GitHub does not document which one Pages picks, and it may redirect `/digest` to `/digest/`. This cannot be checked before the first deploy, so it is the first thing checked in AC3. If Pages redirects, the two index routes would end in a slash, which means a spec edit and Alina's OK on a URL change.
