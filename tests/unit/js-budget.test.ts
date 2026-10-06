import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { budgetBytes, measureDist } from "../../scripts/js-budget.ts";

const script = join(process.cwd(), "scripts/js-budget.ts");
const dirs: string[] = [];

function makeDist(): string {
	const dir = mkdtempSync(join(tmpdir(), "js-budget-"));
	dirs.push(dir);
	return dir;
}

function runScript(distDir: string) {
	return spawnSync(process.execPath, [script, distDir], { encoding: "utf8" });
}

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

describe("js-budget", () => {
	it("reports 0 KB for a page without scripts", () => {
		const dist = makeDist();
		writeFileSync(
			join(dist, "index.html"),
			"<html><body><h1>[HOME]</h1></body></html>",
		);
		const [report] = measureDist(dist);
		expect(report?.bytes).toBe(0);
		const result = runScript(dist);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain("0.0 KB");
	});

	it("follows module imports and island urls", () => {
		const dist = makeDist();
		mkdirSync(join(dist, "_astro"));
		writeFileSync(join(dist, "_astro/shared.js"), "export const a = 1;");
		writeFileSync(
			join(dist, "_astro/island.js"),
			'import { a } from "./shared.js"; export default a;',
		);
		writeFileSync(join(dist, "_astro/client.js"), "export const b = 2;");
		writeFileSync(
			join(dist, "index.html"),
			'<astro-island component-url="/_astro/island.js" renderer-url="/_astro/client.js"></astro-island>',
		);
		const [report] = measureDist(dist);
		expect(report?.files).toEqual([
			"_astro/client.js",
			"_astro/island.js",
			"_astro/shared.js",
		]);
		expect(report?.bytes).toBeGreaterThan(0);
	});

	it("exits non-zero when a page is over 30 KB", () => {
		const dist = makeDist();
		mkdirSync(join(dist, "_astro"));
		const payload = randomBytes(budgetBytes + 4096).toString("base64");
		writeFileSync(
			join(dist, "_astro/big.js"),
			`export const big = "${payload}";`,
		);
		writeFileSync(
			join(dist, "index.html"),
			'<script type="module" src="/_astro/big.js"></script>',
		);
		const result = runScript(dist);
		expect(result.status).not.toBe(0);
		expect(result.stdout).toContain("FAIL");
	});

	it("ignores non-JavaScript script types", () => {
		const dist = makeDist();
		writeFileSync(
			join(dist, "index.html"),
			'<script type="application/ld+json">{"@type":"WebSite"}</script>',
		);
		const [report] = measureDist(dist);
		expect(report?.bytes).toBe(0);
	});
});
