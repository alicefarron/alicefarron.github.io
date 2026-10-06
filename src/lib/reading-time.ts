export const wordsPerMinute = 220;

export function countWords(body: string): number {
	const text = body
		.split("\n")
		.filter((line) => !/^\s*(?:import|export)\s/.test(line))
		.filter((line) => !/^\s*(?:`{3,}|~{3,})/.test(line))
		.join("\n")
		.replace(/<\/?[A-Za-z][^>]*>/g, " ")
		.replace(/[#>*_`~[\]()|-]+/g, " ");
	return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export function readingTime(body: string): number {
	return Math.max(1, Math.ceil(countWords(body) / wordsPerMinute));
}
