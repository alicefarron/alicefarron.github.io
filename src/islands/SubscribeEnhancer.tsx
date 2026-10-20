import { useEffect, useRef, useState } from "preact/hooks";
import {
	type SubscribeState,
	subscribeMessage,
	subscribeOutcome,
} from "../lib/subscribe";

type Props = {
	inputId: string;
};

export default function SubscribeEnhancer({ inputId }: Props) {
	const root = useRef<HTMLDivElement>(null);
	const [state, setState] = useState<SubscribeState>("idle");
	const [message, setMessage] = useState("");
	const errorId = `${inputId}-error`;

	useEffect(() => {
		const form = root.current?.closest("form");
		const input = document.getElementById(inputId);
		if (
			form === null ||
			form === undefined ||
			!(input instanceof HTMLInputElement)
		) {
			return;
		}
		form.noValidate = true;
		const onSubmit = (event: SubmitEvent) => {
			const outcome = subscribeOutcome(input.value, navigator.onLine);
			setState(outcome);
			setMessage(subscribeMessage(outcome, input.value));
			if (outcome === "sent") {
				input.removeAttribute("aria-invalid");
				input.removeAttribute("aria-describedby");
				return;
			}
			event.preventDefault();
			input.setAttribute(
				"aria-invalid",
				outcome === "invalid" ? "true" : "false",
			);
			input.setAttribute("aria-describedby", errorId);
			input.focus();
		};
		form.addEventListener("submit", onSubmit);
		return () => {
			form.removeEventListener("submit", onSubmit);
		};
	}, [inputId, errorId]);

	const isError = state === "invalid" || state === "offline";

	return (
		<div ref={root} class="-mt-2 flex flex-col gap-2 has-[p:not(:empty)]:mt-0">
			<p
				id={errorId}
				aria-live="assertive"
				data-subscribe-error
				class="font-ui text-ui-sm leading-ui font-bold empty:hidden"
			>
				{isError ? message : ""}
			</p>
			<p
				aria-live="polite"
				data-subscribe-status
				class="font-ui text-ui-sm leading-ui empty:hidden"
			>
				{state === "sent" ? message : ""}
			</p>
		</div>
	);
}
