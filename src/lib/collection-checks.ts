export type CheckedEntry = {
	id: string;
	filePath?: string;
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
