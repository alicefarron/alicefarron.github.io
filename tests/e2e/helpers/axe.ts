import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export async function expectNoAxeViolations(page: Page): Promise<void> {
	const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
	expect(results.violations).toEqual([]);
}
