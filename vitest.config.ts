import { getViteConfig } from "astro/config";
import type {} from "vitest/config";

export default getViteConfig({
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					include: ["tests/unit/**/*.test.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "build",
					include: ["tests/build/**/*.test.ts"],
					testTimeout: 180_000,
					hookTimeout: 180_000,
					fileParallelism: false,
				},
			},
		],
	},
});
