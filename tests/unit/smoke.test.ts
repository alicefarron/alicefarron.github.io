import { describe, expect, it } from "vitest";
import { routes } from "../e2e/helpers/routes";

describe("route list", () => {
	it("includes the home route", () => {
		expect(routes.map((route) => route.path)).toContain("/");
	});

	it("has unique paths", () => {
		const paths = routes.map((route) => route.path);
		expect(new Set(paths).size).toBe(paths.length);
	});
});
