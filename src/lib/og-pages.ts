import { getPublishedIssues, getPublishedNotes } from "./collections";
import { issuePath, notePath } from "./content";
import type { OgPage } from "./og";
import { ogImagePath } from "./seo";
import { site } from "./site";

export type OgRoute = {
	params: { path: string };
	props: { page: OgPage };
};

const staticPages: { path: string; page: OgPage }[] = [
	{
		path: "/",
		page: { kind: "page", title: site.name, subtitle: site.tagline },
	},
	{
		path: "/digest",
		page: {
			kind: "page",
			title: "Archive/",
			subtitle: "Every issue of This week in AI",
		},
	},
	{
		path: "/writing",
		page: {
			kind: "page",
			title: "Writing/",
			subtitle: "Long notes on building software",
		},
	},
	{ path: "/about", page: { kind: "page", title: "About.txt" } },
	{ path: "/404", page: { kind: "page", title: "Page not found" } },
];

export function ogParam(pathname: string): string {
	return ogImagePath(pathname)
		.replace(/^\/og\//, "")
		.replace(/\.png$/, "");
}

export async function ogRoutes(): Promise<OgRoute[]> {
	const issues = await getPublishedIssues();
	const notes = await getPublishedNotes();
	const pages = [
		...staticPages,
		...issues.map((issue) => ({
			path: issuePath(issue.data.number),
			page: {
				kind: "issue" as const,
				title: issue.data.title,
				issueNumber: issue.data.number,
			},
		})),
		...notes.map((note) => ({
			path: notePath(note.id),
			page: {
				kind: "note" as const,
				title: note.data.title,
				tag: note.data.tag,
			},
		})),
	];
	return pages.map(({ path, page }) => ({
		params: { path: ogParam(path) },
		props: { page },
	}));
}
