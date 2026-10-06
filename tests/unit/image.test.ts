import { describe, expect, it } from "vitest";
import { asImage } from "../../src/lib/image";

describe("asImage", () => {
	it("accepts image metadata", () => {
		const image = { src: "/a.png", width: 2, height: 2, format: "png" };
		expect(asImage(image)).toBe(image);
	});

	it.each([undefined, null, "a.png", { src: "/a.png" }])(
		"rejects %s",
		(value) => {
			expect(asImage(value)).toBeUndefined();
		},
	);
});
