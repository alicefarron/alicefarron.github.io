import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import {
	assertIssueNumbers,
	assertSinglePinned,
	type CheckedEntry,
} from "./lib/collection-checks";
import { digestSchema, noteSchema } from "./lib/schemas";

const contentDir = (process.env.CONTENT_DIR ?? "src/content").replace(
	/\/+$/,
	"",
);

function checkedGlob(
	base: string,
	check: (entries: CheckedEntry[]) => void,
): Loader {
	const inner = glob({ pattern: "*.mdx", base });
	return {
		name: `checked-${inner.name}`,
		load: async (context) => {
			await inner.load(context);
			check(context.store.values());
		},
	};
}

const digest = defineCollection({
	loader: checkedGlob(`${contentDir}/digest`, assertIssueNumbers),
	schema: digestSchema,
});

const notes = defineCollection({
	loader: checkedGlob(`${contentDir}/notes`, assertSinglePinned),
	schema: noteSchema,
});

export const collections = { digest, notes };
