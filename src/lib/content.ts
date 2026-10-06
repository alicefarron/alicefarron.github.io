type Draftable = { data: { draft: boolean } };
type IssueLike = Draftable & { data: { number: number } };
type NoteLike = Draftable & {
	id: string;
	data: { title: string; date: Date; pinned: boolean };
};

export function published<T extends Draftable>(
	entries: T[],
	isProduction: boolean,
): T[] {
	return isProduction
		? entries.filter((entry) => !entry.data.draft)
		: [...entries];
}

export function sortIssues<T extends IssueLike>(issues: T[]): T[] {
	return [...issues].sort((a, b) => b.data.number - a.data.number);
}

export function latestIssue<T extends IssueLike>(issues: T[]): T {
	const [latest] = sortIssues(issues);
	if (latest === undefined) {
		throw new Error("No published digest issues");
	}
	return latest;
}

export function prevIssue<T extends IssueLike>(
	issues: T[],
	number: number,
): T | undefined {
	return sortIssues(issues).find((entry) => entry.data.number < number);
}

export function issuePath(number: number): string {
	return `/digest/${String(number).padStart(3, "0")}`;
}

export function sortNotes<T extends NoteLike>(notes: T[]): T[] {
	return [...notes].sort(
		(a, b) =>
			b.data.date.getTime() - a.data.date.getTime() ||
			a.data.title.localeCompare(b.data.title),
	);
}

export function newestNotes<T extends NoteLike>(
	notes: T[],
	count: number,
): T[] {
	return sortNotes(notes).slice(0, count);
}

export function pinnedOrNewest<T extends NoteLike>(notes: T[]): T | undefined {
	return notes.find((entry) => entry.data.pinned) ?? sortNotes(notes)[0];
}

export function prevNextNote<T extends NoteLike>(
	notes: T[],
	id: string,
): { prev?: T; next?: T } {
	const ordered = sortNotes(notes).reverse();
	const index = ordered.findIndex((entry) => entry.id === id);
	if (index === -1) {
		return {};
	}
	return { prev: ordered[index - 1], next: ordered[index + 1] };
}

export function notePath(id: string): string {
	return `/writing/${id}`;
}
