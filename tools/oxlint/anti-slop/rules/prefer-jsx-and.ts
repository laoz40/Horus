import { defineRule } from "@oxlint/plugins";

import { unwrapArrayExpression } from "../shared/array-method.ts";

/** Optional JSX uses a boolean guard instead of a ternary with an empty branch. */
export const preferJsxAndRule = defineRule({
	meta: {
		type: "suggestion",
		docs: { description: "Prefer boolean && guards for JSX ternaries ending in null." },
		messages: {
			preferAnd:
				"Replace this JSX-or-null ternary with `condition && <Component />`. Keep the condition boolean: use `items.length > 0`, not `items.length`, or `Boolean(value)` for a truthiness check.",
		},
	},
	createOnce(context) {
		return {
			ConditionalExpression(node) {
				const content = unwrapArrayExpression(node.consequent);
				const alternate = unwrapArrayExpression(node.alternate);
				if (
					(content.type === "JSXElement" || content.type === "JSXFragment") &&
					alternate.type === "Literal" &&
					alternate.value === null
				) {
					context.report({ node, messageId: "preferAnd" });
				}
			},
		};
	},
});
