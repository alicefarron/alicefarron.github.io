import { chipClass } from "../lib/chip";
import { formatDate, isoDate } from "../lib/format";
import { tagColor } from "../lib/labels";
import { document } from "../sprites/document";
import SpriteIcon from "./SpriteIcon";

export type NoteListEntry = {
	id: string;
	href: string;
	title: string;
	date: string;
	tag: string;
	dek?: string;
};

type Props = {
	note: NoteListEntry;
};

export default function NoteListItem({ note }: Props) {
	return (
		<li
			class="grid grid-cols-1 gap-x-4 gap-y-1 border-b-2 border-ink px-4 py-3 last:border-b-0 @dock:grid-cols-12 @dock:items-center"
			data-note={note.id}
		>
			<time
				dateTime={isoDate(note.date)}
				class="font-label text-label-sm @dock:col-span-2"
			>
				{formatDate(note.date)}
			</time>
			<div class="flex min-w-0 items-start gap-2 @dock:col-span-7">
				<SpriteIcon sprite={document} class="mt-1 shrink-0" />
				<div class="flex min-w-0 flex-col">
					<a
						href={note.href}
						class="font-ui text-ui leading-ui font-bold text-ink underline wrap-anywhere"
					>
						{note.title}
					</a>
					{note.dek !== undefined && (
						<span class="font-ui text-ui-sm leading-ui">{note.dek}</span>
					)}
				</div>
			</div>
			<span class="@dock:col-span-3 @dock:justify-self-end">
				<span class={chipClass(tagColor(note.tag))}>{note.tag}</span>
			</span>
		</li>
	);
}
