import type { Sprite } from "../lib/sprite";
import { cat } from "./cat";
import { clock } from "./clock";
import { document } from "./document";
import { floppy } from "./floppy";
import { folder } from "./folder";
import { radar } from "./radar";
import { speechBubble } from "./speech-bubble";

export { cat, clock, document, floppy, folder, radar, speechBubble };

export const sprites: Record<string, Sprite> = {
	cat,
	folder,
	document,
	floppy,
	"speech-bubble": speechBubble,
	radar,
	clock,
};
