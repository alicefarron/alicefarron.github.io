import { expect, test } from "@playwright/test";

test.describe("home", () => {
	test("shows issue 012 and the five newest notes in order (AC1)", async ({
		page,
	}) => {
		await page.goto("/");
		const thisWeek = page.locator('[data-window="this-week"]');
		await expect(thisWeek.getByRole("heading", { level: 2 })).toHaveText(
			"this_week_in_ai.md",
		);
		await expect(thisWeek.locator("[data-issue-number]")).toHaveText(
			"Issue #012",
		);
		await expect(thisWeek).toContainText("[ISSUE 012 TITLE]");
		await expect(thisWeek).toContainText("[ISSUE 012 LEDE]");
		await expect(thisWeek).toContainText("min read");
		await expect(thisWeek.locator("[data-issue-items] li")).toHaveCount(6);
		await expect(
			thisWeek.getByRole("link", { name: "Read issue #012" }),
		).toHaveAttribute("href", "/digest/012");

		const items = page.locator('[data-window="writing"] [data-note]');
		await expect(items).toHaveCount(5);
		expect(
			await items.evaluateAll((nodes) =>
				nodes.map((node) => node.getAttribute("data-note")),
			),
		).toEqual([
			"sample-note-table",
			"sample-note-series",
			"sample-note-cover",
			"sample-note-pinned",
			"sample-note-code",
		]);
		await expect(page.locator('[data-window="latest-note"]')).toContainText(
			"[NOTE 6 TITLE]",
		);
	});

	test("desktop icons link to the R2 targets", async ({ page }) => {
		await page.goto("/");
		const icons = page.locator("[data-desktop-icons] a");
		await expect(icons).toHaveText([
			"digest.txt",
			"writing/",
			"archive/",
			"feed.rss",
			"about.txt",
		]);
		expect(
			await icons.evaluateAll((links) =>
				links.map((link) => link.getAttribute("href")),
			),
		).toEqual(["/digest/012", "/writing", "/digest", "/rss.xml", "/about"]);
	});

	test("phone: icons in a grid above the title, windows full width (AC2)", async ({
		page,
	}, testInfo) => {
		test.skip(testInfo.project.name !== "phone", "runs at 390 px");
		await page.goto("/");
		const title = await page.getByRole("heading", { level: 1 }).boundingBox();
		const icons = await page
			.locator("[data-desktop-icons] a")
			.evaluateAll((links) =>
				links.map((link) => link.getBoundingClientRect().toJSON()),
			);
		expect(title).not.toBeNull();
		for (const icon of icons) {
			expect(icon.bottom).toBeLessThanOrEqual(title?.y ?? 0);
		}
		const rows = new Set(icons.map((icon) => Math.round(icon.y)));
		expect(rows.size).toBeGreaterThan(1);
		const columns = new Set(icons.map((icon) => Math.round(icon.x)));
		expect(columns.size).toBeGreaterThan(1);

		const content = await page
			.locator('[data-window="this-week"]')
			.evaluate(
				(node) =>
					node.parentElement?.getBoundingClientRect().width ??
					node.getBoundingClientRect().width,
			);
		for (const name of ["this-week", "latest-note", "writing"]) {
			const box = await page.locator(`[data-window="${name}"]`).boundingBox();
			expect(Math.abs((box?.width ?? 0) - content)).toBeLessThanOrEqual(1);
		}
		const pet = await page
			.getByText("meow.app", { exact: true })
			.locator("xpath=ancestor::div[contains(@class,'border-window')][1]")
			.boundingBox();
		expect(Math.abs((pet?.width ?? 0) - content)).toBeLessThanOrEqual(1);
	});

	test("desktop: icons in one column left of the title (AC3)", async ({
		page,
	}, testInfo) => {
		test.skip(testInfo.project.name !== "desktop", "runs at 1280 px");
		await page.goto("/");
		const title = await page.getByRole("heading", { level: 1 }).boundingBox();
		const icons = await page
			.locator("[data-desktop-icons] a")
			.evaluateAll((links) =>
				links.map((link) => link.getBoundingClientRect().toJSON()),
			);
		const xs = new Set(icons.map((icon) => Math.round(icon.x)));
		expect(xs.size).toBe(1);
		for (const icon of icons) {
			expect(icon.right).toBeLessThanOrEqual(title?.x ?? 0);
		}
	});

	test("subscribe dialog and footer are present", async ({ page }) => {
		await page.goto("/");
		const dialog = page.locator('#subscribe[data-variant="dialog"]');
		await expect(
			dialog.getByRole("button", { name: "Subscribe" }),
		).toBeVisible();
		await expect(dialog.getByRole("link", { name: "Not now" })).toBeVisible();
		await expect(page.getByRole("contentinfo")).toHaveText("© 2026 alina.os");
	});
});
