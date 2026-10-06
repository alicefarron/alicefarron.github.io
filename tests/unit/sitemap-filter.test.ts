import { describe, expect, it } from "vitest";
import { includeInSitemap } from "../../src/lib/seo";

describe("includeInSitemap", () => {
	it.each([
		["https://a.example/", true],
		["https://a.example/about", true],
		["https://a.example/404", false],
		["https://a.example/404/", false],
		["https://a.example/og/index.png", false],
	])("%s is %s", (url, expected) => {
		expect(includeInSitemap(url)).toBe(expected);
	});
});
