import { useEffect, useState } from "preact/hooks";
import { nextPetIndex } from "../lib/pet";

type Props = {
	lines: readonly string[];
};

export default function PetButton({ lines }: Props) {
	const [mounted, setMounted] = useState(false);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<div class="flex flex-col items-center gap-4">
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
