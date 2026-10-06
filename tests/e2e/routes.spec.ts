import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/axe";
import { routes } from "./helpers/routes";

for (const route of routes) {
	test.describe(`route ${route.path}`, () => {
		test("has no horizontal overflow", async ({ page }) => {
			await page.goto(route.path);
			const overflow = await page.evaluate(() => {
				const root = document.documentElement;
				return root.scrollWidth - root.clientWidth;
			});
			expect(overflow).toBeLessThanOrEqual(0);
		});

		test("has no axe violations", async ({ page }) => {
			await page.goto(route.path);
			await expectNoAxeViolations(page);
		});
	});
}

test("loads every request from the local server", async ({ page, baseURL }) => {
	const origin = new URL(baseURL ?? "http://localhost").origin;
	const external: string[] = [];
	page.on("request", (request) => {
		const url = new URL(request.url());
		if (url.protocol !== "data:" && url.origin !== origin) {
			external.push(request.url());
		}
	});
	for (const route of routes) {
		await page.goto(route.path, { waitUntil: "networkidle" });
	}
	expect(external).toEqual([]);
});
