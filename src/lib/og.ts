import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { cat } from "../sprites";
import { issueLabel } from "./format";
import { ogImageSize } from "./seo";
import { colorKey, type Sprite, toRects } from "./sprite";
import { type TokenColors, tokenColor, tokenColors } from "./tokens";

export type OgPage =
	| { kind: "page"; title: string; subtitle?: string }
	| { kind: "issue"; title: string; issueNumber: number }
	| { kind: "note"; title: string; tag: string };

type OgChild = OgElement | string | number;

export type OgElement = {
	type: string;
	props: {
		style?: Record<string, string | number>;
		src?: string;
		width?: number;
		height?: number;
		children?: OgChild | OgChild[];
	};
};

function el(
	type: string,
	style: Record<string, string | number>,
	children?: OgChild | OgChild[],
): OgElement {
	return { type, props: { style: { display: "flex", ...style }, children } };
}

export function spriteDataUri(sprite: Sprite, colors: TokenColors): string {
	const rects = toRects(sprite)
		.map(
			(rect) =>
				`<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${tokenColor(colors, colorKey[rect.color])}"/>`,
		)
		.join("");
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sprite.width} ${sprite.height}" shape-rendering="crispEdges">${rects}</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function dotsDataUri(color: string): string {
	const { width, height } = ogImageSize;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges"><defs><pattern id="d" width="24" height="24" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="6" height="6" fill="${color}"/></pattern></defs><rect width="${width}" height="${height}" fill="url(#d)"/></svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function windowTitle(page: OgPage): string {
	if (page.kind === "issue") {
		return "this_week_in_ai.md";
	}
	if (page.kind === "note") {
		return "note.txt";
	}
	return "alina.os";
}

function titleSize(title: string): number {
	if (title.length > 48) {
		return 52;
	}
	if (title.length > 24) {
		return 64;
	}
	return 88;
}

function chip(
	text: string,
	background: string,
	colors: TokenColors,
): OgElement {
	return el(
		"div",
		{
			fontFamily: "Silkscreen",
			fontSize: 26,
			color: tokenColor(colors, "ink"),
			background,
			border: `3px solid ${tokenColor(colors, "ink")}`,
			padding: "6px 14px",
		},
		text,
	);
}

export function ogTree(
	page: OgPage,
	colors: TokenColors = tokenColors(),
): OgElement {
	const ink = tokenColor(colors, "ink");
	const white = tokenColor(colors, "white");
	const stripes = Array.from({ length: 6 }, () =>
		el("div", { height: 2, background: ink, marginBottom: 3 }),
	);
	const titleBar = el(
		"div",
		{
			position: "relative",
			height: 48,
			alignItems: "center",
			justifyContent: "center",
			borderBottom: `3px solid ${ink}`,
			background: white,
		},
		[
			el(
				"div",
				{
					position: "absolute",
					left: 12,
					right: 12,
					top: 9,
					flexDirection: "column",
				},
				stripes,
			),
			el("div", {
				position: "absolute",
				left: 24,
				top: 12,
				width: 22,
				height: 22,
				background: white,
				border: `3px solid ${ink}`,
			}),
			el(
				"div",
				{
					fontFamily: "Silkscreen",
					fontSize: 24,
					color: ink,
					background: white,
					padding: "0 16px",
				},
				windowTitle(page),
			),
		],
	);
	const chips: OgElement[] =
		page.kind === "issue"
			? [
					chip(
						issueLabel(page.issueNumber),
						tokenColor(colors, "yellow"),
						colors,
					),
					chip("This week in AI", tokenColor(colors, "sky"), colors),
				]
			: page.kind === "note"
				? [chip(page.tag, tokenColor(colors, "pink"), colors)]
				: [];
	const body = el(
		"div",
		{
			flexDirection: "column",
			flexGrow: 1,
			justifyContent: "space-between",
			padding: "36px 44px",
			background: white,
		},
		[
			el("div", { flexDirection: "column", gap: 24 }, [
				el("div", { gap: 16 }, chips),
				el(
					"div",
					{
						fontFamily: "Pixelify Sans",
						fontWeight: 700,
						fontSize: titleSize(page.title),
						lineHeight: 1.05,
						textTransform: "uppercase",
						color: ink,
					},
					page.title,
				),
				...(page.kind === "page" && page.subtitle !== undefined
					? [
							el(
								"div",
								{ fontFamily: "Space Mono", fontSize: 28, color: ink },
								page.subtitle,
							),
						]
					: []),
			]),
			el("div", { alignItems: "center", gap: 18 }, [
				{
					type: "img",
					props: {
						src: spriteDataUri(cat, colors),
						width: cat.width * 5,
						height: cat.height * 5,
					},
				},
				el(
					"div",
					{
						fontFamily: "Space Mono",
						fontWeight: 700,
						fontSize: 30,
						color: ink,
					},
					"alina.os",
				),
			]),
		],
	);
	return el(
		"div",
		{
			position: "relative",
			width: ogImageSize.width,
			height: ogImageSize.height,
			padding: "56px 80px 66px 70px",
			backgroundColor: tokenColor(colors, "sky"),
		},
		[
			{
				type: "img",
				props: {
					src: dotsDataUri(tokenColor(colors, "sky-dot")),
					width: ogImageSize.width,
					height: ogImageSize.height,
					style: { position: "absolute", left: 0, top: 0 },
				},
			},
			el(
				"div",
				{
					flexDirection: "column",
					flexGrow: 1,
					border: `3px solid ${ink}`,
					background: white,
					boxShadow: `10px 10px 0 0 ${ink}`,
				},
				[titleBar, body],
			),
		],
	);
}

const fontFiles = [
	{
		name: "Pixelify Sans",
		weight: 700,
		file: "pixelify-sans/files/pixelify-sans-latin-700-normal.woff",
	},
	{
		name: "Silkscreen",
		weight: 400,
		file: "silkscreen/files/silkscreen-latin-400-normal.woff",
	},
	{
		name: "Space Mono",
		weight: 400,
		file: "space-mono/files/space-mono-latin-400-normal.woff",
	},
	{
		name: "Space Mono",
		weight: 700,
		file: "space-mono/files/space-mono-latin-700-normal.woff",
	},
] as const;

type LoadedFont = {
	name: string;
	weight: 400 | 700;
	style: "normal";
	data: Buffer;
};

let fontsPromise: Promise<LoadedFont[]> | undefined;

function loadFonts(): Promise<LoadedFont[]> {
	fontsPromise ??= Promise.all(
		fontFiles.map(async (font) => ({
			name: font.name,
			weight: font.weight,
			style: "normal" as const,
			data: await readFile(
				join(process.cwd(), "node_modules/@fontsource", font.file),
			),
		})),
	);
	return fontsPromise;
}

export async function renderOgPng(tree: OgElement): Promise<Uint8Array> {
	const svg = await satori(tree as Parameters<typeof satori>[0], {
		width: ogImageSize.width,
		height: ogImageSize.height,
		fonts: await loadFonts(),
	});
	return new Resvg(svg, { fitTo: { mode: "width", value: ogImageSize.width } })
		.render()
		.asPng();
}
