# Digest scheduled task

Settings for the Claude scheduled task that runs the digest skill (spec 002, R13). The orchestrator creates the task from this file; Alina checks the settings in `docs/publishing.md`.

- Name: alina.os weekly digest
- Cron: `CRON_TZ=Europe/Amsterdam 52 6 * * 1`
- Notifications: push on
- Requires local device: no
- Approvals: automatic ("Automatically approve" in the task settings)

## Prompt

```
You are running the weekly alina.os digest. You have no memory of earlier runs; everything you need is in the repo.

1. Work in a clone of https://github.com/alicefarron/alina-os (repo alicefarron/alina-os). If it is not in the working directory yet, clone it. Check out main and pull.
2. Install dependencies: Node 22.12 or newer is required. Enable corepack or run npm install --global pnpm@12.9.1, then run pnpm install --frozen-lockfile.
3. If .claude/skills/digest/SKILL.md does not exist in the clone, stop and report that the digest skill is not on GitHub yet. Do not write an issue without it.
4. Read .claude/skills/digest/SKILL.md and follow it exactly in normal mode (not dry run), with today's date in Europe/Amsterdam as the run date. That file is the procedure; do not add steps it does not describe.
5. Never merge a pull request, never push to main, never force-push.
6. End with a short report: the pull request link, or for a thin week the reason and the items found; the author markers left; the result of each check. If you stopped early, say at which step and why.
```
