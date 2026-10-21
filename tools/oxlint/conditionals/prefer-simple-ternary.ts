import { defineRule, type ESTree } from "@oxlint/plugins";

import { unwrapArrayExpression } from "../anti-slop/shared/array-method.ts";

/** Value selection stays inline; construction, calls, and rendering use statements. */
function isSimpleValue(node: ESTree.Node): boolean {
	node = unwrapArrayExpression(node);

	if (["Identifier", "Literal", "ThisExpression"].includes(node.type)) {
		return true;
	}

	if (node.type === "MemberExpression") {
		return isSimpleValue(node.object) && (!node.computed || isSimpleValue(node.property));
	}

	if (node.type === "UnaryExpression") {
		return (
			["!", "+", "-", "~", "void", "typeof"].includes(node.operator) && isSimpleValue(node.argument)
		);
	}

	if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
		return isSimpleValue(node.left) && isSimpleValue(node.right);
	}

	if (node.type === "TemplateLiteral") {
		return node.expressions.every(isSimpleValue);
	}

	return false;
}

/** Restrict ternaries by branch syntax, independently of line wrapping. */
export const preferSimpleTernaryRule = defineRule({
	meta: {
		type: "suggestion",
		docs: {
			description:
				"Keep ternaries for simple value selection; use if returns for complex branches.",
		},
		messages: {
			preferIf:
				"Keep ternaries for simple values such as literals, variables, property reads, or basic expressions. This branch contains a call, construction, JSX, or other complex expression. Use `if (condition) { return firstValue; } return otherValue;` instead. For optional JSX use a boolean `&&` guard; for JSX alternatives inside shared markup, consider a focused component with early returns. Preserve branch laziness and side effects.",
		},
	},
	createOnce(context) {
		return {
			ConditionalExpression(node) {
				if (!isSimpleValue(node.consequent) || !isSimpleValue(node.alternate)) {
					context.report({ node, messageId: "preferIf" });
				}
			},
		};
	},
});
