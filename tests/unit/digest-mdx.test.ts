import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/mdx/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import Item from "../../src/components/mdx/Item.astro";
import Section from "../../src/components/mdx/Section.astro";
import TriedIt from "../../src/components/mdx/TriedIt.astro";
import { issueContents } from "../../src/lib/digest";
import { digestComponents } from "../../src/lib/mdx-components";
import Issue012 from "../fixtures/content/digest/012.mdx";
import { colorUtilityProblems } from "./helpers/classes";

let container: AstroContainer;

beforeAll(async () => {
	const renderers = await loadRenderers([getContainerRenderer()]);
	container = await AstroContainer.create({ renderers });
});

describe("Section", () => {
	it("renders an h2 with a slug id inside a labelled section", async () => {
		const html = await container.renderToString(Section, {
			props: { title: "Models and tools", color: "yellow" },
			slots: { default: "<p>[BODY]</p>" },
		});
		expect(html).toMatch(
			/<h2[^>]*id="models-and-tools"[^>]*>Models and tools<\/h2>/,
		);
		expect(html).toMatch(/<section[^>]*aria-labelledby="models-and-tools"/);
		expect(html).toContain("bg-yellow");
		expect(html).toContain("[BODY]");
		expect(colorUtilityProblems(html)).toEqual([]);
	});
});

describe("Item", () => {
	it("renders headline, source link and highlighted takeaway from children", async () => {
		const html = await container.renderToString(Item, {
			props: {
				headline: "[HEADLINE]",
				source: { name: "[SOURCE]", url: "https://example.com/[SOURCE]" },
			},
			slots: { default: "[TAKEAWAY]" },
		});
		expect(html).toMatch(/<h3[^>]*>\[HEADLINE\]<\/h3>/);
		expect(html).toMatch(
			/<a[^>]*href="https:\/\/example.com\/\[SOURCE\]"[^>]*>\[SOURCE\]<\/a>/,
		);
		expect(html).toMatch(/data-takeaway[^>]*>[\s\S]*\[TAKEAWAY\]/);
		expect(html).toMatch(/class="[^"]*bg-yellow[^"]*"[^>]*data-takeaway/);
		expect(colorUtilityProblems(html)).toEqual([]);
	});

	it("accepts the takeaway as a prop", async () => {
		const html = await container.renderToString(Item, {
			props: {
				headline: "[HEADLINE]",
				source: { name: "[SOURCE]", url: "https://example.com/" },
				takeaway: "[PROP TAKEAWAY]",
			},
		});
		expect(html).toMatch(/data-takeaway[^>]*>[\s\S]*\[PROP TAKEAWAY\]/);
	});
});

describe("TriedIt", () => {
	it("includes a Terminal for a command prop", async () => {
		const html = await container.renderToString(TriedIt, {
			props: { command: "[COMMAND]" },
			slots: { default: "<p>[TEXT]</p>" },
		});
		expect(html).toMatch(/<h2[^>]*id="tried-it"[^>]*>Tried it<\/h2>/);
		expect(html).toContain("[TEXT]");
		expect(html).toContain("bg-ink");
		expect(html).toContain("$ [COMMAND]");
	});
});

describe("issue 012 through the digest component map", () => {
	it("renders three sections with h2 ids that match the contents list", async () => {
		const html = await container.renderToString(Issue012, {
			props: { components: digestComponents },
		});
		const ids = [...html.matchAll(/<h2[^>]*id="([^"]+)"/g)].map((m) => m[1]);
		expect(ids).toEqual(["section-1", "section-2", "section-3", "tried-it"]);
		expect(html.match(/<article\b/g)).toHaveLength(6);
	});
});

describe("issueContents", () => {
	it("lists Section titles and Tried it in order", () => {
		const body = [
			'<Section title="One" color="sky">',
			"</Section>",
			"<Section title='Two'>",
			"<TriedIt>",
		].join("\n");
		expect(issueContents(body)).toEqual([
			{ id: "one", title: "One" },
			{ id: "two", title: "Two" },
			{ id: "tried-it", title: "Tried it" },
		]);
	});

	it("omits Tried it when absent", () => {
		expect(issueContents('<Section title="A">')).toEqual([
			{ id: "a", title: "A" },
		]);
	});
});
