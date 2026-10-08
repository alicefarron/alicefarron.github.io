import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/preact/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PetWindow from "../../src/components/PetWindow.astro";
import {
	isPetted,
	nextPetIndex,
	petBodyClass,
	petLines,
} from "../../src/lib/pet";
import { colorUtilityProblems } from "./helpers/classes";

let container: AstroContainer;

beforeAll(async () => {
	const renderers = await loadRenderers([getContainerRenderer()]);
	container = await AstroContainer.create({ renderers });
});

describe("pet lines", () => {
	it("are the five spec lines in order", () => {
		expect(petLines).toEqual([
			"zzz... (idle)",
			"purr",
			"purr purr",
			"PURR. cpu usage: 0.4%",
			"ok that is enough",
		]);
	});

	it("four presses reach the fifth line and further presses stay there (AC11)", () => {
		let index = 0;
		for (let press = 0; press < 4; press += 1) {
			index = nextPetIndex(index);
		}
		expect(petLines[index]).toBe("ok that is enough");
		expect(nextPetIndex(index)).toBe(index);
	});
});

describe("pet blush (AC5)", () => {
	it("is white before the first press", () => {
		expect(isPetted(0)).toBe(false);
		expect(petBodyClass(0)).toContain("bg-white");
		expect(petBodyClass(0)).not.toContain("bg-pet-blush");
	});

	it("turns pet-blush after the first press and stays on every later press", () => {
		let index = 0;
		for (let press = 0; press < 8; press += 1) {
			index = nextPetIndex(index);
			expect(isPetted(index)).toBe(true);
			expect(petBodyClass(index)).toContain("bg-pet-blush");
			expect(petBodyClass(index)).not.toContain("bg-white");
		}
	});

	it("uses only token colors", () => {
		expect(colorUtilityProblems(`class="${petBodyClass(0)}"`)).toEqual([]);
		expect(colorUtilityProblems(`class="${petBodyClass(1)}"`)).toEqual([]);
	});
});

describe("PetWindow", () => {
	it("server-renders the cat inside a white island body with no blush (AC5 no-JS)", async () => {
		const html = await container.renderToString(PetWindow);
		const body = /<div[^>]*data-pet-body[^>]*>/.exec(html)?.[0] ?? "";
		expect(body).toContain("bg-white");
		expect(body).not.toContain("bg-pet-blush");
		expect(body).not.toContain("data-petted");
		expect(html).toMatch(/data-pet-body[\s\S]*<svg[\s\S]*data-pet-status/);
	});

	it("server-renders the idle line and a hidden button (R8 no-JS state)", async () => {
		const html = await container.renderToString(PetWindow);
		expect(html).toContain("meow.app");
		expect(html).toMatch(/data-pet-status[^>]*>zzz\.\.\. \(idle\)</);
		expect(html).toMatch(/<button[^>]*hidden[^>]*>Pet the cat<\/button>/);
		expect(html).toMatch(/<astro-island[^>]*client="visible"/);
	});
});
