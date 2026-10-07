export const siteTimeZone = "Europe/Amsterdam";

export type CoverageWindow = {
	start: string;
	end: string;
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
	if (!isoDate.test(value)) {
		return false;
	}
	const parsed = new Date(`${value}T00:00:00Z`);
	return (
		!Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
	);
}

export function dateInTimeZone(now: Date, timeZone = siteTimeZone): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const part = (type: string) =>
		parts.find((entry) => entry.type === type)?.value ?? "";
	return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(date: string, days: number): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	parsed.setUTCDate(parsed.getUTCDate() + days);
	return parsed.toISOString().slice(0, 10);
}

export function coverageWindow(
	runDate: string,
	previousDate: string | null,
): CoverageWindow {
	return {
		start:
			previousDate === null ? addDays(runDate, -6) : addDays(previousDate, 1),
		end: runDate,
	};
}

export function inWindow(date: string, window: CoverageWindow): boolean {
	return isIsoDate(date) && date >= window.start && date <= window.end;
}
