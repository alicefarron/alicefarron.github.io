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
	tagline: "A weekly AI digest and long notes on building software.",
	taglineHighlight: "Only the news you can use on Monday.",
	domain: "[DOMAIN]",
	digestDay: "[DAY]",
	email: "[EMAIL]",
	github: "https://github.com/alicefarron",
	linkedin: "[LINKEDIN_URL]",
	buttondownUsername: "[BUTTONDOWN_USERNAME]",
} as const;

export function buttondownAction(
	username: string = site.buttondownUsername,
): string {
	return `https://buttondown.com/api/emails/embed-subscribe/${username}`;
}

export function isPlaceholder(value: string): boolean {
	return /^\[[A-Z_ ]+\]$/.test(value);
}

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
