import { hasMarker, splitMarkers } from "./author-markers";

type HastText = {
	type: "text";
	value: string;
};

type HastMark = {
	type: "element";
	tagName: "mark";
	properties: { className: string[]; dataAuthorMarker: string };
	children: HastText[];
};

type HastAncestor = {
	type: string;
	tagName?: string;
};

type MarkerContext = {
	parent(node: HastAncestor): HastAncestor | undefined;
	replaceNode(node: HastText, replacement: Array<HastText | HastMark>): void;
};

export type AuthorMarkerPlugin = {
	name: string;
	text(node: Readonly<HastText>, ctx: MarkerContext): void;
};

const skippedTags = new Set(["code", "pre", "script", "style", "mark"]);

function insideSkippedTag(node: HastAncestor, ctx: MarkerContext): boolean {
	let current = ctx.parent(node);
	while (current !== undefined) {
		if (current.tagName !== undefined && skippedTags.has(current.tagName)) {
			return true;
		}
		current = ctx.parent(current);
	}
	return false;
}

export function markerNodes(value: string): Array<HastText | HastMark> {
	return splitMarkers(value).map((part) =>
		part.kind === "marker"
			? {
					type: "element",
					tagName: "mark",
					properties: { className: ["author-marker"], dataAuthorMarker: "" },
					children: [{ type: "text", value: part.value }],
				}
			: { type: "text", value: part.value },
	);
}

export const authorMarkerPlugin: AuthorMarkerPlugin = {
	name: "alina-os:author-marker",
	text(node, ctx) {
		if (!hasMarker(node.value) || insideSkippedTag(node, ctx)) {
			return;
		}
		ctx.replaceNode(node, markerNodes(node.value));
	},
};
