import { defineRule, eslintCompatPlugin, type ESTree, type SourceCode } from "@oxlint/plugins";

import {
	arrayMethodTarget,
	resolveArrayBinding,
	unwrapArrayExpression,
} from "../anti-slop/shared/array-method.ts";

function isEffectBinding(sourceCode: SourceCode, node: ESTree.Node): boolean {
	const binding = resolveArrayBinding(sourceCode, node);

	return (
		binding?.defs.some(
			(def) =>
				def.type === "ImportBinding" &&
				def.parent?.type === "ImportDeclaration" &&
				def.parent.source.value === "effect" &&
				def.node.type === "ImportSpecifier" &&
				def.node.imported.type === "Identifier" &&
				def.node.imported.name === "Effect",
		) ?? false
	);
}

function promiseCallback(node: ESTree.CallExpression, method: string) {
	const argument = node.arguments[0];

	if (argument === undefined || argument.type === "SpreadElement") return null;
	const callback = unwrapArrayExpression(argument);

	if (callback.type === "ArrowFunctionExpression" || callback.type === "FunctionExpression")
		return callback;

	if (method !== "tryPromise" || callback.type !== "ObjectExpression") return null;

	const tryProperty = callback.properties.find(
		(property) =>
			property.type === "Property" &&
			!property.computed &&
			property.key.type === "Identifier" &&
			property.key.name === "try",
	);

	if (tryProperty?.type !== "Property") return null;
	const tryCallback = unwrapArrayExpression(tryProperty.value);

	return tryCallback.type === "ArrowFunctionExpression" || tryCallback.type === "FunctionExpression"
		? tryCallback
		: null;
}

/** Keep Promise callback failures in the enclosing Effect workflow. */
const noThrowInEffectPromiseRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description: "Reject explicit throws in Effect Promise callbacks in server database modules.",
		},
		messages: {
			throwInPromise:
				"Move domain failures into the enclosing Effect workflow and use Effect.fail.",
		},
	},
	createOnce(context) {
		const callbacks = new Set<ESTree.Node>();

		return {
			before() {
				callbacks.clear();
				const file = context.filename.replaceAll("\\", "/");

				return file.includes("/src/server/") && file.endsWith(".db.ts");
			},
			CallExpression(node) {
				const member = arrayMethodTarget(node.callee);

				if (
					member === null ||
					(member.name !== "tryPromise" && member.name !== "promise") ||
					!isEffectBinding(context.sourceCode, member.object)
				)
					return;
				const callback = promiseCallback(node, member.name);

				if (callback !== null) callbacks.add(callback);
			},
			ThrowStatement(node) {
				let parent: ESTree.Node | null = node.parent;

				while (parent !== null) {
					if (callbacks.has(parent)) {
						context.report({ node, messageId: "throwInPromise" });

						return;
					}

					parent = parent.parent;
				}
			},
		};
	},
});

export default eslintCompatPlugin({
	meta: { name: "effect-db" },
	rules: { "no-throw-in-promise": noThrowInEffectPromiseRule },
});
