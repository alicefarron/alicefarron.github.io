export function filterItems<T extends { labels: readonly string[] }>(
	items: readonly T[],
	active: string | undefined,
): T[] {
	return active === undefined
		? [...items]
		: items.filter((item) => item.labels.includes(active));
}

export function toggleFilter(
	active: string | undefined,
	pressed: string | undefined,
): string | undefined {
	return pressed === undefined || pressed === active ? undefined : pressed;
}

export function countLabel(count: number, noun: string): string {
	return `${count} ${count === 1 ? noun : `${noun}s`}`;
}
