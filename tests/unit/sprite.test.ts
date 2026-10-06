import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	colorKey,
	parseSprite,
	type Sprite,
	spriteColorVar,
	toRects,
} from "../../src/lib/sprite";
import { sprites } from "../../src/sprites";

type SpecGrid = { width: number; height: number; rows: string[] };

function specGrids(): Map<string, SpecGrid> {
	const spec = readFileSync(
		join(process.cwd(), "specs/001-site-v1/spec.md"),
		"utf8",
	);
	const appendix = spec.slice(spec.indexOf("## Appendix: sprite grids"));
	const grids = new Map<string, SpecGrid>();
	for (const match of appendix.matchAll(
		/\n([a-z ]+) \((\d+) x (\d+)\)\n```\n([\s\S]*?)```/g,
	)) {
		const [, name, width, height, body] = match;
		if (
			name === undefined ||
			width === undefined ||
			height === undefined ||
			body === undefined
		) {
			continue;
		}
		grids.set(name.replace(/ /g, "-"), {
			width: Number(width),
			height: Number(height),
			rows: body.replace(/\n$/, "").split("\n"),
		});
	}
	return grids;
}

function sprite(rows: string[]): Sprite {
	return {
		name: "test",
		width: rows[0]?.length ?? 0,
		height: rows.length,
		rows,
	};
}

describe("sprite grids", () => {
	const grids = specGrids();

	it("covers the seven spec sprites", () => {
		expect([...grids.keys()].sort()).toEqual(
			[
				"cat",
				"clock",
				"document",
				"floppy",
				"folder",
				"radar",
				"speech-bubble",
			].sort(),
		);
		expect(Object.keys(sprites).sort()).toEqual([...grids.keys()].sort());
	});

	it.each([...specGrids().keys()])(
		"%s matches the spec appendix exactly",
		(name) => {
			const expected = grids.get(name);
			const actual = sprites[name];
			expect(actual).toBeDefined();
			expect(actual?.width).toBe(expected?.width);
			expect(actual?.height).toBe(expected?.height);
			expect(actual?.rows).toEqual(expected?.rows);
			expect(() => parseSprite(actual as Sprite)).not.toThrow();
		},
	);
});

describe("parseSprite", () => {
	it("rejects rows of the wrong width", () => {
		expect(() =>
			parseSprite({ name: "bad", width: 3, height: 2, rows: ["KKK", "KK"] }),
		).toThrow(/row 2/);
	});

	it("rejects the wrong row count", () => {
		expect(() =>
			parseSprite({ name: "bad", width: 2, height: 3, rows: ["KK", "KK"] }),
		).toThrow(/height/);
	});

	it("rejects characters outside the key", () => {
		expect(() =>
			parseSprite({ name: "bad", width: 2, height: 1, rows: ["KX"] }),
		).toThrow(/X/);
	});
});

describe("toRects", () => {
	it("merges horizontal runs: KKWW..K yields three rects", () => {
		const rects = toRects(sprite(["KKWW..K"]));
		expect(rects).toEqual([
			{ x: 0, y: 0, w: 2, h: 1, color: "K" },
			{ x: 2, y: 0, w: 2, h: 1, color: "W" },
			{ x: 6, y: 0, w: 1, h: 1, color: "K" },
		]);
	});

	it("does not merge across rows", () => {
		const rects = toRects(sprite(["KK", "KK"]));
		expect(rects).toHaveLength(2);
		expect(rects.map((rect) => rect.y)).toEqual([0, 1]);
	});

	it("covers every opaque pixel exactly once", () => {
		for (const item of Object.values(sprites)) {
			const rects = toRects(item);
			const opaque = item.rows.join("").replace(/\./g, "").length;
			expect(rects.reduce((sum, rect) => sum + rect.w, 0)).toBe(opaque);
		}
	});

	it("maps every key to a color token variable", () => {
		expect(Object.keys(colorKey).sort()).toEqual([
			"B",
			"G",
			"K",
			"P",
			"W",
			"Y",
		]);
		expect(spriteColorVar("K")).toBe("var(--color-ink)");
		expect(spriteColorVar("B")).toBe("var(--color-sprite-blue)");
		expect(spriteColorVar("G")).toBe("var(--color-sprite-green)");
	});
});
