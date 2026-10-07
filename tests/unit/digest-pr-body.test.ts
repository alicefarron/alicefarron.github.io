import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Ledger } from "../../scripts/digest/ledger.ts";
import { prBody } from "../../scripts/digest/pr-body.ts";
import { checkDiff, runDigest } from "../../scripts/digest.ts";

const runs = "tests/fixtures/digest-runs";
const ledgerPath = join(runs, "ledger-015.json");
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8")) as Ledger;
const dirs: string[] = [];
const noSources = { readSources: () => ({ groups: [], problems: [] }) };

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

function contentWithIssue(): { dir: string; file: string } {
	const dir = mkdtempSync(join(tmpdir(), "digest-pr-"));
	dirs.push(dir);
	mkdirSync(join(dir, "digest"));
	for (const name of readdirSync(join(runs, "basic/digest"))) {
		copyFileSync(join(runs, "basic/digest", name), join(dir, "digest", name));
	}
	const file = join(dir, "digest", "015.mdx");
	copyFileSync(join(runs, "issue-015.mdx"), file);
	return { dir, file };
}

describe("pr-body", () => {
	it("prints every section from the ledger, markers and checks (AC9)", () => {
		const { dir, file } = contentWithIssue();
		const result = runDigest(
			[
				"pr-body",
				file,
				ledgerPath,
				"--content-dir",
				dir,
				"--check",
				"pass",
				"--render",
				"fail",
			],
			noSources,
		);
		expect(result.code, result.stderr).toBe(0);
		const body = result.stdout;
		expect(body).toContain("## Items");
		expect(body).toContain(
			"| # | Section | Headline | Source | Date on page |",
		);
		for (const item of ledger.items) {
			expect(body).toContain(
				`| ${item.section} | ${item.headline} | [${item.sourceName}](${item.url}) | ${item.dateEvidence} (${item.publishedDate}) |`,
			);
		}
		expect(body).toContain(
			"## Quote\n\n[QUOTE TEXT], [QUOTE AUTHOR], [QUOTE ROLE]. Source: https://example.com/[M1]",
		);
		expect(body).toContain(
			"## Dropped\n\n- [HEADLINE OLD]: outside window: 2026-10-02",
		);
		expect(body).toContain(
			"## Sources checked\n\n- https://example.com/[SOURCE LIST 1]: [NOTE]\n- https://example.com/[SOURCE LIST 2]: [NOTE]",
		);
		expect(body).toContain(
			"## Author markers left\n\n- line 17: [ALINA: your take, optional]\n- line 56: [ALINA: tried it this week]",
		);
		expect(body).toContain(
			"## Checks\n\n- check-issue: pass\n- pnpm check: pass\n- render-check: fail",
		);
		expect(body).toContain(
			"## Before merging\n\n- [ ] Fill or delete every marker (production refuses to build with one left)\n- [ ] Open three source links and compare the dates",
		);
	});

	it("reports check-issue: fail when the file has problems", () => {
		const { dir } = contentWithIssue();
		const file = join(dir, "digest", "015.mdx");
		const broken = readFileSync(file, "utf8").replace(
			" [ALINA: your take, optional]",
			"",
		);
		writeFileSync(file, broken);
		const result = runDigest(
			[
				"pr-body",
				file,
				ledgerPath,
				"--content-dir",
				dir,
				"--check",
				"pass",
				"--render",
				"pass",
			],
			noSources,
		);
		expect(result.code).toBe(0);
		expect(result.stdout).toContain("- check-issue: fail");
	});

	it("writes None for no quote, no dropped items and no markers", () => {
		const body = prBody({
			ledger: { ...ledger, quote: null, dropped: [] },
			markers: [],
			checks: { checkIssue: "pass", pnpmCheck: "pass", renderCheck: "pass" },
		});
		expect(body).toContain("## Quote\n\nNone");
		expect(body).toContain("## Dropped\n\nNone");
		expect(body).toContain("## Author markers left\n\nNone");
	});

	it("escapes pipes in table cells", () => {
		const first = ledger.items[0];
		if (first === undefined) {
			throw new Error("fixture has no items");
		}
		const body = prBody({
			ledger: { ...ledger, items: [{ ...first, headline: "[A | B]" }] },
			markers: [],
			checks: { checkIssue: "pass", pnpmCheck: "pass", renderCheck: "pass" },
		});
		expect(body).toContain("[A \\| B]");
	});

	it("requires --check and --render", () => {
		const result = runDigest(["pr-body", "a.mdx", ledgerPath], noSources);
		expect(result.code).toBe(64);
	});
});

describe("check-diff", () => {
	function diff(files: string[]) {
		return runDigest(["check-diff", "15"], { changedFiles: () => files });
	}

	it("passes when only the new issue changed (AC9)", () => {
		const result = diff(["src/content/digest/015.mdx"]);
		expect(result.code).toBe(0);
		expect(JSON.parse(result.stdout)).toMatchObject({ status: "ok" });
	});

	it("fails with two files (AC9)", () => {
		const result = diff([
			"src/content/digest/015.mdx",
			".claude/skills/digest/sources.md",
		]);
		expect(result.code).toBe(2);
		expect(result.stderr).toContain(
			"it changes src/content/digest/015.mdx, .claude/skills/digest/sources.md",
		);
	});

	it("fails with a different path (AC9)", () => {
		expect(diff(["src/content/digest/014.mdx"]).code).toBe(2);
		expect(diff(["src/content/digest/15.mdx"]).code).toBe(2);
	});

	it("fails with no changes", () => {
		expect(checkDiff(15, []).problems).toEqual([
			"the branch must change exactly src/content/digest/015.mdx; it changes nothing",
		]);
	});

	it("exits 1 when git fails", () => {
		const result = runDigest(["check-diff", "15"], {
			changedFiles: () => {
				throw new Error("git diff failed: no origin/main");
			},
		});
		expect(result.code).toBe(1);
		expect(result.stderr).toContain("no origin/main");
	});

	it("compares with origin/main by default", () => {
		const bases: string[] = [];
		runDigest(["check-diff", "15"], {
			changedFiles: (base) => {
				bases.push(base);
				return ["src/content/digest/015.mdx"];
			},
		});
		expect(bases).toEqual(["origin/main"]);
	});

	it("compares with --base when given, for dry runs on a local main", () => {
		const bases: string[] = [];
		const result = runDigest(["check-diff", "15", "--base", "main"], {
			changedFiles: (base) => {
				bases.push(base);
				return ["src/content/digest/015.mdx"];
			},
		});
		expect(result.code).toBe(0);
		expect(bases).toEqual(["main"]);
	});

	it("requires a number", () => {
		expect(runDigest(["check-diff"]).code).toBe(64);
	});
});
