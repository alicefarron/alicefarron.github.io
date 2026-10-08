export const petLines = [
	"zzz... (idle)",
	"purr",
	"purr purr",
	"PURR. cpu usage: 0.4%",
	"ok that is enough",
] as const;

export function nextPetIndex(index: number): number {
	return Math.min(index + 1, petLines.length - 1);
}

export function isPetted(index: number): boolean {
	return index > 0;
}

export function petBodyClass(index: number): string {
	return `flex grow flex-col items-center justify-center gap-4 p-6 ${isPetted(index) ? "bg-pet-blush" : "bg-white"}`;
}
