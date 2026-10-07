import { z } from "astro/zod";
import { digestTopics } from "../../src/lib/schemas.ts";
import { normalizeUrl } from "./urls.ts";
import { type CoverageWindow, inWindow, isIsoDate } from "./window.ts";

export const maxPerSection = 4;
export const minItems = 4;
export const maxItems = 10;

const text = z.string().trim().min(1);

export const ledgerItemSchema = z.object({
	section: z.string(),
	headline: text,
	sourceName: text,
	url: text,
	publishedDate: z.string(),
	dateEvidence: text,
	takeaway: text,
});

export const ledgerQuoteSchema = z.object({
	text: z.string(),
	author: z.string(),
	role: z.string(),
	url: z.string(),
});

export const ledgerSchema = z.object({
	number: z.number().int().positive(),
	runDate: z.string(),
	window: z.object({ start: z.string(), end: z.string() }),
	sourcesChecked: z.array(z.object({ url: text, note: z.string() })),
	opened: z.array(z.string()),
	items: z.array(ledgerItemSchema),
	dropped: z.array(
		z.object({
			headline: z.string().optional(),
			url: z.string(),
			reason: text,
		}),
	),
	quote: ledgerQuoteSchema.nullable(),
});

export type Ledger = z.infer<typeof ledgerSchema>;
export type LedgerItem = z.infer<typeof ledgerItemSchema>;
export type LedgerQuote = z.infer<typeof ledgerQuoteSchema>;

export type LedgerExpectations = {
	number: number;
	runDate: string;
	window: CoverageWindow;
	citedUrls: Array<{ issue: number; normalized: string }>;
	sourceUrls: string[];
};

export type LedgerCheck = {
	status: "ok" | "problems" | "thin";
	validItems: number;
	problems: string[];
};

export const ledgerExitCodes = { ok: 0, problems: 2, thin: 3 } as const;

function isTopic(value: string): boolean {
	return (digestTopics as readonly string[]).includes(value);
}

export function parseLedger(
	input: unknown,
): { ok: true; ledger: Ledger } | { ok: false; problems: string[] } {
	const parsed = ledgerSchema.safeParse(input);
	if (parsed.success) {
		return { ok: true, ledger: parsed.data };
	}
	return {
		ok: false,
		problems: parsed.error.issues.map(
			(issue) => `ledger ${issue.path.join(".") || "(root)"}: ${issue.message}`,
		),
	};
}

function itemProblems(
	item: LedgerItem,
	index: number,
	expect: LedgerExpectations,
	opened: Set<string>,
	seen: Map<string, number>,
): string[] {
	const label = `item ${index + 1} (${item.url})`;
	const problems: string[] = [];
	const normalized = normalizeUrl(item.url);
	if (!isTopic(item.section)) {
		problems.push(
			`${label}: section "${item.section}" is not one of ${digestTopics.join(", ")}`,
		);
	}
	if (!isIsoDate(item.publishedDate)) {
		problems.push(
			`${label}: publishedDate "${item.publishedDate}" is not YYYY-MM-DD`,
		);
	} else if (!inWindow(item.publishedDate, expect.window)) {
		problems.push(
			`${label}: published ${item.publishedDate}, outside the window ${expect.window.start} to ${expect.window.end}`,
		);
	}
	if (!opened.has(normalized)) {
		problems.push(`${label}: URL is not in opened`);
	}
	const cited = expect.citedUrls.find(
		(entry) => entry.normalized === normalized,
	);
	if (cited !== undefined) {
		problems.push(`${label}: already cited in issue ${cited.issue}`);
	}
	const first = seen.get(normalized);
	if (first !== undefined) {
		problems.push(`${label}: same URL as item ${first + 1}`);
	} else {
		seen.set(normalized, index);
	}
	return problems;
}

export function checkLedger(
	input: unknown,
	expect: LedgerExpectations,
): LedgerCheck {
	const parsed = parseLedger(input);
	if (!parsed.ok) {
		return { status: "problems", validItems: 0, problems: parsed.problems };
	}
	const { ledger } = parsed;
	const general: string[] = [];
	if (ledger.number !== expect.number) {
		general.push(
			`ledger number ${ledger.number} does not match the next issue number ${expect.number}`,
		);
	}
	if (ledger.runDate !== expect.runDate) {
		general.push(
			`ledger runDate ${ledger.runDate} does not match the run date ${expect.runDate}`,
		);
	}
	if (
		ledger.window.start !== expect.window.start ||
		ledger.window.end !== expect.window.end
	) {
		general.push(
			`ledger window ${ledger.window.start} to ${ledger.window.end} does not match ${expect.window.start} to ${expect.window.end}`,
		);
	}
	const checked = new Set(
		ledger.sourcesChecked.map((source) => normalizeUrl(source.url)),
	);
	for (const url of expect.sourceUrls) {
		if (!checked.has(normalizeUrl(url))) {
			general.push(`sources.md source ${url} is missing from sourcesChecked`);
		}
	}
	const opened = new Set(ledger.opened.map(normalizeUrl));
	if (ledger.quote !== null) {
		const quote = ledger.quote;
		for (const field of ["text", "author", "role", "url"] as const) {
			if (quote[field].trim() === "") {
				general.push(`quote: ${field} is empty`);
			}
		}
		if (quote.url.trim() !== "" && !opened.has(normalizeUrl(quote.url))) {
			general.push(`quote: URL ${quote.url} is not in opened`);
		}
	}
	const seen = new Map<string, number>();
	const perItem = ledger.items.map((item, index) =>
		itemProblems(item, index, expect, opened, seen),
	);
	const valid = ledger.items.filter((_, index) => perItem[index]?.length === 0);
	const selection: string[] = [];
	const counts = new Map<string, number>();
	for (const item of ledger.items) {
		counts.set(item.section, (counts.get(item.section) ?? 0) + 1);
	}
	for (const [section, count] of counts) {
		if (count > maxPerSection) {
			selection.push(
				`section ${section} has ${count} items, at most ${maxPerSection} allowed`,
			);
		}
	}
	if (ledger.items.length > maxItems) {
		selection.push(
			`ledger has ${ledger.items.length} items, at most ${maxItems} allowed`,
		);
	}
	const itemIssues = perItem.flat();
	if (general.length > 0) {
		return {
			status: "problems",
			validItems: valid.length,
			problems: [...general, ...itemIssues, ...selection],
		};
	}
	if (valid.length < minItems) {
		return {
			status: "thin",
			validItems: valid.length,
			problems: [
				`only ${valid.length} valid items, at least ${minItems} needed`,
				...itemIssues,
			],
		};
	}
	const problems = [...itemIssues, ...selection];
	return {
		status: problems.length === 0 ? "ok" : "problems",
		validItems: valid.length,
		problems,
	};
}
