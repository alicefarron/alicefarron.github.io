# 002: Digest agent

Status: approved
Owner: Alina

## Why

Spec 001 publishes an issue when an MDX file lands on `main`, so nothing on the site needs a server. What is missing is the work before that: finding the week's news, checking it and writing the issue. Alina wants an agent to do that on a schedule and hand her a ready issue to review, so a weekly digest costs her minutes, not hours.

## Users and goals

- Alina wants a draft issue waiting for her every week, with every claim traceable to a source she can open.
- Alina wants to publish by merging a pull request, after reading the issue in the real design.
- Alina wants to run the same procedure by hand ("make this week's digest") when the schedule is off or she wants an extra issue.
- Subscribers want the issue in their inbox shortly after it is published.

## Scope

- A `digest` skill in the repo that describes the whole procedure, usable by hand and by the scheduled run.
- A sources file the skill reads, which Alina edits without touching the skill.
- A production guard that refuses to publish an issue with unresolved author markers.
- A weekly scheduled task in Claude that runs the skill and opens a pull request.
- Documentation for the manual setup: GitHub access for Claude, Railway variables, Buttondown RSS-to-email.

## Out of scope

- Writing notes (the writing section). Notes stay Alina's own work.
- Publishing without Alina's review. The agent never merges, never pushes to `main` and never sets anything live.
- Sending email from the repo. Buttondown sends it from the RSS feed.
- Social media posts about the issue.

## Decisions

- Runs as a Claude scheduled task in the cloud, not in Hermes. Reason: the stronger model writes and checks better.
- Merge is publication. The agent opens the issue with `draft: false`, so the PR preview on Railway shows it as it will look live. Anything only Alina can write is left as a marker, and production refuses to build while a marker is left.
- Author marker format: `[ALINA: what is needed]`, for example `[ALINA: tried it this week]`.
- Issues are written in English, following `.claude/rules/content.md`.
- Schedule: the agent runs on Monday morning, Alina reviews and merges the same day, so the issue comes out on Monday. `site.digestDay` becomes "Monday".
- Initial sources: official blogs and changelogs of the main model labs and dev-tool vendors, Hugging Face daily papers, Simon Willison's weblog, the Hacker News front page. Alina edits `sources.md` afterwards.

## Requirements

R1. The repo has a skill at `.claude/skills/digest/SKILL.md` that describes the procedure in R2 to R9. It is triggered by requests such as "make this week's digest" or "собери дайджест", and is the only place the procedure is written down. The scheduled task's prompt only tells the agent to follow it.

R2. The skill reads `.claude/skills/digest/sources.md`, a plain list of sources grouped by topic (Models, Tooling, Agents, Papers), and searches the web beyond it when needed. Alina can change the list without touching the skill.

R3. The coverage window starts the day after the previous published issue's `date` and ends on the run date. With no previous issue, the window is the last 7 days.

R4. Every item in the issue has a source URL that the agent opened during the run, and a publication date inside the window that the agent read on that page. Items that fail either check are dropped. The agent never cites a page it did not open, and never writes facts, numbers or quotes that are not on a page it opened.

R5. The agent drops items whose source URL, or a URL to the same announcement, already appears in an earlier issue.

R6. The issue has between 4 and 10 items, at most 4 per section, grouped into `Section`s by topic with the colors used in 001 (Models sky, Tooling yellow, Agents pink, Papers lime). Each `Item` has a headline in the agent's words, the source name and URL, and one takeaway sentence for an engineer who ships AI features. `topics` in the frontmatter lists exactly the sections used.

R7. The agent writes `title`, `lede` and the intro in plain English per the content rules. The `quote` field is set only when a quote appears word for word on a source page the agent opened, with that person's name and role from the same page; otherwise it is omitted.

R8. The `TriedIt` section is never written by the agent. It contains a single `[ALINA: tried it this week]` marker. The intro ends with `[ALINA: your take, optional]` so Alina can add her voice.

R9. The file is `src/content/digest/NNN.mdx`, where NNN is the highest existing issue number plus one, padded to three digits, and `number`, `date` (run date) and the file name agree. The agent runs `pnpm check` and only continues when it passes.

R10. The agent works on a branch `digest/NNN`, commits only the new issue file, pushes, and opens a pull request titled `Digest #NNN: <title>`. The PR body lists every item with its source URL and the date read on the page, the items dropped and why, every author marker left in the file, and the result of `pnpm check`.

R11. If fewer than 4 items pass R4 and R5, the agent does not open a PR. It reports the items it found and why the week was thin.

R12. Production builds fail when a published (non-draft) digest issue or note contains an `[ALINA:` marker, with a message naming the file and the marker. The check runs only when the environment variable `CONTENT_STRICT` is `true`, which is set on the Railway production environment and not on PR environments. Without it, markers render visibly highlighted so Alina sees them in the preview.

R13. A Claude scheduled task runs the skill every Monday shortly before 07:00 Europe/Amsterdam, with a push notification when it finishes. The run needs GitHub push access to `alicefarron/alina-os` and must not stop to ask for approvals.

R14. `docs/publishing.md` describes the weekly routine from Alina's side (review the PR, fill the markers, merge), the one-time setup (Claude GitHub access, `CONTENT_STRICT=true` on Railway production, Buttondown RSS-to-email on `/digest/rss.xml`), and how to run the skill by hand. `site.digestDay` is set to "Monday".

## Acceptance criteria

AC1 (R1). Given a Claude Code session in the repo, when Alina asks "make this week's digest", then the `digest` skill loads and the run follows R2 to R10.
AC2 (R2). Given a source added to `sources.md`, when the skill runs, then that source is checked. Verified by reading the run's report.
AC3 (R3). Given the latest published issue dated 2026-10-05 and a run on 2026-10-12, then every item's date is between 2026-10-06 and 2026-10-12.
AC4 (R4). Given a finished PR, when Alina opens any three source links from the PR body, then each page exists, carries the date listed in the PR body, and supports the item's takeaway. Manual check on the first three runs.
AC5 (R5). Given issue 014 cites a URL, then issue 015 does not cite that URL.
AC6 (R6, R9). Given the agent's file, then `pnpm check` passes, it has 4 to 10 items, no section has more than 4, and `topics` equals the set of sections used.
AC7 (R7). Given an issue with a `quote`, then the quoted text appears verbatim on a page listed in the PR body.
AC8 (R8). Given the agent's file, then `TriedIt` contains only the `[ALINA: tried it this week]` marker.
AC9 (R10). Given a run, then a PR exists from `digest/NNN` to `main` with exactly one changed file, and the PR body has the items list, dropped items, markers and check result.
AC10 (R11). Given a run that finds 3 valid items, then no branch or PR is created and the report says why.
AC11 (R12). Given `CONTENT_STRICT=true` and a published issue containing `[ALINA: tried it this week]`, then `pnpm build` fails and the message names the file and marker. Given the same issue without the variable, the build passes and the marker is visibly highlighted on the issue page. Unit and build tests.
AC12 (R12). Given `CONTENT_STRICT=true` and a draft issue containing a marker, then the build passes.
AC13 (R13). Given the scheduled task, when it fires, then a PR appears or a thin-week report is delivered, without anyone approving steps during the run.
AC14 (R14). Given `docs/publishing.md`, when Alina follows the one-time setup, then the next merged issue reaches Buttondown subscribers by email. Manual check on the first published issue.

## Open questions

None.
