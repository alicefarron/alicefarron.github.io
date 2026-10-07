import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { type IssueFile, padNumber, readIssues } from "./digest/issues.ts";
import {
	checkLedger,
	type LedgerCheck,
	ledgerExitCodes,
} from "./digest/ledger.ts";
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

export type { LedgerCheck };

export type CommandResult = {
	code: number;
	stdout: string;
	stderr: string;
};

export type Deps = {
	now: () => Date;
	readSources: () => ParsedSources;
};

const defaultDeps: Deps = {
	now: () => new Date(),
	readSources: () => readSources(),
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
): ContextResult {
	const runDate = options.date ?? dateInTimeZone(deps.now());
	if (!isIsoDate(runDate)) {
		return { ok: false, error: `--date must be YYYY-MM-DD, got "${runDate}"` };
	}
	const contentDir = options["content-dir"] ?? "src/content";
	const context = buildContext(
		readIssues(contentDir),
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

const usage = `Usage: node scripts/digest.ts <command> [options]
Commands: context, check-ledger <ledger>
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
