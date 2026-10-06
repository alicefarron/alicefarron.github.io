import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import {
	digestSchema,
	digestTopics,
	noteSchema,
	noteTags,
} from "../../src/lib/schemas";

const image = () => z.string().min(1);
const notes = noteSchema({ image });

const validIssue = {
	number: 12,
	title: "[ISSUE TITLE]",
	date: "2026-01-02",
	lede: "[LEDE]",
	topics: ["Agents", "Models"],
};

const validNote = {
	title: "[NOTE TITLE]",
	date: "2026-01-02",
	tag: "Architecture",
	dek: "[DEK]",
	tldr: ["[TLDR 1]"],
};

describe("digest schema", () => {
	it("accepts a valid issue and coerces the date", () => {
		const result = digestSchema.parse(validIssue);
		expect(result.date).toBeInstanceOf(Date);
		expect(result.draft).toBe(false);
		expect(result.quote).toBeUndefined();
	});

	it("accepts an optional quote with text, author and role", () => {
		const quote = { text: "[QUOTE]", author: "[AUTHOR]", role: "[ROLE]" };
		expect(digestSchema.parse({ ...validIssue, quote }).quote).toEqual(quote);
		expect(
			digestSchema.safeParse({ ...validIssue, quote: { text: "[QUOTE]" } })
				.success,
		).toBe(false);
	});

	it("lists exactly the spec topics", () => {
		expect([...digestTopics]).toEqual([
			"Models",
			"Tooling",
			"Agents",
			"Papers",
		]);
	});

	it("rejects topics outside the enum", () => {
		expect(
			digestSchema.safeParse({ ...validIssue, topics: ["Robotics"] }).success,
		).toBe(false);
	});

	it("requires at least one topic", () => {
		expect(digestSchema.safeParse({ ...validIssue, topics: [] }).success).toBe(
			false,
		);
	});

	it.each([0, -1, 1.5])("rejects number %s", (number) => {
		expect(digestSchema.safeParse({ ...validIssue, number }).success).toBe(
			false,
		);
	});

	it.each(["title", "lede", "date", "number", "topics"])(
		"requires %s",
		(key) => {
			const { [key as keyof typeof validIssue]: _omitted, ...rest } =
				validIssue;
			expect(digestSchema.safeParse(rest).success).toBe(false);
		},
	);
});

describe("note schema", () => {
	it("accepts a valid note with defaults", () => {
		const result = notes.parse(validNote);
		expect(result.draft).toBe(false);
		expect(result.pinned).toBe(false);
		expect(result.date).toBeInstanceOf(Date);
	});

	it("lists exactly the spec tags", () => {
		expect([...noteTags]).toEqual([
			"Architecture",
			"AI in production",
			"Agents",
			"Side projects",
			"Backend",
		]);
	});

	it("rejects a tag outside the enum", () => {
		expect(notes.safeParse({ ...validNote, tag: "Frontend" }).success).toBe(
			false,
		);
	});

	it.each([0, 6])("rejects a tldr of %s items", (count) => {
		const tldr = Array.from(
			{ length: count },
			(_, index) => `[TLDR ${index + 1}]`,
		);
		expect(notes.safeParse({ ...validNote, tldr }).success).toBe(false);
	});

	it.each([1, 5])("accepts a tldr of %s items", (count) => {
		const tldr = Array.from(
			{ length: count },
			(_, index) => `[TLDR ${index + 1}]`,
		);
		expect(notes.safeParse({ ...validNote, tldr }).success).toBe(true);
	});

	it("accepts a cover with alt text", () => {
		const cover = { src: "./cover.png", alt: "[COVER ALT]" };
		expect(notes.parse({ ...validNote, cover }).cover).toEqual(cover);
	});

	it("rejects a cover without alt (AC16)", () => {
		expect(
			notes.safeParse({ ...validNote, cover: { src: "./cover.png" } }).success,
		).toBe(false);
	});

	it.each(["", "   "])("rejects a cover with empty alt %j (AC16)", (alt) => {
		expect(
			notes.safeParse({ ...validNote, cover: { src: "./cover.png", alt } })
				.success,
		).toBe(false);
	});

	it("accepts optional updated and series", () => {
		const result = notes.parse({
			...validNote,
			updated: "2026-02-01",
			series: "sample-series",
		});
		expect(result.updated).toBeInstanceOf(Date);
		expect(result.series).toBe("sample-series");
	});

	it("rejects a series that is not a slug", () => {
		expect(
			notes.safeParse({ ...validNote, series: "Not A Slug" }).success,
		).toBe(false);
	});

	it("keeps explicit pinned and draft values", () => {
		const result = notes.parse({ ...validNote, pinned: true, draft: true });
		expect(result.pinned).toBe(true);
		expect(result.draft).toBe(true);
	});
});
