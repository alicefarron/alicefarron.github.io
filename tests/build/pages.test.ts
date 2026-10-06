import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runBuild } from "./build-output";

let outDir = "";

beforeAll(() => {
	const result = runBuild({ CONTENT_DIR: "tests/fixtures/content" });
	outDir = result.outDir;
	expect(result.status, result.output).toBe(0);
}, 180_000);

afterAll(() => {
	if (outDir !== "") {
		rmSync(outDir, { recursive: true, force: true });
	}
});

function page(path: string): string {
	const file =
		path === "/" ? "index.html" : join(path.replace(/^\//, ""), "index.html");
	return readFileSync(join(outDir, file), "utf8");
}

function attrs(html: string, pattern: RegExp): string[] {
	return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

function between(html: string, start: string, end: string): string {
	const from = html.indexOf(start);
	expect(from, `missing ${start}`).toBeGreaterThan(-1);
	const to = html.indexOf(end, from);
	return html.slice(from, to === -1 ? undefined : to);
}

describe("home", () => {
	it("shows the highest issue and the five newest notes, newest first (AC1)", () => {
		const html = page("/");
		const thisWeek = between(
			html,
			'data-window="this-week"',
			'data-window="latest-note"',
		);
		expect(thisWeek).toContain("Issue #012");
		expect(thisWeek).toContain("[ISSUE 012 TITLE]");
		expect(thisWeek).toContain("[ISSUE 012 LEDE]");
		expect(thisWeek).toContain('href="/digest/012"');
		expect(thisWeek).toContain("[HEADLINE 3.2]");
		const writing = between(html, 'data-window="writing"', "</section>");
		expect(attrs(writing, /data-note="([^"]+)"/g)).toEqual([
			"sample-note-table",
			"sample-note-series",
			"sample-note-cover",
			"sample-note-pinned",
			"sample-note-code",
		]);
		expect(html).not.toContain("[NOTE 7 TITLE]");
	});

	it("desktop icons link to the R2 targets", () => {
		const icons = between(page("/"), "data-desktop-icons", "</nav>");
		expect(attrs(icons, /<a\b[^>]*href="([^"]+)"/g)).toEqual([
			"/digest/012",
			"/writing",
			"/digest",
			"/rss.xml",
			"/about",
		]);
	});

	it("has the tagline, the issue chip, the dialog and the footer", () => {
		const html = page("/");
		expect(html).toContain(
			"A weekly AI digest and long notes on building software.",
		);
		expect(html).toMatch(
			/<mark[^>]*>Only the news you can use on Monday\.<\/mark>/,
		);
		expect(html).toContain("// issue #012 is out");
		expect(html).toMatch(/id="subscribe"[^>]*data-variant="dialog"/);
		expect(html).toMatch(/<footer[^>]*>[\s\S]*© 2026 alina\.os/);
		expect(html).toContain("meow.app");
		expect(html).toContain("zzz... (idle)");
	});
});
