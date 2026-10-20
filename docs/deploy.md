# Deploying alina.os to GitHub Pages

The site is served by GitHub Pages at https://alicefarron.github.io. The repository is named `alicefarron.github.io`, so Pages serves it from the root path. `.github/workflows/deploy.yml` builds and publishes it on every push to `main`. Spec: `specs/004-github-pages/spec.md`.

The weekly publishing routine, branch protection, the Claude scheduled task and Buttondown RSS-to-email are in `docs/publishing.md`.

## Before the first deploy

- Add at least one published digest issue in `src/content/digest/` and one published note in `src/content/notes/`. The production build fails on purpose until both exist ("No published digest issues"), so the workflow stays red until then.
- Set the Buttondown username in `src/lib/site.ts` (`buttondownUsername`, now `[BUTTONDOWN_USERNAME]`). Until then the subscribe form posts to an address that does not exist.

## 1. One-time setting

On GitHub, open the repository, then Settings, then Pages. Under "Build and deployment", set Source to **GitHub Actions**. Nothing else is needed: the workflow creates the `github-pages` environment on its first run.

## 2. What the workflow does

1. Installs the pnpm version from `packageManager` and the Node version from `.nvmrc`.
2. Runs `pnpm check` (Biome, `astro check`, Vitest, a fixtures build and the JS budget). If it fails, nothing is published.
3. Runs `pnpm build` with:

| Name | Value | Why |
|---|---|---|
| `SITE_URL` | `https://alicefarron.github.io` | Canonical URLs, feeds, sitemap and OG image URLs. |
| `CONTENT_STRICT` | `true` | Production refuses to build while a published issue or note still has an `[ALINA: ...]` author marker. The error names the file and the marker. |

4. Uploads `dist/` and publishes it to Pages.

Each route is built as one file (`digest/012.html`, not `digest/012/index.html`), so Pages serves `/digest/012` directly instead of redirecting to `/digest/012/`. `404.html` is served with status 404 for any unknown path.

## 3. Check it worked

- The Actions tab shows "Deploy to GitHub Pages" green for the latest commit on `main`.
- `curl -I https://alicefarron.github.io/digest/<latest>` returns 200 with no redirect. Same for `/`, `/digest`, `/writing`, `/about` and `/digest/rss.xml`.
- `curl -I https://alicefarron.github.io/no-such-page` returns 404, and the page in a browser shows the "The page could not be found." alert.

## 4. Rerun or debug a deploy

- Rerun: Actions, "Deploy to GitHub Pages", then "Run workflow" on `main`, or "Re-run jobs" on a failed run.
- A failed build shows the error in the `build` job log. An author marker left in published content looks like `Unresolved author markers in published content (CONTENT_STRICT=true)` followed by the file, line and marker.

## Caching

Pages sends `Cache-Control: max-age=600` for every file and this cannot be changed, so hashed assets under `/_astro/` are re-checked after ten minutes instead of being cached for a year.
