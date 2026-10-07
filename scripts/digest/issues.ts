import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "astro/markdown";
import { extractUrls } from "./urls.ts";

export type IssueFile = {
	number: number;
	file: string;
	date: string;
	draft: boolean;
	title: string;
	urls: string[];
	headlines: string[];
};

const issueFileName = /^(\d+)\.mdx$/;

export const itemTag =
	/<Item\b[^>]*?\bheadline=(?:"([^"]*)"|'([^']*)'|\{\s*"([^"]*)"\s*\})/g;

export function frontmatterDate(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	return typeof value === "string" ? value.slice(0, 10) : "";
}

export function itemHeadlines(body: string): string[] {
	return [...body.matchAll(itemTag)]
		.map((match) => match[1] ?? match[2] ?? match[3] ?? "")
		.filter((headline) => headline.trim() !== "");
}

export function padNumber(number: number): string {
	return String(number).padStart(3, "0");
}

export function parseIssue(file: string, source: string): IssueFile {
	const { frontmatter, content } = parseFrontmatter(source);
	const stem = issueFileName.exec(file.split("/").pop() ?? "")?.[1] ?? "";
	const number =
		typeof frontmatter.number === "number"
			? frontmatter.number
			: Number.parseInt(stem, 10);
	return {
		number,
		file,
		date: frontmatterDate(frontmatter.date),
		draft: frontmatter.draft === true,
		title: typeof frontmatter.title === "string" ? frontmatter.title : "",
		urls: extractUrls(source),
		headlines: itemHeadlines(content),
	};
}

export function readIssues(contentDir: string): IssueFile[] {
	const dir = join(contentDir, "digest");
	let names: string[];
	try {
		names = readdirSync(dir);
	} catch {
		return [];
	}
	return names
		.filter((name) => issueFileName.test(name))
		.map((name) => {
			const file = join(dir, name);
			return parseIssue(file, readFileSync(file, "utf8"));
		})
		.sort((a, b) => a.number - b.number);
}
