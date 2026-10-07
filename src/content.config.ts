import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import {
	assertIssueNumbers,
	assertNoAuthorMarkers,
	assertSinglePinned,
	type CheckedEntry,
} from "./lib/collection-checks";
import { digestSchema, noteSchema } from "./lib/schemas";

const contentDir = (process.env.CONTENT_DIR ?? "src/content").replace(
	/\/+$/,
	"",
);

const strict = process.env.CONTENT_STRICT === "true";

type Check = (entries: CheckedEntry[]) => void;

const noAuthorMarkers: Check = (entries) =>
	assertNoAuthorMarkers(entries, strict);

function checkedGlob(base: string, checks: Check[]): Loader {
	const inner = glob({ pattern: "*.mdx", base });
	return {
		name: `checked-${inner.name}`,
		load: async (context) => {
			await inner.load(context);
			const entries = context.store.values();
			for (const check of checks) {
				check(entries);
			}
		},
	};
}

const digest = defineCollection({
	loader: checkedGlob(`${contentDir}/digest`, [
		assertIssueNumbers,
		noAuthorMarkers,
	]),
	schema: digestSchema,
});

const notes = defineCollection({
	loader: checkedGlob(`${contentDir}/notes`, [
		assertSinglePinned,
		noAuthorMarkers,
	]),
	schema: noteSchema,
});

export const collections = { digest, notes };
