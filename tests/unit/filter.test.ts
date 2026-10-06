import { describe, expect, it } from "vitest";
import { countLabel, filterItems, toggleFilter } from "../../src/lib/filter";

const items = [
	{ id: 1, labels: ["Agents", "Models"] },
	{ id: 2, labels: ["Tooling"] },
	{ id: 3, labels: ["Agents"] },
];

describe("filterItems", () => {
	it("shows everything without an active filter", () => {
		expect(filterItems(items, undefined).map((item) => item.id)).toEqual([
			1, 2, 3,
		]);
	});

	it("keeps only items with the active label (AC6)", () => {
		expect(filterItems(items, "Agents").map((item) => item.id)).toEqual([1, 3]);
		expect(filterItems(items, "Papers")).toEqual([]);
	});
});

describe("toggleFilter", () => {
	it("selects one filter at a time", () => {
		expect(toggleFilter(undefined, "Agents")).toBe("Agents");
		expect(toggleFilter("Agents", "Tooling")).toBe("Tooling");
	});

	it("pressing the active filter or All returns to All", () => {
		expect(toggleFilter("Agents", "Agents")).toBeUndefined();
		expect(toggleFilter("Agents", undefined)).toBeUndefined();
	});
});

describe("countLabel", () => {
	it("pluralises the noun", () => {
		expect(countLabel(1, "issue")).toBe("1 issue");
		expect(countLabel(3, "note")).toBe("3 notes");
		expect(countLabel(0, "issue")).toBe("0 issues");
	});
});
