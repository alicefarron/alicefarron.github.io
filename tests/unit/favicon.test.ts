import { Resvg } from "@resvg/resvg-js";
import { describe, expect, it } from "vitest";
import {
	faviconPng,
	faviconSprite,
	faviconSvg,
	favicons,
} from "../../src/lib/favicon";
import { toRects } from "../../src/lib/sprite";
import { cat } from "../../src/sprites";

function pixelAt(x: number, y: number): string {
	const rendered = new Resvg(faviconSvg(favicons.png.canvas), {
		fitTo: { mode: "width", value: favicons.png.size },
		shapeRendering: 1,
	}).render();
	const offset = (y * rendered.width + x) * 4;
	return `#${[...rendered.pixels.subarray(offset, offset + 3)]
		.map((value) => value.toString(16).padStart(2, "0"))
		.join("")}`;
}

describe("favicon (R1)", () => {
	it("uses the cat sprite grid in ink and white only", () => {
		const sprite = faviconSprite();
		expect(sprite.width).toBe(cat.width);
		expect(sprite.height).toBe(cat.height);
		const colors = new Set(toRects(sprite).map((rect) => rect.color));
		expect([...colors].sort()).toEqual(["K", "W"]);
		sprite.rows.forEach((row, y) => {
			for (let x = 0; x < row.length; x += 1) {
				expect(row[x] === "K", `${x},${y}`).toBe(cat.rows[y]?.[x] === "K");
			}
		});
	});

	it("draws merged rects on a yellow square with token colors", () => {
		const svg = faviconSvg();
		expect(svg).toMatch(/viewBox="0 0 16 16"/);
		expect(svg).toContain('shape-rendering="crispEdges"');
		expect(svg).toMatch(/<rect width="16" height="16" fill="#ffe45c"\/>/);
		const fills = new Set(
			[...svg.matchAll(/fill="([^"]+)"/g)].map((match) => match[1]),
		);
		expect([...fills].sort()).toEqual(["#111111", "#ffe45c", "#ffffff"]);
		expect(svg.match(/<rect /g)).toHaveLength(
			toRects(faviconSprite()).length + 1,
		);
	});

	it("centers the cat with whole pixels on both canvases", () => {
		expect(faviconSvg(16)).toContain('<rect x="3" y="2" width="1" height="1"');
		expect(faviconSvg(18)).toContain('<rect x="4" y="3" width="1" height="1"');
	});

	it("renders square PNGs at 32 and 180 px", () => {
		for (const icon of [favicons.png, favicons.appleTouch]) {
			const png = faviconPng(icon);
			const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
			expect(view.getUint32(16)).toBe(icon.size);
			expect(view.getUint32(20)).toBe(icon.size);
		}
	});

	it("keeps the 32 px corners yellow and the outline ink", () => {
		expect(pixelAt(0, 0)).toBe("#ffe45c");
		expect(pixelAt(31, 31)).toBe("#ffe45c");
		expect(pixelAt(6, 4)).toBe("#111111");
		expect(pixelAt(6, 6)).toBe("#ffffff");
	});
});
