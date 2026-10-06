import { loadRenderers } from "astro:container";
import { render } from "astro:content";
import { getContainerRenderer as mdxRenderer } from "@astrojs/mdx/container-renderer";
import rss, { type RSSFeedItem } from "@astrojs/rss";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import {
	getPublishedIssues,
	getPublishedNotes,
	type Issue,
	type Note,
} from "./collections";
import { issuePath, notePath } from "./content";
import { absolutizeHtml, byNewest, type FeedKind, feedChannel } from "./feed";
import { issueLabel } from "./format";
import { digestComponents, noteComponents } from "./mdx-components";
import { absoluteUrl, siteOrigin } from "./seo";

type DatedItem = RSSFeedItem & { pubDate: Date };

async function createContainer(): Promise<AstroContainer> {
	const renderers = await loadRenderers([mdxRenderer()]);
	return AstroContainer.create({ renderers });
}

async function entryHtml(
	container: AstroContainer,
	entry: Issue | Note,
	components: Record<string, unknown>,
	origin: string,
): Promise<string> {
	const { Content } = await render(entry);
	const html = await container.renderToString(Content, {
		props: { components },
	});
	return absolutizeHtml(html, origin);
}

async function issueItems(
	container: AstroContainer,
	origin: string,
): Promise<DatedItem[]> {
	const issues = await getPublishedIssues();
	return Promise.all(
		issues.map(async (issue) => ({
			title: `${issueLabel(issue.data.number)}: ${issue.data.title}`,
			link: absoluteUrl(issuePath(issue.data.number), origin),
			pubDate: issue.data.date,
			description: issue.data.lede,
			categories: [...issue.data.topics],
			content: await entryHtml(container, issue, digestComponents, origin),
		})),
	);
}

async function noteItems(
	container: AstroContainer,
	origin: string,
): Promise<DatedItem[]> {
	const notes = await getPublishedNotes();
	return Promise.all(
		notes.map(async (note) => ({
			title: note.data.title,
			link: absoluteUrl(notePath(note.id), origin),
			pubDate: note.data.date,
			description: note.data.dek,
			categories: [note.data.tag],
			content: await entryHtml(container, note, noteComponents, origin),
		})),
	);
}

export async function feedResponse(
	kind: FeedKind,
	site: URL | undefined,
): Promise<Response> {
	const origin = siteOrigin(site);
	const container = await createContainer();
	const items = [
		...(kind === "writing" ? [] : await issueItems(container, origin)),
		...(kind === "digest" ? [] : await noteItems(container, origin)),
	];
	const channel = feedChannel(kind);
	return rss({
		title: channel.title,
		description: channel.description,
		site: absoluteUrl(channel.path, origin),
		items: byNewest(items),
		xmlns: { content: "http://purl.org/rss/1.0/modules/content/" },
		customData: "<language>en</language>",
		trailingSlash: false,
	});
}
