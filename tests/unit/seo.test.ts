import { describe, expect, it } from "vitest";
import {
	canonicalUrl,
	feedLinks,
	ogImagePath,
	pageTitle,
	placeholderSiteUrl,
	resolveSiteUrl,
} from "../../src/lib/seo";

describe("resolveSiteUrl", () => {
	it("prefers SITE_URL without a trailing slash", () => {
		expect(
			resolveSiteUrl({
				SITE_URL: "https://alina.example/",
				RAILWAY_PUBLIC_DOMAIN: "x.up.railway.app",
			}),
		).toBe("https://alina.example");
	});

	it("falls back to the Railway public domain", () => {
		expect(resolveSiteUrl({ RAILWAY_PUBLIC_DOMAIN: "x.up.railway.app" })).toBe(
			"https://x.up.railway.app",
		);
	});

	it("falls back to the placeholder when nothing is set", () => {
		expect(resolveSiteUrl({})).toBe(placeholderSiteUrl);
		expect(resolveSiteUrl({ SITE_URL: "", RAILWAY_PUBLIC_DOMAIN: "" })).toBe(
			placeholderSiteUrl,
		);
	});

	it("rejects a value that is not an http URL", () => {
		expect(() => resolveSiteUrl({ SITE_URL: "[DOMAIN]" })).toThrow(/SITE_URL/);
	});
});

describe("pageTitle", () => {
	it("uses the site name alone on Home and appends it elsewhere", () => {
		expect(pageTitle()).toBe("alina.os");
		expect(pageTitle("Writing")).toBe("Writing | alina.os");
	});
});

describe("canonicalUrl", () => {
	it.each([
		["/", "https://a.example/"],
		["/writing/", "https://a.example/writing"],
		["/digest/012", "https://a.example/digest/012"],
		["/about/index.html", "https://a.example/about"],
		["/about.html", "https://a.example/about"],
		["/digest/012.html", "https://a.example/digest/012"],
	])("%s becomes %s", (pathname, expected) => {
		expect(canonicalUrl(pathname, "https://a.example")).toBe(expected);
	});
});

describe("ogImagePath", () => {
	it.each([
		["/", "/og/index.png"],
		["/digest", "/og/digest.png"],
		["/digest/012/", "/og/digest/012.png"],
		["/writing/some-note", "/og/writing/some-note.png"],
		["/404", "/og/404.png"],
	])("%s maps to %s", (pathname, expected) => {
		expect(ogImagePath(pathname)).toBe(expected);
	});
});

describe("feedLinks", () => {
	it("lists the three feeds", () => {
		expect(feedLinks.map((feed) => feed.href)).toEqual([
			"/rss.xml",
			"/digest/rss.xml",
			"/writing/rss.xml",
		]);
	});
});
