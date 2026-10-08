import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/preact/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SubscribeForm from "../../src/components/SubscribeForm.astro";
import { buttondownAction } from "../../src/lib/site";
import { colorUtilityProblems } from "./helpers/classes";

let container: AstroContainer;

beforeAll(async () => {
	const renderers = await loadRenderers([getContainerRenderer()]);
	container = await AstroContainer.create({ renderers });
});

function render(props: Record<string, unknown> = {}) {
	return container.renderToString(SubscribeForm, { props });
}

function formTag(html: string): string {
	return /<form\b[^>]*>/.exec(html)?.[0] ?? "";
}

describe("buttondownAction", () => {
	it("uses the embed subscribe endpoint with the username placeholder", () => {
		expect(buttondownAction()).toBe(
			"https://buttondown.com/api/emails/embed-subscribe/[BUTTONDOWN_USERNAME]",
		);
	});
});

describe.each(["dialog", "band"])("SubscribeForm %s", (variant) => {
	it("is a native POST into a new tab to the Buttondown embed URL", async () => {
		const form = formTag(await render({ variant }));
		expect(form).toContain('method="post"');
		expect(form).toContain('target="_blank"');
		expect(form).toContain(
			'action="https://buttondown.com/api/emails/embed-subscribe/[BUTTONDOWN_USERNAME]"',
		);
	});

	it("has a labelled required email input and hidden embed=1", async () => {
		const html = await render({ variant });
		const input = /<input\b[^>]*type="email"[^>]*>/.exec(html)?.[0] ?? "";
		expect(input).toContain('name="email"');
		expect(input).toContain("required");
		expect(input).toContain('autocomplete="email"');
		const id = /id="([^"]+)"/.exec(input)?.[1];
		expect(id).toBeDefined();
		expect(html).toMatch(new RegExp(`<label[^>]*for="${id}"[^>]*>`));
		expect(html).toMatch(
			/<input\b(?=[^>]*type="hidden")(?=[^>]*name="embed")(?=[^>]*value="1")[^>]*>/,
		);
	});

	it("has a Subscribe submit button and the subscribe anchor", async () => {
		const html = await render({ variant });
		expect(html).toMatch(
			/<button[^>]*type="submit"[^>]*>\s*Subscribe\s*<\/button>/,
		);
		expect(html).toMatch(/id="subscribe"/);
		expect(html).toContain(`data-variant="${variant}"`);
		expect(colorUtilityProblems(html)).toEqual([]);
	});
});

describe("SubscribeForm variants", () => {
	it.each(["dialog", "band"])(
		"%s says the digest is weekly, every Monday (AC2)",
		async (variant) => {
			const html = await render({ variant });
			expect(html).toContain(
				"One issue a week, every Monday. Only the news you can use on Monday.",
			);
			expect(html).not.toContain("[DAY]");
			expect(html).not.toContain("every [");
		},
	);

	it("dialog is a system alert with one default Subscribe button aligned right (AC3)", async () => {
		const html = await render({ variant: "dialog" });
		expect(html).not.toContain("Not now");
		expect(html).not.toContain("data-not-now");
		expect(html.match(/<button\b/g)).toHaveLength(1);
		expect(html).toMatch(
			/<div class="[^"]*justify-end[^"]*">\s*<button[^>]*class="[^"]*ring-default[^"]*"[^>]*>\s*Subscribe/,
		);
		expect(html).toContain("rounded-dialog-button");
	});

	it("band has no Not now control", async () => {
		const html = await render({ variant: "band" });
		expect(html).not.toContain("Not now");
	});

	it("can skip the id for a second form on a page", async () => {
		const html = await render({ variant: "band", id: null });
		expect(html).not.toMatch(/id="subscribe"/);
	});
});
