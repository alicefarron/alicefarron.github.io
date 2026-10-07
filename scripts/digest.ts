import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkIssue, type IssueCheck } from "./digest/issue-check.ts";
import { type IssueFile, padNumber, readIssues } from "./digest/issues.ts";
import {
	checkLedger,
	type LedgerCheck,
	ledgerExitCodes,
	parseLedger,
} from "./digest/ledger.ts";
import { type CheckOutcome, prBody } from "./digest/pr-body.ts";
import {
	defaultNotesDir,
	type RenderCheck,
	renderCheck,
} from "./digest/render-check.ts";
import {
	type ParsedSources,
	readSources,
	sourceUrls,
} from "./digest/sources.ts";
import { normalizeUrl } from "./digest/urls.ts";
import {
	type CoverageWindow,
	coverageWindow,
	dateInTimeZone,
	isIsoDate,
} from "./digest/window.ts";

export type { IssueCheck, LedgerCheck, RenderCheck };

export type CommandResult = {
	code: number;
	stdout: string;
	stderr: string;
};

export type Deps = {
	now: () => Date;
	readSources: () => ParsedSources;
	changedFiles: (base: string) => string[];
	renderCheck: (file: string) => RenderCheck;
};

export const defaultDiffBase = "origin/main";

function gitChangedFiles(base: string): string[] {
	const result = spawnSync("git", ["diff", "--name-only", `${base}...HEAD`], {
		encoding: "utf8",
	});
	if (result.status !== 0) {
		throw new Error(`git diff failed: ${result.stderr.trim()}`);
	}
	return result.stdout
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line !== "");
}

const defaultDeps: Deps = {
	now: () => new Date(),
	readSources: () => readSources(),
	changedFiles: gitChangedFiles,
	renderCheck: (file) =>
		renderCheck(file, { notesDir: defaultNotesDir, cwd: process.cwd() }),
};

export type CitedUrl = {
	issue: number;
	url: string;
	normalized: string;
};

export type CitedHeadline = {
	issue: number;
	headline: string;
};

export type DigestContext = {
	runDate: string;
	number: number;
	file: string;
	branch: string;
	previous: { number: number; date: string; file: string } | null;
	window: CoverageWindow;
	cited: { urls: CitedUrl[]; headlines: CitedHeadline[] };
	sources: ParsedSources;
};

export type ParsedArgs = {
	positional: string[];
	options: Record<string, string>;
};

export function parseArgs(argv: string[]): ParsedArgs {
	const positional: string[] = [];
	const options: Record<string, string> = {};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index] ?? "";
		if (arg.startsWith("--")) {
			const [key, inline] = arg.slice(2).split("=", 2);
			if (inline !== undefined) {
				options[key ?? ""] = inline;
			} else {
				options[key ?? ""] = argv[index + 1] ?? "";
				index += 1;
			}
		} else {
			positional.push(arg);
		}
	}
	return { positional, options };
}

export function buildContext(
	issues: IssueFile[],
	runDate: string,
	contentDir: string,
	sources: ParsedSources,
): DigestContext {
	const number = Math.max(0, ...issues.map((issue) => issue.number)) + 1;
	const published = issues.filter((issue) => !issue.draft);
	const latest = published.reduce<IssueFile | undefined>(
		(best, issue) =>
			best === undefined || issue.number > best.number ? issue : best,
		undefined,
	);
	const previous =
		latest === undefined
			? null
			: { number: latest.number, date: latest.date, file: latest.file };
	const padded = padNumber(number);
	return {
		runDate,
		number,
		file: `${contentDir.replace(/\/+$/, "")}/digest/${padded}.mdx`,
		branch: `digest/${padded}`,
		previous,
		window: coverageWindow(runDate, previous?.date ?? null),
		cited: {
			urls: issues.flatMap((issue) =>
				[...new Set(issue.urls)].map((url) => ({
					issue: issue.number,
					url,
					normalized: normalizeUrl(url),
				})),
			),
			headlines: issues.flatMap((issue) =>
				issue.headlines.map((headline) => ({
					issue: issue.number,
					headline,
				})),
			),
		},
		sources,
	};
}

export type ContextResult =
	| { ok: true; context: DigestContext }
	| { ok: false; error: string };

export function loadContext(
	options: Record<string, string>,
	deps: Deps,
	exclude?: string,
): ContextResult {
	const runDate = options.date ?? dateInTimeZone(deps.now());
	if (!isIsoDate(runDate)) {
		return { ok: false, error: `--date must be YYYY-MM-DD, got "${runDate}"` };
	}
	const contentDir = options["content-dir"] ?? "src/content";
	const excluded = exclude === undefined ? undefined : resolve(exclude);
	const context = buildContext(
		readIssues(contentDir).filter((issue) => resolve(issue.file) !== excluded),
		runDate,
		contentDir,
		deps.readSources(),
	);
	if (context.previous !== null && runDate <= context.previous.date) {
		return {
			ok: false,
			error: `Run date ${runDate} must be after the previous issue date ${context.previous.date} (${context.previous.file})`,
		};
	}
	return { ok: true, context };
}

