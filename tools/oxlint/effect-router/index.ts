import { defineRule, eslintCompatPlugin } from "@oxlint/plugins";

import { arrayMethodTarget, resolveArrayBinding } from "../anti-slop/shared/array-method.ts";

/** Keep router failures in the Effect error channel until the oRPC boundary. */
const preferRouterCatchTagsRule = defineRule({
	meta: {
		type: "problem",
		docs: { description: "Use Effect.catchTags for server router error handling." },
		messages: {
			catchTags:
				"Use Effect.catchTags for router errors and Effect.map for success transformations instead of Effect.match or Effect.matchEffect.",
		},
	},
	createOnce(context) {
		return {
			CallExpression(node) {
				if (
					!context.filename.replaceAll("\\", "/").includes("/src/server/") ||
					!context.filename.endsWith(".router.ts")
				)
					return;
				const member = arrayMethodTarget(node.callee);

				if (member === null || (member.name !== "match" && member.name !== "matchEffect")) return;
				const binding = resolveArrayBinding(context.sourceCode, member.object);

				if (
					!binding?.defs.some(
						(def) =>
							def.type === "ImportBinding" &&
							def.parent?.type === "ImportDeclaration" &&
							def.parent.source.value === "effect" &&
							def.node.type === "ImportSpecifier" &&
							def.node.imported.type === "Identifier" &&
							def.node.imported.name === "Effect",
					)
				)
					return;
				context.report({ node, messageId: "catchTags" });
			},
		};
	},
});

export default eslintCompatPlugin({
	meta: { name: "effect-router" },
	rules: { "prefer-catch-tags": preferRouterCatchTagsRule },
});
