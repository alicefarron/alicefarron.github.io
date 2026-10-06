import { type CollectionEntry, getCollection } from "astro:content";
import { published, sortIssues, sortNotes } from "./content";
import { readingTime } from "./reading-time";

export type Issue = CollectionEntry<"digest">;
export type Note = CollectionEntry<"notes">;

export async function getPublishedIssues(): Promise<Issue[]> {
	return sortIssues(
		published(await getCollection("digest"), import.meta.env.PROD),
	);
}

export async function getPublishedNotes(): Promise<Note[]> {
	return sortNotes(
		published(await getCollection("notes"), import.meta.env.PROD),
	);
}

export function entryReadingTime(entry: Issue | Note): number {
	return readingTime(entry.body ?? "");
}
