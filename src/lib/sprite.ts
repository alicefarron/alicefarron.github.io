export const colorKey = {
	K: "ink",
	W: "white",
	Y: "yellow",
	B: "sprite-blue",
	P: "pink",
	G: "sprite-green",
} as const;

export type SpriteColor = keyof typeof colorKey;

export type Sprite = {
	name: string;
	width: number;
	height: number;
	rows: readonly string[];
};

export type SpriteRect = {
	x: number;
	y: number;
	w: number;
	h: number;
	color: SpriteColor;
};

const transparent = ".";

function isSpriteColor(char: string): char is SpriteColor {
	return Object.hasOwn(colorKey, char);
}

export function parseSprite(sprite: Sprite): Sprite {
	if (sprite.rows.length !== sprite.height) {
		throw new Error(
			`Sprite ${sprite.name}: expected height ${sprite.height}, got ${sprite.rows.length} rows`,
		);
	}
	sprite.rows.forEach((row, index) => {
		if (row.length !== sprite.width) {
			throw new Error(
				`Sprite ${sprite.name}: row ${index + 1} has ${row.length} pixels, expected ${sprite.width}`,
			);
		}
		for (const char of row) {
			if (char !== transparent && !isSpriteColor(char)) {
				throw new Error(
					`Sprite ${sprite.name}: row ${index + 1} has unknown key "${char}"`,
				);
			}
		}
	});
	return sprite;
}

export function toRects(sprite: Sprite): SpriteRect[] {
	parseSprite(sprite);
	const rects: SpriteRect[] = [];
	sprite.rows.forEach((row, y) => {
		let x = 0;
		while (x < row.length) {
			const char = row.charAt(x);
			let end = x + 1;
			while (end < row.length && row.charAt(end) === char) {
				end += 1;
			}
			if (isSpriteColor(char)) {
				rects.push({ x, y, w: end - x, h: 1, color: char });
			}
			x = end;
		}
	});
	return rects;
}

export function spriteColorVar(color: SpriteColor): string {
	return `var(--color-${colorKey[color]})`;
}
