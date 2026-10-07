import { describe, expect, it } from "vitest";
import {
	assertIssueNumbers,
	assertNoAuthorMarkers,
	assertSinglePinned,
	type CheckedEntry,
} from "../../src/lib/collection-checks";

function note(filePath: string, pinned: boolean): CheckedEntry {
	return { id: filePath, filePath, data: { pinned } };
}

function issue(filePath: string, number: number): CheckedEntry {
	return { id: filePath, filePath, data: { number } };
}

describe("assertSinglePinned", () => {
	it("passes with no pinned notes", () => {
		expect(() =>
			assertSinglePinned([note("src/content/notes/a.mdx", false)]),
		).not.toThrow();
	});

	it("passes with one pinned note", () => {
		expect(() =>
			assertSinglePinned([
				note("src/content/notes/a.mdx", true),
				note("src/content/notes/b.mdx", false),
			]),
		).not.toThrow();
	});

	it("throws naming both files when two notes are pinned (AC7)", () => {
		expect(() =>
			assertSinglePinned([
				note("src/content/notes/a.mdx", true),
				note("src/content/notes/b.mdx", false),
				note("src/content/notes/c.mdx", true),
			]),
		).toThrow(
			"Only one note can be pinned. Pinned: src/content/notes/a.mdx, src/content/notes/c.mdx",
		);
	});

	it("falls back to the entry id when the file path is missing", () => {
		expect(() =>
			assertSinglePinned([
				{ id: "a", data: { pinned: true } },
				{ id: "b", data: { pinned: true } },
			]),
		).toThrow(/Pinned: a, b/);
	});
});

describe("assertIssueNumbers", () => {
	it("passes when numbers match file names", () => {
		expect(() =>
			assertIssueNumbers([
				issue("src/content/digest/011.mdx", 11),
				issue("src/content/digest/012.mdx", 12),
			]),
		).not.toThrow();
	});

	it("throws when 012.mdx has number 11", () => {
		expect(() =>
			assertIssueNumbers([issue("src/content/digest/012.mdx", 11)]),
		).toThrow(/src\/content\/digest\/012\.mdx.*number 11.*012/);
	});

	it("throws on duplicate numbers naming the files", () => {
		expect(() =>
			assertIssueNumbers([
				issue("src/content/digest/012.mdx", 12),
				issue("src/content/digest/12.mdx", 12),
			]),
		).toThrow(
			/Duplicate issue number 12: src\/content\/digest\/012\.mdx, src\/content\/digest\/12\.mdx/,
		);
	});

	it("throws when the file name is not a number", () => {
		expect(() =>
			assertIssueNumbers([issue("src/content/digest/first.mdx", 1)]),
		).toThrow(/first\.mdx/);
	});
});

function marked(
	filePath: string,
	body: string,
	data: Record<string, unknown> = {},
): CheckedEntry {
	return { id: filePath, filePath, body, data };
}

describe("assertNoAuthorMarkers", () => {
	const issue = marked(
		"src/content/digest/014.mdx",
		[
			"[INTRO] [ALINA: your take, optional]",
			"",
			"<TriedIt>",
			"[ALINA: tried it this week]",
			"</TriedIt>",
		].join("\n"),
		{ number: 14, lede: "[LEDE]", quote: { text: "[ALINA: quote]" } },
	);
	const note = marked("src/content/notes/a.mdx", "[TEXT]", {
		tldr: ["[ONE]", "[ALINA: point"],
	});

	it("throws one error listing file, line and marker for every hit (AC11)", () => {
		let message = "";
		try {
			assertNoAuthorMarkers([issue, note], true);
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		}
		expect(message).toBe(
			[
				"Unresolved author markers in published content (CONTENT_STRICT=true):",
				"  src/content/digest/014.mdx:frontmatter [ALINA: quote]",
				"  src/content/digest/014.mdx:1 [ALINA: your take, optional]",
				"  src/content/digest/014.mdx:4 [ALINA: tried it this week]",
				"  src/content/notes/a.mdx:frontmatter [ALINA: point",
				"Fill or remove each marker, or set draft: true.",
			].join("\n"),
		);
	});

	it("passes when not strict", () => {
		expect(() => assertNoAuthorMarkers([issue, note], false)).not.toThrow();
	});

	it("skips draft entries (AC12)", () => {
		const draft = marked("src/content/digest/015.mdx", "[ALINA: x]", {
			draft: true,
		});
		expect(() => assertNoAuthorMarkers([draft], true)).not.toThrow();
	});

	it("passes clean published entries", () => {
		expect(() =>
			assertNoAuthorMarkers(
				[marked("src/content/digest/001.mdx", "[TEXT]", { draft: false })],
				true,
			),
		).not.toThrow();
	});

	it("ignores dates and entries without a body", () => {
		expect(() =>
			assertNoAuthorMarkers(
				[{ id: "a", data: { date: new Date("2026-10-05") } }],
				true,
			),
		).not.toThrow();
	});
});
