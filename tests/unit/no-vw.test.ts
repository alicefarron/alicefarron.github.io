import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const extensions = [".astro", ".css", ".ts", ".tsx", ".mdx", ".md"];
const viewportWidthUnit = /(?<![\w-])-?\d*\.?\d+(?:d|s|l)?vw\b/;

function listFiles(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			out.push(...listFiles(path));
		} else if (extensions.some((extension) => name.endsWith(extension))) {
			out.push(path);
		}
	}
	return out;
}

describe("no vw units", () => {
	it("matches viewport width units and ignores other text", () => {
		expect(viewportWidthUnit.test("width: 50vw;")).toBe(true);
		expect(viewportWidthUnit.test("width: 100dvw;")).toBe(true);
		expect(viewportWidthUnit.test("clamp(1rem, 2.5vw, 3rem)")).toBe(true);
		expect(viewportWidthUnit.test("font-size: 10cqi;")).toBe(false);
		expect(viewportWidthUnit.test('class="vw-label"')).toBe(false);
	});

	it("finds no vw units in src", () => {
		const offenders = listFiles(join(root, "src")).flatMap((file) =>
			readFileSync(file, "utf8")
				.split("\n")
				.flatMap((line, index) =>
					viewportWidthUnit.test(line)
						? [`${relative(root, file)}:${index + 1}`]
						: [],
				),
		);
		expect(offenders).toEqual([]);
	});
});
