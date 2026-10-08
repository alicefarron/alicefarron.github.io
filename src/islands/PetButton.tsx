import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import { isPetted, nextPetIndex, petBodyClass } from "../lib/pet";

type Props = {
	lines: readonly string[];
	children?: ComponentChildren;
};

export default function PetButton({ lines, children }: Props) {
	const [mounted, setMounted] = useState(false);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<div
			class={petBodyClass(index)}
			data-pet-body
			data-petted={isPetted(index) ? "" : undefined}
		>
			{children}
			<p class="font-ui text-ui leading-ui" aria-live="polite" data-pet-status>
				{lines[index]}
			</p>
			<button
				type="button"
				hidden={!mounted}
				onClick={() => setIndex(nextPetIndex)}
				class="border-window min-h-11 rounded-dialog-button bg-yellow px-4 font-ui text-ui font-bold text-ink shadow-hard-sm shadow-ink"
			>
				Pet the cat
			</button>
		</div>
	);
}
