import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Ledger, LedgerItem } from "../../scripts/digest/ledger.ts";
import type { ParsedSources } from "../../scripts/digest/sources.ts";
import { type LedgerCheck, runDigest } from "../../scripts/digest.ts";

const basic = "tests/fixtures/digest-runs/basic";
const fixture = "tests/fixtures/digest-runs/ledger-015.json";
const sources: ParsedSources = {
	groups: [
		{
			topic: "Models",
			sources: [
				{
					topic: "Models",
					name: "[SOURCE LIST 1]",
					url: "https://example.com/[SOURCE LIST 1]",
					note: "[NOTE]",
				},
				{
					topic: "Models",
					name: "[SOURCE LIST 2]",
					url: "https://example.com/[SOURCE LIST 2]",
					note: "[NOTE]",
				},
			],
		},
	],
	problems: [],
};
const dirs: string[] = [];

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

function validLedger(): Ledger {
	return JSON.parse(readFileSync(fixture, "utf8")) as Ledger;
}

function item(overrides: Partial<LedgerItem>): LedgerItem {
	const url = overrides.url ?? "https://example.com/[EXTRA]";
	return {
		section: "Models",
		headline: "[HEADLINE]",
		sourceName: "[SOURCE]",
		url,
		publishedDate: "2026-10-07",
		dateEvidence: "[DATE]",
		takeaway: "[TAKEAWAY]",
		...overrides,
	};
}

function withOpened(ledger: Ledger, ...urls: string[]): Ledger {
	return { ...ledger, opened: [...ledger.opened, ...urls] };
}

function check(ledger: unknown): { code: number; result: LedgerCheck } {
	const dir = mkdtempSync(join(tmpdir(), "digest-ledger-"));
	dirs.push(dir);
	const path = join(dir, "015.json");
	writeFileSync(path, JSON.stringify(ledger));
	const output = runDigest(["check-ledger", path, "--content-dir", basic], {
		readSources: () => sources,
	});
	return {
		code: output.code,
		result: JSON.parse(output.stdout) as LedgerCheck,
	};
}

