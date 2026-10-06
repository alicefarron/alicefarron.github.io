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
