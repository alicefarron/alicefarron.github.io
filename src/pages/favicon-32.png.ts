import type { APIRoute } from "astro";
import { faviconPng, favicons } from "../lib/favicon";

export const GET: APIRoute = () =>
	new Response(new Uint8Array(faviconPng(favicons.png)), {
		headers: { "Content-Type": "image/png" },
	});
