import { chipClass } from "../lib/chip";
import { formatDate, isoDate, issueLabel } from "../lib/format";
import { topicColor } from "../lib/labels";

export type IssueListEntry = {
	id: string;
	href: string;
	number: number;
	title: string;
	date: string;
	topics: string[];
};

type Props = {
	issue: IssueListEntry;
};

export default function IssueListItem({ issue }: Props) {
	return (
		<li
			class="grid grid-cols-1 gap-x-4 gap-y-2 border-b-2 border-ink px-4 py-3 last:border-b-0 @dock:grid-cols-12 @dock:items-center"
			data-issue={issue.number}
		>
			<span class="flex items-center gap-3 @dock:col-span-3">
				<span class="bg-ink px-2 py-0.5 font-label text-label-sm text-white">
					{issueLabel(issue.number)}
				</span>
				<time dateTime={isoDate(issue.date)} class="font-label text-label-sm">
					{formatDate(issue.date)}
				</time>
			</span>
			<a
				href={issue.href}
				class="font-ui text-ui leading-ui font-bold text-ink underline wrap-anywhere @dock:col-span-5"
			>
				{issue.title}
			</a>
			<ul class="flex flex-wrap gap-2 @dock:col-span-4 @dock:justify-end">
				{issue.topics.map((topic) => (
					<li key={topic} class={chipClass(topicColor(topic))}>
						{topic}
					</li>
				))}
			</ul>
		</li>
	);
}