describe("check-ledger", () => {
	it("accepts a valid ledger with exit 0", () => {
		const { code, result } = check(validLedger());
		expect(result.problems).toEqual([]);
		expect(result.status).toBe("ok");
		expect(result.validItems).toBe(5);
		expect(code).toBe(0);
	});

	it("rejects an item dated 2026-10-05 for the 2026-10-06 to 2026-10-12 window (AC3)", () => {
		const ledger = validLedger();
		const first = ledger.items[0];
		if (first === undefined) {
			throw new Error("fixture has no items");
		}
		first.publishedDate = "2026-10-05";
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"item 1 (https://example.com/[M1]): published 2026-10-05, outside the window 2026-10-06 to 2026-10-12",
		]);
	});

	it("accepts an item dated 2026-10-12 (AC3)", () => {
		const ledger = validLedger();
		expect(ledger.items[1]?.publishedDate).toBe("2026-10-12");
		expect(check(ledger).code).toBe(0);
	});

	it("rejects a malformed date", () => {
		const ledger = validLedger();
		ledger.items.push(item({ publishedDate: "Oct 7" }));
		const { code, result } = check(
			withOpened(ledger, "https://example.com/[EXTRA]"),
		);
		expect(code).toBe(2);
		expect(result.problems[0]).toContain('publishedDate "Oct 7"');
	});

	it.each([
		"https://example.com/[A]",
		"https://example.com/[A]?utm_source=newsletter",
		"https://www.example.com/[A]",
		"https://example.com/[A]/",
		"https://example.com/[B]",
	])("rejects %s, already cited in 014 (AC5)", (url) => {
		const ledger = withOpened(validLedger(), url);
		ledger.items.push(item({ section: "Tooling", url }));
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			`item 6 (${url}): already cited in issue 14`,
		]);
	});

	it("rejects a URL repeated inside the ledger", () => {
		const ledger = validLedger();
		ledger.items.push(
			item({ section: "Tooling", url: "https://example.com/[M1]#more" }),
		);
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"item 6 (https://example.com/[M1]#more): same URL as item 1",
		]);
	});

	it("rejects an item whose URL was not opened (R4)", () => {
		const ledger = validLedger();
		ledger.items.push(item({ url: "https://example.com/[UNOPENED]" }));
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"item 6 (https://example.com/[UNOPENED]): URL is not in opened",
		]);
	});

	it("rejects 5 items in one section", () => {
		const ledger = validLedger();
		const urls = [1, 2, 3].map((n) => `https://example.com/[EXTRA ${n}]`);
		for (const url of urls) {
			ledger.items.push(item({ url }));
		}
		const { code, result } = check(withOpened(ledger, ...urls));
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"section Models has 5 items, at most 4 allowed",
		]);
	});

	it("rejects more than 10 items", () => {
		const ledger = validLedger();
		const extra = [
			"Tooling",
			"Tooling",
			"Tooling",
			"Agents",
			"Agents",
			"Agents",
		];
		const urls = extra.map((_, n) => `https://example.com/[EXTRA ${n}]`);
		extra.forEach((section, n) => {
			ledger.items.push(item({ section, url: urls[n] }));
		});
		const { code, result } = check(withOpened(ledger, ...urls));
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"ledger has 11 items, at most 10 allowed",
		]);
	});

	it("rejects a section that is not a topic", () => {
		const ledger = withOpened(validLedger(), "https://example.com/[EXTRA]");
		ledger.items.push(item({ section: "Hardware" }));
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			'item 6 (https://example.com/[EXTRA]): section "Hardware" is not one of Models, Tooling, Agents, Papers',
		]);
	});

	it("rejects a sources.md URL missing from sourcesChecked (AC2)", () => {
		const ledger = validLedger();
		ledger.sourcesChecked = ledger.sourcesChecked.slice(0, 1);
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"sources.md source https://example.com/[SOURCE LIST 2] is missing from sourcesChecked",
		]);
	});

	it.each([
		["author", "quote: author is empty"],
		["role", "quote: role is empty"],
		["text", "quote: text is empty"],
	] as const)("rejects a quote without %s (AC7)", (field, problem) => {
		const ledger = validLedger();
		if (ledger.quote === null) {
			throw new Error("fixture has no quote");
		}
		ledger.quote[field] = "";
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([problem]);
	});

	it("rejects a quote from a page that was not opened (AC7)", () => {
		const ledger = validLedger();
		if (ledger.quote === null) {
			throw new Error("fixture has no quote");
		}
		ledger.quote.url = "https://example.com/[ELSEWHERE]";
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"quote: URL https://example.com/[ELSEWHERE] is not in opened",
		]);
	});

	it("accepts a null quote", () => {
		expect(check({ ...validLedger(), quote: null }).code).toBe(0);
	});

	it("exits 3 with 3 valid items (AC10)", () => {
		const ledger = validLedger();
		ledger.items = ledger.items.slice(0, 3);
		const { code, result } = check(ledger);
		expect(code).toBe(3);
		expect(result.status).toBe("thin");
		expect(result.validItems).toBe(3);
	});

	it("exits 3 when invalid items leave fewer than 4 valid ones (AC10)", () => {
		const ledger = validLedger();
		for (const entry of ledger.items.slice(0, 2)) {
			entry.publishedDate = "2026-10-01";
		}
		const { code, result } = check(ledger);
		expect(code).toBe(3);
		expect(result.validItems).toBe(3);
	});

	it("rejects a ledger whose number or window does not match the context", () => {
		const ledger = {
			...validLedger(),
			number: 16,
			window: { start: "2026-10-05", end: "2026-10-12" },
		};
		const { code, result } = check(ledger);
		expect(code).toBe(2);
		expect(result.problems).toEqual([
			"ledger number 16 does not match the next issue number 15",
			"ledger window 2026-10-05 to 2026-10-12 does not match 2026-10-06 to 2026-10-12",
		]);
	});

	it("reports a malformed ledger", () => {
		const { code, result } = check({ number: 15 });
		expect(code).toBe(2);
		expect(result.problems.length).toBeGreaterThan(0);
	});

	it("exits 1 when the ledger file cannot be read", () => {
		const output = runDigest(["check-ledger", "/nonexistent/015.json"], {
			readSources: () => sources,
		});
		expect(output.code).toBe(1);
	});
});
