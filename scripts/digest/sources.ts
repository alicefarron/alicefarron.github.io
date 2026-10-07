import { readFileSync } from "node:fs";

export const sourceTopics = ["Models", "Tooling", "Agents", "Papers"] as const;

export type SourceTopic = (typeof sourceTopics)[number];

export type Source = {
	topic: SourceTopic;
	name: string;
	url: string;
	note: string;
};

export type SourceGroup = {
	topic: SourceTopic;
	sources: Source[];
};

export type ParsedSources = {
	groups: SourceGroup[];
	problems: string[];
};

export const sourcesPath = ".claude/skills/digest/sources.md";

const headingLine = /^##\s+(.+?)\s*$/;
const sourceLine = /^- \[([^\]]+)\]\((https?:\/\/[^\s)]+)\):\s+(\S.*)$/;

function isTopic(value: string): value is SourceTopic {
	return (sourceTopics as readonly string[]).includes(value);
}

export function parseSources(markdown: string): ParsedSources {
	const groups: SourceGroup[] = [];
	const problems: string[] = [];
	const seen = new Set<string>();
	let current: SourceGroup | undefined;
	markdown.split("\n").forEach((raw, index) => {
		const line = raw.trimEnd();
		const lineNumber = index + 1;
		const heading = headingLine.exec(line);
		if (heading !== null) {
			const title = heading[1] ?? "";
			if (!isTopic(title)) {
				problems.push(`line ${lineNumber}: "${title}" is not a topic`);
				current = undefined;
				return;
			}
			if (groups.some((group) => group.topic === title)) {
				problems.push(`line ${lineNumber}: topic ${title} appears twice`);
			}
			current = { topic: title, sources: [] };
			groups.push(current);
			return;
		}
		if (current === undefined || line.trim() === "") {
			return;
		}
		const match = sourceLine.exec(line);
		if (match === null) {
			problems.push(
				`line ${lineNumber}: expected "- [Name](https://...): note", got "${line}"`,
			);
			return;
		}
		const url = match[2] ?? "";
		if (seen.has(url)) {
			problems.push(`line ${lineNumber}: duplicate URL ${url}`);
		}
		seen.add(url);
		current.sources.push({
			topic: current.topic,
			name: match[1] ?? "",
			url,
			note: match[3] ?? "",
		});
	});
	return { groups, problems };
}

export function readSources(path = sourcesPath): ParsedSources {
	return parseSources(readFileSync(path, "utf8"));
}

export function sourceUrls(parsed: ParsedSources): string[] {
	return parsed.groups.flatMap((group) =>
		group.sources.map((source) => source.url),
	);
}
