import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type RenderCheck, runDigest } from "../../scripts/digest.ts";

const fixture = "tests/fixtures/digest-runs/issue-015.mdx";
const dirs: string[] = [];

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

describe("render-check", () => {
	it("builds a valid issue and names its page (AC6)", () => {
		const result = runDigest(["render-check", fixture]);
		expect(result.code, result.stderr).toBe(0);
		const report = JSON.parse(result.stdout) as RenderCheck;
		expect(report).toEqual({
			status: "ok",
			page: "digest/015.html",
			problems: [],
		});
	});

	it("exits 2 for an issue with a broken component", () => {
		const dir = mkdtempSync(join(tmpdir(), "digest-render-broken-"));
		dirs.push(dir);
		const file = join(dir, "015.mdx");
		writeFileSync(
			file,
			readFileSync(fixture, "utf8").replace(
				'<Section title="Papers" color="lime">',
				'<Section title="Papers" color="lime"',
			),
		);
		const result = runDigest(["render-check", file]);
		expect(result.code).toBe(2);
		expect(result.stderr).toContain("astro build exited");
	});
});
