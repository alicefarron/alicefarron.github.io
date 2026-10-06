import { describe, expect, it } from "vitest";
import { absolutizeHtml, byNewest, feedChannel } from "../../src/lib/feed";

describe("absolutizeHtml", () => {
	it("makes root-relative href and src absolute and leaves others alone", () => {
		const html =
			'<a href="/writing/x">x</a><img src="/_astro/a.png" alt=""><a href="https://example.com/y">y</a><a href="#top">t</a><a href="//cdn.example/z">z</a>';
		expect(absolutizeHtml(html, "https://a.example")).toBe(
			'<a href="https://a.example/writing/x">x</a><img src="https://a.example/_astro/a.png" alt=""><a href="https://example.com/y">y</a><a href="#top">t</a><a href="//cdn.example/z">z</a>',
		);
	});

	it("drops script elements", () => {
		expect(
			absolutizeHtml(
				'<p>a</p><script type="module">x()</script>',
				"https://a.example",
			),
		).toBe("<p>a</p>");
	});
});

describe("byNewest", () => {
	it("sorts items by date, newest first", () => {
		const items = [
			{ title: "a", pubDate: new Date("2026-01-01") },
			{ title: "c", pubDate: new Date("2026-03-01") },
			{ title: "b", pubDate: new Date("2026-02-01") },
		];
		expect(byNewest(items).map((item) => item.title)).toEqual(["c", "b", "a"]);
	});
});

describe("feedChannel", () => {
	it("describes each feed", () => {
		expect(feedChannel("all").title).toBe("alina.os");
		expect(feedChannel("digest").title).toBe("alina.os: This week in AI");
		expect(feedChannel("writing").title).toBe("alina.os: writing");
	});
});
