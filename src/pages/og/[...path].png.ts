import type { APIRoute, GetStaticPaths } from "astro";
import { type OgPage, ogTree, renderOgPng } from "../../lib/og";
import { ogRoutes } from "../../lib/og-pages";

export const getStaticPaths = (() => ogRoutes()) satisfies GetStaticPaths;

export const GET: APIRoute<{ page: OgPage }> = async ({ props }) => {
	const png = await renderOgPng(ogTree(props.page));
	return new Response(new Uint8Array(png), {
		headers: { "Content-Type": "image/png" },
	});
};
