import { defineConfig, devices } from "@playwright/test";

const port = 4322;

export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: `http://localhost:${port}`,
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "phone",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 390, height: 844 },
				hasTouch: true,
				isMobile: true,
			},
		},
		{
			name: "tablet",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 820, height: 1180 },
				hasTouch: true,
				isMobile: true,
			},
		},
		{
			name: "desktop",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 800 },
			},
		},
	],
	webServer: {
		command: `pnpm build && pnpm preview --port ${port} --ignore-lock`,
		url: `http://localhost:${port}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
		env: {
			CONTENT_DIR: "tests/fixtures/content",
		},
	},
});
