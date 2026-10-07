import type { IssueMarker } from "./issue-check.ts";
import type { Ledger } from "./ledger.ts";

export type CheckOutcome = "pass" | "fail";

export type PrBodyInput = {
	ledger: Ledger;
	markers: IssueMarker[];
	checks: {
		checkIssue: CheckOutcome;
		pnpmCheck: CheckOutcome;
		renderCheck: CheckOutcome;
	};
};

function cell(value: string): string {
	return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function prBody({ ledger, markers, checks }: PrBodyInput): string {
	const lines: string[] = [
		"## Items",
		"",
		"| # | Section | Headline | Source | Date on page |",
		"|---|---|---|---|---|",
		...ledger.items.map(
			(item, index) =>
				`| ${index + 1} | ${cell(item.section)} | ${cell(item.headline)} | [${cell(item.sourceName)}](${item.url}) | ${cell(item.dateEvidence)} (${item.publishedDate}) |`,
		),
		"",
		"## Quote",
		"",
		ledger.quote === null
			? "None"
			: `"${ledger.quote.text}" (${ledger.quote.author}, ${ledger.quote.role}). Source: ${ledger.quote.url}`,
		"",
		"## Dropped",
		"",
		...(ledger.dropped.length === 0
			? ["None"]
			: ledger.dropped.map(
					(entry) => `- ${entry.headline ?? entry.url}: ${entry.reason}`,
				)),
		"",
		"## Sources checked",
		"",
		...ledger.sourcesChecked.map(
			(source) => `- ${source.url}: ${source.note || "checked"}`,
		),
		"",
		"## Author markers left",
		"",
		...(markers.length === 0
			? ["None"]
			: markers.map((marker) => `- line ${marker.line}: ${marker.marker}`)),
		"",
		"## Checks",
		"",
		`- check-issue: ${checks.checkIssue}`,
		`- pnpm check: ${checks.pnpmCheck}`,
		`- render-check: ${checks.renderCheck}`,
		"",
		"## Before merging",
		"",
		"- [ ] Fill or delete every marker (production refuses to build with one left)",
		"- [ ] Open three source links and compare the dates",
		"",
	];
	return lines.join("\n");
}
