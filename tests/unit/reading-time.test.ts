import { describe, expect, it } from "vitest";
import {
	countWords,
	readingTime,
	wordsPerMinute,
} from "../../src/lib/reading-time";

function words(count: number): string {
	return Array.from({ length: count }, (_, index) => `word${index}`).join(" ");
}

describe("readingTime", () => {
	it("reads at 220 words per minute", () => {
		expect(wordsPerMinute).toBe(220);
	});

	it.each([
		[0, 1],
		[1, 1],
		[220, 1],
		[221, 2],
		[440, 2],
		[1100, 5],
		[1101, 6],
	])("%s words take %s min", (count, minutes) => {
		expect(readingTime(words(count))).toBe(minutes);
	});

	it("ignores import and export lines", () => {
		const body = `import Callout from "../Callout.astro";\nexport const meta = { a: 1 };\n${words(3)}`;
		expect(countWords(body)).toBe(3);
	});

	it("ignores JSX tags but counts their text", () => {
		const body =
			'<Section title="[SECTION 1]" color="sky">\none two\n</Section>\n<Item headline="x" />';
		expect(countWords(body)).toBe(2);
	});

	it("ignores fence lines but counts code text", () => {
		const body = '```ts title="example.ts"\nconst a = 1;\n```\nthree';
		expect(countWords(body)).toBe(4);
	});

	it("ignores markdown syntax characters", () => {
		expect(countWords("## Heading here\n\n- one\n- **two**\n\n> three")).toBe(
			5,
		);
	});
});
