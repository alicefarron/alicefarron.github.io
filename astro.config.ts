import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import {
	defineConfig,
	fontProviders,
	passthroughImageService,
} from "astro/config";
import { authorMarkerPlugin } from "./src/lib/author-marker-plugin";
import { codeMetaTransformer } from "./src/lib/code-meta";
import { includeInSitemap, resolveSiteUrl } from "./src/lib/seo";

type Weight = 400 | 600 | 700;

function fontsourceVariants(
	slug: string,
	[first, ...rest]: [Weight, ...Weight[]],
) {
	const variant = (weight: Weight) => ({
		weight,
		style: "normal" as const,
		display: "swap" as const,
		src: [`@fontsource/${slug}/files/${slug}-latin-${weight}-normal.woff2`] as [
			string,
		],
	});
	return {
		variants: [variant(first), ...rest.map(variant)] as [
			ReturnType<typeof variant>,
			...ReturnType<typeof variant>[],
		],
	};
}

export default defineConfig({
	site: resolveSiteUrl(process.env),
	output: "static",
	trailingSlash: "never",
	build: {
		format: "directory",
	},
	integrations: [mdx(), preact(), sitemap({ filter: includeInSitemap })],
	image: {
		service: passthroughImageService(),
	},
	markdown: {
		processor: satteri({ hastPlugins: [authorMarkerPlugin] }),
		shikiConfig: {
			transformers: [codeMetaTransformer],
		},
	},
	fonts: [
		{
			name: "Pixelify Sans",
			cssVariable: "--font-pixelify",
			provider: fontProviders.local(),
			options: fontsourceVariants("pixelify-sans", [600, 700]),
			fallbacks: ["monospace"],
		},
		{
			name: "Silkscreen",
			cssVariable: "--font-silkscreen",
			provider: fontProviders.local(),
			options: fontsourceVariants("silkscreen", [400]),
			fallbacks: ["monospace"],
		},
		{
			name: "Space Mono",
			cssVariable: "--font-space-mono",
			provider: fontProviders.local(),
			options: fontsourceVariants("space-mono", [400, 700]),
			fallbacks: ["monospace"],
		},
		{
			name: "Atkinson Hyperlegible Next",
			cssVariable: "--font-atkinson",
			provider: fontProviders.local(),
			options: fontsourceVariants("atkinson-hyperlegible-next", [400, 700]),
			fallbacks: ["sans-serif"],
		},
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
