export type SubscribeState = "idle" | "invalid" | "offline" | "sent";

const emailPattern =
	/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function isValidEmail(value: string): boolean {
	return emailPattern.test(value.trim());
}

export function subscribeOutcome(
	value: string,
	online: boolean,
): Exclude<SubscribeState, "idle"> {
	if (!isValidEmail(value)) {
		return "invalid";
	}
	return online ? "sent" : "offline";
}

export function subscribeMessage(state: SubscribeState, value: string): string {
	switch (state) {
		case "invalid":
			return "Enter a valid email address.";
		case "offline":
			return "You seem to be offline. Your email is still here, try again when connected.";
		case "sent":
			return `Almost done. Finish in the Buttondown tab, then confirm the email sent to ${value.trim()}.`;
		default:
			return "";
	}
}
