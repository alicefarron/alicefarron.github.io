import type { IssueListEntry } from "../islands/IssueListItem";
import type { NoteListEntry } from "../islands/NoteListItem";
import { entryReadingTime, type Issue, type Note } from "./collections";
import { issuePath, notePath } from "./content";

export function noteEntry(note: Note): NoteListEntry {
	return {
		id: note.id,
		href: notePath(note.id),
		title: note.data.title,
		date: note.data.date.toISOString(),
		tag: note.data.tag,
		dek: note.data.dek,
	};
}

export function issueEntry(issue: Issue): IssueListEntry {
	return {
		id: issue.id,
		href: issuePath(issue.data.number),
		number: issue.data.number,
		title: issue.data.title,
		date: issue.data.date.toISOString(),
		topics: [...issue.data.topics],
	};
}

export { entryReadingTime };
