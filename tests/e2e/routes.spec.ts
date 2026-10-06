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
