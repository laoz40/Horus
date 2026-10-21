import { defineRule, type ESTree } from "@oxlint/plugins";

import {
	arrayMethodTarget,
	isKnownArrayExpression,
	resolveArrayBinding,
	unwrapArrayExpression,
} from "../anti-slop/shared/array-method.ts";

/** Find only inline map callbacks, stopping at nested function boundaries. */
function mapCallback(node: ESTree.Node) {
	let parent = node.parent;

	while (parent !== null) {
		if (parent.type === "FunctionDeclaration") return null;

		if (parent.type === "ArrowFunctionExpression" || parent.type === "FunctionExpression") {
			const owner = parent.parent;

			if (owner?.type !== "CallExpression") return null;
			const method = arrayMethodTarget(owner.callee);
			const callback = owner.arguments[0];

			if (
				method?.name !== "map" ||
				callback === undefined ||
				unwrapArrayExpression(callback) !== parent
			)
				return null;

			return { callback: parent, receiver: method.object };
		}

		parent = parent.parent;
	}

	return null;
}

/** Keep unchanged items separate from object replacements in known array updates. */
export const noMapUpdateTernaryRule = defineRule({
	meta: {
		type: "suggestion",
		docs: {
			description: "Use if returns when map selects a replacement object or the original item.",
		},
		messages: {
			preferGuard:
				"Replace this array update ternary with a block callback: `if (keepOriginal) { return item; } return replacement;`. Preserve the original condition and return values.",
		},
	},
	createOnce(context) {
		return {
			ConditionalExpression(node) {
				const map = mapCallback(node);

				if (map === null || !isKnownArrayExpression(context.sourceCode, map.receiver)) return;
				const parameter = map.callback.params[0];

				if (parameter === undefined) return;
				let returned: ESTree.Node = node;

				while (returned.parent !== null && unwrapArrayExpression(returned.parent) === node)
					returned = returned.parent;

				if (returned !== map.callback.body && returned.parent?.type !== "ReturnStatement") return;
				const item = resolveArrayBinding(context.sourceCode, parameter);

				if (item === null) return;
				const branches = [node.consequent, node.alternate].map(unwrapArrayExpression);

				if (!branches.some((branch) => resolveArrayBinding(context.sourceCode, branch) === item))
					return;

				if (!branches.some((branch) => branch.type === "ObjectExpression")) return;
				context.report({ node, messageId: "preferGuard" });
			},
		};
	},
});
