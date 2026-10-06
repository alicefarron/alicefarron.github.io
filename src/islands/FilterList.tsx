import { useEffect, useState } from "preact/hooks";
import { chipClass } from "../lib/chip";
import { countLabel, filterItems, toggleFilter } from "../lib/filter";
import IssueListItem, { type IssueListEntry } from "./IssueListItem";
import NoteListItem, { type NoteListEntry } from "./NoteListItem";

type IssueProps = {
	kind: "issue";
	items: IssueListEntry[];
};

type NoteProps = {
	kind: "note";
	items: NoteListEntry[];
};

type Props = (IssueProps | NoteProps) & {
	filters: readonly string[];
	groupLabel: string;
};

type Row =
	| { kind: "issue"; labels: string[]; issue: IssueListEntry }
	| { kind: "note"; labels: string[]; note: NoteListEntry };

function toRows(props: IssueProps | NoteProps): Row[] {
	return props.kind === "issue"
		? props.items.map((issue) => ({
				kind: "issue",
				labels: issue.topics,
				issue,
			}))
		: props.items.map((note) => ({ kind: "note", labels: [note.tag], note }));
}

const buttonBase =
	"border-window min-h-11 px-3 font-label text-label-sm uppercase text-ink";

export default function FilterList(props: Props) {
	const [mounted, setMounted] = useState(false);
	const [active, setActive] = useState<string | undefined>(undefined);

	useEffect(() => {
		setMounted(true);
	}, []);

	const visible = filterItems(toRows(props), active);
	const noun = props.kind === "issue" ? "issue" : "note";
	const options: (string | undefined)[] = [undefined, ...props.filters];

	return (
		<div>
			<div class="flex flex-wrap items-center justify-between gap-3 border-b-window px-4 py-3">
				<p class="font-label text-label" aria-live="polite" data-count>
					{countLabel(visible.length, noun)}
				</p>
				<fieldset hidden={!mounted} class="flex flex-wrap gap-2" data-filters>
					<legend class="sr-only">{props.groupLabel}</legend>
					{options.map((option) => {
						const pressed = option === active;
						return (
							<button
								key={option ?? "all"}
								type="button"
								aria-pressed={pressed ? "true" : "false"}
								onClick={() => setActive(toggleFilter(active, option))}
								class={
									pressed
										? `${buttonBase} bg-ink text-white`
										: `${buttonBase} ${chipClass("white")}`
								}
							>
								{option ?? "All"}
							</button>
						);
					})}
				</fieldset>
			</div>
			<ul data-list>
				{visible.map((row) =>
					row.kind === "issue" ? (
						<IssueListItem key={row.issue.id} issue={row.issue} />
					) : (
						<NoteListItem key={row.note.id} note={row.note} />
					),
				)}
			</ul>
		</div>
	);
}
