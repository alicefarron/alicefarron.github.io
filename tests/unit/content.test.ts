import { describe, expect, it } from "vitest";
import {
	issuePath,
	latestIssue,
	newestNotes,
	notePath,
	pinnedOrNewest,
	prevIssue,
	prevNextNote,
	published,
	sortIssues,
	sortNotes,
} from "../../src/lib/content";

type Issue = {
	id: string;
	data: { number: number; date: Date; draft: boolean };
};
type Note = {
	id: string;
	data: { title: string; date: Date; pinned: boolean; draft: boolean };
};

function issue(number: number, draft = false): Issue {
	return {
		id: String(number).padStart(3, "0"),
		data: { number, date: new Date(2026, 0, number), draft },
	};
}

function note(
	id: string,
	day: number,
	options: { pinned?: boolean; draft?: boolean; title?: string } = {},
): Note {
	return {
		id,
		data: {
			title: options.title ?? `[${id}]`,
			date: new Date(2026, 0, day),
			pinned: options.pinned ?? false,
			draft: options.draft ?? false,
		},
	};
}

const issues = [issue(10), issue(12), issue(11), issue(13, true)];
const notes = [
	note("one", 1),
	note("two", 8),
	note("three", 15, { pinned: true }),
	note("four", 22),
	note("five", 29),
	note("six", 36),
	note("draft", 43, { draft: true }),
];

describe("published", () => {
	it("drops drafts in production", () => {
		expect(published(issues, true).map((entry) => entry.data.number)).toEqual([
			10, 12, 11,
		]);
		expect(published(notes, true).map((entry) => entry.id)).not.toContain(
			"draft",
		);
	});

	it("keeps drafts in dev", () => {
		expect(published(issues, false)).toHaveLength(4);
		expect(published(notes, false).map((entry) => entry.id)).toContain("draft");
	});
});

describe("issues", () => {
	const live = published(issues, true);

	it("latest issue is the highest number (AC1)", () => {
		expect(latestIssue(live).data.number).toBe(12);
	});

	it("throws a clear error when there are no published issues", () => {
		expect(() => latestIssue([])).toThrow("No published digest issues");
	});

	it("sorts newest first by number", () => {
		expect(sortIssues(live).map((entry) => entry.data.number)).toEqual([
			12, 11, 10,
		]);
	});

	it("previous issue is the next lower number", () => {
		expect(prevIssue(live, 12)?.data.number).toBe(11);
		expect(prevIssue(live, 11)?.data.number).toBe(10);
		expect(prevIssue(live, 10)).toBeUndefined();
	});

	it("previous issue skips gaps", () => {
		expect(prevIssue([issue(3), issue(7)], 7)?.data.number).toBe(3);
	});

	it.each([
		[12, "/digest/012"],
		[7, "/digest/007"],
		[123, "/digest/123"],
	])("issue %s lives at %s", (number, path) => {
		expect(issuePath(number)).toBe(path);
	});
});

describe("notes", () => {
	const live = published(notes, true);

	it("newest five notes come newest first (AC1)", () => {
		expect(newestNotes(live, 5).map((entry) => entry.id)).toEqual([
			"six",
			"five",
			"four",
			"three",
			"two",
		]);
	});

	it("sorts by date then title", () => {
		const tied = [
			note("b", 5, { title: "B" }),
			note("a", 5, { title: "A" }),
			note("c", 6, { title: "C" }),
		];
		expect(sortNotes(tied).map((entry) => entry.id)).toEqual(["c", "a", "b"]);
	});

	it("the first note by date has no previous (AC9)", () => {
		const { prev, next } = prevNextNote(live, "one");
		expect(prev).toBeUndefined();
		expect(next?.id).toBe("two");
	});

	it("the newest note has no next", () => {
		const { prev, next } = prevNextNote(live, "six");
		expect(prev?.id).toBe("five");
		expect(next).toBeUndefined();
	});

	it("a middle note has both neighbours by date", () => {
		const { prev, next } = prevNextNote(live, "three");
		expect(prev?.id).toBe("two");
		expect(next?.id).toBe("four");
	});

	it("pinned beats newest", () => {
		expect(pinnedOrNewest(live)?.id).toBe("three");
	});

	it("falls back to the newest when nothing is pinned", () => {
		expect(pinnedOrNewest([note("old", 1), note("new", 9)])?.id).toBe("new");
	});

	it("returns undefined when there are no notes", () => {
		expect(pinnedOrNewest([])).toBeUndefined();
	});

	it("note paths live under /writing", () => {
		expect(notePath("sample-note")).toBe("/writing/sample-note");
	});
});
