import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import Callout from "../../src/components/Callout.astro";
import DesktopIcon from "../../src/components/DesktopIcon.astro";
import TagChip from "../../src/components/TagChip.astro";
import Terminal from "../../src/components/Terminal.astro";
import { folder } from "../../src/sprites";
import { colorUtilityProblems, hasArbitraryValues } from "./helpers/classes";

let container: AstroContainer;

beforeAll(async () => {
	container = await AstroContainer.create();
});

describe("TagChip", () => {
	it("renders the label in the label face", async () => {
		const html = await container.renderToString(TagChip, {
			props: { label: "Agents" },
		});
		expect(html).toContain("Agents");
		expect(html).toContain("font-label");
		expect(colorUtilityProblems(html)).toEqual([]);
	});

	it.each([
		["pink", "bg-pink"],
		["lime", "bg-lime"],
		["yellow", "bg-yellow"],
		["sky", "bg-sky"],
		["white", "bg-white"],
	])("color %s maps to %s", async (color, expected) => {
		const html = await container.renderToString(TagChip, {
			props: { label: "x", color },
		});
		expect(html).toContain(expected);
		expect(colorUtilityProblems(html)).toEqual([]);
	});
});

describe("DesktopIcon", () => {
	it("is one link with a visible label and a decorative sprite", async () => {
		const html = await container.renderToString(DesktopIcon, {
			props: { href: "/writing", label: "writing/", sprite: folder },
		});
		expect(html.match(/<a\b/g)).toHaveLength(1);
		expect(html).toMatch(/^<a\b[^>]*href="\/writing"/);
		expect(html).toMatch(/<span[^>]*>writing\/<\/span>/);
		expect(html).not.toMatch(/<span[^>]*sr-only/);
		expect(html).toContain('aria-hidden="true"');
		expect(colorUtilityProblems(html)).toEqual([]);
	});
});

describe("Terminal", () => {
	it("renders an ink panel with a lime label and mono content", async () => {
		const html = await container.renderToString(Terminal, {
			props: { label: "tried_it.sh" },
			slots: { default: "<p>$ [COMMAND]</p>" },
		});
		expect(html).toContain("bg-ink");
		expect(html).toContain("text-terminal-text");
		expect(html).toContain("text-lime");
		expect(html).toContain("font-mono");
		expect(html).toContain("tried_it.sh");
		expect(html).toContain("$ [COMMAND]");
	});

	it("uses only token classes", async () => {
		const html = await container.renderToString(Terminal, {
			props: { label: "x" },
			slots: { default: "y" },
		});
		expect(colorUtilityProblems(html)).toEqual([]);
		expect(hasArbitraryValues(html)).toBe(false);
		expect(html).not.toMatch(/style="/);
		expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
	});

	it("can render without a label", async () => {
		const html = await container.renderToString(Terminal, {
			slots: { default: "y" },
		});
		expect(html).toContain("bg-ink");
	});
});

describe("Callout", () => {
	it("is an aside with a screen reader label and a decorative mark", async () => {
		const html = await container.renderToString(Callout, {
			slots: { default: "<p>[CALLOUT]</p>" },
		});
		expect(html).toMatch(/^<aside\b/);
		expect(html).toMatch(
			/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>Note<\/span>/,
		);
		expect(html).toMatch(/<span[^>]*aria-hidden="true"[^>]*>!<\/span>/);
		expect(html).toContain("[CALLOUT]");
		expect(colorUtilityProblems(html)).toEqual([]);
	});

	it("accepts a custom label", async () => {
		const html = await container.renderToString(Callout, {
			props: { label: "Warning" },
			slots: { default: "x" },
		});
		expect(html).toMatch(/>Warning<\/span>/);
	});
});
