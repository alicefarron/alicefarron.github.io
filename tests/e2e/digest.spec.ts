import { expect, test } from "@playwright/test";

test.describe("digest issue", () => {
	test("contents links scroll to each section (AC4)", async ({ page }) => {
		await page.goto("/digest/012");
		const links = page.locator('[data-window="contents"] a');
		await expect(links).toHaveText([
			"[SECTION 1]",
			"[SECTION 2]",
			"[SECTION 3]",
			"Tried it",
		]);
		for (const link of await links.all()) {
			const href = (await link.getAttribute("href")) ?? "";
			await link.click();
			await expect(page).toHaveURL(new RegExp(`${href}$`));
			await expect(page.locator(href)).toBeInViewport();
		}
	});

	test("quote window shows on an issue with a quote (AC4)", async ({
		page,
	}) => {
		await page.goto("/digest/012");
		const quote = page.locator('[data-window="quote"]');
		await expect(quote).toBeVisible();
		await expect(quote).toContainText("[QUOTE]");
		await expect(quote).toContainText("[AUTHOR], [ROLE]");
	});

	test("previous links to issue 011 and archive to /digest (AC4)", async ({
		page,
	}) => {
		await page.goto("/digest/012");
		await expect(page.locator("[data-previous]")).toHaveAttribute(
			"href",
			"/digest/011",
		);
		await expect(
			page.getByRole("navigation", { name: "Issues" }).getByRole("link", {
				name: "archive/",
			}),
		).toHaveAttribute("href", "/digest");
	});

	test("hero shows number, date, reading time, title and highlighted issue title", async ({
		page,
	}) => {
		await page.goto("/digest/012");
		const chip = page.locator("[data-issue-chip]");
		await expect(chip).toContainText("Issue #012");
		await expect(chip).toContainText("23 Jan 2026");
		await expect(chip).toContainText("min read");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"This week in AI",
		);
		await expect(page.locator("mark[data-issue-title]")).toHaveText(
			"[ISSUE 012 TITLE]",
		);
		await expect(page.locator("#tried-it")).toBeVisible();
		await expect(page.locator('[data-variant="band"]')).toBeVisible();
	});

	test("issue without a quote has no quote window (AC5)", async ({ page }) => {
		await page.goto("/digest/011");
		await expect(page.locator('[data-window="quote"]')).toHaveCount(0);
	});

	test("the oldest issue has no previous link", async ({ page }) => {
		await page.goto("/digest/010");
		await expect(page.locator("[data-previous]")).toHaveCount(0);
	});

	test("draft issue 013 is not built", async ({ page }) => {
		const response = await page.goto("/digest/013");
		expect(response?.status()).toBe(404);
	});
});
