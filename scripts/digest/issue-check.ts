import { parseFrontmatter } from "astro/markdown";
import { findMarkers } from "../../src/lib/author-markers.ts";
import { digestSchema, digestTopics } from "../../src/lib/schemas.ts";
import { frontmatterDate, padNumber } from "./issues.ts";
import { type Ledger, maxItems, maxPerSection, minItems } from "./ledger.ts";
import { normalizeUrl } from "./urls.ts";

export const sectionColors: Record<string, string> = {
	Models: "sky",
	Tooling: "yellow",
	Agents: "pink",
	Papers: "lime",
};

export const triedItMarker = "[ALINA: tried it this week]";
export const takeMarker = "[ALINA: your take, optional]";

export type IssueMarker = {
	line: number;
	marker: string;
};

export type IssueCheck = {
	status: "ok" | "problems";
	problems: string[];
	markers: IssueMarker[];
};

export type ParsedItem = {
	section: string | null;
	headline: string;
	sourceName: string;
	url: string;
};

export type ParsedSection = {
	title: string;
	color: string;
};

export type ParsedIssueBody = {
	intro: string;
	sections: ParsedSection[];
	items: ParsedItem[];
	triedIt: Array<{ attributes: string; content: string }>;
};

const tagPattern =
	/<(\/?)(Section|Item|TriedIt)\b((?:[^>"'{}]|"[^"]*"|'[^']*'|\{\{[^}]*\}\}|\{[^}]*\})*)>/g;

function attribute(attributes: string, name: string): string {
	const match = new RegExp(
		`\\b${name}=(?:"([^"]*)"|'([^']*)'|\\{\\s*"([^"]*)"\\s*\\})`,
	).exec(attributes);
	return match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}

function sourceField(attributes: string, field: string): string {
	const match = new RegExp(`\\b${field}:\\s*(?:"([^"]*)"|'([^']*)')`).exec(
		attributes,
	);
	return match?.[1] ?? match?.[2] ?? "";
}

export function parseIssueBody(body: string): ParsedIssueBody {
	const sections: ParsedSection[] = [];
	const items: ParsedItem[] = [];
	const triedIt: ParsedIssueBody["triedIt"] = [];
	let current: string | null = null;
	let introEnd: number | undefined;
	let triedItOpen: { attributes: string; start: number } | undefined;
	for (const match of body.matchAll(tagPattern)) {
		const closing = match[1] === "/";
		const name = match[2];
		const attributes = match[3] ?? "";
		if (name === "Section" && !closing) {
			introEnd ??= match.index;
			current = attribute(attributes, "title");
			sections.push({ title: current, color: attribute(attributes, "color") });
		} else if (name === "Section" && closing) {
			current = null;
		} else if (name === "Item" && !closing) {
			introEnd ??= match.index;
			items.push({
				section: current,
				headline: attribute(attributes, "headline"),
				sourceName: sourceField(attributes, "name"),
				url: sourceField(attributes, "url"),
			});
		} else if (name === "TriedIt" && !closing) {
			introEnd ??= match.index;
			triedItOpen = {
				attributes: attributes.trim(),
				start: match.index + match[0].length,
			};
			if (attributes.trim().endsWith("/")) {
				triedIt.push({ attributes: attributes.trim(), content: "" });
				triedItOpen = undefined;
			}
		} else if (name === "TriedIt" && closing && triedItOpen !== undefined) {
			triedIt.push({
				attributes: triedItOpen.attributes,
				content: body.slice(triedItOpen.start, match.index).trim(),
			});
			triedItOpen = undefined;
		}
	}
	if (triedItOpen !== undefined) {
		triedIt.push({
			attributes: triedItOpen.attributes,
			content: body.slice(triedItOpen.start).trim(),
		});
	}
	return {
		intro: body.slice(0, introEnd ?? body.length).trim(),
		sections,
		items,
		triedIt,
	};
}

export type IssueExpectations = {
	file: string;
	number: number;
	runDate: string;
	ledger: Ledger;
};

function frontmatterProblems(
	frontmatter: Record<string, unknown>,
	expect: IssueExpectations,
): string[] {
	const problems: string[] = [];
	const parsed = digestSchema.safeParse(frontmatter);
	if (!parsed.success) {
		for (const issue of parsed.error.issues) {
			problems.push(
				`frontmatter ${issue.path.join(".") || "(root)"}: ${issue.message}`,
			);
		}
	}
	if (frontmatter.number !== expect.number) {
		problems.push(
			`frontmatter number ${String(frontmatter.number)} is not the next issue number ${expect.number}`,
		);
	}
	const date = frontmatterDate(frontmatter.date);
	if (date !== expect.runDate) {
		problems.push(
			`frontmatter date ${date || "(missing)"} is not the run date ${expect.runDate}`,
		);
	}
	if (frontmatter.draft === true) {
		problems.push("frontmatter has draft: true; the issue must be published");
	}
	return problems;
}

function sectionProblems(
	sections: ParsedSection[],
	frontmatter: Record<string, unknown>,
): string[] {
	const problems: string[] = [];
	const seen = new Set<string>();
	for (const section of sections) {
		const color = sectionColors[section.title];
		if (color === undefined) {
			problems.push(
				`Section "${section.title}" is not one of ${digestTopics.join(", ")}`,
			);
		} else if (section.color !== color) {
			problems.push(
				`Section "${section.title}" has color "${section.color}", expected "${color}"`,
			);
		}
		if (seen.has(section.title)) {
			problems.push(`Section "${section.title}" appears twice`);
		}
		seen.add(section.title);
	}
	const topics = Array.isArray(frontmatter.topics)
		? frontmatter.topics.map(String)
		: [];
	const used = [...seen].sort();
	const listed = [...new Set(topics)].sort();
	if (used.join("|") !== listed.join("|") || topics.length !== listed.length) {
		problems.push(
			`topics [${topics.join(", ")}] do not equal the sections used [${[...seen].join(", ")}]`,
		);
	}
	return problems;
}

function itemProblems(items: ParsedItem[], ledger: Ledger): string[] {
	const problems: string[] = [];
	if (items.length < minItems || items.length > maxItems) {
		problems.push(
			`issue has ${items.length} items, expected ${minItems} to ${maxItems}`,
		);
	}
	const counts = new Map<string, number>();
	for (const item of items) {
		if (item.section === null) {
			problems.push(`Item "${item.headline}" is outside a Section`);
			continue;
		}
		counts.set(item.section, (counts.get(item.section) ?? 0) + 1);
	}
	for (const [section, count] of counts) {
		if (count > maxPerSection) {
			problems.push(
				`Section "${section}" has ${count} items, at most ${maxPerSection} allowed`,
			);
		}
	}
	const key = (section: string | null, url: string) =>
		`${section ?? ""} ${normalizeUrl(url)}`;
	const remaining = ledger.items.map((item) => ({
		item,
		key: key(item.section, item.url),
	}));
	for (const item of items) {
		const at = remaining.findIndex(
			(entry) => entry.key === key(item.section, item.url),
		);
		if (at === -1) {
			problems.push(
				`Item "${item.headline}" (${item.section ?? "no section"}, ${item.url || "no URL"}) is not in the ledger`,
			);
		} else {
			remaining.splice(at, 1);
		}
	}
	for (const { item } of remaining) {
		problems.push(
			`ledger item "${item.headline}" (${item.section}, ${item.url}) is not in the file`,
		);
	}
	return problems;
}

function triedItProblems(triedIt: ParsedIssueBody["triedIt"]): string[] {
	if (triedIt.length === 0) {
		return ["TriedIt is missing"];
	}
	if (triedIt.length > 1) {
		return [`TriedIt appears ${triedIt.length} times, expected once`];
	}
	const [only] = triedIt;
	const problems: string[] = [];
	if (only !== undefined && only.attributes !== "") {
		problems.push(`TriedIt must have no props, found "${only.attributes}"`);
	}
	if (only !== undefined && only.content !== triedItMarker) {
		problems.push(`TriedIt must contain only ${triedItMarker}`);
	}
	return problems;
}

function quoteProblems(
	frontmatter: Record<string, unknown>,
	ledger: Ledger,
): string[] {
	const quote = frontmatter.quote;
	if (quote === undefined) {
		return [];
	}
	if (ledger.quote === null) {
		return ["frontmatter has a quote but the ledger quote is null"];
	}
	const record =
		typeof quote === "object" && quote !== null
			? (quote as Record<string, unknown>)
			: {};
	const problems: string[] = [];
	for (const field of ["text", "author", "role"] as const) {
		if (record[field] !== ledger.quote[field]) {
			problems.push(
				`frontmatter quote.${field} does not equal the ledger quote`,
			);
		}
	}
	return problems;
}

export function issueMarkers(source: string): IssueMarker[] {
	return findMarkers(source).map((hit) => ({
		line: hit.line,
		marker: hit.marker,
	}));
}

export function checkIssue(
	source: string,
	expect: IssueExpectations,
): IssueCheck {
	const problems: string[] = [];
	const name = expect.file.split("/").pop() ?? expect.file;
	const expectedName = `${padNumber(expect.number)}.mdx`;
	if (name !== expectedName) {
		problems.push(`file name ${name} should be ${expectedName}`);
	}
	let frontmatter: Record<string, unknown> = {};
	let body = source;
	try {
		const parsed = parseFrontmatter(source);
		frontmatter = parsed.frontmatter;
		body = parsed.content;
	} catch (error) {
		problems.push(
			`frontmatter cannot be parsed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
	const parsedBody = parseIssueBody(body);
	problems.push(
		...frontmatterProblems(frontmatter, expect),
		...sectionProblems(parsedBody.sections, frontmatter),
		...itemProblems(parsedBody.items, expect.ledger),
		...triedItProblems(parsedBody.triedIt),
	);
	if (!parsedBody.intro.endsWith(takeMarker)) {
		problems.push(`the intro must end with ${takeMarker}`);
	}
	problems.push(...quoteProblems(frontmatter, expect.ledger));
	return {
		status: problems.length === 0 ? "ok" : "problems",
		problems,
		markers: issueMarkers(source),
	};
}
