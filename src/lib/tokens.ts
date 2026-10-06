import { readFileSync } from "node:fs";
import { join } from "node:path";

export type TokenColors = Record<string, string>;

export function parseTokenColors(css: string): TokenColors {
	const colors: TokenColors = {};
	for (const match of css.matchAll(
		/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g,
	)) {
		const [, name, value] = match;
		if (name !== undefined && value !== undefined) {
			colors[name] = value.toLowerCase();
		}
	}
	return colors;
}

export function tokenColors(): TokenColors {
	return parseTokenColors(
		readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8"),
	);
}

export function tokenColor(colors: TokenColors, name: string): string {
	const value = colors[name];
	if (value === undefined) {
		throw new Error(`Missing color token --color-${name} in tokens.css`);
	}
	return value;
}
