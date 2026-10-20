import { expect, type Page, test } from "@playwright/test";

const buttondown = "https://buttondown.com/api/emails/embed-subscribe/**";

async function bandForm(page: Page) {
	await page.goto("/digest/012");
	const band = page.locator('[data-subscribe][data-variant="band"]');
	await band.scrollIntoViewIfNeeded();
	await expect(band.locator("astro-island")).not.toHaveAttribute("ssr", /.*/);
	return band;
}

test.describe("subscribe form (AC12)", () => {
	test("an invalid email shows an assertive error and keeps the value", async ({
		page,
	}) => {
		const band = await bandForm(page);
		const input = band.getByLabel("Email address");
		await input.fill("not-an-email");
		await band.getByRole("button", { name: "Subscribe" }).click();
		const error = band.locator("[data-subscribe-error]");
		await expect(error).toHaveAttribute("aria-live", "assertive");
		await expect(error).toHaveText("Enter a valid email address.");
		await expect(input).toHaveValue("not-an-email");
		await expect(input).toHaveAttribute("aria-invalid", "true");
		await expect(input).toBeFocused();
	});

	test("offline shows an assertive error and keeps the value", async ({
		page,
		context,
	}) => {
		const band = await bandForm(page);
		const input = band.getByLabel("Email address");
		await input.fill("reader@example.com");
		await context.setOffline(true);
		await band.getByRole("button", { name: "Subscribe" }).click();
		await expect(band.locator("[data-subscribe-error]")).toHaveText(
			"You seem to be offline. Your email is still here, try again when connected.",
		);
		await expect(input).toHaveValue("reader@example.com");
		await context.setOffline(false);
	});

	test("a valid email posts to Buttondown in a new tab and shows the sent state", async ({
		page,
		context,
	}) => {
		await context.route(buttondown, (route) =>
			route.fulfill({
				status: 200,
				contentType: "text/html",
				body: "<p>ok</p>",
			}),
		);
		const band = await bandForm(page);
		const input = band.getByLabel("Email address");
		await input.fill("reader@example.com");
		const [popup, request] = await Promise.all([
			context.waitForEvent("page"),
			context.waitForEvent("request", (r) =>
				r.url().startsWith("https://buttondown.com/"),
			),
			band.getByRole("button", { name: "Subscribe" }).click(),
		]);
		expect(popup.url()).toContain(
			"https://buttondown.com/api/emails/embed-subscribe/",
		);
		expect(request.method()).toBe("POST");
		await expect(band.locator("[data-subscribe-status]")).toHaveText(
			"Almost done. Finish in the Buttondown tab, then confirm the email sent to reader@example.com.",
		);
		await expect(band.locator("[data-subscribe-error]")).toHaveText("");
		await expect(input).toHaveValue("reader@example.com");
	});

	test("the Home dialog has one Subscribe button and no Not now", async ({
		page,
	}) => {
		await page.goto("/");
		const dialog = page.locator('[data-subscribe][data-variant="dialog"]');
		await expect(dialog.getByRole("button")).toHaveCount(1);
		await expect(
			dialog.getByRole("button", { name: "Subscribe" }),
		).toBeVisible();
		await expect(dialog).not.toContainText("Not now");
		await expect(dialog).toContainText("One issue a week, every Monday.");
	});

	test.describe("without JavaScript", () => {
		test.use({ javaScriptEnabled: false });

		test("the form still posts natively and the live regions are empty", async ({
			page,
		}) => {
			await page.goto("/digest/012");
			const form = page.locator('[data-variant="band"] form');
			await expect(form).toHaveAttribute("method", "post");
			await expect(form).toHaveAttribute("target", "_blank");
			await expect(form.locator("[data-subscribe-error]")).toHaveText("");
		});
	});
});
