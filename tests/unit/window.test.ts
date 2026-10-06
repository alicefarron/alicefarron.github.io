import { readFileSync } from "node:fs";
import { join } from "node:path";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import Window from "../../src/components/Window.astro";

const tokensCss = readFileSync(
	join(process.cwd(), "src/styles/tokens.css"),
	"utf8",
);
const colorTokens = new Set(
	[...tokensCss.matchAll(/--color-([a-z-]+):/g)].map((match) => match[1]),
);
const shadowTokens = new Set(
	[...tokensCss.matchAll(/--shadow-([a-z-]+):/g)].map((match) => match[1]),
);

let container: AstroContainer;

beforeAll(async () => {
	container = await AstroContainer.create();
});

function render(props: Record<string, unknown>, body = "<p>[BODY]</p>") {
	return container.renderToString(Window, { props, slots: { default: body } });
}

function classes(html: string): string[] {
	return [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
		(match[1] ?? "").split(/\s+/).filter(Boolean),
	);
}

const nonColorSuffixes = new Set([
	"window",
	"b-window",
	"t-window",
	"titlebar-stripes",
	"dots-sky",
	"dots-lavender",
	"center",
	"left",
	"right",
	"label",
	"label-sm",
	"label-lg",
	"ui",
	"ui-sm",
	"ui-lg",
	"body",
	"h1",
	"h2",
	"title",
	"none",
]);

function colorUtilityProblems(html: string): string[] {
	return classes(html).flatMap((name) => {
		const color =
			/^(?:[a-z@-]+:)*(?:bg|text|border|shadow|outline|fill|stroke|decoration)-([a-z-]+)$/.exec(
				name,
			);
		if (color === null) {
			return [];
		}
		const value = color[1] ?? "";
		if (nonColorSuffixes.has(value)) {
			return [];
		}
		if (/^hard-(sm|md|lg)$/.test(value)) {
			return shadowTokens.has(value) ? [] : [name];
		}
		return colorTokens.has(value) ? [] : [name];
	});
}

describe("Window", () => {
	it("renders the title as an h2 inside a section when as is section", async () => {
		const html = await render({ title: "this_week_in_ai.md", as: "section" });
		expect(html).toMatch(/^<section\b/);
		expect(html).toMatch(/<h2[^>]*>[\s\S]*this_week_in_ai\.md[\s\S]*<\/h2>/);
		expect(html).toMatch(
			/<section[^>]*aria-labelledby="([^"]+)"[\s\S]*<h2[^>]*id="\1"/,
		);
	});

	it("supports other heading levels for sections", async () => {
		const html = await render({
			title: "pinned.md",
			as: "section",
			headingLevel: 3,
		});
		expect(html).toMatch(/<h3[^>]*>[\s\S]*pinned\.md/);
	});

	it("renders a plain title without a heading when not a section", async () => {
		const html = await render({ title: "meow.app" });
		expect(html).toMatch(/^<div\b/);
		expect(html).not.toMatch(/<h[1-6]\b/);
		expect(html).toContain("meow.app");
	});

	it("hides the close box from assistive tech and does not make it a control", async () => {
		const html = await render({ title: "about.txt" });
		expect(html).toMatch(
			/<span[^>]*data-close-box[^>]*aria-hidden="true"|<span[^>]*aria-hidden="true"[^>]*data-close-box/,
		);
		expect(html).not.toContain("<button");
	});

	it("renders the slot inside a container body", async () => {
		const html = await render({ title: "x" }, "<p>[BODY]</p>");
		expect(html).toContain("<p>[BODY]</p>");
		expect(classes(html)).toContain("@container");
	});

	it.each([
		["white", "bg-white"],
		["sky", "bg-sky"],
		["yellow", "bg-yellow"],
		["pink", "bg-pink"],
		["lavender", "bg-lavender"],
		["alert", "bg-white"],
	])("variant %s maps to %s", async (variant, expected) => {
		const html = await render({ title: "x", variant });
		expect(classes(html)).toContain(expected);
		expect(colorUtilityProblems(html)).toEqual([]);
	});

	it.each([
		["sm", "shadow-hard-sm"],
		["md", "shadow-hard-md"],
		["lg", "shadow-hard-lg"],
	])("shadow %s maps to %s", async (shadow, expected) => {
		const html = await render({ title: "x", shadow });
		expect(classes(html)).toContain(expected);
	});

	it.each([
		["ink", "shadow-ink"],
		["pink", "shadow-pink"],
	])("shadowColor %s maps to %s", async (shadowColor, expected) => {
		const html = await render({ title: "x", shadowColor });
		expect(classes(html)).toContain(expected);
		expect(colorUtilityProblems(html)).toEqual([]);
	});

	it("uses only token classes and no inline styles", async () => {
		const html = await render({
			title: "x",
			variant: "pink",
			shadow: "lg",
			shadowColor: "pink",
			as: "section",
		});
		expect(colorUtilityProblems(html)).toEqual([]);
		expect(html).not.toMatch(/style="/);
		expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
		expect(html).not.toMatch(/-\[[^\]]*\]/);
	});
});
