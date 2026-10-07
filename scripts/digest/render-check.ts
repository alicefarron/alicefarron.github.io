import { spawnSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { parseFrontmatter } from "astro/markdown";
import { findMarkers } from "../../src/lib/author-markers.ts";
import { itemHeadlines, padNumber } from "./issues.ts";

export type RenderCheck = {
	status: "ok" | "failed";
	page: string;
	problems: string[];
	buildOutput: string;
};

export type RenderOptions = {
	notesDir: string;
	cwd: string;
};

export const defaultNotesDir = "tests/fixtures/content/notes";

const issueFileName = /^\d+\.mdx$/;

function buildEnv(contentDir: string): NodeJS.ProcessEnv {
	const env = Object.fromEntries(
		Object.entries(process.env).filter(
			([key]) =>
				!/^(?:VITEST.*|VITE_.*|TEST|MODE|NODE_ENV|DEV|PROD|SSR|BASE_URL|NODE_PATH)$/.test(
					key,
				),
		),
	);
	return { ...env, CONTENT_DIR: contentDir, CONTENT_STRICT: "" };
}

function copyDir(from: string, to: string): void {
	mkdirSync(to, { recursive: true });
	for (const name of readdirSync(from)) {
		const source = join(from, name);
		if (statSync(source).isFile()) {
			copyFileSync(source, join(to, name));
		}
	}
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function containsText(html: string, value: string): boolean {
	return (
		html.includes(value) ||
		html.includes(escapeHtml(value)) ||
		html.includes(escapeHtml(value).replaceAll("&#39;", "&#x27;"))
	);
}

export function renderCheck(
	file: string,
	options: RenderOptions = { notesDir: defaultNotesDir, cwd: process.cwd() },
): RenderCheck {
	const source = readFileSync(file, "utf8");
	const { frontmatter, content } = parseFrontmatter(source);
	const number =
		typeof frontmatter.number === "number" ? frontmatter.number : Number.NaN;
	const page = `digest/${padNumber(number)}/index.html`;
	if (!Number.isInteger(number)) {
		return {
			status: "failed",
			page,
			problems: [`${file} has no numeric frontmatter number`],
			buildOutput: "",
		};
	}
	const work = mkdtempSync(join(tmpdir(), "digest-render-"));
	try {
		const contentDir = join(work, "content");
		const outDir = join(work, "dist");
		mkdirSync(join(contentDir, "digest"), { recursive: true });
		for (const name of readdirSync(dirname(file))) {
			const sibling = join(dirname(file), name);
			if (issueFileName.test(name) && sibling !== file) {
				copyFileSync(sibling, join(contentDir, "digest", name));
			}
		}
		copyFileSync(file, join(contentDir, "digest", `${padNumber(number)}.mdx`));
		copyDir(options.notesDir, join(contentDir, "notes"));
		const build = spawnSync(
			"pnpm",
			["exec", "astro", "build", "--outDir", outDir],
			{ cwd: options.cwd, encoding: "utf8", env: buildEnv(contentDir) },
		);
		const buildOutput = `${build.stdout ?? ""}\n${build.stderr ?? ""}`;
		if (build.status !== 0) {
			return {
				status: "failed",
				page,
				problems: [
					`astro build exited with ${String(build.status)} for ${basename(file)}`,
				],
				buildOutput,
			};
		}
		const pagePath = join(outDir, page);
		if (!existsSync(pagePath)) {
			return {
				status: "failed",
				page,
				problems: [`${page} was not built`],
				buildOutput,
			};
		}
		const html = readFileSync(pagePath, "utf8");
		const problems: string[] = [];
		for (const headline of itemHeadlines(content)) {
			if (!containsText(html, headline)) {
				problems.push(`${page} does not contain the headline "${headline}"`);
			}
		}
		const markers = findMarkers(content).length;
		const marks = (html.match(/<mark class="author-marker"/g) ?? []).length;
		if (marks !== markers) {
			problems.push(
				`${page} has ${marks} author-marker marks for ${markers} markers in the body`,
			);
		}
		return {
			status: problems.length === 0 ? "ok" : "failed",
			page,
			problems,
			buildOutput,
		};
	} finally {
		rmSync(work, { recursive: true, force: true });
	}
}
