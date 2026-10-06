import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/preact/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SubscribeForm from "../../src/components/SubscribeForm.astro";
import {
	isValidEmail,
	subscribeMessage,
	subscribeOutcome,
} from "../../src/lib/subscribe";

let container: AstroContainer;

beforeAll(async () => {
	const renderers = await loadRenderers([getContainerRenderer()]);
	container = await AstroContainer.create({ renderers });
});

describe("isValidEmail", () => {
	it.each([
		["reader@example.com", true],
		["  reader@example.com  ", true],
		["first.last+tag@mail.example.org", true],
		["", false],
		["   ", false],
		["reader", false],
		["reader@", false],
		["reader@example", false],
		["@example.com", false],
		["two words@example.com", false],
	])("%j is %s", (value, expected) => {
		expect(isValidEmail(value)).toBe(expected);
	});
});

describe("subscribeOutcome (AC12)", () => {
	it("blocks an invalid email whether online or not", () => {
		expect(subscribeOutcome("nope", true)).toBe("invalid");
		expect(subscribeOutcome("nope", false)).toBe("invalid");
	});

	it("blocks a valid email when offline", () => {
		expect(subscribeOutcome("reader@example.com", false)).toBe("offline");
	});

	it("lets a valid email through when online", () => {
		expect(subscribeOutcome("reader@example.com", true)).toBe("sent");
	});
});

describe("subscribeMessage", () => {
	it("has plain copy for each state and names the address when sent", () => {
		expect(subscribeMessage("invalid", "x")).toBe(
			"Enter a valid email address.",
		);
		expect(subscribeMessage("offline", "x")).toBe(
			"You seem to be offline. Your email is still here, try again when connected.",
		);
		expect(subscribeMessage("sent", " reader@example.com ")).toBe(
			"Almost done. Finish in the Buttondown tab, then confirm the email sent to reader@example.com.",
		);
		expect(subscribeMessage("idle", "x")).toBe("");
	});

	it("uses no em dashes or curly quotes", () => {
		for (const state of ["invalid", "offline", "sent"] as const) {
			expect(subscribeMessage(state, "a@b.co")).not.toMatch(/[—‘’“”]/);
		}
	});
});

describe.each(["dialog", "band"])(
	"SubscribeForm %s with the enhancer",
	(variant) => {
		it("renders empty live regions inside the form and hydrates when visible", async () => {
			const html = await container.renderToString(SubscribeForm, {
				props: { variant },
			});
			const form = /<form\b[\s\S]*<\/form>/.exec(html)?.[0] ?? "";
			expect(form).toMatch(/<astro-island[^>]*client="visible"/);
			expect(form).toMatch(
				/<p[^>]*aria-live="assertive"[^>]*data-subscribe-error[^>]*><\/p>/,
			);
			expect(form).toMatch(
				/<p[^>]*aria-live="polite"[^>]*data-subscribe-status[^>]*><\/p>/,
			);
			const inputId =
				/<input\b[^>]*type="email"[^>]*id="([^"]+)"|<input\b[^>]*id="([^"]+)"[^>]*type="email"/.exec(
					html,
				);
			const id = inputId?.[1] ?? inputId?.[2];
			expect(form).toContain(`id="${id}-error"`);
		});
	},
);
