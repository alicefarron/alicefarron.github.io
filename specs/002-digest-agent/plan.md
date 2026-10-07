# 002: Plan

Spec: `specs/002-digest-agent/spec.md` (Status: approved). Nothing here is implemented until Alina approves this plan and `tasks.md` together.

## 1. Summary

Four pieces:

1. A content guard. A third whole-collection check, next to the pinned and issue-number checks, fails the build when `CONTENT_STRICT=true` and a published issue or note contains `[ALINA:`. Without the variable, a small Sätteri hast plugin wraps each marker in `<mark class="author-marker">` so it stands out in the PR preview.
2. A `digest` skill in `.claude/skills/digest/` (SKILL.md, sources.md, an issue template, the scheduled prompt). Everything countable is done by one TypeScript script, `scripts/digest.ts`, run with `node` and unit tested: next issue number, coverage window, URLs already cited, the run ledger checks, the issue file checks, the PR body and a render check. The model does the research and the writing; the script decides whether the result is allowed.
3. Deploy and docs: `CONTENT_STRICT` passed as a Docker build argument, `docs/publishing.md`, `docs/deploy.md` updated, `site.digestDay = "Monday"`.
4. A dry run in this sandbox, then a Claude scheduled task created by the orchestrator.

No new runtime code ships to the browser. One dependency is promoted from transitive to direct (section 3).

## 2. Files

Add:

```
.claude/skills/digest/SKILL.md            procedure, R1 to R11
.claude/skills/digest/sources.md          source list, R2
.claude/skills/digest/issue-template.mdx  skeleton the agent fills
.claude/skills/digest/scheduled-prompt.md prompt text and cron for R13
.claude/settings.json                     permission allow and deny rules for unattended runs
scripts/digest.ts                         CLI entry, subcommands below
scripts/digest/issues.ts                  read issue files: number, date, draft, URLs, headlines
scripts/digest/window.ts                  run date in Europe/Amsterdam, coverage window
scripts/digest/urls.ts                    URL normalization for duplicate checks
scripts/digest/sources.ts                 parse sources.md
scripts/digest/ledger.ts                  run ledger type, parser and checks
scripts/digest/issue-check.ts             checks on the written MDX file
scripts/digest/pr-body.ts                 PR body from ledger, markers and check results
scripts/digest/render-check.ts            build the new issue against fixture notes
src/lib/author-markers.ts                 find and split [ALINA: ...] markers
src/lib/author-marker-plugin.ts           Sätteri hast plugin that wraps markers in <mark>
tests/unit/author-markers.test.ts
tests/unit/author-marker-render.test.ts
tests/unit/digest-context.test.ts
tests/unit/digest-ledger.test.ts
tests/unit/digest-issue-check.test.ts
tests/unit/digest-pr-body.test.ts
tests/unit/digest-skill-files.test.ts
tests/unit/deploy-config.test.ts
tests/build/markers.test.ts
tests/build/digest-render-check.test.ts
tests/fixtures/content-markers/**         published issue and note with markers, plus a draft
tests/fixtures/content-markers-draft/**   markers only in a draft issue and a draft note
tests/fixtures/digest-runs/**             issue folders, ledgers and issue files for script tests
docs/publishing.md
```

Change:

```
src/content.config.ts          run a list of checks per collection; pass CONTENT_STRICT
src/lib/collection-checks.ts   CheckedEntry gets body; add assertNoAuthorMarkers
astro.config.ts                markdown.processor: satteri({ hastPlugins: [authorMarkerPlugin] })
package.json                   @astrojs/markdown-satteri 0.4.3 as a direct dependency
src/styles/global.css          author-marker utility; prose-note mark rule skips it
tests/build/build-output.ts    runBuild clears CONTENT_STRICT unless the test sets it
tests/unit/collection-checks.test.ts
Dockerfile                     ARG and ENV CONTENT_STRICT
docs/deploy.md                 CONTENT_STRICT rows for production and PR environments
.gitignore                     .digest/
src/lib/site.ts                digestDay only, in its own task (T13)
tests/unit/site.test.ts        digestDay expectation
```

`src/lib/site.ts` gets no other change. Alina has an uncommitted local edit to it, so T13 touches only the `digestDay` line and its test, and the orchestrator applies it separately.

## 3. Versions and dependencies

Checked on 2026-10-07 with `npm view` and against `node_modules`:

