export type RouteEntry = {
	path: string;
	name: string;
};

export const routes: RouteEntry[] = [
	{ path: "/", name: "home" },
	{ path: "/digest", name: "archive" },
	{ path: "/digest/012", name: "issue-with-quote" },
	{ path: "/digest/011", name: "issue-without-quote" },
	{ path: "/404", name: "not-found" },
];
