export const placeholderSiteUrl = "https://domain.invalid";

export const ogImageSize = { width: 1200, height: 630 } as const;

export type SiteEnv = {
	SITE_URL?: string;
	RAILWAY_PUBLIC_DOMAIN?: string;
};

function nonEmpty(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed === undefined || trimmed === "" ? undefined : trimmed;
}

export function resolveSiteUrl(env: SiteEnv): string {
	const explicit = nonEmpty(env.SITE_URL);
	const railway = nonEmpty(env.RAILWAY_PUBLIC_DOMAIN);
	const candidate =
		explicit ??
		(railway === undefined ? placeholderSiteUrl : `https://${railway}`);
	let url: URL;
	try {
		url = new URL(candidate);
	} catch {
		throw new Error(
			`SITE_URL must be an absolute http(s) URL, got ${candidate}`,
		);
	}
	if (url.protocol !== "https:" && url.protocol !== "http:") {
		throw new Error(
			`SITE_URL must be an absolute http(s) URL, got ${candidate}`,
		);
	}
	return url.origin;
}

export function siteOrigin(site: URL | string | undefined): string {
	return site === undefined ? placeholderSiteUrl : new URL(site).origin;
}

export function pageTitle(title?: string, siteName = "alina.os"): string {
	return title === undefined ? siteName : `${title} | ${siteName}`;
}

export function normalizePath(pathname: string): string {
	const path = pathname
		.replace(/\/index\.html$/, "")
		.replace(/\.html$/, "")
		.replace(/\/+$/, "");
	return path === "" ? "/" : path;
}

export function absoluteUrl(
	path: string,
	site: URL | string | undefined,
): string {
	return new URL(path, `${siteOrigin(site)}/`).href;
}

export function canonicalUrl(
	pathname: string,
	site: URL | string | undefined,
): string {
	return absoluteUrl(normalizePath(pathname), site);
}

export function ogImagePath(pathname: string): string {
	const path = normalizePath(pathname);
	return path === "/" ? "/og/index.png" : `/og${path}.png`;
}

export const feedLinks = [
	{ href: "/rss.xml", title: "alina.os: everything" },
	{ href: "/digest/rss.xml", title: "alina.os: This week in AI" },
	{ href: "/writing/rss.xml", title: "alina.os: writing" },
] as const;
