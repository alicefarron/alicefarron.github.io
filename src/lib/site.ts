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
	digestDay: "Monday",
	email: "shaimievaalinas@gmail.com",
	github: "https://github.com/alicefarron",
	linkedin: "https://www.linkedin.com/in/alina-shaimieva-5043a4233/",
	cv: "https://drive.google.com/file/d/1K4zLioaxgYTVEnET1auOg1ME8npQxxWB/view?usp=sharing",
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

export type CaseStudy = {
	id: string;
	title: string;
	where: string;
	when: string;
	summary: string;
	stack: string;
	result: string;
};

export type SideProject = {
	name: string;
	description: string;
	stack: string;
	sprite: "cat" | "speech-bubble" | "radar" | "clock";
	href?: string;
};

export const about = {
	bio: [
		"Alina Shaimieva. Fullstack engineer in Eindhoven, eight years of TypeScript: React, React Native, Node.js, GraphQL, Kafka, PostgreSQL.",
		"alina.os is where I keep the weekly AI digest and longer notes from work. I write them for engineers who want the useful part of the news and none of the hype.",
		"Off the clock: 3D printing, electronics, and a desktop cat written in Rust.",
	],
	caseStudies: [
		{
			id: "vet-ai-layer",
			title: "AI layer for a veterinary B2B platform",
			where: "Freelance",
			when: "2026 to now",
			summary:
				"Designed and orchestrated the AI layer for a livestock and veterinary SaaS.",
			stack: "Kotlin and Spring Boot backend, Next.js frontend",
			result: "[RESULT]",
		},
		{
			id: "mobile-platform",
			title: "One React Native app, three product teams",
			where: "ecom.tech",
			when: "2023 to 2026",
			summary:
				"Led the mobile platform team of four. Designed an FSD-based architecture so three product teams could ship in one codebase.",
			stack: "[STACK]",
			result: "[RESULT]",
		},
	] satisfies CaseStudy[],
	sideProjects: [
		{
			name: "sudo-meow",
			description: "Desktop pet with a strict performance budget.",
			stack: "Tauri 2, Rust",
			sprite: "cat",
			href: "https://github.com/alicefarron",
		},
		{
			name: "VeterokSetkaBot",
			description:
				"Telegram bot with an LLM inside, run live at a summer camp festival.",
			stack: "[STACK]",
			sprite: "speech-bubble",
		},
		{
			name: "job-radar",
			description: "Vacancy radar with an MCP server so agents can query it.",
			stack: "Python, FastAPI, Kubernetes, AWS",
			sprite: "radar",
			href: "https://github.com/alicefarron",
		},
		{
			name: "schedule-agent",
			description:
				"Personal agent that turns a weekly task list into a daily plan.",
			stack: "Hermes Agent, Railway",
			sprite: "clock",
		},
	] satisfies SideProject[],
};
