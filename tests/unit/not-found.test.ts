import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import NotFound from "../../src/pages/404.astro";

let html = "";

beforeAll(async () => {
	const container = await AstroContainer.create();
	html = await container.renderToString(NotFound, {
		request: new Request("http://localhost/404"),
	});
});

describe("404 page", () => {
	it("shows the alert window with the spec message", () => {
		expect(html).toMatch(/<section[^>]*aria-labelledby="alert-title"/);
		expect(html).toMatch(/<h1[^>]*>The page could not be found\.<\/h1>/);
	});

	it("links home", () => {
		expect(html).toMatch(
			/<a[^>]*href="\/"[^>]*>\s*Go to the home page\s*<\/a>/,
		);
	});

	it("is not indexed", () => {
		expect(html).toContain('<meta name="robots" content="noindex">');
	});
});
