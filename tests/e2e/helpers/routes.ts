export type RouteEntry = {
	path: string;
	name: string;
};

export const routes: RouteEntry[] = [
	{ path: "/", name: "home" },
	{ path: "/404", name: "not-found" },
];
