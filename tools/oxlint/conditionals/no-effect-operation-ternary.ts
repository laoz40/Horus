import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { effectMethodTarget } from "../effect-boundaries/lib.ts";
import { unwrapArrayExpression } from "../anti-slop/shared/array-method.ts";

// Only constructors with known Effect results; predicates and runners remain value choices.
const effectConstructors = new Set([
	"succeed",
	"fail",
	"die",
	"sync",
	"suspend",
	"promise",
	"tryPromise",
	"gen",
	"all",
]);

function isEffectOperation(sourceCode: SourceCode, node: ESTree.Node): boolean {
	node = unwrapArrayExpression(node);

	if (node.type === "CallExpression") {
		const method = effectMethodTarget(sourceCode, node.callee);

		return method !== null && effectConstructors.has(method);
	}

	return effectMethodTarget(sourceCode, node) === "void";
}

/** Recognize direct imported Effect operations without guessing arbitrary call return types. */
export const noEffectOperationTernaryRule = defineRule({
	meta: {
		type: "suggestion",
		docs: { description: "Use if guards when ternaries select direct Effect operations." },
		messages: {
			preferGuard:
				"Replace this Effect-operation ternary with `if (condition) { return firstEffect; } return otherEffect;`. If it is inside another expression, move the branch into the surrounding function and preserve error handling and Effect laziness.",
		},
	},
	createOnce(context) {
		return {
			ConditionalExpression(node) {
				if (
					isEffectOperation(context.sourceCode, node.consequent) ||
					isEffectOperation(context.sourceCode, node.alternate)
				) {
					context.report({ node, messageId: "preferGuard" });
				}
			},
		};
	},
});
