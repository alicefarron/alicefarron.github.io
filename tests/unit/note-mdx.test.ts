import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/mdx/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import CodeBlock from "../../src/components/mdx/CodeBlock.astro";
import Figure from "../../src/components/mdx/Figure.astro";
import PullQuote from "../../src/components/mdx/PullQuote.astro";
import TableWrap from "../../src/components/mdx/TableWrap.astro";
import { parseFenceTitle } from "../../src/lib/code-meta";
import { digestComponents, noteComponents } from "../../src/lib/mdx-components";
import Issue012 from "../fixtures/content/digest/012.mdx";
import CodeNote from "../fixtures/content/notes/sample-note-code.mdx";
import TableNote from "../fixtures/content/notes/sample-note-table.mdx";
import { colorUtilityProblems } from "./helpers/classes";

let container: AstroContainer;

beforeAll(async () => {
	const renderers = await loadRenderers([getContainerRenderer()]);
	container = await AstroContainer.create({ renderers });
});

describe("parseFenceTitle", () => {
	it.each([
		['title="example.ts"', "example.ts"],
		["title='a b.ts'", "a b.ts"],
		["{1,3} title=file.sh", "file.sh"],
		["", undefined],
		[undefined, undefined],
		['title=""', undefined],
	])("reads %s", (meta, expected) => {
		expect(parseFenceTitle(meta)).toBe(expected);
	});
});

describe("CodeBlock", () => {
	it("shows the file name label and a focusable scroll region", async () => {
		const html = await container.renderToString(CodeBlock, {
			props: { "data-title": "example.ts", "data-language": "ts" },
			slots: { default: "<code>x</code>" },
		});
		expect(html).toContain("example.ts");
		expect(html).toMatch(/text-lime[^>]*>example\.ts</);
		expect(html).toMatch(
			/<div[^>]*role="region"[^>]*tabindex="0"[^>]*aria-label="Code: example\.ts"[^>]*class="[^"]*overflow-x-auto/,
		);
		expect(colorUtilityProblems(html)).toEqual([]);
	});

	it("falls back to the language when there is no title", async () => {
		const html = await container.renderToString(CodeBlock, {
			props: { "data-language": "sh" },
			slots: { default: "<code>x</code>" },
		});
		expect(html).toMatch(/text-lime[^>]*>sh</);
	});

	it("receives the fence title from the MDX pipeline (AC8)", async () => {
		const html = await container.renderToString(CodeNote, {
			props: { components: noteComponents },
		});
		expect(html).toMatch(/text-lime[^>]*>example\.ts</);
		expect(html).toMatch(/role="region"[^>]*tabindex="0"/);
		expect(html).toContain("bg-ink");
		expect(html).not.toMatch(/style="/);
	});

	it("renders fenced code in a digest TriedIt as a Terminal", async () => {
		const html = await container.renderToString(Issue012, {
			props: { components: digestComponents },
		});
		const tried = html.slice(html.indexOf('id="tried-it"'));
		expect(tried).toContain("bg-ink");
		expect(tried).toMatch(/text-lime[^>]*>\[FILE\]</);
		expect(tried).toContain("[COMMAND]");
	});
});

describe("TableWrap", () => {
	it("wraps tables in a focusable scroll region", async () => {
		const html = await container.renderToString(TableNote, {
			props: { components: noteComponents },
		});
		expect(html).toMatch(
			/<div[^>]*role="region"[^>]*tabindex="0"[^>]*class="[^"]*overflow-x-auto[^"]*"[^>]*>\s*<table/,
		);
	});

	it("renders directly", async () => {
		const html = await container.renderToString(TableWrap, {
			slots: { default: "<tr><td>x</td></tr>" },
		});
		expect(html).toMatch(/^<div[^>]*role="region"/);
	});
});

describe("PullQuote", () => {
	it("replaces blockquote with ink rules above and below", async () => {
		const html = await container.renderToString(TableNote, {
			props: { components: noteComponents },
		});
		expect(html).toMatch(
			/<blockquote[^>]*class="[^"]*border-y-window[^"]*"[^>]*>[\s\S]*\[PULL QUOTE/,
		);
	});

	it("renders directly", async () => {
		const html = await container.renderToString(PullQuote, {
			slots: { default: "<p>x</p>" },
		});
		expect(html).toMatch(/^<blockquote\b/);
	});
});

describe("Figure", () => {
	it("renders a caption", async () => {
		const html = await container.renderToString(Figure, {
			props: { caption: "[CAPTION]" },
			slots: { default: '<img src="/x.png" alt="[ALT]">' },
		});
		expect(html).toMatch(/^<figure\b/);
		expect(html).toMatch(/<figcaption[^>]*>\[CAPTION\]<\/figcaption>/);
	});

	it("omits the caption when absent", async () => {
		const html = await container.renderToString(Figure, {
			slots: { default: '<img src="/x.png" alt="[ALT]">' },
		});
		expect(html).not.toContain("figcaption");
	});
});

describe("Callout in a note", () => {
	it("renders the MDX Callout as an aside", async () => {
		const html = await container.renderToString(TableNote, {
			props: { components: noteComponents },
		});
		expect(html).toMatch(/<aside\b[\s\S]*\[CALLOUT/);
	});
});
