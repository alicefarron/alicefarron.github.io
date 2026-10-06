import { z } from "astro/zod";

export const digestTopics = ["Models", "Tooling", "Agents", "Papers"] as const;

export const noteTags = [
	"Architecture",
	"AI in production",
	"Agents",
	"Side projects",
	"Backend",
] as const;

export type DigestTopic = (typeof digestTopics)[number];
export type NoteTag = (typeof noteTags)[number];

export const digestSchema = z.object({
	number: z.number().int().positive(),
	title: z.string().min(1),
	date: z.coerce.date(),
	lede: z.string().min(1),
	topics: z.array(z.enum(digestTopics)).min(1),
	quote: z
		.object({
			text: z.string().min(1),
			author: z.string().min(1),
			role: z.string().min(1),
		})
		.optional(),
	draft: z.boolean().default(false),
});

type ImageSchema = () => z.ZodType;

export function noteSchema<TImage extends ImageSchema>({
	image,
}: {
	image: TImage;
}) {
	return z.object({
		title: z.string().min(1),
		date: z.coerce.date(),
		updated: z.coerce.date().optional(),
		tag: z.enum(noteTags),
		dek: z.string().min(1),
		tldr: z.array(z.string().min(1)).min(1).max(5),
		cover: z
			.object({
				src: image() as ReturnType<TImage>,
				alt: z.string().trim().min(1),
			})
			.optional(),
		pinned: z.boolean().default(false),
		series: z
			.string()
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
			.optional(),
		draft: z.boolean().default(false),
	});
}
