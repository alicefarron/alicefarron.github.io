import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type BuildResult = {
	status: number | null;
	output: string;
	outDir: string;
};

export function runBuild(env: Record<string, string> = {}): BuildResult {
	const outDir = mkdtempSync(join(tmpdir(), "alina-os-build-"));
	const result = spawnSync(
		"pnpm",
		["exec", "astro", "build", "--outDir", outDir],
		{
			cwd: process.cwd(),
			encoding: "utf8",
			env: { ...process.env, ...env },
		},
	);
	return {
		status: result.status,
		output: `${result.stdout}\n${result.stderr}`,
		outDir,
	};
}

export function readBuiltFiles(dir: string, extensions: string[]): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			out.push(...readBuiltFiles(path, extensions));
		} else if (extensions.some((extension) => name.endsWith(extension))) {
			out.push(readFileSync(path, "utf8"));
		}
	}
	return out;
}
