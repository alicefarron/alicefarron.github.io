import { type Sprite, spriteColorVar, toRects } from "../lib/sprite";

type Props = {
	sprite: Sprite;
	scale?: number;
	class?: string;
};

export default function SpriteIcon({
	sprite,
	scale = 2,
	class: className,
}: Props) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={`0 0 ${sprite.width} ${sprite.height}`}
			width={sprite.width * scale}
			height={sprite.height * scale}
			shape-rendering="crispEdges"
			focusable="false"
			aria-hidden="true"
			class={className}
		>
			{toRects(sprite).map((rect) => (
				<rect
					key={`${rect.x}-${rect.y}`}
					x={rect.x}
					y={rect.y}
					width={rect.w}
					height={rect.h}
					fill={spriteColorVar(rect.color)}
				/>
			))}
		</svg>
	);
}
