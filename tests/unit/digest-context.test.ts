import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ParsedSources } from "../../scripts/digest/sources.ts";
import { extractUrls, normalizeUrl } from "../../scripts/digest/urls.ts";
import {
	coverageWindow,
	dateInTimeZone,
	inWindow,
	isIsoDate,
} from "../../scripts/digest/window.ts";
import {
	buildContext,
	type DigestContext,
	runDigest,
} from "../../scripts/digest.ts";

const basic = "tests/fixtures/digest-runs/basic";
const withDraft = "tests/fixtures/digest-runs/with-draft";
const sources: ParsedSources = { groups: [], problems: [] };
const deps = { readSources: () => sources };
const dirs: string[] = [];

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

function context(args: string[], now?: Date): DigestContext {
	const result = runDigest(["context", ...args], {
		...deps,
		...(now === undefined ? {} : { now: () => now }),
	});
	expect(result.code, result.stderr).toBe(0);
	return JSON.parse(result.stdout) as DigestContext;
}

describe("context", () => {
	it("windows a 2026-10-12 run after an issue dated 2026-10-05 as 2026-10-06 to 2026-10-12 (AC3)", () => {
		const result = context(["--content-dir", basic, "--date", "2026-10-12"]);
		expect(result.window).toEqual({ start: "2026-10-06", end: "2026-10-12" });
		expect(result.previous).toEqual({
			number: 14,
			date: "2026-10-05",
			file: `${basic}/digest/014.mdx`,
		});
		expect(result.number).toBe(15);
		expect(result.file).toBe(`${basic}/digest/015.mdx`);
		expect(result.branch).toBe("digest/015");
		expect(result.runDate).toBe("2026-10-12");
	});

	it("starts at issue 1 with a 7-day window when there are no issues", () => {
		const empty = mkdtempSync(join(tmpdir(), "digest-empty-"));
		dirs.push(empty);
		const result = context(["--content-dir", empty, "--date", "2026-10-12"]);
		expect(result.number).toBe(1);
		expect(result.previous).toBeNull();
		expect(result.window).toEqual({ start: "2026-10-06", end: "2026-10-12" });
		expect(result.file.endsWith("/digest/001.mdx")).toBe(true);
		expect(result.branch).toBe("digest/001");
	});

	it("names src/content/digest/001.mdx for the default content folder", () => {
		const result = buildContext([], "2026-10-12", "src/content", sources);
		expect(result.file).toBe("src/content/digest/001.mdx");
		expect(result.number).toBe(1);
	});

	it("counts a draft 015 for the next number but skips it as previous", () => {
		const result = context([
			"--content-dir",
			withDraft,
			"--date",
			"2026-10-19",
		]);
		expect(result.number).toBe(16);
		expect(result.previous?.number).toBe(14);
		expect(result.window).toEqual({ start: "2026-10-06", end: "2026-10-19" });
	});

	it("lists every URL of earlier issues with normalized forms and headlines (AC5)", () => {
		const result = context(["--content-dir", basic, "--date", "2026-10-12"]);
		expect(result.cited.urls).toEqual([
			{
				issue: 13,
				url: "https://example.com/[D]",
				normalized: "https://example.com/[D]",
			},
			{
				issue: 14,
				url: "https://example.com/[C]",
				normalized: "https://example.com/[C]",
			},
			{
				issue: 14,
				url: "https://example.com/[A]",
				normalized: "https://example.com/[A]",
			},
			{
				issue: 14,
				url: "https://www.example.com/[B]/",
				normalized: "https://example.com/[B]",
			},
		]);
		expect(result.cited.headlines).toEqual([
			{ issue: 13, headline: "[HEADLINE 13.1]" },
			{ issue: 14, headline: "[HEADLINE 14.1]" },
			{ issue: 14, headline: "[HEADLINE 14.2]" },
		]);
	});

	it("computes the default run date in Europe/Amsterdam", () => {
		const result = context(
			["--content-dir", basic],
			new Date("2026-10-11T23:30:00Z"),
		);
		expect(result.runDate).toBe("2026-10-12");
	});

	it("exits 1 when the run date is before the previous issue", () => {
		const result = runDigest(
			["context", "--content-dir", basic, "--date", "2026-10-04"],
			deps,
		);
		expect(result.code).toBe(1);
		expect(result.stderr).toContain("2026-10-05");
	});

	it("exits 1 on a malformed date", () => {
		const result = runDigest(
			["context", "--content-dir", basic, "--date", "2026-13-01"],
			deps,
		);
		expect(result.code).toBe(1);
	});

	it("includes the parsed sources", () => {
		const result = runDigest(
			["context", "--content-dir", basic, "--date", "2026-10-12"],
			{},
		);
		const parsed = JSON.parse(result.stdout) as DigestContext;
		expect(parsed.sources.groups.map((group) => group.topic)).toEqual([
			"Models",
			"Tooling",
			"Agents",
			"Papers",
		]);
	});

	it("prints valid JSON from the command line", () => {
		const result = spawnSync(
			process.execPath,
			[
				"scripts/digest.ts",
				"context",
				"--content-dir",
				basic,
				"--date",
				"2026-10-12",
			],
			{ encoding: "utf8" },
		);
		expect(result.status, result.stderr).toBe(0);
		expect(() => JSON.parse(result.stdout)).not.toThrow();
	});
});

describe("window helpers", () => {
	it("checks ISO dates", () => {
		expect(isIsoDate("2026-10-12")).toBe(true);
		expect(isIsoDate("2026-02-30")).toBe(false);
		expect(isIsoDate("12-10-2026")).toBe(false);
	});

	it("handles month boundaries", () => {
		expect(coverageWindow("2026-03-03", null)).toEqual({
			start: "2026-02-25",
			end: "2026-03-03",
		});
		expect(coverageWindow("2026-11-02", "2026-10-31")).toEqual({
			start: "2026-11-01",
			end: "2026-11-02",
		});
	});

	it("tests window membership inclusively", () => {
		const window = { start: "2026-10-06", end: "2026-10-12" };
		expect(inWindow("2026-10-05", window)).toBe(false);
		expect(inWindow("2026-10-06", window)).toBe(true);
		expect(inWindow("2026-10-12", window)).toBe(true);
		expect(inWindow("2026-10-13", window)).toBe(false);
	});

	it("formats a summer date in Amsterdam", () => {
		expect(dateInTimeZone(new Date("2026-06-30T22:30:00Z"))).toBe("2026-07-01");
		expect(dateInTimeZone(new Date("2026-06-30T21:30:00Z"))).toBe("2026-06-30");
	});
});

describe("normalizeUrl", () => {
	it("drops www, tracking parameters, fragments and a trailing slash", () => {
		expect(
			normalizeUrl(
				"HTTPS://WWW.Example.com/Post/?utm_source=x&b=2&ref=hn&a=1#top",
			),
		).toBe("https://example.com/Post?a=1&b=2");
	});

	it("keeps the root slash", () => {
		expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
		expect(normalizeUrl("https://example.com")).toBe("https://example.com/");
	});

	it("returns non-URLs trimmed", () => {
		expect(normalizeUrl(" not a url ")).toBe("not a url");
	});
});

describe("extractUrls", () => {
	it("finds URLs in attributes and Markdown links", () => {
		expect(
			extractUrls(
				'url: "https://example.com/[A]" and [x](https://example.com/b). Also https://example.com/c.',
			),
		).toEqual([
			"https://example.com/[A]",
			"https://example.com/b",
			"https://example.com/c",
		]);
	});
});
