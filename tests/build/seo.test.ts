import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runBuild } from "./build-output";

const site = "https://seo.example";
let outDir = "";
let pages: { path: string; html: string }[] = [];

function htmlFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			return htmlFiles(path);
		}
		return name.endsWith(".html") ? [path] : [];
	});
}

function meta(html: string, attr: "name" | "property", key: string): string[] {
	const pattern = new RegExp(
		`<meta\\b(?=[^>]*\\b${attr}="${key.replace(/[.:]/g, "\\$&")}")[^>]*\\bcontent="([^"]*)"[^>]*>`,
		"g",
	);
	return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

function one(html: string, attr: "name" | "property", key: string): string {
	const values = meta(html, attr, key);
	expect(values, key).toHaveLength(1);
	return values[0] ?? "";
}

beforeAll(() => {
	const result = runBuild({
		CONTENT_DIR: "tests/fixtures/content",
		SITE_URL: site,
	});
	outDir = result.outDir;
	expect(result.status, result.output).toBe(0);
	pages = htmlFiles(outDir).map((file) => ({
		path: relative(outDir, file),
		html: readFileSync(file, "utf8"),
	}));
}, 180_000);

afterAll(() => {
	if (outDir !== "") {
		rmSync(outDir, { recursive: true, force: true });
	}
});

describe("seo tags on every built page (R12)", () => {
	it("built some pages", () => {
		expect(pages.length).toBeGreaterThan(10);
	});

	it("titles and descriptions are present and unique", () => {
		const titles = pages.map(
			({ html }) => /<title>([^<]+)<\/title>/.exec(html)?.[1] ?? "",
		);
		const descriptions = pages.map(({ html }) =>
			one(html, "name", "description"),
		);
		for (const value of [...titles, ...descriptions]) {
			expect(value.trim()).not.toBe("");
		}
		expect(new Set(titles).size).toBe(pages.length);
		expect(new Set(descriptions).size).toBe(pages.length);
	});

	it("each page has an absolute canonical, og and twitter tags", () => {
		for (const { path, html } of pages) {
			const canonical =
				/<link\b(?=[^>]*rel="canonical")[^>]*href="([^"]+)"/.exec(html)?.[1] ??
				"";
			expect(canonical, path).toMatch(new RegExp(`^${site}/`));
			expect(one(html, "property", "og:url"), path).toBe(canonical);
			expect(one(html, "property", "og:title"), path).not.toBe("");
			expect(one(html, "property", "og:description"), path).not.toBe("");
			expect(one(html, "property", "og:type"), path).toMatch(
				/^(website|article)$/,
			);
			expect(one(html, "property", "og:site_name"), path).toBe("alina.os");
			const image = one(html, "property", "og:image");
			expect(image, path).toMatch(new RegExp(`^${site}/og/.+\\.png$`));
			expect(one(html, "property", "og:image:width"), path).toBe("1200");
			expect(one(html, "property", "og:image:height"), path).toBe("630");
			expect(one(html, "property", "og:image:alt"), path).not.toBe("");
			expect(one(html, "name", "twitter:card"), path).toBe(
				"summary_large_image",
			);
			expect(one(html, "name", "twitter:title"), path).not.toBe("");
			expect(one(html, "name", "twitter:description"), path).not.toBe("");
			expect(one(html, "name", "twitter:image"), path).toBe(image);
		}
	});

	it("canonical URLs follow the page paths", () => {
		const byPath = Object.fromEntries(
			pages.map(({ path, html }) => [
				path,
				/<link\b(?=[^>]*rel="canonical")[^>]*href="([^"]+)"/.exec(html)?.[1],
			]),
		);
		expect(byPath["index.html"]).toBe(`${site}/`);
		expect(byPath[join("digest", "012", "index.html")]).toBe(
			`${site}/digest/012`,
		);
		expect(byPath[join("writing", "sample-note-code", "index.html")]).toBe(
			`${site}/writing/sample-note-code`,
		);
	});

	it("notes are articles and link the three feeds", () => {
		const note = pages.find(
			({ path }) => path === join("writing", "sample-note-code", "index.html"),
		);
		expect(note && one(note.html, "property", "og:type")).toBe("article");
		for (const { path, html } of pages) {
			const feeds = [
				...html.matchAll(
					/<link\b(?=[^>]*rel="alternate")(?=[^>]*type="application\/rss\+xml")[^>]*href="([^"]+)"/g,
				),
			].map((match) => match[1]);
			expect(feeds, path).toEqual([
				`${site}/rss.xml`,
				`${site}/digest/rss.xml`,
				`${site}/writing/rss.xml`,
			]);
		}
	});
});

describe("og images (R12, R16)", () => {
	it("every og:image points at a built 1200x630 PNG", () => {
		for (const { path, html } of pages) {
			const image = one(html, "property", "og:image");
			const file = join(outDir, new URL(image).pathname);
			const png = readFileSync(file);
			expect(png.subarray(1, 4).toString(), path).toBe("PNG");
			expect(png.readUInt32BE(16), path).toBe(1200);
			expect(png.readUInt32BE(20), path).toBe(630);
		}
	});
});
