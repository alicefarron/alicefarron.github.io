import { findMarkers } from "./author-markers";

export type CheckedEntry = {
	id: string;
	filePath?: string;
	body?: string;
	data: Record<string, unknown>;
};

function label(entry: CheckedEntry): string {
	return entry.filePath ?? entry.id;
}

function fileStem(path: string): string {
	const name = path.split(/[\\/]/).pop() ?? path;
	return name.replace(/\.[^.]+$/, "");
}

export function assertSinglePinned(entries: CheckedEntry[]): void {
	const pinned = entries.filter((entry) => entry.data.pinned === true);
	if (pinned.length > 1) {
		throw new Error(
			`Only one note can be pinned. Pinned: ${pinned.map(label).join(", ")}`,
		);
	}
}

export function assertIssueNumbers(entries: CheckedEntry[]): void {
	const byNumber = new Map<number, string[]>();
	for (const entry of entries) {
		const path = label(entry);
		const stem = fileStem(path);
		const number = entry.data.number;
		if (!/^\d+$/.test(stem)) {
			throw new Error(
				`Digest file ${path} must be named after its issue number, for example 012.mdx`,
			);
		}
		if (typeof number !== "number" || number !== Number.parseInt(stem, 10)) {
			throw new Error(
				`Digest file ${path} has number ${String(number)} but its file name says ${stem}`,
			);
		}
		byNumber.set(number, [...(byNumber.get(number) ?? []), path]);
	}
	for (const [number, paths] of byNumber) {
		if (paths.length > 1) {
			throw new Error(`Duplicate issue number ${number}: ${paths.join(", ")}`);
		}
	}
}

function frontmatterMarkers(value: unknown): string[] {
	if (typeof value === "string") {
		return findMarkers(value).map((hit) => hit.marker);
	}
	if (Array.isArray(value)) {
		return value.flatMap(frontmatterMarkers);
	}
	if (value !== null && typeof value === "object" && !(value instanceof Date)) {
		return Object.values(value).flatMap(frontmatterMarkers);
	}
	return [];
}

export function assertNoAuthorMarkers(
	entries: CheckedEntry[],
	strict: boolean,
): void {
	if (!strict) {
		return;
	}
	const lines: string[] = [];
	for (const entry of entries) {
		if (entry.data.draft === true) {
			continue;
		}
		const path = label(entry);
		for (const marker of frontmatterMarkers(entry.data)) {
			lines.push(`  ${path}:frontmatter ${marker}`);
		}
		for (const hit of findMarkers(entry.body ?? "")) {
			lines.push(`  ${path}:${hit.line} ${hit.marker}`);
		}
	}
	if (lines.length > 0) {
		throw new Error(
			[
				"Unresolved author markers in published content (CONTENT_STRICT=true):",
				...lines,
				"Fill or remove each marker, or set draft: true.",
			].join("\n"),
		);
	}
}
