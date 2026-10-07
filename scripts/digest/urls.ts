const droppedParams = /^(?:utm_.*|ref|source)$/i;

export function normalizeUrl(input: string): string {
	let url: URL;
	try {
		url = new URL(input.trim());
	} catch {
		return input.trim();
	}
	url.hash = "";
	url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
	const params = [...url.searchParams.entries()]
		.filter(([key]) => !droppedParams.test(key))
		.sort(([a, av], [b, bv]) =>
			a === b ? av.localeCompare(bv) : a.localeCompare(b),
		);
	url.search = "";
	for (const [key, value] of params) {
		url.searchParams.append(key, value);
	}
	if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
		url.pathname = url.pathname.replace(/\/+$/, "");
	}
	return `${url.protocol.toLowerCase()}//${url.host}${url.pathname}${url.search}`;
}

const urlPattern = /https?:\/\/[^\s"'<>(){}`]+/g;

function trimUrl(raw: string): string {
	let url = raw.replace(/[.,;:!?]+$/, "");
	while (
		url.endsWith("]") &&
		(url.match(/\]/g) ?? []).length > (url.match(/\[/g) ?? []).length
	) {
		url = url.slice(0, -1);
	}
	return url;
}

export function extractUrls(text: string): string[] {
	return [...text.matchAll(urlPattern)].map((match) => trimUrl(match[0]));
}
