import { describe, expect, it } from "vitest";
import {
	type OgElement,
	type OgPage,
	ogTree,
	renderOgPng,
} from "../../src/lib/og";
import { tokenColors } from "../../src/lib/tokens";

function texts(node: OgElement | string | number | undefined): string[] {
	if (node === undefined) {
		return [];
	}
	if (typeof node === "string" || typeof node === "number") {
		return [String(node)];
	}
	const children = node.props.children;
	const list = Array.isArray(children) ? children : [children];
	return list.flatMap((child) => texts(child));
}

function pngSize(png: Uint8Array): { width: number; height: number } {
	const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
	return { width: view.getUint32(16), height: view.getUint32(20) };
}

const issue: OgPage = {
	kind: "issue",
	title: "[ISSUE 012 TITLE]",
	issueNumber: 12,
};

describe("tokenColors", () => {
	it("reads hex values from tokens.css", () => {
		const colors = tokenColors();
		expect(colors.ink).toBe("#111111");
		expect(colors.sky).toBe("#9fd3f7");
		expect(colors["sprite-green"]).toBe("#7bc86c");
	});
});

describe("ogTree", () => {
	it("issue 012 shows #012 and This week in AI (AC18)", () => {
		const all = texts(ogTree(issue)).join(" ");
		expect(all).toContain("#012");
		expect(all).toContain("This week in AI");
		expect(all).toContain("[ISSUE 012 TITLE]");
	});

	it("a page shows its title and the site name without an issue label", () => {
		const all = texts(ogTree({ kind: "page", title: "Writing" })).join(" ");
		expect(all).toContain("Writing");
		expect(all).toContain("alina.os");
		expect(all).not.toMatch(/#\d{3}/);
	});

	it("a note shows its tag", () => {
		const all = texts(
			ogTree({ kind: "note", title: "[NOTE 2 TITLE]", tag: "Agents" }),
		).join(" ");
		expect(all).toContain("[NOTE 2 TITLE]");
		expect(all).toContain("Agents");
	});
});

describe("renderOgPng", () => {
	it("renders a 1200x630 PNG", async () => {
		const png = await renderOgPng(ogTree(issue));
		expect([...png.subarray(0, 8)]).toEqual([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		]);
		expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
	}, 30_000);
});

describe("ogParam", () => {
	it.each([
		["/", "index"],
		["/digest", "digest"],
		["/digest/012", "digest/012"],
		["/writing/a-note", "writing/a-note"],
	])("%s maps to %s", async (path, expected) => {
		const { ogParam } = await import("../../src/lib/og-pages");
		expect(ogParam(path)).toBe(expected);
	});
});
