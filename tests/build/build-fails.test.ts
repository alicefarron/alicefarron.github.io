import { rmSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { type BuildResult, runBuild } from "./build-output";

const results: BuildResult[] = [];

function build(contentDir: string): BuildResult {
	const result = runBuild({ CONTENT_DIR: contentDir });
	results.push(result);
	return result;
}

afterEach(() => {
	for (const result of results.splice(0)) {
		rmSync(result.outDir, { recursive: true, force: true });
	}
});

describe("build fails on broken content", () => {
	it("fails when two notes are pinned and names both files (AC7)", () => {
		const result = build("tests/fixtures/content-two-pinned");
		expect(result.status).not.toBe(0);
		expect(result.output).toContain("Only one note can be pinned");
		expect(result.output).toContain(
			"tests/fixtures/content-two-pinned/notes/sample-pinned-a.mdx",
		);
		expect(result.output).toContain(
			"tests/fixtures/content-two-pinned/notes/sample-pinned-b.mdx",
		);
	});

	it("fails when a note cover has no alt text (AC16)", () => {
		const result = build("tests/fixtures/content-missing-alt");
		expect(result.status).not.toBe(0);
		expect(result.output).toContain("sample-missing-alt");
		expect(result.output).toMatch(/cover\.alt/);
	});

	it("succeeds with the valid fixture content", () => {
		const result = build("tests/fixtures/content");
		expect(result.status, result.output).toBe(0);
	});
});
