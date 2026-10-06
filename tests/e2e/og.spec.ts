import { expect, test } from "@playwright/test";

test.describe("og images", () => {
	test.skip(
		({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
		"one run is enough",
	);

	test("issue 012 OG image matches the approved look (AC18)", async ({
		request,
	}) => {
		const response = await request.get("/og/digest/012.png");
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toContain("image/png");
		expect(await response.body()).toMatchSnapshot("og-digest-012.png");
	});
});
