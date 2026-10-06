import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import MenuBar from "../../src/components/MenuBar.astro";

let container: AstroContainer;

beforeAll(async () => {
	container = await AstroContainer.create();
});

function render(path: string, props: Record<string, unknown> = {}) {
	return container.renderToString(MenuBar, {
		props,
		request: new Request(`http://localhost${path}`),
	});
}

function currentLinks(html: string): string[] {
	return [...html.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)].map(
		(match) => /href="([^"]+)"/.exec(match[0])?.[1] ?? "",
	);
}

describe("MenuBar", () => {
	it.each([
		["/digest/012", "/digest"],
		["/writing", "/writing"],
		["/about", "/about"],
		["/", "/"],
	])("on %s marks %s as current", async (path, href) => {
		expect(currentLinks(await render(path))).toEqual([href]);
	});

	it("marks nothing as current on unknown pages", async () => {
		expect(currentLinks(await render("/404"))).toEqual([]);
	});

	it("hides the nav below 640 px and keeps the site name", async () => {
		const html = await render("/");
		expect(html).toMatch(
			/<nav[^>]*aria-label="Main"[^>]*class="[^"]*max-dock:hidden/,
		);
		expect(html).toContain("alina.os");
	});

	it("points Subscribe at the local form only when the page has one", async () => {
		expect(await render("/", { hasSubscribeForm: true })).toContain(
			'href="#subscribe"',
		);
		expect(await render("/about")).toContain('href="/#subscribe"');
	});
});
