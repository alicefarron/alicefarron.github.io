import { describe, expect, it } from "vitest";
import {
	formatDate,
	isoDate,
	issueLabel,
	minutesLabel,
} from "../../src/lib/format";
import { tagColor, topicColor } from "../../src/lib/labels";

describe("format", () => {
	it("formats dates in UTC", () => {
		expect(formatDate(new Date("2026-01-23T00:00:00Z"))).toBe("23 Jan 2026");
		expect(isoDate("2026-01-23T00:00:00Z")).toBe("2026-01-23");
	});

	it("pads issue numbers to three digits", () => {
		expect(issueLabel(12)).toBe("#012");
		expect(issueLabel(123)).toBe("#123");
	});

	it("labels reading time", () => {
		expect(minutesLabel(4)).toBe("4 min read");
	});
});

describe("labels", () => {
	it("maps every topic and tag to a chip color", () => {
		expect(topicColor("Agents")).toBe("pink");
		expect(tagColor("Backend")).toBe("lavender");
		expect(topicColor("Unknown")).toBe("white");
	});
});
