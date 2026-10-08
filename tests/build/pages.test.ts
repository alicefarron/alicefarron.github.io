import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readBuiltFiles, runBuild } from "./build-output";

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

describe("subscribe copy", () => {
	it.each(["/", "/digest/012"])(
		"%s says one issue a week, every Monday (AC2)",
		(path) => {
			const subscribe = between(page(path), "data-subscribe", "</form>");
			expect(subscribe).toContain("One issue a week, every Monday.");
		},
	);

	it("no page mentions an unknown digest day (AC2)", () => {
		for (const html of readBuiltFiles(outDir, [".html"])) {
			expect(html).not.toContain("[DAY]");
			expect(html).not.toContain("every [");
		}
	});

	it("the Home dialog has exactly one button and no Not now (AC3)", () => {
		const dialog = between(page("/"), 'data-variant="dialog"', "</form>");
		expect(dialog.match(/<button\b/g)).toHaveLength(1);
		expect(dialog).not.toContain("Not now");
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

describe("writing index", () => {
	it("shows the pinned note in pinned.md and again in all_notes/ (AC7)", () => {
		const html = page("/writing");
		const pinned = between(
			html,
			'data-window="pinned"',
			'data-window="all-notes"',
		);
		expect(attrs(pinned, /data-note="([^"]+)"/g)).toEqual([
			"sample-note-pinned",
		]);
		const all = html.slice(html.indexOf('data-window="all-notes"'));
		expect(attrs(all, /data-note="([^"]+)"/g)).toEqual([
			"sample-note-table",
			"sample-note-series",
			"sample-note-cover",
			"sample-note-pinned",
			"sample-note-code",
			"sample-note-one",
		]);
		expect(html).toMatch(/data-count[^>]*>6 notes</);
		expect(html).not.toContain("[NOTE 7 TITLE]");
	});
});

describe("article", () => {
	it("renders the code block as a Terminal with the file label (AC8)", () => {
		const html = page("/writing/sample-note-code");
		const body = between(html, "data-note-body", "</article>");
		expect(body).toMatch(
			/<figure[^>]*bg-ink[\s\S]*text-lime[^>]*>example\.ts</,
		);
		expect(body).toMatch(
			/role="region"[^>]*tabindex="0"[^>]*class="[^"]*overflow-x-auto/,
		);
		expect(body).not.toMatch(/style="/);
	});

	it("has no previous link on the oldest note (AC9)", () => {
		const html = page("/writing/sample-note-one");
		expect(html).not.toContain('data-neighbour="previous"');
		expect(html).toMatch(
			/href="\/writing\/sample-note-code"[^>]*data-neighbour="next"/,
		);
	});

	it("renders the hero, tl;dr, neighbours and subscribe band", () => {
		const html = page("/writing/sample-note-code");
		expect(html).toMatch(/<a[^>]*href="\/writing"[^>]*>← writing\/<\/a>/);
		expect(html).toMatch(/<h1[^>]*>\[NOTE 2 TITLE\]<\/h1>/);
		expect(html).toMatch(
			/data-note-meta[\s\S]*Alina Shaimieva[\s\S]*12 Jan 2026[\s\S]*min read/,
		);
		const tldr = between(html, 'data-window="tldr"', "</section>");
		expect(tldr).toContain("[NOTE 2 TLDR 1]");
		expect(tldr).toContain("[NOTE 2 TLDR 2]");
		expect(html).toMatch(
			/href="\/writing\/sample-note-one"[^>]*data-neighbour="previous"/,
		);
		expect(html).toMatch(
			/href="\/writing\/sample-note-pinned"[^>]*data-neighbour="next"/,
		);
		expect(html).toMatch(/id="subscribe"[^>]*data-variant="band"/);
	});

	it("shows updated date, cover, table, callout and pull quote", () => {
		expect(page("/writing/sample-note-series")).toMatch(
			/Updated[\s\S]*10 Feb 2026/,
		);
		expect(page("/writing/sample-note-cover")).toMatch(
			/<img[^>]*alt="\[COVER ALT\]"/,
		);
		const table = page("/writing/sample-note-table");
		expect(table).toMatch(/data-table-scroll[^>]*>\s*<table/);
		expect(table).toMatch(/<aside[\s\S]*\[CALLOUT/);
		expect(table).toMatch(/<blockquote[^>]*border-y-window[\s\S]*\[PULL QUOTE/);
		expect(table).not.toContain('data-neighbour="next"');
	});

	it("does not build drafts", () => {
		expect(() => page("/writing/sample-note-draft")).toThrow();
	});
});

describe("about", () => {
	it("shows the title, bio terminal, case studies and side projects", () => {
		const html = page("/about");
		expect(html).toMatch(
			/<h1[^>]*>\s*About<span class="text-pink">\.txt<\/span>/,
		);
		expect(html).toContain("$ whoami");
		expect(attrs(html, /data-bio[^>]*>([^<]+)</g)).toHaveLength(3);
		expect(html).toContain(
			"Fullstack engineer in Eindhoven, eight years of TypeScript",
		);
		expect(attrs(html, /data-case-study="([^"]+)"/g)).toEqual([
			"vet-ai-layer",
			"mobile-platform",
		]);
		expect(html).toContain("AI layer for a veterinary B2B platform");
		expect(html).toContain("One React Native app, three product teams");
		expect(attrs(html, /data-project="([^"]+)"/g)).toEqual([
			"sudo-meow",
			"VeterokSetkaBot",
			"job-radar",
			"schedule-agent",
		]);
	});

	it("keeps unknown copy as visible placeholders", () => {
		const html = page("/about");
		expect(html).toContain("[RESULT]");
	});

	it("links the real email and LinkedIn with no square brackets (AC6)", () => {
		const html = page("/about");
		const contacts = between(html, "data-contacts", "</section>");
		expect(contacts).toMatch(
			/<a[^>]*href="mailto:shaimievaalinas@gmail\.com"[^>]*>shaimievaalinas@gmail\.com</,
		);
		expect(contacts).toMatch(
			/<a[^>]*href="https:\/\/www\.linkedin\.com\/in\/alina-shaimieva-5043a4233\/"[^>]*>https:\/\/www\.linkedin\.com\/in\/alina-shaimieva-5043a4233\/</,
		);
		expect(contacts).not.toContain("data-placeholder");
		expect(contacts).not.toMatch(/[[\]]/);
		expect(html).toMatch(
			/<a[^>]*href="https:\/\/github\.com\/alicefarron"[^>]*>github\.com\/alicefarron</,
		);
	});

	it("links the CV on Google Drive in a new tab (AC4)", () => {
		const contacts = between(page("/about"), "data-contacts", "</section>");
		expect(attrs(contacts, /<span[^>]*text-lime[^>]*>([^<]+)</g)).toEqual([
			"Email",
			"GitHub",
			"LinkedIn",
			"CV",
		]);
		const link =
			/<a\b[^>]*href="https:\/\/drive\.google\.com\/file\/d\/1K4zLioaxgYTVEnET1auOg1ME8npQxxWB\/view\?usp=sharing"[^>]*>/.exec(
				contacts,
			)?.[0] ?? "";
		expect(link).toContain('target="_blank"');
		expect(link).toMatch(/rel="[^"]*\bnoopener\b[^"]*"/);
		expect(link).toMatch(/aria-label="CV[^"]*Google Drive[^"]*"/);
	});

	it("uses no em dashes or curly quotes in copy", () => {
		const html = page("/about");
		expect(html).not.toMatch(/[\u2014\u2018\u2019\u201c\u201d]/);
	});
});

