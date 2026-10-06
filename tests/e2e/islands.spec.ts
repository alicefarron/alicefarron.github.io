import { expect, test } from "@playwright/test";

test.describe("meow.app", () => {
	test("four presses show the fifth line and a fifth keeps it (AC11)", async ({
		page,
	}) => {
		await page.goto("/");
		const pet = page.locator('[data-window="meow"]');
		const button = pet.getByRole("button", { name: "Pet the cat" });
		const status = pet.locator("[data-pet-status]");
		await button.scrollIntoViewIfNeeded();
		await expect(button).toBeVisible();
		await expect(status).toHaveText("zzz... (idle)");
		const expected = [
			"purr",
			"purr purr",
			"PURR. cpu usage: 0.4%",
			"ok that is enough",
		];
		for (const line of expected) {
			await button.click();
			await expect(status).toHaveText(line);
		}
		await button.click();
		await expect(status).toHaveText("ok that is enough");
	});

	test.describe("without JavaScript", () => {
		test.use({ javaScriptEnabled: false });

		test("the button is hidden and the idle line shows (R8)", async ({
			page,
		}) => {
			await page.goto("/");
			const pet = page.locator('[data-window="meow"]');
			await expect(pet.locator("[data-pet-status]")).toHaveText(
				"zzz... (idle)",
			);
			await expect(
				pet.getByRole("button", { name: "Pet the cat" }),
			).toBeHidden();
		});
	});
});

test.describe("archive filter", () => {
	test("pressing Agents shows only Agents issues and updates the count (AC6)", async ({
		page,
	}) => {
		await page.goto("/digest");
		const group = page.getByRole("group", { name: "Filter by topic" });
		await expect(group).toBeVisible();
		const agents = group.getByRole("button", { name: "Agents" });
		await agents.click();
		await expect(agents).toHaveAttribute("aria-pressed", "true");
		await expect(group.getByRole("button", { name: "All" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		const items = page.locator("[data-issue]");
		await expect(items).toHaveCount(1);
		await expect(items.first()).toHaveAttribute("data-issue", "12");
		await expect(page.locator("[data-count]")).toHaveText("1 issue");
		await agents.click();
		await expect(agents).toHaveAttribute("aria-pressed", "false");
		await expect(items).toHaveCount(3);
		await expect(page.locator("[data-count]")).toHaveText("3 issues");
	});

	test.describe("without JavaScript", () => {
		test.use({ javaScriptEnabled: false });

		test("all issues show and no filter buttons render (AC6)", async ({
			page,
		}) => {
			await page.goto("/digest");
			await expect(page.locator("[data-issue]")).toHaveCount(3);
			await expect(page.locator("[data-count]")).toHaveText("3 issues");
			await expect(
				page.getByRole("group", { name: "Filter by topic" }),
			).toBeHidden();
			await expect(page.locator("[data-filters] button").first()).toBeHidden();
		});
	});
});

test.describe("writing filter", () => {
	test("pressing a tag shows only notes with that tag (R5)", async ({
		page,
	}) => {
		await page.goto("/writing");
		const group = page.getByRole("group", { name: "Filter by tag" });
		const architecture = group.getByRole("button", { name: "Architecture" });
		await architecture.click();
		await expect(architecture).toHaveAttribute("aria-pressed", "true");
		const items = page.locator('[data-window="all-notes"] [data-note]');
		await expect(items).toHaveCount(2);
		expect(
			await items.evaluateAll((nodes) =>
				nodes.map((node) => node.getAttribute("data-note")),
			),
		).toEqual(["sample-note-table", "sample-note-one"]);
		await expect(page.locator("[data-count]")).toHaveText("2 notes");
	});

	test.describe("without JavaScript", () => {
		test.use({ javaScriptEnabled: false });

		test("all notes show and no filter buttons render", async ({ page }) => {
			await page.goto("/writing");
			await expect(
				page.locator('[data-window="all-notes"] [data-note]'),
			).toHaveCount(6);
			await expect(
				page.getByRole("group", { name: "Filter by tag" }),
			).toBeHidden();
		});
	});
});
