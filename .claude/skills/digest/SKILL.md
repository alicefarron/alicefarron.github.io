---
name: digest
description: Research, check and write this week's alina.os AI digest issue, then open a pull request for Alina to review. Use when asked to make, write, collect or prepare the weekly digest or a new digest issue, for example "make this week's digest", "write digest issue 14", "собери дайджест", "сделай дайджест за неделю", "новый выпуск дайджеста". Also used by the Monday scheduled run.
---

# Digest

You research the AI news of the coverage window, check every item against its own page, write the next issue in `src/content/digest/NNN.mdx` and open a pull request. Alina reviews, fills the author markers and merges. Merging is publication, so the issue is written with `draft: false` and must be right.

This file is the only place the procedure is written. Follow it step by step and do not add steps it does not describe. Details on the ledger, the PR body and MDX pitfalls are in `reference.md` next to this file.

## Never

- Never merge a pull request. Never push to `main`. Never force-push.
- Never work on any branch except `digest/NNN`, and never create it before step 6 passes.
- Never commit any file except the new `src/content/digest/NNN.mdx`. Never change other files, including other issues, `sources.md`, scripts or settings.
- Never cite a page you did not open in this run. Never write a fact, number, name or quote that is not on a page you opened in this run. Never fill a gap from memory.
- Never write the `TriedIt` text. Never set `draft: true` to get past a check. Never delete anything Alina made.

## Modes

- Normal: the default, and the scheduled run.
- Dry run: when the request says "dry run" or "без PR". Same steps, but nothing is pushed and no PR is opened.
- `date=YYYY-MM-DD` in the request sets the run date. Without it the run date is today in Europe/Amsterdam, which `context` computes. Pass `--date` to every `node scripts/digest.ts` command when the request set a date.

## 1. Preflight

1. `git status --porcelain` prints nothing. If the tree is not clean, stop and report.
2. `git fetch origin main`, `git switch main`, `git pull --ff-only`.
   In normal mode, `git log --oneline origin/main..main` must print nothing; local commits on `main` would end up in the PR, so stop and report them.
3. If `node_modules` is missing, run `pnpm install --frozen-lockfile`.
4. Open digest PRs: `gh auth status`, then `gh pr list --state open --json number,headRefName,url`. If any open PR has a `headRefName` starting with `digest/`, stop and report its URL; issues must not stack. In normal mode, if `gh` fails, stop and report. In dry run, if `gh` is not authenticated, skip this check and say so in the report.

## 2. Context

Run `node scripts/digest.ts context`. It prints `runDate`, `number`, `file`, `branch`, `previous`, `window`, `cited` (URLs and headlines of earlier issues) and `sources` (parsed `sources.md`). If it exits non-zero, stop and report its message.

If the branch `digest/NNN` already exists, stop and report; do not delete or reuse it. Check locally with `git log -1 --oneline digest/NNN` and on origin with `git fetch origin digest/NNN`; both must fail with an unknown revision or a missing ref.

Create `.digest/NNN.json` with `number`, `runDate` and `window` from `context`, and empty `sourcesChecked`, `opened`, `items`, `dropped`, and `quote: null`. The format is in `reference.md`.

## 3. Research

1. Open every source URL in `sources.md` with WebFetch (not curl). Ask for the posts or entries dated inside the window, with their titles, links and dates exactly as printed. Add each source URL, exactly as written in `sources.md`, to `sourcesChecked` with a note, also when it failed to load or had nothing in the window.
2. Use WebSearch for news the list misses, mainly to find the primary source of a story seen on Hacker News or Simon Willison's weblog. Prefer the primary source (the lab's or vendor's own page) over coverage of it.
3. Write down candidates. Skip anything whose listing date is clearly outside the window, and record it in `dropped` only if it looked relevant.

## 4. Verify each candidate (R4, R5)

For each candidate:

