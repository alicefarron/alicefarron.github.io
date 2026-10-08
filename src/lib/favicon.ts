import { Resvg } from "@resvg/resvg-js";
import { cat } from "../sprites";
import { colorKey, type Sprite, toRects } from "./sprite";
import { type TokenColors, tokenColor, tokenColors } from "./tokens";

export const favicons = {
	svg: { path: "/favicon.svg", canvas: 16 },
	png: { path: "/favicon-32.png", canvas: 16, size: 32 },
	appleTouch: { path: "/apple-touch-icon.png", canvas: 18, size: 180 },
} as const;

export function faviconSprite(): Sprite {
	return {
		...cat,
		name: "favicon",
		rows: cat.rows.map((row) => row.replace(/[^K.]/g, "W")),
	};
}

export function faviconSvg(
	canvas: number = favicons.svg.canvas,
	colors: TokenColors = tokenColors(),
): string {
	const sprite = faviconSprite();
	const left = Math.floor((canvas - sprite.width) / 2);
	const top = Math.floor((canvas - sprite.height) / 2);
	const rects = toRects(sprite)
		.map(
			(rect) =>
				`<rect x="${rect.x + left}" y="${rect.y + top}" width="${rect.w}" height="${rect.h}" fill="${tokenColor(colors, colorKey[rect.color])}"/>`,
		)
		.join("");
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}" shape-rendering="crispEdges"><rect width="${canvas}" height="${canvas}" fill="${tokenColor(colors, "yellow")}"/>${rects}</svg>`;
}

export function faviconPng(icon: { canvas: number; size: number }): Uint8Array {
	return new Resvg(faviconSvg(icon.canvas), {
		fitTo: { mode: "width", value: icon.size },
		shapeRendering: 1,
	})
		.render()
		.asPng();
}
