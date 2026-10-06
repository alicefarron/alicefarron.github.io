import type { ImageMetadata } from "astro";

export function asImage(value: unknown): ImageMetadata | undefined {
	if (
		typeof value === "object" &&
		value !== null &&
		"src" in value &&
		"width" in value &&
		"height" in value &&
		"format" in value
	) {
		return value as ImageMetadata;
	}
	return undefined;
}
