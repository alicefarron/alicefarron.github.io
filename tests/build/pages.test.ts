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

describe("digest issue", () => {
	it("builds published issues only", () => {
		expect(() => page("/digest/012")).not.toThrow();
		expect(() => page("/digest/011")).not.toThrow();
		expect(() => page("/digest/013")).toThrow();
	});

	it("contents link to each section id in the body (AC4)", () => {
		const html = page("/digest/012");
		const contents = between(html, 'data-window="contents"', "</nav>");
		const hrefs = attrs(contents, /href="#([^"]+)"/g);
		expect(hrefs).toEqual(["section-1", "section-2", "section-3", "tried-it"]);
		for (const id of hrefs) {
			expect(html).toMatch(new RegExp(`<h2[^>]*id="${id}"`));
		}
	});

	it("shows the hero, the quote and previous link on 012 (AC4)", () => {
		const html = page("/digest/012");
		expect(html).toMatch(/<h1[^>]*>This week in AI<\/h1>/);
		expect(html).toMatch(
			/data-issue-chip[\s\S]*Issue #012[\s\S]*23 Jan 2026[\s\S]*min read/,
		);
		expect(html).toMatch(
			/<mark[^>]*data-issue-title[^>]*>\[ISSUE 012 TITLE\]<\/mark>/,
		);
		expect(html).toContain('data-window="quote"');
		expect(html).toContain("[QUOTE]");
		expect(html).toMatch(/<a[^>]*href="\/digest\/011"[^>]*data-previous/);
		expect(html).toMatch(/<a[^>]*href="\/digest"[^>]*>\s*archive\/\s*<\/a>/);
		expect(html).toMatch(/id="subscribe"[^>]*data-variant="band"/);
	});

	it("renders Tried it with a Terminal", () => {
		const tried = between(page("/digest/012"), 'id="tried-it"', "</section>");
		expect(tried).toContain("bg-ink");
		expect(tried).toContain("[COMMAND]");
	});

	it("has no quote window without a quote (AC5)", () => {
		expect(page("/digest/011")).not.toContain('data-window="quote"');
	});

	it("has no previous link on the oldest issue", () => {
		expect(page("/digest/010")).not.toContain("data-previous");
	});
});

describe("digest archive", () => {
	it("lists published issues newest first with date, title and topics (R4)", () => {
		const html = page("/digest");
		expect(attrs(html, /data-issue="([^"]+)"/g)).toEqual(["12", "11", "10"]);
		const first = between(html, 'data-issue="12"', 'data-issue="11"');
		expect(first).toContain("#012");
		expect(first).toContain("23 Jan 2026");
		expect(first).toMatch(
			/<a[^>]*href="\/digest\/012"[^>]*>\[ISSUE 012 TITLE\]<\/a>/,
		);
		expect(first).toMatch(/>Agents<[\s\S]*>Models</);
		expect(html).toMatch(/data-count[^>]*>3 issues</);
		expect(html).not.toContain("[ISSUE 013 TITLE]");
	});
});
