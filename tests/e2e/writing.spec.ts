import { expect, test } from "@playwright/test";

test.describe("writing index", () => {
	test("pinned note is in pinned.md and in all_notes/, count matches (AC7)", async ({
		page,
	}) => {
		await page.goto("/writing");
		const pinned = page.locator('[data-window="pinned"]');
		await expect(pinned.locator("[data-note]")).toHaveAttribute(
			"data-note",
			"sample-note-pinned",
		);
		await expect(pinned).toContainText("[NOTE 3 TITLE]");
		const all = page.locator('[data-window="all-notes"] [data-note]');
		await expect(all).toHaveCount(6);
		await expect(
			page.locator(
				'[data-window="all-notes"] [data-note="sample-note-pinned"]',
			),
		).toHaveCount(1);
		await expect(page.locator("[data-count]")).toHaveText("6 notes");
		await expect(page.getByText("[NOTE 7 TITLE]")).toHaveCount(0);
	});
});
