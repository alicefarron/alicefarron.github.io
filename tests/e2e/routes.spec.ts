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

test.describe("layout", () => {
	test("skip link is the first stop in tab order and targets main", async ({
		page,
	}) => {
		await page.goto("/");
		await page.keyboard.press("Tab");
		const focused = page.locator(":focus");
		await expect(focused).toHaveText("Skip to content");
		await expect(focused).toHaveAttribute("href", "#main");
		await expect(focused).toBeVisible();
		await page.keyboard.press("Enter");
		await expect(page).toHaveURL(/#main$/);
	});

	test("menu bar marks the current page with aria-current", async ({
		page,
	}, testInfo) => {
		test.skip(
			testInfo.project.name !== "desktop",
			"menu bar nav is shown at 1280 px",
		);
		await page.goto("/");
		const header = page.getByRole("banner");
		const current = header.locator('[aria-current="page"]');
		await expect(current).toHaveCount(1);
		await expect(current).toHaveAttribute("href", "/");
		await expect(
			header.getByRole("navigation", { name: "Main" }).getByRole("link"),
		).toHaveText(["Digest", "Writing", "About", "Subscribe"]);
	});
});
