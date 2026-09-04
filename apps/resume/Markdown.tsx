import type { Token, Tokens } from "marked";
import { Fragment, type ReactNode } from "react";

export function Markdown({ tokens }: { tokens: Token[] }) {
	const occurrences = new Map<string, number>();
	return tokens.map((token): ReactNode => {
		const occurrence = occurrences.get(token.raw) ?? 0;
		occurrences.set(token.raw, occurrence + 1);
		const key = `${token.type}-${token.raw}-${occurrence}`;
		switch (token.type) {
			case "space":
				return null;
			case "paragraph":
				return (
					<p key={key}>
						<Markdown tokens={token.tokens ?? []} />
					</p>
				);
			case "heading":
				return (
					<h3 key={key}>
						<Markdown tokens={token.tokens ?? []} />
					</h3>
				);
			case "text":
				return (
					<Fragment key={key}>
						{token.tokens ? (
							<Markdown tokens={token.tokens ?? []} />
						) : (
							token.text
						)}
					</Fragment>
				);
			case "link":
				return (
					<a
						key={key}
						href={token.href.startsWith("https://") ? token.href : undefined}
					>
						<Markdown tokens={token.tokens ?? []} />
					</a>
				);
			case "strong":
				return (
					<strong key={key}>
						<Markdown tokens={token.tokens ?? []} />
					</strong>
				);
			case "em":
				return (
					<em key={key}>
						<Markdown tokens={token.tokens ?? []} />
					</em>
				);
			case "list":
				return (
					<ul key={key}>
						{token.items.map((item: Tokens.ListItem) => (
							<li key={item.raw}>
								<Markdown tokens={item.tokens} />
							</li>
						))}
					</ul>
				);
			case "br":
				return <br key={key} />;
			case "escape":
			case "codespan":
				return <Fragment key={key}>{token.text}</Fragment>;
			default:
				return null;
		}
	});
}
