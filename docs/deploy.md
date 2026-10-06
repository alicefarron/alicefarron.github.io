# Deploying alina.os to Railway

The repo holds everything Railway needs: `Dockerfile` (build with Node, serve with Caddy), `Caddyfile` and `railway.json`. The steps below happen once in the Railway dashboard. They cover R17 and task T36 in `specs/001-site-v1/tasks.md`.

## Before the first deploy

- Add at least one published digest issue in `src/content/digest/` and one published note in `src/content/notes/`. The production build fails on purpose until both exist ("No published digest issues").
- Set the Buttondown username in `src/lib/site.ts` (`buttondownUsername`, now `[BUTTONDOWN_USERNAME]`). Until then the subscribe form posts to an address that does not exist.
- Optional: run `scripts/docker-smoke.sh` on a machine with Docker. It builds the image from the test fixtures and checks `/`, `/missing` and the cache headers (AC19).

## 1. Create the service from GitHub

1. In Railway, open the project (or create one with New Project).
2. New, then GitHub Repo, then pick the alina.os repository. Grant the Railway GitHub app access to it if asked.
3. Open the new service, then Settings:
   - Source: branch `main`. Leave "Wait for CI" off unless a CI workflow exists.
   - Build: Railway reads `railway.json` from the repo root, so the builder shows as Dockerfile with path `Dockerfile`. If the dashboard shows Railpack instead, set the builder to Dockerfile by hand.
   - Deploy: the healthcheck path `/` and the restart policy also come from `railway.json`.
   - Do not set a start command. The image already runs Caddy.

## 2. Variables on the production environment

In the service, open Variables and add:

| Name | Value | Why |
|---|---|---|
| `SITE_URL` | `https://[DOMAIN]` once the custom domain is known; leave unset until then | Canonical URLs, feeds, sitemap and OG image URLs. Without it the build uses `https://` plus the Railway domain. |
| `X_ROBOTS_TAG` | `all` | Lets search engines index production. This is also the default. |

Railway sets `PORT` and `RAILWAY_PUBLIC_DOMAIN` itself. Do not add them. The Dockerfile reads `SITE_URL` and `RAILWAY_PUBLIC_DOMAIN` as build arguments, which Railway passes from service variables.

## 3. Public domain

1. Service, Settings, Networking: Generate Domain. This gives a `*.up.railway.app` address. PR environments only get domains when the base service has one, so do this even if a custom domain comes later.
2. When the target port is asked for, use the port Caddy listens on (`PORT`, which Railway sets; 8080 if you need to type a number).
3. Custom domain, when `[DOMAIN]` is decided: Networking, Custom Domain, enter it, add the CNAME (and TXT if shown) records at the DNS provider, wait for the certificate. Then set `SITE_URL=https://[DOMAIN]` and redeploy, so canonical URLs and feeds use it.

## 4. PR environments (previews)

1. Project Settings, Environments: turn on PR Environments. The base environment is `production`.
2. Open the PR environment template (or the first PR environment once one exists) and set the variable `X_ROBOTS_TAG=noindex`, so previews are never indexed. Leave `SITE_URL` unset there, so each preview uses its own Railway domain.
3. Railway creates an environment for each pull request and deletes it when the PR is merged or closed.

## 5. Check it worked

- Production: open the Railway domain. `/` loads, `/missing` shows the "The page could not be found." alert, and the response headers of a file under `/_astro/` include `Cache-Control: public, max-age=31536000, immutable`.
- Preview: open a small test PR. A preview URL appears on the PR and in Railway, it serves `/` with status 200, and its responses carry `X-Robots-Tag: noindex`. Close the PR and confirm the environment is removed.
- Tick T36 in `specs/001-site-v1/tasks.md` after these checks pass.

## Image versions

The Dockerfile pins `node:24.21.0-alpine` and `caddy:2.11.4-alpine`. These tags were chosen without access to Docker Hub. If a build fails with "manifest unknown", replace the tag with the nearest one listed on Docker Hub, then pin its digest (`image:tag@sha256:...`).
