import { defineRule, type ESTree } from "@oxlint/plugins";

import { effectMethodTarget } from "../effect-boundaries/lib.ts";
import { unwrapArrayExpression } from "../anti-slop/shared/array-method.ts";

function propertyName(property: ESTree.ObjectProperty): string | null {
	if (!property.computed && property.key.type === "Identifier") return property.key.name;

	if (
		property.key.type === "Literal" &&
		(property.key.value === "try" || property.key.value === "catch")
	)
		return property.key.value;

	return null;
}

function hasTryPromiseOptions(node: ESTree.Node): boolean {
	node = unwrapArrayExpression(node);

	if (node.type !== "ObjectExpression") return false;

	const names = new Set<string | null>();

	for (const property of node.properties) {
		if (property.type === "Property") names.add(propertyName(property));
	}

	return names.has("try") && names.has("catch");
}

/** Require database Promise failures to pass through an explicit Effect error mapper. */
export const requirePromiseErrorMapperRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description: "Require explicit error mapping for Promise calls in server database modules.",
		},
		messages: {
			mapper:
				"Use Effect.tryPromise({ try, catch }) with an explicit typed error mapper. Database rejections should map to DatabaseError.",
		},
	},
	createOnce(context) {
		return {
			before() {
				const file = context.filename.replaceAll("\\", "/");

				return file.includes("/src/server/") && file.endsWith(".db.ts");
			},
			CallExpression(node) {
				const method = effectMethodTarget(context.sourceCode, node.callee);

				if (method === "promise") {
					context.report({ node, messageId: "mapper" });

					return;
				}

				if (method !== "tryPromise") return;

				const options = node.arguments[0];

				if (
					options === undefined ||
					options.type === "SpreadElement" ||
					!hasTryPromiseOptions(options)
				)
					context.report({ node, messageId: "mapper" });
			},
		};
	},
});