describe("meow.app island", () => {
	it("ships the idle line and a hidden button for no-JS (R8)", () => {
		const html = page("/");
		expect(html).toMatch(/data-pet-status[^>]*>zzz\.\.\. \(idle\)</);
		expect(html).toMatch(/<button[^>]*hidden[^>]*>Pet the cat<\/button>/);
		expect(html).toMatch(
			/<astro-island[^>]*component-url="[^"]+"[^>]*client="visible"/,
		);
	});
});

describe("filter islands", () => {
	it.each([
		["/digest", "Filter by topic", /data-issue="/g, 3, "3 issues"],
		["/writing", "Filter by tag", /data-note="/g, 7, "6 notes"],
	])(
		"%s ships all items and a hidden filter group for no-JS (AC6)",
		(path, label, item, count, text) => {
			const html = page(path);
			expect(html.match(item)).toHaveLength(count);
			expect(html).toMatch(new RegExp(`data-count[^>]*>${text}<`));
			expect(html).toMatch(
				new RegExp(`<fieldset[^>]*hidden[^>]*><legend[^>]*>${label}</legend>`),
			);
			expect(html).toMatch(/<astro-island[^>]*client="idle"/);
		},
	);
});

describe("view toggle island", () => {
	it("ships the Icons view with all projects and a hidden toggle (AC10)", () => {
		const html = page("/about");
		const icons = between(html, 'data-view="icons"', "</ul>");
		expect(attrs(icons, /data-project="([^"]+)"/g)).toHaveLength(4);
		expect(html).toMatch(
			/<fieldset[^>]*hidden[^>]*data-view-toggle[^>]*><legend[^>]*>View<\/legend>/,
		);
		expect(html).toMatch(/aria-pressed="true"[^>]*>Icons</);
		expect(html).not.toContain("<table");
		expect(html).toMatch(/<astro-island[^>]*client="visible"/);
	});
});