function json(value: unknown): string {
	return `${JSON.stringify(value, null, 2)}\n`;
}

function contextCommand(options: Record<string, string>, deps: Deps) {
	const result = loadContext(options, deps);
	if (!result.ok) {
		return { code: 1, stdout: "", stderr: `${result.error}\n` };
	}
	return { code: 0, stdout: json(result.context), stderr: "" };
}

export function readJson(
	path: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
	try {
		return { ok: true, value: JSON.parse(readFileSync(path, "utf8")) };
	} catch (error) {
		return {
			ok: false,
			error: `Cannot read JSON from ${path}: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

function runDateFor(options: Record<string, string>, ledger: unknown) {
	if (options.date !== undefined) {
		return options;
	}
	if (
		typeof ledger === "object" &&
		ledger !== null &&
		"runDate" in ledger &&
		typeof ledger.runDate === "string"
	) {
		return { ...options, date: ledger.runDate };
	}
	return options;
}

export function ledgerCheckFor(
	ledgerPath: string,
	options: Record<string, string>,
	deps: Deps,
):
	| { ok: true; check: LedgerCheck; ledger: unknown; context: DigestContext }
	| {
			ok: false;
			error: string;
	  } {
	const read = readJson(ledgerPath);
	if (!read.ok) {
		return read;
	}
	const loaded = loadContext(runDateFor(options, read.value), deps);
	if (!loaded.ok) {
		return loaded;
	}
	const { context } = loaded;
	const check = checkLedger(read.value, {
		number: context.number,
		runDate: context.runDate,
		window: context.window,
		citedUrls: context.cited.urls,
		sourceUrls: sourceUrls(context.sources),
	});
	return { ok: true, check, ledger: read.value, context };
}

function checkLedgerCommand(
	positional: string[],
	options: Record<string, string>,
	deps: Deps,
): CommandResult {
	const [ledgerPath] = positional;
	if (ledgerPath === undefined) {
		return { code: 64, stdout: "", stderr: `Missing ledger path\n${usage}` };
	}
	const result = ledgerCheckFor(ledgerPath, options, deps);
	if (!result.ok) {
		return { code: 1, stdout: "", stderr: `${result.error}\n` };
	}
	const { check } = result;
	return {
		code: ledgerExitCodes[check.status],
		stdout: json(check),
		stderr: check.problems.map((problem) => `${problem}\n`).join(""),
	};
}

function checkIssueCommand(
	positional: string[],
	options: Record<string, string>,
	deps: Deps,
): CommandResult {
	const [file, ledgerPath] = positional;
	if (file === undefined || ledgerPath === undefined) {
		return {
			code: 64,
			stdout: "",
			stderr: `Missing issue file or ledger path\n${usage}`,
		};
	}
	const read = readJson(ledgerPath);
	if (!read.ok) {
		return { code: 1, stdout: "", stderr: `${read.error}\n` };
	}
	const ledger = parseLedger(read.value);
	if (!ledger.ok) {
		return {
			code: 2,
			stdout: json({
				status: "problems",
				problems: ledger.problems,
				markers: [],
			}),
			stderr: ledger.problems.map((problem) => `${problem}\n`).join(""),
		};
	}
	const loaded = loadContext(runDateFor(options, read.value), deps, file);
	if (!loaded.ok) {
		return { code: 1, stdout: "", stderr: `${loaded.error}\n` };
	}
	let source: string;
	try {
		source = readFileSync(file, "utf8");
	} catch (error) {
		return {
			code: 1,
			stdout: "",
			stderr: `Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}\n`,
		};
	}
	const { context } = loaded;
	const check: IssueCheck = checkIssue(source, {
		file,
		number: context.number,
		runDate: context.runDate,
		ledger: ledger.ledger,
	});
	if (resolve(dirname(file)) !== resolve(dirname(context.file))) {
		check.problems.unshift(
			`issue file ${file} should be in ${dirname(context.file)}`,
		);
		check.status = "problems";
	}
	return {
		code: check.status === "ok" ? 0 : 2,
		stdout: json(check),
		stderr: check.problems.map((problem) => `${problem}\n`).join(""),
	};
}

function renderCheckCommand(positional: string[], deps: Deps): CommandResult {
	const [file] = positional;
	if (file === undefined) {
		return { code: 64, stdout: "", stderr: `Missing issue file\n${usage}` };
	}
	let result: RenderCheck;
	try {
		result = deps.renderCheck(file);
	} catch (error) {
		return {
			code: 1,
			stdout: "",
			stderr: `${error instanceof Error ? error.message : String(error)}\n`,
		};
	}
	const { buildOutput, ...report } = result;
	if (result.status === "ok") {
		return { code: 0, stdout: json(report), stderr: "" };
	}
	return {
		code: 2,
		stdout: json(report),
		stderr: `${result.problems.join("\n")}\n${buildOutput}`,
	};
}

export function checkDiff(number: number, files: string[]) {
	const expected = `src/content/digest/${padNumber(number)}.mdx`;
	const ok = files.length === 1 && files[0] === expected;
	return {
		status: ok ? "ok" : "problems",
		expected,
		files,
		problems: ok
			? []
			: [
					`the branch must change exactly ${expected}; it changes ${files.length === 0 ? "nothing" : files.join(", ")}`,
				],
	};
}

function checkDiffCommand(
	positional: string[],
	options: Record<string, string>,
	deps: Deps,
): CommandResult {
	const [raw] = positional;
	const number = Number.parseInt(raw ?? "", 10);
	if (!Number.isInteger(number) || number < 1) {
		return { code: 64, stdout: "", stderr: `Missing issue number\n${usage}` };
	}
	let files: string[];
	try {
		files = deps.changedFiles(options.base || defaultDiffBase);
	} catch (error) {
		return {
			code: 1,
			stdout: "",
			stderr: `${error instanceof Error ? error.message : String(error)}\n`,
		};
	}
	const result = checkDiff(number, files);
	return {
		code: result.status === "ok" ? 0 : 2,
		stdout: json(result),
		stderr: result.problems.map((problem) => `${problem}\n`).join(""),
	};
}

function outcome(value: string | undefined): CheckOutcome | undefined {
	return value === "pass" || value === "fail" ? value : undefined;
}

function prBodyCommand(
	positional: string[],
	options: Record<string, string>,
	deps: Deps,
): CommandResult {
	const [file, ledgerPath] = positional;
	const pnpmCheck = outcome(options.check);
	const render = outcome(options.render);
	if (
		file === undefined ||
		ledgerPath === undefined ||
		pnpmCheck === undefined ||
		render === undefined
	) {
		return {
			code: 64,
			stdout: "",
			stderr: `pr-body needs <file> <ledger> --check pass|fail --render pass|fail\n${usage}`,
		};
	}
	const issue = checkIssueCommand([file, ledgerPath], options, deps);
	if (issue.code === 1 || issue.code === 64) {
		return issue;
	}
	const read = readJson(ledgerPath);
	const ledger = read.ok ? parseLedger(read.value) : undefined;
	if (ledger === undefined || !ledger.ok) {
		return { code: 1, stdout: "", stderr: issue.stderr };
	}
	const report = JSON.parse(issue.stdout) as IssueCheck;
	return {
		code: 0,
		stdout: prBody({
			ledger: ledger.ledger,
			markers: report.markers,
			checks: {
				checkIssue: report.status === "ok" ? "pass" : "fail",
				pnpmCheck,
				renderCheck: render,
			},
		}),
		stderr: "",
	};
}

const usage = `Usage: node scripts/digest.ts <command> [options]
Commands: context, check-ledger <ledger>, check-issue <file> <ledger>,
  render-check <file>, check-diff <number> [--base REF],
  pr-body <file> <ledger> --check pass|fail --render pass|fail
Options: --date YYYY-MM-DD, --content-dir DIR
`;

export function runDigest(
	argv: string[],
	overrides: Partial<Deps> = {},
): CommandResult {
	const deps = { ...defaultDeps, ...overrides };
	const { positional, options } = parseArgs(argv);
	const [command, ...rest] = positional;
	switch (command) {
		case "context":
			return contextCommand(options, deps);
		case "check-ledger":
			return checkLedgerCommand(rest, options, deps);
		case "check-issue":
			return checkIssueCommand(rest, options, deps);
		case "render-check":
			return renderCheckCommand(rest, deps);
		case "check-diff":
			return checkDiffCommand(rest, options, deps);
		case "pr-body":
			return prBodyCommand(rest, options, deps);
		default:
			return {
				code: 64,
				stdout: "",
				stderr: `Unknown command "${command ?? ""}"\n${usage}`,
			};
	}
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
	const result = runDigest(process.argv.slice(2));
	process.stdout.write(result.stdout);
	process.stderr.write(result.stderr);
	process.exitCode = result.code;
}
