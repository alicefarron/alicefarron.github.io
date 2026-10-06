import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PixelSprite from "../../src/components/PixelSprite.astro";
import PixelStairs from "../../src/components/PixelStairs.astro";
import { toRects } from "../../src/lib/sprite";
import { cat, floppy } from "../../src/sprites";

let container: AstroContainer;

beforeAll(async () => {
	container = await AstroContainer.create();
});

describe("PixelSprite", () => {
	it("renders the cat as crisp inline SVG with one rect per run", async () => {
		const html = await container.renderToString(PixelSprite, {
			props: { sprite: cat },
		});
		expect(html).toContain('shape-rendering="crispEdges"');
		expect(html).toContain('viewBox="0 0 14 12"');
		expect(html).not.toMatch(/<div\b/);
		expect(html.match(/<rect\b/g)).toHaveLength(toRects(cat).length);
	});

	it("is hidden from assistive tech without a title", async () => {
		const html = await container.renderToString(PixelSprite, {
			props: { sprite: cat },
		});
		expect(html).toContain('aria-hidden="true"');
		expect(html).not.toContain('role="img"');
		expect(html).not.toContain("<title");
	});

	it("is an image with a title when titled", async () => {
		const html = await container.renderToString(PixelSprite, {
			props: { sprite: cat, title: "Cat" },
		});
		expect(html).toContain('role="img"');
		expect(html).toMatch(/<title[^>]*>Cat<\/title>/);
		expect(html).not.toContain("aria-hidden");
	});

	it("fills rects only from color token variables", async () => {
		const html = await container.renderToString(PixelSprite, {
			props: { sprite: floppy },
		});
		const fills = [...html.matchAll(/fill="([^"]+)"/g)].map(
			(match) => match[1],
		);
		expect(fills.length).toBeGreaterThan(0);
		for (const fill of fills) {
			expect(fill).toMatch(/^var\(--color-[a-z-]+\)$/);
		}
	});

	it("scales width and height by the pixel size", async () => {
		const html = await container.renderToString(PixelSprite, {
			props: { sprite: cat, scale: 4 },
		});
		expect(html).toContain('width="56"');
		expect(html).toContain('height="48"');
	});
});

describe("PixelStairs", () => {
	it("is decorative and crisp", async () => {
		const html = await container.renderToString(PixelStairs, {
			props: { from: "sky", to: "paper" },
		});
		expect(html).toContain('aria-hidden="true"');
		expect(html).toContain('shape-rendering="crispEdges"');
		expect(html).not.toMatch(/<div\b/);
	});

	it("uses the two section colors as tokens", async () => {
		const html = await container.renderToString(PixelStairs, {
			props: { from: "sky", to: "yellow" },
		});
		expect(html).toContain("var(--color-sky)");
		expect(html).toContain("var(--color-yellow)");
	});
});
