import { rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readBuiltFiles, runBuild } from "./build-output";

let css = "";
let outDir = "";

beforeAll(() => {
	const result = runBuild({ CONTENT_DIR: "tests/fixtures/content" });
	outDir = result.outDir;
	expect(result.status, result.output).toBe(0);
	css = readBuiltFiles(outDir, [".html", ".css"]).join("\n");
}, 120_000);

afterAll(() => {
	if (outDir !== "") {
		rmSync(outDir, { recursive: true, force: true });
	}
});

function faces(family: string): string[] {
	const pattern = new RegExp(
		`@font-face\\s*\\{[^}]*font-family:\\s*"?${family}[^}]*\\}`,
		"g",
	);
	return css.match(pattern) ?? [];
}

function weights(rules: string[]): string[] {
	return rules
		.filter((rule) => !rule.includes("fallback"))
		.map((rule) => /font-weight:\s*(\d+)/.exec(rule)?.[1] ?? "")
		.filter((weight, index, all) => all.indexOf(weight) === index)
		.sort();
}

describe("self-hosted fonts", () => {
	it.each([
		["Pixelify Sans", ["600", "700"]],
		["Silkscreen", ["400"]],
		["Space Mono", ["400", "700"]],
		["Atkinson Hyperlegible Next", ["400", "700"]],
	])(
		"%s has font faces for the spec weights and a metric fallback",
		(family, expected) => {
			const rules = faces(family);
			expect(weights(rules)).toEqual(expected);
			const fallbacks = rules.filter((rule) => rule.includes("fallback"));
			expect(fallbacks.length).toBeGreaterThan(0);
			for (const rule of fallbacks) {
				expect(rule).toMatch(/size-adjust:\s*[\d.]+%/);
			}
		},
	);

	it("serves font files from the site, not a CDN", () => {
		const urls = [
			...css.matchAll(/url\(\s*["']?([^"')]+\.woff2?)["']?\s*\)/g),
		].map((match) => match[1]);
		expect(urls.length).toBeGreaterThan(0);
		for (const url of urls) {
			expect(url).toMatch(/^\/_astro\/fonts\//);
		}
	});
});
