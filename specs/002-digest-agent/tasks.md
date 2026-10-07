# 002: Tasks

Before T01: Alina approves `plan.md` and this file together, including the decisions in plan section 10 (`@astrojs/markdown-satteri` as a direct dependency, stop when a digest PR is still open, the issue commit message, `.claude/settings.json`, the 7-day window without a previous issue). If a decision goes the other way, the affected tasks are rewritten before work starts.

Every task except T14, T16 and T17 ends with `pnpm check` passing and one commit, for example `feat(002): author marker check [T01]`. No comments in code.

## Content guard

- [x] T01 Find author markers and add the strict collection check
  Files: src/lib/author-markers.ts, src/lib/collection-checks.ts, tests/unit/author-markers.test.ts, tests/unit/collection-checks.test.ts
  Verify: `author-markers.test.ts`: finds closed and unclosed `[ALINA:` markers with line numbers, splits text into text and marker parts; `collection-checks.test.ts`: strict throws one error listing file, line and marker for every hit in body and nested frontmatter strings (AC11), not strict passes, draft entries are skipped (AC12)

- [x] T02 Run the marker check in both collections behind CONTENT_STRICT
  Files: src/content.config.ts, tests/build/build-output.ts, tests/build/markers.test.ts, tests/fixtures/content-markers/**, tests/fixtures/content-markers-draft/**
  Verify: `markers.test.ts`: `CONTENT_STRICT=true` build of `content-markers` exits non-zero and the output names `tests/fixtures/content-markers/digest/001.mdx` and `[ALINA: tried it this week]` (AC11); `CONTENT_STRICT=true` build of `content-markers-draft` passes (AC12); `CONTENT_STRICT=false` build of `content-markers` passes; `runBuild` clears `CONTENT_STRICT` by default; existing build tests still pass

- [x] T03 Highlight markers in rendered MDX with a Sätteri hast plugin
  Files: package.json, pnpm-lock.yaml, astro.config.ts, src/lib/author-marker-plugin.ts, src/styles/global.css, tests/unit/author-marker-render.test.ts, tests/build/markers.test.ts
  Verify: `package.json` pins `@astrojs/markdown-satteri` 0.4.3 exactly; `author-marker-render.test.ts` (container render of a fixture MDX): `<mark class="author-marker" data-author-marker>` wraps the marker in a paragraph and inside `TriedIt`, no mark inside a code block, code blocks still get `data-title` from `codeMetaTransformer`; `markers.test.ts`: non-strict build of `content-markers` has the mark with the marker text on `/digest/001` and on the note page (AC11); `tokens.test.ts` and the class helper find no non-token colors; if the hast `text` visitor misses JSX children, switch to the mdast fallback in plan section 13 and record it in `plan.md`

## Skill and scripts

- [x] T04 [P] Write sources.md and its parser
  Files: .claude/skills/digest/sources.md, scripts/digest/sources.ts, tests/unit/digest-skill-files.test.ts
  Verify: `digest-skill-files.test.ts`: `sources.md` parses into exactly the groups Models, Tooling, Agents, Papers, every line is `- [Name](https://...): note`, no duplicate URLs, list matches plan section 7

- [x] T05 Add the context command
  Files: scripts/digest.ts, scripts/digest/issues.ts, scripts/digest/window.ts, scripts/digest/urls.ts, tests/unit/digest-context.test.ts, tests/fixtures/digest-runs/**
  Verify: `digest-context.test.ts`: with 014 published on 2026-10-05 and run date 2026-10-12 the window is 2026-10-06 to 2026-10-12 (AC3); with no issues the number is 1, file `src/content/digest/001.mdx`, window 2026-10-06 to 2026-10-12; next number counts a draft 015 but `previous` skips it; `cited` lists every URL of earlier issues with normalized forms and headlines (AC5); default run date is computed in Europe/Amsterdam (23:30 UTC on Sunday is Monday); run date before the previous issue exits 1; `node scripts/digest.ts context --content-dir tests/fixtures/digest-runs/basic --date 2026-10-12` prints valid JSON

- [x] T06 Add the ledger check
  Files: scripts/digest/ledger.ts, scripts/digest.ts, tests/unit/digest-ledger.test.ts, tests/fixtures/digest-runs/**
  Verify: `digest-ledger.test.ts`: item dated 2026-10-05 rejected and 2026-10-12 accepted for the AC3 window; URL cited in 014 rejected for 015, also with `utm_source`, `www.` and trailing slash variants (AC5); duplicate URL inside the ledger rejected; 5 items in one section rejected; non-topic section rejected; a `sources.md` URL missing from `sourcesChecked` rejected (AC2); quote without author, role or an opened URL rejected (AC7); 3 valid items exits 3 (AC10); a valid ledger exits 0

- [x] T07 Add the issue file check
  Files: scripts/digest/issue-check.ts, scripts/digest.ts, tests/unit/digest-issue-check.test.ts, tests/fixtures/digest-runs/**
  Verify: `digest-issue-check.test.ts`: valid fixture passes; 3 items, 11 items, 5 items in one section, `topics` not equal to section titles, wrong section color, duplicate section, file name not equal to `number`, `date` not the run date, `draft: true`, items not matching the ledger all fail (AC6); `TriedIt` with any text besides `[ALINA: tried it this week]` fails, missing `TriedIt` fails (AC8); intro not ending in `[ALINA: your take, optional]` fails; quote not equal to the ledger quote fails (AC7); every marker is listed with its line

- [x] T08 Add render-check, check-diff and pr-body
  Files: scripts/digest/render-check.ts, scripts/digest/pr-body.ts, scripts/digest.ts, tests/unit/digest-pr-body.test.ts, tests/build/digest-render-check.test.ts
  Verify: `digest-pr-body.test.ts`: body has the items table with URL and date on page, quote or "None", dropped items with reasons, sources checked, every marker with its line, the three check results and the "Before merging" list (AC9); `digest-render-check.test.ts`: a valid fixture issue builds and the result names `digest/NNN/index.html`, an issue with a broken component exits 2; `check-diff` unit-tested with a stubbed file list: one file passes, two files or a different path fail (AC9)

- [ ] T09 Ignore the run folder and add permission rules for unattended runs
  Files: .gitignore, .claude/settings.json
  Verify: `git check-ignore .digest/014.json` matches; rule syntax checked against the current Claude Code permissions docs and recorded in `plan.md` if it differs; manual: in a Claude Code session, `gh pr merge` and `git push origin main` are denied, `node scripts/digest.ts context` runs without a prompt

- [x] T10 Write the issue template and the digest SKILL.md
  Files: .claude/skills/digest/SKILL.md, .claude/skills/digest/issue-template.mdx, tests/unit/digest-skill-files.test.ts
  Verify: `digest-skill-files.test.ts`: SKILL.md frontmatter has `name: digest` and a description containing "make this week's digest" and "собери дайджест"; it names every script command; the `check-ledger` step comes before the `git switch -c` step (AC10); it contains the never-list (merge, push to main, force-push); the template's `TriedIt` holds only `[ALINA: tried it this week]` and the intro ends with `[ALINA: your take, optional]` (AC8); manual: read SKILL.md against R1 to R11 and the procedure in plan section 6, including dry run mode and the open-PR stop

## Deploy and docs

- [ ] T11 [P] Pass CONTENT_STRICT through the Dockerfile and document it
  Files: Dockerfile, docs/deploy.md, tests/unit/deploy-config.test.ts
  Verify: `deploy-config.test.ts`: the build stage declares `ARG CONTENT_STRICT=false` and sets `CONTENT_STRICT=$CONTENT_STRICT` before `astro build`; `docs/deploy.md` lists `CONTENT_STRICT=true` for production and `CONTENT_STRICT=false` for PR environments; manual where Docker exists: `scripts/docker-smoke.sh` still passes

- [ ] T12 [P] Write docs/publishing.md
  Files: docs/publishing.md, docs/deploy.md (link)
  Verify: manual: covers the weekly routine, the production error and how to fix it, the thin-week report, one-time setup (Claude GitHub App with write access, scheduled task settings including automatic approval, Railway variables, Buttondown RSS-to-email on `/digest/rss.xml` with a test send), running the skill by hand in English and Russian, dry run, editing sources; no em dashes or curly quotes (R14)

- [ ] T13 Set site.digestDay to Monday (applied by the orchestrator, separate from other work)
  Files: src/lib/site.ts (the `digestDay` line only), tests/unit/site.test.ts
  Verify: `site.test.ts` expects `"Monday"`; `pages.test.ts` passes and the subscribe band reads "One issue every Monday."; `git diff src/lib/site.ts` shows one changed line

## Dry run

- [ ] T14 Run the skill once end to end in dry run mode
  Files: none committed to main. Produces a local branch `digest/NNN` with one commit, `.digest/NNN.json`, `.digest/NNN-pr.md`. Fixes found in SKILL.md, sources.md or the scripts go in a separate commit `fix(002): ... [T14]` on the working branch, not on `digest/NNN`
  Verify: started with "make this week's digest, dry run"; the skill loads (AC1); every `sources.md` URL is in `sourcesChecked` (AC2); `check-ledger`, `check-issue`, `pnpm check`, `render-check` and `check-diff` all pass, or the run ends as a thin-week report with no branch (AC10); `git log --stat digest/NNN` shows one commit changing only `src/content/digest/NNN.mdx` (AC9); `.digest/NNN-pr.md` has every PR body section; nothing pushed, no `gh pr create` called; report the branch, the PR body and anything the skill got wrong to the orchestrator

## Schedule

- [ ] T15 Write the scheduled prompt
  Files: .claude/skills/digest/scheduled-prompt.md, tests/unit/digest-skill-files.test.ts
  Verify: the file holds the cron `CRON_TZ=Europe/Amsterdam 52 6 * * 1`, push notification on, and the prompt from plan section 8; `digest-skill-files.test.ts` checks the cron line, the repo name `alicefarron/alina-os`, `pnpm install --frozen-lockfile`, a reference to `.claude/skills/digest/SKILL.md`, and the never-merge line; manual: the prompt reads as standalone for a fresh session with no memory

- [ ] T16 Create the scheduled task (done by the orchestrator, not an implementation agent)
  Files: none
  Verify: prerequisites done by Alina: Claude GitHub App has write access to `alicefarron/alina-os`; T15 is on `main`. The orchestrator calls `create_trigger` with the prompt and cron from `scheduled-prompt.md`, `notifications: { push: true }`, no local device; `list_triggers` shows it with the next run on Monday 06:52 Europe/Amsterdam; the reported approval setting is told to Alina, who turns on "Automatically approve" if runs would ask (R13)

- [ ] T17 Walk the run-based acceptance criteria (Alina and the orchestrator)
  Files: specs/002-digest-agent/tasks.md (tick boxes), specs/002-digest-agent/spec.md (Status: implemented when all pass)
  Verify: first firing: a PR from `digest/NNN` to `main` with one changed file or a thin-week report, and no approval stops in the run (AC9, AC13); the run report lists every source (AC2); Alina asks "собери дайджест" in a Claude Code session and the skill loads (AC1); first three runs: Alina opens three source links per PR and checks page, date and takeaway (AC4) and any quote verbatim (AC7); first merged issue: production builds only after markers are filled, the item is in `/digest/rss.xml` and the Buttondown email arrives (AC11 in production, AC14)

## AC coverage

| AC | Tasks |
|---|---|
| AC1 | T10, T14, T17 |
| AC2 | T04, T06, T14, T17 |
| AC3 | T05, T06 |
| AC4 | T17 |
| AC5 | T05, T06 |
| AC6 | T07, T08, T14 |
| AC7 | T06, T07, T17 |
| AC8 | T07, T10 |
| AC9 | T08, T14, T17 |
| AC10 | T06, T10, T14 |
| AC11 | T01, T02, T03, T11, T17 |
| AC12 | T01, T02 |
| AC13 | T09, T15, T16, T17 |
| AC14 | T12, T17 |
