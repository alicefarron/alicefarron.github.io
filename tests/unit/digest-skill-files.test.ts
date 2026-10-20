import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	parseIssueBody,
	takeMarker,
	triedItMarker,
} from "../../scripts/digest/issue-check.ts";
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

const skillPath = ".claude/skills/digest/SKILL.md";
const templatePath = ".claude/skills/digest/issue-template.mdx";
const referencePath = ".claude/skills/digest/reference.md";

function frontmatterOf(markdown: string): Record<string, string> {
	const block = /^---\n([\s\S]*?)\n---\n/.exec(markdown)?.[1] ?? "";
	return Object.fromEntries(
		block.split("\n").map((line) => {
			const at = line.indexOf(":");
			return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
		}),
	);
}

describe("digest SKILL.md", () => {
	const skill = readFileSync(skillPath, "utf8");
	const frontmatter = frontmatterOf(skill);

	it("is named digest and triggers in English and Russian", () => {
		expect(frontmatter.name).toBe("digest");
		expect(frontmatter.description).toContain("make this week's digest");
		expect(frontmatter.description).toContain("собери дайджест");
	});

	it("names every script command", () => {
		for (const command of [
			"context",
			"check-ledger",
			"check-issue",
			"render-check",
			"check-diff",
			"pr-body",
		]) {
			expect(skill).toContain(`node scripts/digest.ts ${command}`);
		}
	});

	it("checks the ledger before it creates the branch", () => {
		const check = skill.indexOf("node scripts/digest.ts check-ledger");
		const branch = skill.indexOf("git switch -c digest/NNN");
		expect(check).toBeGreaterThan(-1);
		expect(branch).toBeGreaterThan(check);
	});

	it("has the never-list", () => {
		expect(skill).toContain("Never merge a pull request");
		expect(skill).toContain("Never push to `main`");
		expect(skill).toContain("Never force-push");
	});

	it("describes dry run, the open-PR stop and the thin week", () => {
		expect(skill).toContain("Dry run");
		expect(skill).toContain(".digest/NNN-pr.md");
		expect(skill).toMatch(/headRefName` starting with `digest\/`, stop/);
		expect(skill).toContain("thin week");
	});

	it("commits only the new issue file with the agreed message", () => {
		expect(skill).toContain("git add src/content/digest/NNN.mdx");
		expect(skill).toContain("content(digest): add issue NNN");
	});

	it("has no em dashes or curly quotes in the skill files", () => {
		for (const path of [skillPath, templatePath, referencePath]) {
			expect(readFileSync(path, "utf8")).not.toMatch(/[—‘’“”]/);
		}
	});
});

describe("digest issue template", () => {
	const template = readFileSync(templatePath, "utf8");
	const body = template.replace(/^---\n[\s\S]*?\n---\n/, "");
	const parsed = parseIssueBody(body);

	it("holds only the tried-it marker in TriedIt", () => {
		expect(parsed.triedIt).toEqual([
			{ attributes: "", content: triedItMarker },
		]);
	});

	it("ends the intro with the take marker", () => {
		expect(parsed.intro.endsWith(takeMarker)).toBe(true);
	});

	it("has the four sections with their colors in order", () => {
		expect(parsed.sections).toEqual([
			{ title: "Models", color: "sky" },
			{ title: "Tooling", color: "yellow" },
			{ title: "Agents", color: "pink" },
			{ title: "Papers", color: "lime" },
		]);
	});
});

describe("digest scheduled prompt", () => {
	const prompt = readFileSync(
		".claude/skills/digest/scheduled-prompt.md",
		"utf8",
	);

	it("runs on Monday shortly before 07:00 Amsterdam time with push", () => {
		expect(prompt).toContain("`CRON_TZ=Europe/Amsterdam 52 6 * * 1`");
		expect(prompt).toContain("Notifications: push on");
	});

	it("clones the repo, installs, follows the skill and never merges", () => {
		expect(prompt).toContain(
			"https://github.com/alicefarron/alicefarron.github.io",
		);
		expect(prompt).toContain("alicefarron/alicefarron.github.io");
		expect(prompt).toContain("pnpm install --frozen-lockfile");
		expect(prompt).toContain(".claude/skills/digest/SKILL.md");
		expect(prompt).toContain("not dry run");
		expect(prompt).toContain(
			"Never merge a pull request, never push to main, never force-push.",
		);
		expect(prompt).toMatch(/pull request link, or for a thin week the reason/);
	});

	it("stops when the skill is missing from the clone", () => {
		expect(prompt).toContain(
			"If .claude/skills/digest/SKILL.md does not exist in the clone, stop and report",
		);
	});

	it("has no em dashes or curly quotes", () => {
		expect(prompt).not.toMatch(/[—‘’“”]/);
	});
});
