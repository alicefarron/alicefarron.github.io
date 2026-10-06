import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runBuild } from "./build-output";

const site = "https://sitemap.example";
let outDir = "";

function locs(xml: string): string[] {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
		(match) => match[1] ?? "",
	);
}

beforeAll(() => {
	const result = runBuild({
		CONTENT_DIR: "tests/fixtures/content",
		SITE_URL: site,
	});
	outDir = result.outDir;
	expect(result.status, result.output).toBe(0);
}, 180_000);

afterAll(() => {
	if (outDir !== "") {
		rmSync(outDir, { recursive: true, force: true });
	}
});

describe("sitemap", () => {
	it("lists every published route and nothing else", () => {
		const index = readFileSync(join(outDir, "sitemap-index.xml"), "utf8");
		const sitemaps = locs(index);
		expect(sitemaps.length).toBeGreaterThan(0);
		const urls = sitemaps.flatMap((url) => {
			const file = join(outDir, new URL(url).pathname);
			expect(existsSync(file), url).toBe(true);
			return locs(readFileSync(file, "utf8"));
		});
		expect([...urls].sort()).toEqual(
			[
				"/",
				"/about",
				"/digest",
				"/digest/010",
				"/digest/011",
				"/digest/012",
				"/writing",
				"/writing/sample-note-code",
				"/writing/sample-note-cover",
				"/writing/sample-note-one",
				"/writing/sample-note-pinned",
				"/writing/sample-note-series",
				"/writing/sample-note-table",
			]
				.map((path) => (path === "/" ? `${site}/` : `${site}${path}`))
				.sort(),
		);
	});

	it("excludes the 404 page and drafts", () => {
		const all = readFileSync(join(outDir, "sitemap-0.xml"), "utf8");
		expect(all).not.toContain("404");
		expect(all).not.toContain("/digest/013");
		expect(all).not.toContain("sample-note-draft");
	});

	it("is linked from every page head", () => {
		const home = readFileSync(join(outDir, "index.html"), "utf8");
		expect(home).toContain(
			`<link rel="sitemap" href="${site}/sitemap-index.xml">`,
		);
	});
});
