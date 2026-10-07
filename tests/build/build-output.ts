import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type BuildResult = {
	status: number | null;
	output: string;
	outDir: string;
};

function parentEnv(): NodeJS.ProcessEnv {
	return Object.fromEntries(
		Object.entries(process.env).filter(
			([key]) =>
				!/^(?:VITEST.*|VITE_.*|TEST|MODE|NODE_ENV|DEV|PROD|SSR|BASE_URL|NODE_PATH)$/.test(
					key,
				),
		),
	);
}

export function runBuild(env: Record<string, string> = {}): BuildResult {
	const outDir = mkdtempSync(join(tmpdir(), "alina-os-build-"));
	const result = spawnSync(
		"pnpm",
		["exec", "astro", "build", "--outDir", outDir],
		{
			cwd: process.cwd(),
			encoding: "utf8",
			env: { ...parentEnv(), CONTENT_STRICT: "", ...env },
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
