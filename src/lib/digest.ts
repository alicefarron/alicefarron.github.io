import { slugify } from "./slug";

export const triedItTitle = "Tried it";
export const triedItId = "tried-it";

export type ContentsEntry = {
	id: string;
	title: string;
};

const sectionTag =
	/<Section\b[^>]*?\btitle=(?:"([^"]*)"|'([^']*)'|\{\s*"([^"]*)"\s*\})/g;

export function issueContents(body: string): ContentsEntry[] {
	const entries: ContentsEntry[] = [];
	for (const match of body.matchAll(sectionTag)) {
		const title = match[1] ?? match[2] ?? match[3];
		if (title !== undefined && title.trim() !== "") {
			entries.push({ id: slugify(title), title });
		}
	}
	if (/<TriedIt\b/.test(body)) {
		entries.push({ id: triedItId, title: triedItTitle });
	}
	return entries;
}

const itemTag =
	/<Item\b[^>]*?\bheadline=(?:"([^"]*)"|'([^']*)'|\{\s*"([^"]*)"\s*\})/g;

export function issueHeadlines(body: string): string[] {
	return [...body.matchAll(itemTag)]
		.map((match) => match[1] ?? match[2] ?? match[3] ?? "")
		.filter((headline) => headline.trim() !== "");
}
