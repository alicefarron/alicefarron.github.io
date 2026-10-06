export type RouteEntry = {
	path: string;
	name: string;
};

export const routes: RouteEntry[] = [
	{ path: "/", name: "home" },
	{ path: "/digest", name: "archive" },
	{ path: "/digest/012", name: "issue-with-quote" },
	{ path: "/digest/011", name: "issue-without-quote" },
	{ path: "/writing", name: "writing" },
	{ path: "/writing/sample-note-code", name: "article-code" },
	{ path: "/writing/sample-note-table", name: "article-table" },
	{ path: "/writing/sample-note-cover", name: "article-cover" },
	{ path: "/about", name: "about" },
	{ path: "/404", name: "not-found" },
];
