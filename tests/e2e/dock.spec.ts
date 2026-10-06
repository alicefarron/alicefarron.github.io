import { expect, test } from "@playwright/test";
import { routes } from "./helpers/routes";

for (const route of routes) {
	test.describe(`dock on ${route.path}`, () => {
		test("phone: dock is the navigation and covers nothing", async ({
			page,
		}, testInfo) => {
			test.skip(testInfo.project.name !== "phone", "dock check runs at 390 px");
			await page.goto(route.path);
			const dock = page.locator("[data-dock]");
			await expect(dock).toBeVisible();
			const items = dock.getByRole("link");
			await expect(items).toHaveCount(4);
			await expect(items).toHaveText([
				"Digest",
				"Writing",
				"About",
				"Subscribe",
			]);
			for (const item of await items.all()) {
				const box = await item.boundingBox();
				expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
			}
			const current = dock.locator('[aria-current="page"]');
			const expectedCurrent = route.path.split("/")[1] ?? "";
			if (["digest", "writing", "about"].includes(expectedCurrent)) {
				await expect(current).toHaveCount(1);
				await expect(current).toHaveAttribute("href", `/${expectedCurrent}`);
			} else {
				await expect(current).toHaveCount(0);
			}

			const header = page.getByRole("banner");
			await expect(header.getByRole("navigation")).toBeHidden();
			const visibleHeaderLinks = await header
				.getByRole("link")
				.evaluateAll(
					(links) =>
						links.filter((link) => (link as HTMLElement).offsetParent !== null)
							.length,
				);
			expect(visibleHeaderLinks).toBe(1);

			await page.evaluate(() =>
				window.scrollTo(0, document.documentElement.scrollHeight),
			);
			const overlap = await page.evaluate(() => {
				const dockElement = document.querySelector("[data-dock]");
				const main = document.querySelector("main");
				if (dockElement === null || main === null) {
					return Number.POSITIVE_INFINITY;
				}
				const leaves = [...main.querySelectorAll("*")].filter(
					(element) =>
						element.children.length === 0 &&
						element.getBoundingClientRect().height > 0,
				);
				const last = leaves.at(-1) ?? main;
				return (
					last.getBoundingClientRect().bottom -
					dockElement.getBoundingClientRect().top
				);
			});
			expect(overlap).toBeLessThanOrEqual(0);
		});

		test("tablet: dock is not visible", async ({ page }, testInfo) => {
			test.skip(
				testInfo.project.name !== "tablet",
				"dock hidden check runs at 820 px",
			);
			await page.goto(route.path);
			await expect(page.locator("[data-dock]")).toBeHidden();
			await expect(
				page.getByRole("banner").getByRole("navigation", { name: "Main" }),
			).toBeVisible();
		});
	});
}
