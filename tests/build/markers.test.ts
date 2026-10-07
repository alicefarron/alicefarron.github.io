import { rmSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { type BuildResult, runBuild } from "./build-output";

const results: BuildResult[] = [];

function build(env: Record<string, string>): BuildResult {
	const result = runBuild(env);
	results.push(result);
	return result;
}

afterEach(() => {
	for (const result of results.splice(0)) {
		rmSync(result.outDir, { recursive: true, force: true });
	}
});

describe("author markers in the build", () => {
	it("fails a strict build naming the file and the marker (AC11)", () => {
		const result = build({
			CONTENT_DIR: "tests/fixtures/content-markers-issue",
			CONTENT_STRICT: "true",
		});
		expect(result.status).not.toBe(0);
		expect(result.output).toContain("Unresolved author markers");
		expect(result.output).toContain(
			"tests/fixtures/content-markers-issue/digest/001.mdx:1 [ALINA: your take, optional]",
		);
		expect(result.output).toContain(
			"tests/fixtures/content-markers-issue/digest/001.mdx:20 [ALINA: tried it this week]",
		);
		const report = result.output.slice(
			result.output.indexOf("Unresolved author markers"),
			result.output.indexOf("Fill or remove each marker"),
		);
		expect(report).not.toContain("002.mdx");
	});

	it("fails a strict build when a published note has a marker", () => {
		const result = build({
			CONTENT_DIR: "tests/fixtures/content-markers",
			CONTENT_STRICT: "true",
		});
		expect(result.status).not.toBe(0);
		expect(result.output).toMatch(
			/tests\/fixtures\/content-markers\/(?:digest\/001\.mdx:\d+ \[ALINA: tried it this week\]|notes\/sample-note-marker\.mdx:1 \[ALINA: note paragraph marker\])/,
		);
	});

	it("passes a strict build when markers are only in drafts (AC12)", () => {
		const result = build({
			CONTENT_DIR: "tests/fixtures/content-markers-draft",
			CONTENT_STRICT: "true",
		});
		expect(result.status, result.output).toBe(0);
	});

	it("passes a build with CONTENT_STRICT=false", () => {
		const result = build({
			CONTENT_DIR: "tests/fixtures/content-markers",
			CONTENT_STRICT: "false",
		});
		expect(result.status, result.output).toBe(0);
	});

	it("clears CONTENT_STRICT from the parent environment by default", () => {
		const previous = process.env.CONTENT_STRICT;
		process.env.CONTENT_STRICT = "true";
		try {
			const result = build({ CONTENT_DIR: "tests/fixtures/content-markers" });
			expect(result.status, result.output).toBe(0);
		} finally {
			if (previous === undefined) {
				delete process.env.CONTENT_STRICT;
			} else {
				process.env.CONTENT_STRICT = previous;
			}
		}
	});
});
