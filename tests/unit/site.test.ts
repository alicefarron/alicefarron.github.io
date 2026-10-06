import { describe, expect, it } from "vitest";
import { currentNav, navItems, site, subscribeHref } from "../../src/lib/site";

describe("site nav", () => {
	it("lists Digest, Writing, About and Subscribe in order", () => {
		expect(navItems.map((item) => item.label)).toEqual([
			"Digest",
			"Writing",
			"About",
			"Subscribe",
		]);
	});

	it.each([
		["/", undefined],
		["/digest", "digest"],
		["/digest/012", "digest"],
		["/writing", "writing"],
		["/writing/some-note", "writing"],
		["/about", "about"],
		["/about/", "about"],
		["/aboutness", undefined],
		["/404", undefined],
	])("current nav for %s is %s", (pathname, expected) => {
		expect(currentNav(pathname)).toBe(expected);
	});

	it("never marks Subscribe as current", () => {
		const subscribe = navItems.find((item) => item.id === "subscribe");
		expect(subscribe?.match).toBeUndefined();
	});

	it("links Subscribe to the local form when the page has one", () => {
		expect(subscribeHref(true)).toBe("#subscribe");
		expect(subscribeHref(false)).toBe("/#subscribe");
	});

	it("keeps unknown copy as visible placeholders", () => {
		expect(site.name).toBe("alina.os");
		expect(site.description).toMatch(/^\[[A-Z_]+\]$/);
		expect(site.email).toBe("[EMAIL]");
		expect(site.linkedin).toBe("[LINKEDIN_URL]");
		expect(site.domain).toBe("[DOMAIN]");
		expect(site.digestDay).toBe("[DAY]");
	});
});