| Package | Version | Status |
|---|---|---|
| astro | 7.3.6 | installed, unchanged |
| @astrojs/mdx | 8.0.3 | installed, unchanged |
| @astrojs/markdown-satteri | 0.4.3 | installed transitively (dependency of astro and @astrojs/mdx); latest on npm is 0.4.3 |
| satteri | 0.10.5 | installed transitively, not imported |
| gh | 2.89.0 | CLI, present in the sandbox |
| Node | 22.22.0 in the sandbox | runs `.ts` scripts directly, as `scripts/js-budget.ts` already does |

New direct dependency, needs Alina's approval: `@astrojs/markdown-satteri` 0.4.3, pinned. Reason: Astro 7 renders MDX with Sätteri and ignores remark and rehype plugins unless the whole pipeline is switched to `unified()` (the `@astrojs/mdx` options `remarkPlugins` and `rehypePlugins` are deprecated and ignored with a warning). The documented way to add a plugin is `markdown.processor: satteri({ hastPlugins })`, imported from `@astrojs/markdown-satteri`. pnpm does not let `astro.config.ts` import a transitive package, so it must be listed in `package.json`. It is the same version already in the lockfile and is already in `pnpm-workspace.yaml` `minimumReleaseAgeExclude`, so nothing new is downloaded. `unist-util-visit` is not needed: Sätteri plugins are visitor objects (`{ name, text(node, ctx) }`) with `ctx.replaceNode` and `ctx.parent`.

No other dependency. The scripts read frontmatter with `parseFrontmatter` from `astro/markdown` and validate it with `digestSchema` from `src/lib/schemas.ts` (both load under plain `node`, checked in the sandbox).

## 4. Author marker guard (R12)

### Finding markers

`src/lib/author-markers.ts`:

- `markerPattern = /\[ALINA:[^\]\n]*\]?/g`. It matches a closed marker and also an unclosed `[ALINA:` up to the end of the line, so a broken marker is still caught.
- `findMarkers(text): { marker: string; line: number }[]`.
- `splitMarkers(text): Array<{ kind: "text" | "marker"; value: string }>` for the renderer.

### The check

`src/lib/collection-checks.ts`:

- `CheckedEntry` gains `body?: string` (the Content Layer store entry already has it).
- `assertNoAuthorMarkers(entries, strict)`: returns at once when `strict` is false. Skips entries with `data.draft === true`. Scans `body` and every string value in `data`, recursively (so `lede`, `quote.text`, `tldr` items are covered). Collects every hit across the collection, then throws once:

```
Unresolved author markers in published content (CONTENT_STRICT=true):
  src/content/digest/014.mdx:12 [ALINA: tried it this week]
  src/content/digest/014.mdx:9 [ALINA: your take, optional]
Fill or remove each marker, or set draft: true.
```

Line numbers are counted in the body; frontmatter hits show `frontmatter` instead of a line.

`src/content.config.ts`:

- `const strict = process.env.CONTENT_STRICT === "true";` Any other value, including unset and `false`, is not strict.
- `checkedGlob(base, checks)` takes an array: digest runs `assertIssueNumbers` and `assertNoAuthorMarkers(·, strict)`, notes run `assertSinglePinned` and the same marker check.

The check runs in the loader, so it fails `astro build`, `astro check` and `astro dev` alike when the variable is set. Drafts are excluded from the check, matching AC12; they are also excluded from production pages by `published()`.

### Highlighting when not strict

Options considered:

| Option | Verdict |
|---|---|
| Sätteri hast plugin that splits text nodes and wraps markers in `<mark>` | Chosen. Works in paragraphs and inside `Item` and `TriedIt` children, no change to MDX authoring, no client JS |
| Switch MDX to `unified()` with a remark plugin | Rejected: changes the whole Markdown pipeline built in 001 (Shiki transformer, heading ids), needs `@astrojs/markdown-remark` and more packages |
| A `<Marker>` MDX component | Rejected: the spec fixes the marker as plain `[ALINA: ...]` text, and a component would not be caught if Alina types a marker by hand |
| CSS or client JS | CSS cannot select text; client JS breaks "zero JS by default" and the no-JS rule |

`src/lib/author-marker-plugin.ts` exports `authorMarkerPlugin`, a plain object `{ name: "alina-os:author-marker", text(node, ctx) { ... } }`. For a text node whose value matches, it walks `ctx.parent` upward and skips the node inside `code` or `pre`. Otherwise it calls `ctx.replaceNode(node, parts)` where each marker part is `{ type: "element", tagName: "mark", properties: { className: ["author-marker"], dataAuthorMarker: "" }, children: [{ type: "text", value }] }`. Types are declared locally, as `src/lib/code-meta.ts` does, so nothing imports `satteri` directly.

