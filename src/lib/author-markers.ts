export const markerPattern = /\[ALINA:[^\]\n]*\]?/g;

export type MarkerHit = {
	marker: string;
	line: number;
};

export type MarkerPart = {
	kind: "text" | "marker";
	value: string;
};

export function hasMarker(text: string): boolean {
	return text.includes("[ALINA:");
}

export function findMarkers(text: string): MarkerHit[] {
	const hits: MarkerHit[] = [];
	const lines = text.split("\n");
	lines.forEach((value, index) => {
		for (const match of value.matchAll(markerPattern)) {
			hits.push({ marker: match[0], line: index + 1 });
		}
	});
	return hits;
}

export function splitMarkers(text: string): MarkerPart[] {
	const parts: MarkerPart[] = [];
	let last = 0;
	for (const match of text.matchAll(markerPattern)) {
		const start = match.index;
		if (start > last) {
			parts.push({ kind: "text", value: text.slice(last, start) });
		}
		parts.push({ kind: "marker", value: match[0] });
		last = start + match[0].length;
	}
	if (last < text.length) {
		parts.push({ kind: "text", value: text.slice(last) });
	}
	return parts;
}
