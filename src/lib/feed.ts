export type FeedKind = "all" | "digest" | "writing";

export type FeedChannel = {
	title: string;
	description: string;
	path: string;
};

const channels: Record<FeedKind, FeedChannel> = {
	all: {
		title: "alina.os",
		description:
			"This week in AI and long notes on building software, in one feed.",
		path: "/",
	},
	digest: {
		title: "alina.os: This week in AI",
		description: "The weekly AI digest from alina.os, full issues.",
		path: "/digest",
	},
	writing: {
		title: "alina.os: writing",
		description: "Long notes on building software from alina.os, full text.",
		path: "/writing",
	},
};

export function feedChannel(kind: FeedKind): FeedChannel {
	return channels[kind];
}

export function absolutizeHtml(html: string, origin: string): string {
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(
			/\b(href|src)="\/(?!\/)([^"]*)"/g,
			(_match, attr: string, rest: string) => `${attr}="${origin}/${rest}"`,
		);
}

export function byNewest<T extends { pubDate: Date }>(items: T[]): T[] {
	return [...items].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}
