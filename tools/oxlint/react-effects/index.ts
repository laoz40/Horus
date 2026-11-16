import { defineRule, eslintCompatPlugin } from "@oxlint/plugins";

import { arrayMethodTarget, resolveArrayBinding } from "../anti-slop/shared/array-method.ts";

const noUseEffect = defineRule({
	meta: {
		type: "problem",
		docs: { description: "Ban direct React useEffect imports and access." },
		messages: {
			noUseEffect:
				"Direct useEffect is banned. Derive values during render, handle user actions in event handlers, use a data library, or subscribe with useSyncExternalStore. True mount synchronization needs a reviewed, controlled useMountEffect.",
		},
	},
	createOnce(context) {
		return {
			ImportSpecifier(node) {
				if (node.parent.type !== "ImportDeclaration" || node.parent.source.value !== "react")
					return;

				if (node.importKind === "type" || node.parent.importKind === "type") return;
				const name = node.imported.type === "Identifier" ? node.imported.name : node.imported.value;

				if (name === "useEffect") context.report({ node, messageId: "noUseEffect" });
			},
			ExportNamedDeclaration(node) {
				if (node.source?.value !== "react" || node.exportKind === "type") return;

				for (const specifier of node.specifiers) {
					if (specifier.exportKind === "type") continue;

					const name =
						specifier.local.type === "Identifier" ? specifier.local.name : specifier.local.value;

					if (name === "useEffect") context.report({ node: specifier, messageId: "noUseEffect" });
				}
			},
			MemberExpression(node) {
				const member = arrayMethodTarget(node);

				if (member?.name !== "useEffect") return;
				const binding = resolveArrayBinding(context.sourceCode, member.object);
				const definition = binding?.defs.find((entry) => entry.type === "ImportBinding");

				if (definition?.parent?.type !== "ImportDeclaration") return;

				if (
					definition.parent.source.value === "react" &&
					(definition.node.type === "ImportDefaultSpecifier" ||
						definition.node.type === "ImportNamespaceSpecifier")
				)
					context.report({ node, messageId: "noUseEffect" });
			},
		};
	},
});

export default eslintCompatPlugin({
	meta: { name: "react-effects" },
	rules: { "no-use-effect": noUseEffect },
});
