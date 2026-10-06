import type { ChipColor } from "./chip";
import type { DigestTopic, NoteTag } from "./schemas";

const topicColors: Record<DigestTopic, ChipColor> = {
	Models: "sky",
	Tooling: "yellow",
	Agents: "pink",
	Papers: "lavender",
};

const tagColors: Record<NoteTag, ChipColor> = {
	Architecture: "sky",
	"AI in production": "lime",
	Agents: "pink",
	"Side projects": "yellow",
	Backend: "lavender",
};

export function topicColor(topic: string): ChipColor {
	return topicColors[topic as DigestTopic] ?? "white";
}

export function tagColor(tag: string): ChipColor {
	return tagColors[tag as NoteTag] ?? "white";
}
