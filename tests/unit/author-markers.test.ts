import { describe, expect, it } from "vitest";
import {
	findMarkers,
	hasMarker,
	splitMarkers,
} from "../../src/lib/author-markers";

describe("findMarkers", () => {
	it("finds closed markers with their line numbers", () => {
		const text = [
			"[INTRO] [ALINA: your take, optional]",
			"",
			"[ALINA: tried it this week]",
		].join("\n");
		expect(findMarkers(text)).toEqual([
			{ marker: "[ALINA: your take, optional]", line: 1 },
			{ marker: "[ALINA: tried it this week]", line: 3 },
		]);
	});

	it("finds an unclosed marker up to the end of its line", () => {
		expect(findMarkers("[TEXT]\n[ALINA: broken marker\n[MORE]")).toEqual([
			{ marker: "[ALINA: broken marker", line: 2 },
		]);
	});

	it("finds two markers on one line", () => {
		expect(findMarkers("[ALINA: a] and [ALINA: b]")).toEqual([
			{ marker: "[ALINA: a]", line: 1 },
			{ marker: "[ALINA: b]", line: 1 },
		]);
	});

	it("ignores other square-bracket placeholders", () => {
		expect(findMarkers("[DATE] [ALINA] [alina: x]")).toEqual([]);
	});
});

describe("splitMarkers", () => {
	it("splits text into text and marker parts", () => {
		expect(splitMarkers("Before [ALINA: x] after")).toEqual([
			{ kind: "text", value: "Before " },
			{ kind: "marker", value: "[ALINA: x]" },
			{ kind: "text", value: " after" },
		]);
	});

	it("returns a single marker part for a marker alone", () => {
		expect(splitMarkers("[ALINA: tried it this week]")).toEqual([
			{ kind: "marker", value: "[ALINA: tried it this week]" },
		]);
	});

	it("returns one text part when there is no marker", () => {
		expect(splitMarkers("[TEXT]")).toEqual([{ kind: "text", value: "[TEXT]" }]);
	});

	it("is stable across repeated calls", () => {
		splitMarkers("[ALINA: a]");
		expect(splitMarkers("x [ALINA: b]")).toEqual([
			{ kind: "text", value: "x " },
			{ kind: "marker", value: "[ALINA: b]" },
		]);
	});
});

describe("hasMarker", () => {
	it("detects the marker prefix", () => {
		expect(hasMarker("a [ALINA: b")).toBe(true);
		expect(hasMarker("[DATE]")).toBe(false);
	});
});
