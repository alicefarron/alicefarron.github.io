type HastProperties = Record<string, unknown>;

type HastElement = {
	type: "element";
	tagName: string;
	properties: HastProperties;
	children: unknown[];
};

type TransformerContext = {
	options: { meta?: { __raw?: string } };
};

export type CodeTransformer = {
	name: string;
	pre(this: TransformerContext, node: HastElement): void;
	span(this: TransformerContext, node: HastElement): void;
};

export function parseFenceTitle(meta: string | undefined): string | undefined {
	if (meta === undefined) {
		return undefined;
	}
	const match = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(meta);
	const title = match?.[1] ?? match?.[2] ?? match?.[3];
	return title === undefined || title.trim() === "" ? undefined : title;
}

export const codeMetaTransformer: CodeTransformer = {
	name: "alina-os:code-meta",
	pre(node) {
		const title = parseFenceTitle(this.options.meta?.__raw);
		delete node.properties.style;
		delete node.properties.tabindex;
		node.properties.class = "astro-code";
		if (title !== undefined) {
			node.properties["data-title"] = title;
		}
	},
	span(node) {
		delete node.properties.style;
	},
};
