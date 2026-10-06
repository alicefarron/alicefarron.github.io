import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

export const budgetBytes = 30 * 1024;

export type PageReport = {
	page: string;
	bytes: number;
	files: string[];
};

const scriptTag = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const srcAttr = /\bsrc\s*=\s*["']([^"']+)["']/i;
const typeAttr = /\btype\s*=\s*["']([^"']+)["']/i;
const islandAttr =
	/\b(?:component-url|renderer-url|before-hydration-url)\s*=\s*["']([^"']+)["']/gi;
const importSpecifier =
	/(?:\bimport\s*(?:[\w*{}\s,$]+\s*from\s*)?|\bimport\s*\(\s*)["']([^"']+\.m?js)["']/g;

function isJavaScriptType(attributes: string): boolean {
	const type = typeAttr.exec(attributes)?.[1]?.toLowerCase();
	return (
		type === undefined ||
		type === "module" ||
		type === "text/javascript" ||
		type === "application/javascript"
	);
}

function resolveAsset(
	distDir: string,
	fromFile: string,
	specifier: string,
): string | undefined {
	if (/^(?:[a-z]+:)?\/\//i.test(specifier) || specifier.startsWith("data:")) {
		return undefined;
	}
	const clean = specifier.split(/[?#]/)[0] ?? specifier;
	const path = clean.startsWith("/")
		? join(distDir, clean)
		: resolve(dirname(fromFile), clean);
	return existsSync(path) ? path : undefined;
}

function collectModule(distDir: string, file: string, seen: Set<string>): void {
	if (seen.has(file)) {
		return;
	}
	seen.add(file);
	const source = readFileSync(file, "utf8");
	for (const match of source.matchAll(importSpecifier)) {
		const specifier = match[1];
		if (specifier === undefined) {
			continue;
		}
		const target = resolveAsset(distDir, file, specifier);
		if (target !== undefined) {
			collectModule(distDir, target, seen);
		}
	}
}

function gzipSize(content: string | Buffer): number {
	return gzipSync(content, { level: 9 }).length;
}

export function measurePage(distDir: string, htmlFile: string): PageReport {
	const html = readFileSync(htmlFile, "utf8");
	const files = new Set<string>();
	let inlineBytes = 0;

	for (const match of html.matchAll(scriptTag)) {
		const attributes = match[1] ?? "";
		const body = match[2] ?? "";
		if (!isJavaScriptType(attributes)) {
			continue;
		}
		const src = srcAttr.exec(attributes)?.[1];
		if (src !== undefined) {
			const target = resolveAsset(distDir, htmlFile, src);
			if (target !== undefined) {
				collectModule(distDir, target, files);
			}
		} else if (body.trim().length > 0) {
			inlineBytes += gzipSize(body);
			for (const imported of body.matchAll(importSpecifier)) {
				const specifier = imported[1];
				const target =
					specifier === undefined
						? undefined
						: resolveAsset(distDir, htmlFile, specifier);
				if (target !== undefined) {
					collectModule(distDir, target, files);
				}
			}
		}
	}

	for (const match of html.matchAll(islandAttr)) {
		const url = match[1];
		const target =
			url === undefined ? undefined : resolveAsset(distDir, htmlFile, url);
		if (target !== undefined) {
			collectModule(distDir, target, files);
		}
	}

	let bytes = inlineBytes;
	for (const file of files) {
		bytes += gzipSize(readFileSync(file));
	}

	return {
		page: relative(distDir, htmlFile),
		bytes,
		files: [...files].map((file) => relative(distDir, file)).sort(),
	};
}

function listHtml(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			out.push(...listHtml(path));
		} else if (name.endsWith(".html")) {
			out.push(path);
		}
	}
	return out.sort();
}

export function measureDist(distDir: string): PageReport[] {
	return listHtml(distDir).map((file) => measurePage(distDir, file));
}

function formatKb(bytes: number): string {
	return `${(bytes / 1024).toFixed(1)} KB`;
}

export function run(distDir: string): number {
	if (!existsSync(distDir)) {
		console.error(`js-budget: ${distDir} does not exist. Run the build first.`);
		return 1;
	}
	const reports = measureDist(distDir);
	let failed = 0;
	for (const report of reports) {
		const over = report.bytes > budgetBytes;
		if (over) {
			failed += 1;
		}
		console.log(
			`${over ? "FAIL" : "ok  "} ${formatKb(report.bytes).padStart(9)}  ${report.page}`,
		);
	}
	if (failed > 0) {
		console.error(
			`js-budget: ${failed} page(s) over ${formatKb(budgetBytes)} gzipped JS`,
		);
		return 1;
	}
	console.log(
		`js-budget: ${reports.length} page(s) within ${formatKb(budgetBytes)}`,
	);
	return 0;
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
	process.exitCode = run(resolve(process.argv[2] ?? "dist"));
}
