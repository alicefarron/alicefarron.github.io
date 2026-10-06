export type ChipColor =
	| "pink"
	| "lime"
	| "yellow"
	| "sky"
	| "white"
	| "lavender";

const colorClasses: Record<ChipColor, string> = {
	pink: "bg-pink",
	lime: "bg-lime",
	yellow: "bg-yellow",
	sky: "bg-sky",
	white: "bg-white",
	lavender: "bg-lavender",
};

export const chipBase =
	"border-window inline-flex items-center px-2 py-0.5 font-label text-label-sm leading-none text-ink uppercase";

export function chipClass(color: ChipColor): string {
	return `${chipBase} ${colorClasses[color]}`;
}
