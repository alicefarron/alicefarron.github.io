import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	parseSources,
	readSources,
	sourcesPath,
	sourceUrls,
} from "../../scripts/digest/sources.ts";

const planned = {
	Models: [
		"https://www.anthropic.com/news",
		"https://openai.com/news/",
		"https://deepmind.google/discover/blog/",
		"https://ai.meta.com/blog/",
		"https://mistral.ai/news",
		"https://x.ai/news",
		"https://api-docs.deepseek.com/updates",
		"https://huggingface.co/blog",
	],
	Tooling: [
		"https://platform.claude.com/docs/en/release-notes/overview",
		"https://code.claude.com/docs/en/changelog",
		"https://developers.openai.com/api/docs/changelog",
		"https://learn.chatgpt.com/docs/changelog",
		"https://ai.google.dev/gemini-api/docs/changelog",
		"https://github.blog/changelog/",
		"https://cursor.com/changelog",
		"https://code.visualstudio.com/updates",
		"https://simonwillison.net/",
		"https://news.ycombinator.com/",
	],
	Agents: [
		"https://www.langchain.com/blog",
		"https://blog.modelcontextprotocol.io/",
		"https://www.anthropic.com/engineering",
		"https://github.com/openai/openai-agents-python/releases",
	],
	Papers: ["https://huggingface.co/papers"],
};

describe("sources.md", () => {
	const parsed = readSources();

	it("parses without problems", () => {
		expect(parsed.problems).toEqual([]);
	});

	it("has exactly the groups Models, Tooling, Agents, Papers", () => {
		expect(parsed.groups.map((group) => group.topic)).toEqual([
			"Models",
			"Tooling",
			"Agents",
			"Papers",
		]);
	});

	it("writes every list line as - [Name](https://...): note", () => {
		const lines = readFileSync(sourcesPath, "utf8")
			.split("\n")
			.filter((line) => line.startsWith("- "));
		expect(lines.length).toBe(sourceUrls(parsed).length);
		for (const line of lines) {
			expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/[^\s)]+\): \S/);
		}
	});

	it("has no duplicate URLs", () => {
		const urls = sourceUrls(parsed);
		expect(new Set(urls).size).toBe(urls.length);
	});

	it("matches the list in plan section 7", () => {
		expect(
			Object.fromEntries(
				parsed.groups.map((group) => [
					group.topic,
					group.sources.map((source) => source.url),
				]),
			),
		).toEqual(planned);
	});

	it("has no em dashes or curly quotes", () => {
		expect(readFileSync(sourcesPath, "utf8")).not.toMatch(/[—‘’“”]/);
	});
});

describe("parseSources", () => {
	it("reports an unknown topic, a malformed line and a duplicate URL", () => {
		const result = parseSources(
			[
				"## Models",
				"- [A](https://example.com/a): note",
				"- [B](https://example.com/a): note",
				"* [C](https://example.com/c)",
				"## Other",
			].join("\n"),
		);
		expect(result.problems).toEqual([
			"line 3: duplicate URL https://example.com/a",
			'line 4: expected "- [Name](https://...): note", got "* [C](https://example.com/c)"',
			'line 5: "Other" is not a topic',
		]);
	});

	it("ignores text before the first heading", () => {
		const result = parseSources(
			"# Title\n\nIntro text.\n\n## Papers\n\n- [P](https://example.com/p): daily\n",
		);
		expect(result.problems).toEqual([]);
		expect(result.groups).toEqual([
			{
				topic: "Papers",
				sources: [
					{
						topic: "Papers",
						name: "P",
						url: "https://example.com/p",
						note: "daily",
					},
				],
			},
		]);
	});
});
