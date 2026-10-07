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
import { parseIssueBody } from "../../scripts/digest/issue-check.ts";
import type { Ledger } from "../../scripts/digest/ledger.ts";
import { type IssueCheck, runDigest } from "../../scripts/digest.ts";

const runs = "tests/fixtures/digest-runs";
const validIssue = readFileSync(join(runs, "issue-015.mdx"), "utf8");
const validLedger = readFileSync(join(runs, "ledger-015.json"), "utf8");
const dirs: string[] = [];

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

type Setup = {
	issue?: string;
	ledger?: Ledger;
	name?: string;
};

function run({ issue = validIssue, ledger, name = "015.mdx" }: Setup = {}): {
	code: number;
	result: IssueCheck;
} {
	const dir = mkdtempSync(join(tmpdir(), "digest-issue-"));
	dirs.push(dir);
	mkdirSync(join(dir, "digest"));
	for (const file of readdirSync(join(runs, "basic/digest"))) {
		copyFileSync(join(runs, "basic/digest", file), join(dir, "digest", file));
	}
	const file = join(dir, "digest", name);
	writeFileSync(file, issue);
	const ledgerPath = join(dir, "ledger.json");
	writeFileSync(
		ledgerPath,
		ledger === undefined ? validLedger : JSON.stringify(ledger),
	);
	const output = runDigest(
		["check-issue", file, ledgerPath, "--content-dir", dir],
		{ readSources: () => ({ groups: [], problems: [] }) },
	);
	expect(output.stdout, output.stderr).not.toBe("");
	return { code: output.code, result: JSON.parse(output.stdout) as IssueCheck };
}

function ledger(): Ledger {
	return JSON.parse(validLedger) as Ledger;
}

function item(id: string): string {
	return `<Item headline="[HEADLINE ${id}]" source={{ name: "[SOURCE ${id}]", url: "https://example.com/[${id}]" }}>\n[TAKEAWAY ${id}]\n</Item>\n`;
}

function ledgerItem(section: string, id: string) {
	return {
		section,
		headline: `[HEADLINE ${id}]`,
		sourceName: `[SOURCE ${id}]`,
		url: `https://example.com/[${id}]`,
		publishedDate: "2026-10-07",
		dateEvidence: "[DATE]",
		takeaway: `[TAKEAWAY ${id}]`,
	};
}

function issueWithItems(ids: Array<[string, string]>): string {
	const sections = ["Models", "Tooling", "Agents", "Papers"] as const;
	const colors = {
		Models: "sky",
		Tooling: "yellow",
		Agents: "pink",
		Papers: "lime",
	};
	const used = sections.filter((section) =>
		ids.some(([itemSection]) => itemSection === section),
	);
	const body = used
		.map(
			(section) =>
				`<Section title="${section}" color="${colors[section]}">\n\n${ids
					.filter(([itemSection]) => itemSection === section)
					.map(([, id]) => item(id))
					.join("\n")}\n</Section>\n`,
		)
		.join("\n");
	return [
		"---",
		"number: 15",
		'title: "[TITLE]"',
		"date: 2026-10-12",
		'lede: "[LEDE]"',
		"topics:",
		...used.map((section) => `  - ${section}`),
		"---",
		"",
		"[INTRO] [ALINA: your take, optional]",
		"",
		body,
		"<TriedIt>",
		"[ALINA: tried it this week]",
		"</TriedIt>",
		"",
	].join("\n");
}

function ledgerWithItems(ids: Array<[string, string]>): Ledger {
	const base = ledger();
	return {
		...base,
		quote: null,
		opened: ids.map(([, id]) => `https://example.com/[${id}]`),
		items: ids.map(([section, id]) => ledgerItem(section, id)),
	};
}

