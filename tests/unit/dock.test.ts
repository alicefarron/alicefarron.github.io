import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import Dock from "../../src/components/Dock.astro";

let container: AstroContainer;

beforeAll(async () => {
	container = await AstroContainer.create();
});

function render(path: string) {
	return container.renderToString(Dock, {
		request: new Request(`http://localhost${path}`),
	});
}

describe("Dock", () => {
	it("renders four sprite and label links", async () => {
		const html = await render("/");
		const links = [...html.matchAll(/<a\b[\s\S]*?<\/a>/g)].map(
			(match) => match[0],
		);
		expect(links).toHaveLength(4);
		for (const link of links) {
			expect(link).toContain('shape-rendering="crispEdges"');
			expect(link).toContain("min-h-11");
		}
		expect(
			links.map((link) => /<span>([^<]+)<\/span>/.exec(link)?.[1]),
		).toEqual(["Digest", "Writing", "About", "Subscribe"]);
	});

	it("marks the current section and only that one", async () => {
		const html = await render("/writing/a-note");
		const current = [...html.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)];
		expect(current).toHaveLength(1);
		expect(current[0]?.[0]).toContain('href="/writing"');
	});

	it("is hidden at 640 px and wider and respects the safe area", async () => {
		const html = await render("/");
		expect(html).toMatch(/<nav[^>]*class="[^"]*dock:hidden/);
		expect(html).toMatch(/<nav[^>]*class="[^"]*pb-safe/);
		expect(html).toMatch(/<nav[^>]*class="[^"]*fixed/);
	});
});
