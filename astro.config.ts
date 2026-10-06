import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

export default defineConfig({
	output: "static",
	trailingSlash: "never",
	build: {
		format: "directory",
	},
	integrations: [mdx()],
});