describe("check-issue", () => {
	it("passes the valid fixture and lists every marker with its line", () => {
		const { code, result } = run();
		expect(result.problems).toEqual([]);
		expect(code).toBe(0);
		expect(result.markers).toEqual([
			{ line: 17, marker: "[ALINA: your take, optional]" },
			{ line: 56, marker: "[ALINA: tried it this week]" },
		]);
	});

	it("fails with 3 items (AC6)", () => {
		const ids: Array<[string, string]> = [
			["Models", "A1"],
			["Tooling", "B1"],
			["Agents", "C1"],
		];
		const { code, result } = run({
			issue: issueWithItems(ids),
			ledger: ledgerWithItems(ids),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual(["issue has 3 items, expected 4 to 10"]);
	});

	it("fails with 11 items (AC6)", () => {
		const ids: Array<[string, string]> = [
			...["1", "2", "3"].map((n): [string, string] => ["Models", `A${n}`]),
			...["1", "2", "3"].map((n): [string, string] => ["Tooling", `B${n}`]),
			...["1", "2", "3"].map((n): [string, string] => ["Agents", `C${n}`]),
			...["1", "2"].map((n): [string, string] => ["Papers", `D${n}`]),
		];
		const { code, result } = run({
			issue: issueWithItems(ids),
			ledger: ledgerWithItems(ids),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual(["issue has 11 items, expected 4 to 10"]);
	});

	it("fails with 5 items in one section (AC6)", () => {
		const ids = ["1", "2", "3", "4", "5"].map((n): [string, string] => [
			"Models",
			`A${n}`,
		]);
		const { code, result } = run({
			issue: issueWithItems(ids),
			ledger: ledgerWithItems(ids),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			'Section "Models" has 5 items, at most 4 allowed',
		]);
	});

	it("fails when topics do not equal the section titles (AC6)", () => {
		const { code, result } = run({
			issue: validIssue.replace("  - Papers\n", ""),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"topics [Models, Tooling, Agents] do not equal the sections used [Models, Tooling, Agents, Papers]",
		]);
	});

	it("fails on a wrong section color (AC6)", () => {
		const { code, result } = run({
			issue: validIssue.replace(
				'title="Agents" color="pink"',
				'title="Agents" color="sky"',
			),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			'Section "Agents" has color "sky", expected "pink"',
		]);
	});

	it("fails on a section that is not a topic", () => {
		const { code, result } = run({
			issue: validIssue.replace(
				'title="Agents" color="pink"',
				'title="Robots" color="pink"',
			),
		});
		expect(code).toBe(2);
		expect(result.problems).toContain(
			'Section "Robots" is not one of Models, Tooling, Agents, Papers',
		);
	});

	it("fails on a duplicate section (AC6)", () => {
		const { code, result } = run({
			issue: validIssue
				.replace('title="Tooling" color="yellow"', 'title="Models" color="sky"')
				.replace("  - Tooling\n", ""),
			ledger: {
				...ledger(),
				items: ledger().items.map((entry) =>
					entry.section === "Tooling" ? { ...entry, section: "Models" } : entry,
				),
			},
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual(['Section "Models" appears twice']);
	});

	it("fails when the file name is not the number (AC6)", () => {
		const { code, result } = run({ name: "15.mdx" });
		expect(code).toBe(2);
		expect(result.problems).toContain("file name 15.mdx should be 015.mdx");
	});

	it("fails when number is not the next issue number", () => {
		const { code, result } = run({
			issue: validIssue.replace("number: 15", "number: 16"),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"frontmatter number 16 is not the next issue number 15",
		]);
	});

	it("fails when date is not the run date (AC6)", () => {
		const { code, result } = run({
			issue: validIssue.replace("date: 2026-10-12", "date: 2026-10-11"),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"frontmatter date 2026-10-11 is not the run date 2026-10-12",
		]);
	});

	it("fails with draft: true (AC6)", () => {
		const { code, result } = run({
			issue: validIssue.replace("number: 15", "number: 15\ndraft: true"),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"frontmatter has draft: true; the issue must be published",
		]);
	});

	it("fails when the frontmatter does not pass the schema", () => {
		const { code, result } = run({
			issue: validIssue.replace('lede: "[ISSUE 015 LEDE]"\n', ""),
		});
		expect(code).toBe(2);
		expect(result.problems[0]).toMatch(/^frontmatter lede:/);
	});

	it("fails when items do not match the ledger (AC6)", () => {
		const { code, result } = run({
			issue: validIssue.replace(
				"https://example.com/[T1]",
				"https://example.com/[OTHER]",
			),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			'Item "[HEADLINE T1]" (Tooling, https://example.com/[OTHER]) is not in the ledger',
			'ledger item "[HEADLINE T1]" (Tooling, https://example.com/[T1]) is not in the file',
		]);
	});

	it("fails when an item sits in a different section than in the ledger", () => {
		const changed = ledger();
		const tooling = changed.items.find((entry) => entry.section === "Tooling");
		if (tooling === undefined) {
			throw new Error("fixture has no Tooling item");
		}
		tooling.section = "Agents";
		const { code, result } = run({ ledger: changed });
		expect(code).toBe(2);
		expect(result.problems).toHaveLength(2);
	});

	it("fails when TriedIt holds anything besides the marker (AC8)", () => {
		const { code, result } = run({
			issue: validIssue.replace(
				"[ALINA: tried it this week]\n</TriedIt>",
				"[ALINA: tried it this week]\n\n[SOMETHING THE AGENT WROTE]\n</TriedIt>",
			),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"TriedIt must contain only [ALINA: tried it this week]",
		]);
	});

	it("fails when TriedIt has a command prop (AC8)", () => {
		const { code, result } = run({
			issue: validIssue.replace("<TriedIt>", '<TriedIt command="[COMMAND]">'),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			'TriedIt must have no props, found "command="[COMMAND]""',
		]);
	});

	it("fails when TriedIt is missing (AC8)", () => {
		const { code, result } = run({
			issue: validIssue.replace(
				"<TriedIt>\n[ALINA: tried it this week]\n</TriedIt>\n",
				"",
			),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual(["TriedIt is missing"]);
	});

	it("fails when the intro does not end with the take marker", () => {
		const { code, result } = run({
			issue: validIssue.replace(" [ALINA: your take, optional]", ""),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"the intro must end with [ALINA: your take, optional]",
		]);
	});

	it("fails when the quote does not equal the ledger quote (AC7)", () => {
		const { code, result } = run({
			issue: validIssue.replace(
				'text: "[QUOTE TEXT]"',
				'text: "[QUOTE TEXT, EDITED]"',
			),
		});
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"frontmatter quote.text does not equal the ledger quote",
		]);
	});

	it("fails when the file has a quote but the ledger has none (AC7)", () => {
		const { code, result } = run({ ledger: { ...ledger(), quote: null } });
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"frontmatter has a quote but the ledger quote is null",
		]);
	});

	it("passes without a quote even when the ledger has one", () => {
		const { code } = run({
			issue: validIssue.replace(
				'quote:\n  text: "[QUOTE TEXT]"\n  author: "[QUOTE AUTHOR]"\n  role: "[QUOTE ROLE]"\n',
				"",
			),
		});
		expect(code).toBe(0);
	});

	it("lists extra markers with their lines", () => {
		const { code, result } = run({
			issue: validIssue.replace(
				'lede: "[ISSUE 015 LEDE]"',
				'lede: "[ALINA: lede]"',
			),
		});
		expect(code).toBe(0);
		expect(result.markers[0]).toEqual({ line: 5, marker: "[ALINA: lede]" });
		expect(result.markers).toHaveLength(3);
	});
});

describe("parseIssueBody", () => {
	it("assigns items to their enclosing section and finds the intro", () => {
		const parsed = parseIssueBody(
			[
				"[INTRO]",
				'<Section title="Models" color="sky">',
				'<Item headline="A" source={{ name: "N", url: "https://example.com/a" }}>',
				"x",
				"</Item>",
				"</Section>",
				'<Item headline="B" source={{ name: "N", url: "https://example.com/b" }}>',
				"</Item>",
			].join("\n"),
		);
		expect(parsed.intro).toBe("[INTRO]");
		expect(parsed.sections).toEqual([{ title: "Models", color: "sky" }]);
		expect(parsed.items).toEqual([
			{
				section: "Models",
				headline: "A",
				sourceName: "N",
				url: "https://example.com/a",
			},
			{
				section: null,
				headline: "B",
				sourceName: "N",
				url: "https://example.com/b",
			},
		]);
	});
});
