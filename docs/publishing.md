# Publishing the weekly digest

Every Monday morning a Claude scheduled task researches the week's AI news and opens a pull request with the next digest issue. You review it, fill in what only you can write, and merge. Merging is publication: production rebuilds, the RSS feed updates and Buttondown emails subscribers.

The procedure the agent follows is in `.claude/skills/digest/SKILL.md`. Spec: `specs/002-digest-agent/spec.md`.

## Every week

1. Monday, shortly before 07:00 (Amsterdam time), you get a push notification. It links either to a pull request titled "Digest #NNN: ..." or to a thin-week report.
2. Open the pull request, then check out its branch locally and start the dev server:
   ```bash
   git fetch && git switch digest/NNN && pnpm install && pnpm dev
   ```
   Open `http://localhost:4321/digest/NNN` and read the issue in the real design. Pink highlighted text is an author marker, for example `[ALINA: tried it this week]`, that only you can fill. There are no hosted previews: GitHub Pages publishes only `main`.
3. Open at least three source links from the "Items" table in the PR body. Check that each page exists, shows the date listed, and supports the takeaway. If there is a quote, find it word for word on its source page.
4. Edit `src/content/digest/NNN.mdx` on the `digest/NNN` branch (on GitHub or locally):
   - Replace `[ALINA: tried it this week]` with your "Tried it" text. A `Terminal` code block is fine there.
   - Replace `[ALINA: your take, optional]` at the end of the intro with your take, or delete it.
   - Fill or delete any other `[ALINA: ...]` marker.
   - Fix or remove any item you disagree with.
5. Commit to the branch and check the page in `pnpm dev` once more. It reloads on save.
6. Merge the pull request. The Pages workflow rebuilds production with the issue, `/digest/rss.xml` gets the new item, and Buttondown sends it.

### If production refuses to build

With `CONTENT_STRICT=true`, production fails while a published issue or note still contains an author marker. The build log names the file, the line and the marker, for example:

```
Unresolved author markers in published content (CONTENT_STRICT=true):
  src/content/digest/014.mdx:12 [ALINA: tried it this week]
```

Fill or remove that marker in a follow-up commit on `main`. Nothing reaches the site or subscribers until the build passes.

### Thin weeks

If fewer than 4 items pass the checks, the agent creates no branch and no pull request. The notification then carries a report: the items it found, the items it dropped and why, and the sources it checked. There is nothing to do. You can run the skill by hand later in the week (see below).

### If a digest pull request is still open

The agent stops without doing anything when a `digest/...` pull request is still open, so issues never overlap. Merge or close the old one first.

## One-time setup

### 1. GitHub branch protection for `main`

This is the real guarantee that the agent cannot publish on its own. The permission rules in `.claude/settings.json` are a second line of defense.

1. On GitHub, open `alicefarron/alicefarron.github.io`, then Settings, then Branches (or Rules, then Rulesets).
2. Add a rule for the branch `main`.
3. Turn on "Require a pull request before merging".
4. Make sure force pushes are blocked ("Block force pushes" in a ruleset; in a classic branch protection rule, leave "Allow force pushes" off). Also leave deletions blocked.
5. Save. Check: `git push origin main` from any clone is now refused, and the agent's pull requests can still be merged by you.

### 2. Claude GitHub access

1. Install the Claude GitHub App on `alicefarron/alicefarron.github.io` (claude.ai Settings, then Connectors, then GitHub).
2. Give it write access to contents and pull requests on this repository, so the scheduled run can push `digest/NNN` branches and open pull requests.

### 3. The scheduled task

The task is created in Claude from `.claude/skills/digest/scheduled-prompt.md`. Check its settings once it exists:

- Schedule: every Monday at 06:52 Europe/Amsterdam.
- Notifications: push on.
- Approvals: turn on "Automatically approve" in the task's settings. A scheduled run has nobody to approve steps, so without it the run stops at the first step that needs approval.
- Web access: the run must be able to reach the sources in `sources.md` with web fetch and web search.

### 4. GitHub Pages

Set Pages to deploy from GitHub Actions once (`docs/deploy.md`, section 1). The workflow builds production with `CONTENT_STRICT=true`; `pnpm dev` leaves it unset, so markers render highlighted locally.

### 5. Buttondown RSS-to-email

1. In Buttondown, open Settings, then the RSS-to-email (automations) section, and add a feed.
2. Feed URL: `https://alicefarron.github.io/digest/rss.xml`.
3. Send each new item as its own email, not a periodic roundup.
4. Send a test email to yourself and check the issue title, links and layout.
5. After the first real issue is merged, confirm the email arrives.

## Running the skill by hand

In a Claude Code session in this repo, say one of:

- "make this week's digest"
- "собери дайджест"

The `digest` skill loads and follows the same procedure as the Monday run, ending with a pull request.

Options you can add to the request:

- "dry run" (or "без PR"): everything up to the commit on a local `digest/NNN` branch, but nothing is pushed and no pull request is opened. The PR body is written to `.digest/NNN-pr.md`.
- `date=YYYY-MM-DD`: use another run date. The coverage window starts the day after the previous published issue and ends on the run date.

## Editing sources

The sources the agent checks every run are in `.claude/skills/digest/sources.md`, grouped under `## Models`, `## Tooling`, `## Agents` and `## Papers`. Add, remove or move lines, keeping the format:

```
- [Name](https://example.com/page): short note
```

`pnpm check` validates the file. The agent searches the web beyond this list when needed, but it opens every listed source on every run.
