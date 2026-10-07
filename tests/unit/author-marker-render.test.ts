import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/mdx/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import { markerNodes } from "../../src/lib/author-marker-plugin";
import { digestComponents } from "../../src/lib/mdx-components";
import Issue001 from "../fixtures/content-markers/digest/001.mdx";
import { colorUtilityProblems } from "./helpers/classes";

let html = "";

beforeAll(async () => {
	const renderers = await loadRenderers([getContainerRenderer()]);
	const container = await AstroContainer.create({ renderers });
	html = await container.renderToString(Issue001, {
		props: { components: digestComponents },
	});
});

const mark = (text: string) =>
	new RegExp(
		`<mark class="author-marker" data-author-marker(?:="")?>${text.replace(/[[\]]/g, "\\$&")}</mark>`,
	);

describe("author marker highlight", () => {
	it("wraps a marker in a paragraph (AC11)", () => {
		expect(html).toMatch(mark("[ALINA: your take, optional]"));
		expect(html).toMatch(/<p>[^<]*<mark class="author-marker"/);
	});

	it("wraps a marker inside TriedIt (AC11)", () => {
		const triedIt = html.slice(html.indexOf('id="tried-it"'));
		expect(triedIt).toMatch(mark("[ALINA: tried it this week]"));
	});

	it("leaves markers inside code blocks alone", () => {
		expect(html).toContain("[ALINA: inside code]");
		expect(html).not.toMatch(mark("[ALINA: inside code]"));
		expect(html.match(/<mark\b/g)).toHaveLength(2);
	});

	it("keeps code block titles from codeMetaTransformer", () => {
		expect(html).toMatch(/text-lime[^>]*>\[FILE\]</);
		expect(html).toContain('aria-label="Code: [FILE]"');
	});

	it("adds no non-token color classes", () => {
		expect(colorUtilityProblems(html)).toEqual([]);
	});
});

describe("markerNodes", () => {
	it("splits text into text nodes and mark elements", () => {
		expect(markerNodes("a [ALINA: b] c")).toEqual([
			{ type: "text", value: "a " },
			{
				type: "element",
				tagName: "mark",
				properties: { className: ["author-marker"], dataAuthorMarker: "" },
				children: [{ type: "text", value: "[ALINA: b]" }],
			},
			{ type: "text", value: " c" },
		]);
	});
});
