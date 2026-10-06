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
