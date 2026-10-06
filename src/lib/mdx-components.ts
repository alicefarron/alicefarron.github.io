import Callout from "../components/Callout.astro";
import CodeBlock from "../components/mdx/CodeBlock.astro";
import Figure from "../components/mdx/Figure.astro";
import Item from "../components/mdx/Item.astro";
import PullQuote from "../components/mdx/PullQuote.astro";
import Section from "../components/mdx/Section.astro";
import TableWrap from "../components/mdx/TableWrap.astro";
import TriedIt from "../components/mdx/TriedIt.astro";
import Terminal from "../components/Terminal.astro";

export const digestComponents = {
	Section,
	Item,
	TriedIt,
	Terminal,
	Callout,
	pre: CodeBlock,
	table: TableWrap,
};

export const noteComponents = {
	Callout,
	CodeBlock,
	Figure,
	PullQuote,
	Terminal,
	pre: CodeBlock,
	table: TableWrap,
	blockquote: PullQuote,
};
