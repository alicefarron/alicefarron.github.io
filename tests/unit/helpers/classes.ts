import { readFileSync } from "node:fs";
import { join } from "node:path";

const tokensCss = readFileSync(
	join(process.cwd(), "src/styles/tokens.css"),
	"utf8",
);

const colorTokens = new Set(
	[...tokensCss.matchAll(/--color-([a-z-]+):/g)].map((match) => match[1]),
);

const shadowTokens = new Set(
	[...tokensCss.matchAll(/--shadow-([a-z-]+):/g)].map((match) => match[1]),
);

const nonColorSuffixes = new Set([
	"window",
	"b-window",
	"t-window",
	"y-window",
	"titlebar-stripes",
	"dots-sky",
	"dots-lavender",
	"center",
	"left",
	"right",
	"label",
	"label-sm",
	"label-lg",
	"ui",
	"ui-sm",
	"ui-lg",
	"body",
	"h1",
	"h2",
	"h3",
	"title",
	"none",
	"wrap",
	"nowrap",
	"balance",
	"pretty",
	"clip",
	"ellipsis",
	"start",
	"end",
	"justify",
	"collapse",
	"separate",
	"x-auto",
	"auto",
	"3",
	"offset-2",
	"solid",
	"dashed",
	"dotted",
	"double",
	"stairs",
]);

export function classes(html: string): string[] {
	return [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
		(match[1] ?? "").split(/\s+/).filter(Boolean),
	);
}

export function colorUtilityProblems(html: string): string[] {
	return classes(html).flatMap((name) => {
		const color =
			/^(?:[a-z@-]+:)*(?:bg|text|border|shadow|outline|fill|stroke|decoration)-([a-z0-9-]+)$/.exec(
				name,
			);
		if (color === null) {
			return [];
		}
		const value = color[1] ?? "";
		if (nonColorSuffixes.has(value) || /^(?:[trblxy]-)?\d+$/.test(value)) {
			return [];
		}
		if (/^hard-(sm|md|lg)$/.test(value)) {
			return shadowTokens.has(value) ? [] : [name];
		}
		return colorTokens.has(value) ? [] : [name];
	});
}

export function hasArbitraryValues(html: string): boolean {
	return classes(html).some((name) => /-\[[^\]]*\]/.test(name));
}