1. Open the candidate's own page with WebFetch. Ask for the publication date exactly as printed on the page, and for the sentences that support what you want to say. When a changelog has a page or anchor per entry, open and cite that entry, not only the index. For papers, cite the arXiv abstract page (`https://arxiv.org/abs/<id>`), which prints "Submitted on" with the year; Hugging Face paper pages show the day without the year.
2. Keep it only when the page loaded, a full date including the year is printed on that page, and the date is inside the window. A date without a year counts only when the same page shows the year for that entry. Do not take the date from a listing page, a search result or the URL alone.
3. Drop it when its URL, or another URL for the same announcement, is in `cited`. Judge "same announcement" by subject and headline, and put the earlier issue number in the reason.
4. Add the page to `opened`. Add the item to `items`, or the candidate to `dropped` with a reason.

## 5. Select

1. Keep 4 to 10 items, at most 4 per section, the most useful for an engineer who ships AI features first. Move the rest to `dropped` with `section full` or `over 10 items`.
2. Sections are `Models`, `Tooling`, `Agents` and `Papers`. Put each item in the section it fits best.
3. Quote (R7): set `quote` only when an opened page shows a sentence in quotation marks attributed to a named person, with that person's role on the same page. Copy text, name and role exactly. Otherwise leave `quote: null`.

## 6. Check the ledger

Run `node scripts/digest.ts check-ledger .digest/NNN.json`.

- Exit 0: go on.
- Exit 2: fix the ledger and run it again. Fix by dropping items or adding missing sources, never by changing a date you read.
- Exit 3: thin week (fewer than 4 valid items). Do not create a branch, do not write the issue, do not open a PR. Go to step 11.

## 7. Branch

`git switch -c digest/NNN` from the up-to-date `main`.

## 8. Write the issue

Write `src/content/digest/NNN.mdx` starting from `issue-template.mdx` and fill it:

- Frontmatter: `number`, `date` (the run date), `title`, `lede`, `topics` (exactly the sections used, in the order Models, Tooling, Agents, Papers), `quote` only when the ledger has one. No `draft` line.
- Intro: two to four plain sentences about the week, then ` [ALINA: your take, optional]` as the last thing before the first `Section`.
- One `Section` per topic used, in the order Models, Tooling, Agents, Papers, with its fixed color (Models sky, Tooling yellow, Agents pink, Papers lime). Delete the sections you do not use.
- Each `Item`: `headline` in your own words, `source={{ name, url }}` with the source name and the URL from the ledger, and one takeaway sentence as its only child. Headline and takeaway must be the same as in the ledger.
- `TriedIt` contains only `[ALINA: tried it this week]`.
- Copy rules from `.claude/rules/content.md`: plain English, specific, no hype words, no em dashes, straight quotes. Any other gap only Alina can fill becomes another `[ALINA: what is needed]` marker.

## 9. Checks

Run, in this order, and fix the issue file until all pass:

1. `node scripts/digest.ts check-issue src/content/digest/NNN.mdx .digest/NNN.json`
2. `pnpm check`
3. `node scripts/digest.ts render-check src/content/digest/NNN.mdx`

Change only the issue file and the ledger. If `pnpm check` fails for a reason unrelated to the issue file, do not touch other files: switch back to `main` without committing, report the failure and stop. Do not open a PR.

## 10. Commit and publish

1. `git add src/content/digest/NNN.mdx` and nothing else. Commit with the message `content(digest): add issue NNN`.
2. `node scripts/digest.ts check-diff NNN`. It must pass. In dry run use `node scripts/digest.ts check-diff NNN --base main`, because a local `main` may be ahead of `origin/main` and nothing is pushed.
3. `node scripts/digest.ts pr-body src/content/digest/NNN.mdx .digest/NNN.json --check pass --render pass > .digest/NNN-pr.md`
4. Normal mode: `git push -u origin digest/NNN`, then `gh pr create --base main --head digest/NNN --title "Digest #NNN: <title>" --body-file .digest/NNN-pr.md`, with `<title>` the frontmatter title.
5. Dry run: do not push and do not run `gh pr create`. Run `git switch main`; the issue stays committed on `digest/NNN` and the PR body stays in `.digest/NNN-pr.md`.

## 11. Report

End with a short report:

- Normal: the PR URL, the number of items, the markers left and the result of each check.
- Dry run: the branch, the commit hash, the path of the PR body file, the number of items, the markers left and the check results.
- Thin week: say that no branch and no PR were created, list the valid items, the dropped items with reasons and the sources checked, and say why the week was thin.
- Any step you could not do, and why.
