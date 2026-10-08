import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { compile } from "tailwindcss";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const tokensCss = readFileSync(join(root, "src/styles/tokens.css"), "utf8");

const specColors: Record<string, string> = {
	ink: "#111111",
	paper: "#F4F3EF",
	white: "#FFFFFF",
	sky: "#9FD3F7",
	"sky-dot": "#7BB8E3",
	yellow: "#FFE45C",
	pink: "#FF9BD6",
	lime: "#B8F28B",
	lavender: "#E9E6F7",
	"lavender-dot": "#C9C3E6",
	"sprite-blue": "#3B6FE0",
	"sprite-green": "#7BC86C",
	"link-hover": "#2348C4",
	"terminal-text": "#E8E8E8",
	"terminal-dim": "#6F6F6F",
	"pet-blush": "#FFF6F9",
};

const defaultPalette = [
	"slate",
	"gray",
	"zinc",
	"neutral",
	"stone",
	"red",
	"orange",
	"amber",
	"yellow",
	"lime",
	"green",
	"emerald",
	"teal",
	"cyan",
	"sky",
	"blue",
	"indigo",
	"violet",
	"purple",
	"fuchsia",
	"pink",
	"rose",
];
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function declaredColors(css: string): Map<string, string> {
	const colors = new Map<string, string>();
	for (const match of css.matchAll(
		/--color-([a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g,
	)) {
		const [, name, value] = match;
		if (name !== undefined && value !== undefined) {
			colors.set(name, value.toUpperCase());
		}
	}
	return colors;
}

async function buildCss(candidates: string[]): Promise<string> {
	const stylesDir = join(root, "src/styles");
	const compiler = await compile(
		readFileSync(join(stylesDir, "global.css"), "utf8"),
		{
			base: stylesDir,
			async loadStylesheet(id, base) {
				const path =
					id === "tailwindcss"
						? join(root, "node_modules/tailwindcss/index.css")
						: resolve(base, id);
				return {
					path,
					base: dirname(path),
					content: readFileSync(path, "utf8"),
				};
			},
		},
	);
	return compiler.build(candidates);
}

describe("design tokens", () => {
	it("defines every spec color with its exact hex value", () => {
		const colors = declaredColors(tokensCss);
		for (const [name, hex] of Object.entries(specColors)) {
			expect(colors.get(name), name).toBe(hex);
		}
	});

	it("defines no hex colors beyond the spec table", () => {
		const colors = declaredColors(tokensCss);
		expect([...colors.keys()].sort()).toEqual(Object.keys(specColors).sort());
	});

	it("does not use the canvas pink for shadows", () => {
		expect(tokensCss.toUpperCase()).not.toContain("#FF8AD8");
	});

	it("resets the Tailwind default color, font and shadow themes", () => {
		expect(tokensCss).toMatch(/--color-\*:\s*initial/);
		expect(tokensCss).toMatch(/--font-\*:\s*initial/);
		expect(tokensCss).toMatch(/--shadow-\*:\s*initial/);
	});

	it("builds CSS with no Tailwind default palette names", async () => {
		const candidates = defaultPalette.flatMap((name) =>
			shades.flatMap((shade) => [
				`bg-${name}-${shade}`,
				`text-${name}-${shade}`,
				`border-${name}-${shade}`,
			]),
		);
		const css = await buildCss([
			...candidates,
			"bg-sky",
			"text-ink",
			"shadow-hard-md",
			"font-sans",
			"shadow-lg",
		]);
		const pattern = new RegExp(
			`(?:--color-|\\.(?:bg|text|border)-)(?:${defaultPalette.join("|")})-\\d+`,
		);
		expect(css).not.toMatch(pattern);
		expect(css).toContain("--color-sky: #9fd3f7");
		expect(css).not.toMatch(/\.font-sans\b/);
		expect(css).not.toMatch(/\.shadow-lg\b/);
	});
});
