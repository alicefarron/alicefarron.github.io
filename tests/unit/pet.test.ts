import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/preact/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PetWindow from "../../src/components/PetWindow.astro";
import { nextPetIndex, petLines } from "../../src/lib/pet";

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

describe("PetWindow", () => {
	it("server-renders the idle line and a hidden button (R8 no-JS state)", async () => {
		const html = await container.renderToString(PetWindow);
		expect(html).toContain("meow.app");
		expect(html).toMatch(/data-pet-status[^>]*>zzz\.\.\. \(idle\)</);
		expect(html).toMatch(/<button[^>]*hidden[^>]*>Pet the cat<\/button>/);
		expect(html).toMatch(/<astro-island[^>]*client="visible"/);
	});
});
