import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dockerfile = readFileSync("Dockerfile", "utf8");
const deployDoc = readFileSync("docs/deploy.md", "utf8");

function buildStage(): string {
	const stages = dockerfile.split(/^FROM /m);
	return stages.find((stage) => /AS build/.test(stage)) ?? "";
}

describe("Dockerfile CONTENT_STRICT", () => {
	const stage = buildStage();

	it("declares the build argument with false as default", () => {
		expect(stage).toMatch(/^ARG CONTENT_STRICT=false$/m);
	});

	it("sets CONTENT_STRICT in the environment before astro build", () => {
		const env = stage.indexOf("CONTENT_STRICT=$CONTENT_STRICT");
		const build = stage.indexOf("pnpm exec astro build");
		const arg = stage.indexOf("ARG CONTENT_STRICT");
		expect(arg).toBeGreaterThan(-1);
		expect(env).toBeGreaterThan(arg);
		expect(build).toBeGreaterThan(env);
		const envBlock = stage.slice(stage.lastIndexOf("ENV ", env), env);
		expect(envBlock).not.toMatch(/\nRUN /);
	});
});

describe("docs/deploy.md CONTENT_STRICT", () => {
	it("sets true on production", () => {
		expect(deployDoc).toMatch(/\| `CONTENT_STRICT` \| `true` \|/);
	});

	it("sets false on PR environments", () => {
		const prSection = deployDoc.slice(deployDoc.indexOf("## 4."));
		expect(prSection).toContain("`CONTENT_STRICT=false`");
	});
});