`astro.config.ts` adds `processor: satteri({ hastPlugins: [authorMarkerPlugin] })` to `markdown`. `@astrojs/mdx` inherits `config.markdown.processor` (checked in its source), and the shared options (`shikiConfig` with `codeMetaTransformer`) still reach the renderer, because `satteri()` receives them in `createRenderer(shared)` and `createMdxRenderer(shared, ...)`. User hast plugins run after the highlighter.

The plugin runs in every build, strict or not. In a strict build a published marker never gets that far, so it only shows in previews, dev and drafts.

Style: a custom utility `author-marker` in `src/styles/global.css` (reason: the class is set by a build plugin, and `.prose-note mark` would otherwise turn it yellow): `background-color: var(--color-pink); color: var(--color-ink); font-weight: 700; outline: var(--outline-focus) dashed var(--color-ink); box-decoration-break: clone`. The `.prose-note` rule becomes `& mark:not(.author-marker)`. Pink is used because item takeaways already sit on yellow, where a yellow mark would vanish. Contrast of ink #111111 on pink #FF9BD6 is about 9.8:1, above AA. Only existing tokens are used.

Feeds render MDX through the same pipeline, so a non-strict build also shows the mark in RSS content. Only previews and dev are non-strict, so this never reaches subscribers.

## 5. CONTENT_STRICT on Railway

- `Dockerfile`: `ARG CONTENT_STRICT=false` and `CONTENT_STRICT=$CONTENT_STRICT` added to the existing `ENV` line before `pnpm exec astro build`. Railway passes service variables to declared build arguments, the same way it does for `SITE_URL`.
- `docs/deploy.md`, section 2: add `CONTENT_STRICT | true` to the production table. Section 4: set `CONTENT_STRICT=false` on the PR environment template next to `X_ROBOTS_TAG=noindex`. Railway's docs do not say whether PR environments copy base variables (see Risks), so the explicit override makes previews non-strict either way.
- `railway.json` needs no change: `src/**` is already in `watchPatterns`.
- `scripts/docker-smoke.sh` keeps building from fixtures without the variable.
- `tests/unit/deploy-config.test.ts` reads the Dockerfile and asserts the `ARG` and that `CONTENT_STRICT` is in the build stage `ENV`.

## 6. The digest skill (R1 to R11)

### Layout

```
.claude/skills/digest/
  SKILL.md              the procedure, the only place it is written
  sources.md            Alina's list, grouped by topic
  issue-template.mdx    frontmatter and body skeleton with the two fixed markers
  scheduled-prompt.md   prompt and cron for the scheduled task (R13)
```

`SKILL.md` frontmatter:

```
name: digest
description: Research, check and write this week's alina.os AI digest issue, then open a pull request for Alina to review. Use when asked to make, write, collect or prepare the weekly digest or a new digest issue, for example "make this week's digest", "write digest issue 14", "собери дайджест", "сделай дайджест за неделю", "новый выпуск дайджеста". Also used by the Monday scheduled run.
```

### Script: `node scripts/digest.ts <command>`

All output is JSON on stdout unless noted; problems go to stderr with a non-zero exit code. Options shared by all commands: `--date YYYY-MM-DD` (run date, default today in Europe/Amsterdam via `Intl.DateTimeFormat`), `--content-dir` (default `src/content`).

