export type NavId = "digest" | "writing" | "about" | "subscribe";

export type NavItem = {
	id: NavId;
	label: string;
	href: string;
	match?: string;
};

export const site = {
	name: "alina.os",
	author: "Alina Shaimieva",
	description: "[SITE_DESCRIPTION]",
	domain: "[DOMAIN]",
	digestDay: "[DAY]",
	email: "[EMAIL]",
	github: "https://github.com/alicefarron",
	linkedin: "[LINKEDIN_URL]",
} as const;

export const navItems: NavItem[] = [
	{ id: "digest", label: "Digest", href: "/digest", match: "/digest" },
	{ id: "writing", label: "Writing", href: "/writing", match: "/writing" },
	{ id: "about", label: "About", href: "/about", match: "/about" },
	{ id: "subscribe", label: "Subscribe", href: "/#subscribe" },
];

export function currentNav(pathname: string): NavId | undefined {
	const path = pathname.replace(/\/+$/, "") || "/";
	return navItems.find(
		(item) =>
			item.match !== undefined &&
			(path === item.match || path.startsWith(`${item.match}/`)),
	)?.id;
}

export function subscribeHref(hasForm: boolean): string {
	return hasForm ? "#subscribe" : "/#subscribe";
}

export function isHome(pathname: string): boolean {
	return (pathname.replace(/\/+$/, "") || "/") === "/";
}
