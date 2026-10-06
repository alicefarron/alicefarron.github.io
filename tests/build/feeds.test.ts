import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runBuild } from "./build-output";

const site = "https://feeds.example";
const feeds = ["rss.xml", "digest/rss.xml", "writing/rss.xml"] as const;
let outDir = "";

type Item = {
	title?: string;
	link?: string;
	guid?: unknown;
	pubDate?: string;
	description?: string;
	"content:encoded"?: string;
};

type Channel = {
	title?: string;
	link?: string;
	description?: string;
	item?: Item | Item[];
};

type Parsed = {
	rss?: {
		"@_version"?: string;
		"@_xmlns:content"?: string;
		channel?: Channel;
	};
};

const parser = new XMLParser({ ignoreAttributes: false });

function read(path: string): { raw: string; channel: Channel; items: Item[] } {
	const raw = readFileSync(join(outDir, path), "utf8");
	const parsed = parser.parse(raw) as Parsed;
	expect(parsed.rss?.["@_version"]).toBe("2.0");
	expect(parsed.rss?.["@_xmlns:content"]).toBe(
		"http://purl.org/rss/1.0/modules/content/",
	);
	const channel = parsed.rss?.channel ?? {};
	const item = channel.item;
	const items = item === undefined ? [] : Array.isArray(item) ? item : [item];
	return { raw, channel, items };
}

beforeAll(() => {
	const result = runBuild({
		CONTENT_DIR: "tests/fixtures/content",
		SITE_URL: site,
	});
	outDir = result.outDir;
	expect(result.status, result.output).toBe(0);
}, 180_000);

afterAll(() => {
	if (outDir !== "") {
		rmSync(outDir, { recursive: true, force: true });
	}
});

describe("feeds (R13, AC15)", () => {
	it.each(feeds)("%s is RSS 2.0 with channel and item fields", (path) => {
		const { channel, items } = read(path);
		expect(channel.title).toBeTruthy();
		expect(channel.description).toBeTruthy();
		expect(channel.link).toMatch(new RegExp(`^${site}(/|$)`));
		expect(items.length).toBeGreaterThan(0);
		for (const item of items) {
			expect(item.title).toBeTruthy();
			expect(item.link).toMatch(new RegExp(`^${site}/(digest|writing)/`));
			expect(item.guid).toBeTruthy();
			expect(Number.isNaN(Date.parse(item.pubDate ?? ""))).toBe(false);
			expect(item.description).toBeTruthy();
			expect(item["content:encoded"]).toBeTruthy();
		}
	});

	it.each(feeds)("%s has no drafts", (path) => {
		const { raw } = read(path);
		expect(raw).not.toContain("[ISSUE 013");
		expect(raw).not.toContain("[NOTE 7");
	});

	it("the digest feed holds full issue content, newest first", () => {
		const { items } = read("digest/rss.xml");
		expect(items.map((item) => item.link)).toEqual([
			`${site}/digest/012`,
			`${site}/digest/011`,
			`${site}/digest/010`,
		]);
		const content = items[0]?.["content:encoded"] ?? "";
		expect(content).toContain("[HEADLINE 3.2]");
		expect(content).toContain("[TAKEAWAY 3.2]");
		expect(content).toContain("[COMMAND]");
		expect(content).not.toContain("<script");
	});

	it("the writing feed holds full note content with absolute URLs", () => {
		const { items } = read("writing/rss.xml");
		expect(items).toHaveLength(6);
		const code = items.find((item) => item.link?.endsWith("/sample-note-code"));
		expect(code?.["content:encoded"]).toContain("example.ts");
		for (const item of items) {
			expect(item["content:encoded"]).not.toMatch(/(?:href|src)="\/(?!\/)/);
		}
	});

	it("the combined feed has every published issue and note, newest first", () => {
		const { items } = read("rss.xml");
		expect(items).toHaveLength(9);
		const dates = items.map((item) => Date.parse(item.pubDate ?? ""));
		expect(dates).toEqual([...dates].sort((a, b) => b - a));
	});
});