| Command | Does | Exit codes |
|---|---|---|
| `context` | Reads `<content-dir>/digest/*.mdx`. Returns `runDate`, `number` (highest existing number including drafts, plus one), `file` (`src/content/digest/NNN.mdx`), `branch` (`digest/NNN`), `previous` (highest-numbered non-draft issue: number, date, file, or null), `window` (`start` = previous date + 1 day, `end` = run date; without a previous issue `start` = run date minus 6 days, so the window is 7 days), `cited` (every `http(s)` URL in earlier issues with its issue number and normalized form, plus each issue's headlines so the model can spot the same announcement under another URL), `sources` (parsed `sources.md`) | 0; 1 when the run date is before the previous issue date |
| `check-ledger <ledger>` | Validates the run ledger (shape below): each kept item's `publishedDate` is inside the window (R3, R4), its URL is not in `cited` after normalization and not repeated in the ledger (R5), sections are topics, at most 4 per section, every URL in `sources.md` is listed in `sourcesChecked` (R2), a quote has text, author, role and a URL that is in `opened` | 0 ok; 2 problems listed; 3 fewer than 4 valid items (thin week, R11) |
| `check-issue <file> <ledger>` | Validates the written file: name `NNN.mdx` equals `number` and the context number; frontmatter passes `digestSchema`; `date` equals the run date; no `draft: true`; every `Section` title is a topic with its color (Models sky, Tooling yellow, Agents pink, Papers lime), no topic twice; `topics` equals the set of section titles; 4 to 10 `Item`s, at most 4 per section; the items in the file match the ledger items one to one by URL and section; exactly one `TriedIt` whose content is exactly `[ALINA: tried it this week]`; the intro (text before the first `Section`) ends with `[ALINA: your take, optional]`; `quote` absent or equal to the ledger quote. Also lists every marker with its line | 0 ok; 2 problems listed |
| `render-check <file>` | Copies `src/content/digest/*.mdx` and `tests/fixtures/content/notes/*` into a temp `CONTENT_DIR`, runs `pnpm exec astro build --outDir <tmp>` without `CONTENT_STRICT`, asserts `digest/NNN/index.html` exists, contains every item headline and one `author-marker` mark per marker. Needed because `pnpm check` builds the fixtures only and would not compile the new file, and a production build of `src/content` fails until a published note exists | 0 ok; 2 failed, build output on stderr |
| `check-diff <number>` | `git diff --name-only origin/main...HEAD` lists exactly `src/content/digest/NNN.mdx` (R10, AC9) | 0 ok; 2 otherwise |
| `pr-body <file> <ledger> --check <pass\|fail> --render <pass\|fail>` | Prints the PR body as Markdown (format below) | 0 |

URL normalization (`urls.ts`): lowercase scheme and host, drop `www.`, drop the fragment, drop `utm_*`, `ref` and `source` query parameters, sort the remaining parameters, drop a trailing slash except on the root. Used only for equality; the issue keeps the URL as opened.

Issue file parsing (`issues.ts`, `issue-check.ts`): `parseFrontmatter` from `astro/markdown` for frontmatter, regular expressions for `Section` (title, color), `Item` (headline, `source={{ name, url }}`) and `TriedIt`, in the same style as `src/lib/digest.ts`. The script cannot import `src/lib/digest.ts` because that file uses an extensionless import that plain `node` does not resolve; the parser is small and has its own tests.

### Run ledger

The agent keeps `.digest/NNN.json` (git-ignored) as it works. The script checks it and builds the PR body from it, so the PR body cannot drift from what was checked.

```json
{
  "number": 14,
  "runDate": "2026-10-12",
  "window": { "start": "2026-10-06", "end": "2026-10-12" },
  "sourcesChecked": [{ "url": "https://www.anthropic.com/news", "note": "2 candidates" }],
  "opened": ["https://..."],
  "items": [{
    "section": "Models",
    "headline": "...",
    "sourceName": "...",
    "url": "https://...",
    "publishedDate": "2026-10-07",
    "dateEvidence": "Oct 7, 2026",
    "takeaway": "..."
  }],
  "dropped": [{ "headline": "...", "url": "https://...", "reason": "outside window: 2026-10-02" }],
  "quote": { "text": "...", "author": "...", "role": "...", "url": "https://..." }
}
```

`dateEvidence` is the date text as it appears on the page, so Alina can check AC4 quickly. `quote` is `null` when no verbatim quote was found.

### Procedure in SKILL.md

Modes: normal, and dry run (when the request says "dry run" or "без PR"). Optional `date=YYYY-MM-DD` for a different run date.

1. Preflight. Working tree clean, on an up-to-date `main` (`git fetch origin main`, `git switch main`, `git pull --ff-only`). `pnpm install --frozen-lockfile` if `node_modules` is missing. In normal mode, `gh auth status` and `gh pr list --state open --search "head:digest/"`: if a digest PR is still open, stop and report it (see section 10, decision 2).
2. Context. `node scripts/digest.ts context`. Create `.digest/NNN.json` with number, run date and window.
3. Research. Open every source in `sources.md` with WebFetch (not curl; outbound shell traffic may be blocked), note candidates in the window, record each source in `sourcesChecked`. Use WebSearch for news the list misses, mainly to find the primary source of a story seen on Hacker News or Simon Willison's weblog. Prefer the primary source (the lab's or vendor's own page) over coverage.
4. Verify each candidate (R4). Open the candidate's own page with WebFetch, asking for the publication date exactly as printed and the sentences that support the takeaway. Keep it only when the page opened, the date is printed on it and is inside the window. Record in `opened`, `items` or `dropped` with a reason. Never cite a page not opened in this run, never add facts, numbers or quotes not on an opened page. Drop items whose URL or announcement already appears in `cited` (R5); judge "same announcement" by headline and subject, and record the earlier issue number in the reason.
5. Select. 4 to 10 items, at most 4 per section, most useful for an engineer who ships AI features first. Quote (R7): only when a page shows a sentence in quotation marks attributed to a named person with a role on that same page; copy it exactly; otherwise `quote: null`.
6. `node scripts/digest.ts check-ledger .digest/NNN.json`. Exit 2: fix the ledger (drop, do not bend dates) and repeat. Exit 3: thin week, go to step 12. No branch exists yet at this point (AC10).
7. Branch. `git switch -c digest/NNN`.
8. Write `src/content/digest/NNN.mdx` from `issue-template.mdx`: frontmatter (`number`, `date` = run date, `title`, `lede`, `topics`, `quote` when set, no `draft`), intro of two to four plain sentences ending with `[ALINA: your take, optional]`, one `Section` per topic used in the fixed order Models, Tooling, Agents, Papers with its color, each `Item` with the agent's own headline, `source={{ name, url }}` and one takeaway sentence as children, then `<TriedIt>` with only `[ALINA: tried it this week]`. Copy rules from `.claude/rules/content.md`: plain English, no hype words, no em dashes, straight quotes. Any other gap only Alina can fill becomes another `[ALINA: ...]` marker.
9. Checks. `node scripts/digest.ts check-issue`, then `pnpm check`, then `node scripts/digest.ts render-check`. Fix and repeat until all pass. If `pnpm check` fails for a reason unrelated to the new file (it builds fixtures only), do not change other files: stop, report, and do not open a PR.
10. Commit. `git add src/content/digest/NNN.mdx` only, commit `content(digest): add issue NNN`, then `node scripts/digest.ts check-diff NNN`.
11. Publish. `node scripts/digest.ts pr-body ... > .digest/NNN-pr.md`. Normal mode: `git push -u origin digest/NNN`, then `gh pr create --base main --head digest/NNN --title "Digest #NNN: <title>" --body-file .digest/NNN-pr.md`. Dry run: no push, no `gh`; print the branch, the commit and the path of the PR body file.
12. Report. Normal: PR URL, item count, markers left, check results. Thin week: no branch, no PR; list the valid items, the dropped items with reasons and the sources checked, and say why the week was thin. Delete nothing Alina made.

Never: merge, push to `main`, force-push, change files other than the new issue, set `draft: true` to get past the guard, or write the `TriedIt` text.

### PR body format

```
## Items
| # | Section | Headline | Source | Date on page |
## Quote
<text>, <author>, <role>. Source: <url>   (or "None")
## Dropped
- <headline or URL>: <reason>
## Sources checked
- <url>: <note>
## Author markers left
- line 9: [ALINA: your take, optional]
- line 41: [ALINA: tried it this week]
## Checks
- check-issue: pass
- pnpm check: pass
- render-check: pass
## Before merging
- [ ] Fill or delete every marker (production refuses to build with one left)
- [ ] Open three source links and compare the dates
```

### Permissions for unattended runs (R13)

`.claude/settings.json`, checked into the repo:

- allow: `WebFetch`, `WebSearch`, `Bash(pnpm install --frozen-lockfile)`, `Bash(pnpm check)`, `Bash(node scripts/digest.ts:*)`, `Bash(git fetch:*)`, `Bash(git switch:*)`, `Bash(git pull --ff-only)`, `Bash(git status:*)`, `Bash(git diff:*)`, `Bash(git log:*)`, `Bash(git add src/content/digest/:*)`, `Bash(git commit:*)`, `Bash(git push -u origin digest/:*)`, `Bash(gh auth status)`, `Bash(gh pr list:*)`, `Bash(gh pr create:*)`, `Write(.digest/**)`, `Write(src/content/digest/**)`, `Edit(src/content/digest/**)`, `Edit(.digest/**)`
- deny: `Bash(gh pr merge:*)`, `Bash(git push origin main:*)`, `Bash(git push --force:*)`, `Bash(git push -f:*)`

The exact rule syntax is checked against the current Claude Code permission docs in T09. The deny list backs up the skill's "never merge, never push to main".

## 7. sources.md (R2)

Plain Markdown, one `##` heading per topic, one `- [Name](url): note` line per source, so `sources.ts` can parse it and Alina can edit it by hand. Cross-topic sources are listed once under the topic where most of their items land, with a note to scan for all topics, so the file keeps the four topics of R2.

Checked with WebFetch on 2026-10-07 (page exists and shows dated entries):

Models
- Anthropic news, https://www.anthropic.com/news (newest Oct 7, 2026)
- OpenAI news, https://openai.com/news/ (Oct 7, 2026)
- Google DeepMind blog, https://deepmind.google/discover/blog/ (October 2026; listing is not strictly by date, open each post)
- Meta AI blog, https://ai.meta.com/blog/ (July 27, 2026)
- Mistral AI news, https://mistral.ai/news (Oct 6, 2026)
- xAI news, https://x.ai/news (Sep 28, 2026)
- DeepSeek API change log, https://api-docs.deepseek.com/updates (2026-09-10)
- Hugging Face blog, https://huggingface.co/blog (Oct 7, 2026)

Tooling
- Claude Platform release notes, https://platform.claude.com/docs/en/release-notes/overview (Oct 8, 2026)
- Claude Code changelog, https://code.claude.com/docs/en/changelog (Oct 7, 2026)
- OpenAI API changelog, https://developers.openai.com/api/docs/changelog (Oct 6, 2026; the old platform.openai.com URL returned 503)
- ChatGPT and Codex changelog, https://learn.chatgpt.com/docs/changelog (2026-10-07; developers.openai.com/codex/changelog redirects here)
- Gemini API release notes, https://ai.google.dev/gemini-api/docs/changelog (Oct 6, 2026)
- GitHub changelog, https://github.blog/changelog/ (Oct 6, 2026)
- Cursor changelog, https://cursor.com/changelog (Oct 6, 2026)
- VS Code release notes, https://code.visualstudio.com/updates (Oct 7, 2026)
- Simon Willison's weblog, https://simonwillison.net/ (Oct 7, 2026), all topics
- Hacker News front page, https://news.ycombinator.com/ , all topics; use only to find stories, then cite the primary source

Agents
- LangChain blog, https://www.langchain.com/blog (Oct 7, 2026; blog.langchain.com redirects here)
- Model Context Protocol blog, https://blog.modelcontextprotocol.io/ (Aug 22, 2026)
- Anthropic engineering, https://www.anthropic.com/engineering (Apr 23, 2026)
- OpenAI Agents SDK releases, https://github.com/openai/openai-agents-python/releases (opened; page shows "19 Aug" without a year)

Papers
- Hugging Face daily papers, https://huggingface.co/papers (Oct 6, 2026)

Left out: the Qwen blog (qwenlm.github.io/blog says it moved to qwen.ai/research, which rendered no posts to WebFetch) and Google's developer blog section (no dates on the index). Alina can add them.

## 8. Scheduled task (R13)

Not code. The orchestrator creates it from a chat session with `create_trigger` after T15 is merged. The prompt is versioned in `.claude/skills/digest/scheduled-prompt.md`:

```
cron: CRON_TZ=Europe/Amsterdam 52 6 * * 1
notifications: push
requires_local_device: false
```

Prompt text (draft, finalized in T15):

```
You are running the weekly alina.os digest. You have no memory of earlier runs.

1. Work in a clone of https://github.com/alicefarron/alina-os. If it is not already in the working directory, clone it. Check out main and pull.
2. Install dependencies: enable corepack or install pnpm 12.9.1, then run pnpm install --frozen-lockfile. Node must be 22.12 or newer.
3. Read .claude/skills/digest/SKILL.md and follow it exactly in normal mode, with today's date in Europe/Amsterdam as the run date. That file is the procedure; do not improvise steps it does not describe.
4. Never merge a pull request, never push to main, never force-push.
5. Finish with a short report: the PR URL, or for a thin week the reason and the items found; markers left; the result of each check.
```

Prerequisites, listed in `docs/publishing.md`: the Claude GitHub App installed on `alicefarron/alina-os` with write access (contents and pull requests), the scheduled task's environment allowed to reach the sources (web access for WebFetch and WebSearch), and automatic approval for the task. The `create_trigger` tool cannot request automatic approval; the result reports the setting it got, and if runs will ask, Alina turns on "Automatically approve" in the task settings. `.claude/settings.json` (section 6) also keeps the run from stopping on the commands it needs.

## 9. Docs and site.digestDay (R14)

`docs/publishing.md`, plain English:

- Weekly routine: Monday morning a PR "Digest #NNN: ..." appears with a push notification. Open the Railway preview from the PR, read the issue in the real design (pink marks show what to fill), open a few source links, fill `[ALINA: tried it this week]` with the `TriedIt` text and a `Terminal` block if wanted, add or delete `[ALINA: your take, optional]`, fill or delete any other marker, commit to the branch, merge. Production rebuilds; the RSS feed updates; Buttondown sends.
- If production refuses to build: the error names the file and the marker. Fix on `main` with a follow-up commit.
- Thin week: the notification says why; nothing to do, or run by hand later.
- One-time setup: Claude GitHub App with write access; the scheduled task (owned by the orchestrator, settings to check: cron, push notification, automatic approval); Railway `CONTENT_STRICT=true` on production and `false` on PR environments; Buttondown RSS-to-email pointed at `https://<domain>/digest/rss.xml`, sending each new item, with a test send.
- By hand: in Claude Code in the repo, say "make this week's digest" or "собери дайджест"; "dry run" to stop before pushing; `date=YYYY-MM-DD` for another run date.
- Editing sources: edit `.claude/skills/digest/sources.md`, keep the `- [Name](url): note` format; `pnpm check` validates it.

`docs/deploy.md` links to it and gets the `CONTENT_STRICT` rows.

`site.digestDay`: `"[DAY]"` becomes `"Monday"`; `tests/unit/site.test.ts` expects `"Monday"`. The subscribe lede then reads "One issue every Monday." Visual baselines are not approved yet (001 T37), so no snapshot update is needed.

## 10. Decisions for Alina

1. Promote `@astrojs/markdown-satteri` 0.4.3 to a direct dependency (section 3). Without it, highlighting needs a switch of the whole MDX pipeline to remark and rehype.
2. Open digest PR at run time: the plan stops and reports when a `digest/*` PR is still open, so issues never stack with overlapping windows and duplicate numbers. Alternative: number past the open PR and start the window after its date.
3. Commit message for issues: `content(digest): add issue NNN`. Issues are content, not a spec task, so the `feat(NNN): ... [Txx]` form does not fit.
4. `.claude/settings.json` with allow and deny rules (section 6). It applies to every Claude Code session in the repo, including Alina's own.
5. With no previous issue the window is the run date and the six days before it.

## 11. Testing

| AC | Test or step | Kind | Who, when |
|---|---|---|---|
| AC1 | Dry run (T14) loads the skill from "make this week's digest, dry run" and walks R2 to R10; Alina repeats with "собери дайджест" in her own session | manual | implementation agent at T14; Alina once after approval |
| AC2 | `digest-ledger.test.ts` "fails when a sources.md URL is missing from sourcesChecked"; run report lists every source | unit + run | Alina reads the first run's report |
| AC3 | `digest-context.test.ts` "window after an issue dated 2026-10-05 on 2026-10-12 is 2026-10-06 to 2026-10-12"; `digest-ledger.test.ts` "rejects an item dated 2026-10-05" and "accepts 2026-10-12" | unit | `pnpm check` |
| AC4 | Open three source links from the PR body, compare page, date and takeaway | manual | Alina, first three scheduled runs |
| AC5 | `digest-ledger.test.ts` "issue 015 ledger with a URL cited in 014 fails, also with utm and trailing slash variants"; `digest-context.test.ts` "cited lists URLs of every earlier issue" | unit | `pnpm check` |
| AC6 | `digest-issue-check.test.ts` cases: 3 items, 11 items, 5 in one section, topics mismatch, wrong color, all fail; valid fixture passes; run step 9 runs `pnpm check` and `render-check` on the real file; `digest-render-check.test.ts` | unit + build + run | `pnpm check`; every run |
| AC7 | `digest-issue-check.test.ts` "quote must equal the ledger quote"; `digest-ledger.test.ts` "quote URL must be opened"; verbatim match on the page | unit + manual | Alina, first three runs with a quote |
| AC8 | `digest-issue-check.test.ts` "TriedIt with any other text fails", "missing TriedIt fails", "intro without the take marker fails"; `digest-skill-files.test.ts` "template TriedIt holds only the marker" | unit | `pnpm check` |
| AC9 | `digest-pr-body.test.ts` "has items with URL and date, dropped, markers, checks"; `check-diff` in the run; dry run shows one commit with one file; first scheduled run: `gh pr view --json files,headRefName,baseRefName` shows one file, `digest/NNN` to `main` | unit + run | `pnpm check`; T14; orchestrator after the first run |
| AC10 | `digest-ledger.test.ts` "3 valid items exits 3"; SKILL.md orders `check-ledger` before the branch step, checked by `digest-skill-files.test.ts` (the branch command appears after the check-ledger command) | unit | `pnpm check`; Alina on the first thin week |
| AC11 | `collection-checks.test.ts` "strict throws naming file, line and marker", "not strict passes"; `markers.test.ts` "CONTENT_STRICT=true build of content-markers fails naming the file and the marker", "build without it passes and /digest/001 has mark.author-marker with the marker text, inside TriedIt too"; `author-marker-render.test.ts` container render: mark in paragraph and TriedIt, none inside a code block; `author-markers.test.ts` split and find | unit + build | `pnpm check` |
| AC12 | `collection-checks.test.ts` "draft entries are skipped"; `markers.test.ts` "CONTENT_STRICT=true build of content-markers-draft passes" | unit + build | `pnpm check` |
| AC13 | First firing (a Monday, 06:52 Europe/Amsterdam): a PR or a thin-week report exists, and the run transcript shows no approval stops | manual, run-based | orchestrator and Alina, first firing |
| AC14 | After merging the first real issue: the item appears in `/digest/rss.xml` and the Buttondown email arrives | manual | Alina, first published issue |

Build tests reuse `runBuild` from `tests/build/build-output.ts`. `runBuild` gets `CONTENT_STRICT: ""` by default so a value in Alina's shell does not leak into tests; tests that need strict pass it explicitly.

Fixture rules from 001 still hold: every fixture text is a square-bracket placeholder or marked sample filler. `content-markers/` has `digest/001.mdx` (published, `[ALINA: tried it this week]` in `TriedIt`, `[ALINA: your take, optional]` in the intro, a fenced code block containing a marker), `digest/002.mdx` (draft with a marker) and one published note with a marker in a paragraph. `content-markers-draft/` has a clean published issue and note, plus a draft issue and a draft note with markers.

`tests/fixtures/digest-runs/` holds small content folders (issues 013 dated 2026-09-28 draft, 014 dated 2026-10-05 published citing `https://example.com/[A]`), ledgers and issue files for the script tests, all with example.com URLs and placeholder text.

## 12. Principles check

| Principle | Status |
|---|---|
| Static first | Met. No server. The scheduled task runs in Claude's cloud, outside the site |
| Zero JS by default | Met. The marker highlight is build-time HTML and CSS |
| WCAG 2.2 AA | Met for the mark: ink on pink about 9.8:1, plus bold weight and a dashed outline so it does not rely on color alone |
| Under 30 KB JS | Unchanged |
| No trackers or third-party data | Met. The agent reads public pages; nothing is sent from the site |
| Tokens only | Met. `author-marker` uses `--color-pink`, `--color-ink`, `--outline-focus`. Custom utility reason given in section 4 |
| No comments in code | Applies to scripts and plugin. SKILL.md and docs are prose, not code |
| Ask before adding a dependency | Decision 1 |
| Ask before changing a URL or deleting content | No URL changes. The skill never deletes content |

No conflict with the spec. One gap the plan fills: R9 asks for `pnpm check`, which builds fixtures only, so it does not compile the new issue. The plan adds `render-check` as an extra gate rather than changing what `pnpm check` builds.

## 13. Risks

- Railway docs do not say whether PR environments copy variables from production. If they do and the override is missing, previews fail on markers. Mitigation: set `CONTENT_STRICT=false` on PR environments explicitly; check on the first digest PR.
- The Sätteri hast `text` visitor was read from the 0.10.5 type definitions, not run. If text inside MDX JSX children (`TriedIt`, `Item`) does not reach it, fall back to an mdast plugin (`mdastPlugins`) that replaces the text node with an `mdxJsxTextElement` named `mark`. T03 tests both places.
- WebFetch returns a model-processed reading of the page, not raw HTML. Dates and quotes are only as exact as that reading. The skill asks for the date and quoted sentences verbatim and drops anything unclear; AC4 and AC7 stay manual for the first three runs.
- The cloud environment of the scheduled task is unverified: Node version, pnpm availability, `gh` authentication through the Claude GitHub App, and web egress for WebFetch. The prompt installs pnpm itself; the first firing proves the rest.
- Approval mode of the scheduled task is set by the server; if it asks, the run stops on the first unapproved tool. `.claude/settings.json` reduces this; Alina may need to turn on automatic approval.
- Source URLs checked once on 2026-10-07 through WebFetch only (shell egress to them is blocked here). Not verified: whether the OpenAI Agents SDK releases page shows years; Anthropic engineering and MCP blog post rarely, so most weeks they add nothing. Qwen and Google developer blog not included.
- The dry run in this sandbox cannot push or open a PR, so `gh pr create` and the push permission are first exercised on the first scheduled run.
- A thin first run is possible if sources post little; the run then reports instead of opening a PR, which is the specified behavior.
- `pnpm check` gets slower: three more builds in `tests/build/` (strict fail, non-strict, draft-only) and one in `digest-render-check.test.ts`.
