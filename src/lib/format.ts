const dateFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

export function isoDate(date: Date | string): string {
	return new Date(date).toISOString().slice(0, 10);
}

export function formatDate(date: Date | string): string {
	return dateFormat.format(new Date(date));
}

export function issueLabel(number: number): string {
	return `#${String(number).padStart(3, "0")}`;
}

export function minutesLabel(minutes: number): string {
	return `${minutes} min read`;
}
