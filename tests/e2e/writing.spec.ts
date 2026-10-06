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

test.describe("article", () => {
	test("code block is a Terminal with the file label and scrolls at 390 px (AC8)", async ({
		page,
	}, testInfo) => {
		test.skip(testInfo.project.name !== "phone", "runs at 390 px");
		await page.goto("/writing/sample-note-code");
		const block = page.locator("[data-note-body] figure").first();
		await expect(block.getByText("example.ts", { exact: true })).toBeVisible();
		const scroller = block.locator("[data-code-scroll]");
		await expect(scroller).toHaveAttribute("role", "region");
		await expect(scroller).toHaveAttribute("tabindex", "0");
		const scrolls = await scroller.evaluate(
			(node) => node.scrollWidth > node.clientWidth,
		);
		expect(scrolls).toBe(true);
		const overflow = await page.evaluate(
			() =>
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(0);
	});

	test("the oldest note has no previous link (AC9)", async ({ page }) => {
		await page.goto("/writing/sample-note-one");
		await expect(page.locator('[data-neighbour="previous"]')).toHaveCount(0);
		await expect(page.locator('[data-neighbour="next"]')).toHaveAttribute(
			"href",
			"/writing/sample-note-code",
		);
	});

	test("hero, tl;dr and next link render", async ({ page }) => {
		await page.goto("/writing/sample-note-code");
		await expect(
			page.getByRole("link", { name: "← writing/" }),
		).toHaveAttribute("href", "/writing");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"[NOTE 2 TITLE]",
		);
		const meta = page.locator("[data-note-meta]");
		await expect(meta).toContainText("Alina Shaimieva");
		await expect(meta).toContainText("12 Jan 2026");
		await expect(meta).toContainText("min read");
		await expect(page.locator('[data-window="tldr"] li')).toHaveText([
			"[NOTE 2 TLDR 1]",
			"[NOTE 2 TLDR 2]",
		]);
		await expect(page.locator('[data-neighbour="next"]')).toHaveAttribute(
			"href",
			"/writing/sample-note-pinned",
		);
		await expect(page.locator('[data-variant="band"]')).toBeVisible();
	});

	test("the newest note has no next link", async ({ page }) => {
		await page.goto("/writing/sample-note-table");
		await expect(page.locator('[data-neighbour="next"]')).toHaveCount(0);
	});

	test("wide tables scroll in their own box", async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== "phone", "runs at 390 px");
		await page.goto("/writing/sample-note-table");
		const scroller = page.locator("[data-table-scroll]");
		expect(
			await scroller.evaluate((node) => node.scrollWidth > node.clientWidth),
		).toBe(true);
	});
});
