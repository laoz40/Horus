import { defineRule } from "@oxlint/plugins";

import { effectMethodTarget, importedTarget } from "./lib.ts";

const PROVIDERS = new Set(["provide", "provideContext", "provideService", "provideServiceEffect"]);

// DB Layers use camelCase *Db / *DbLayer exports; contextual service identifiers use PascalCase.
const DB_LAYER_EXPORT = /^[a-z].*Db(?:Layer)?$/u;

/** Services retain their requirements; routers and transaction orchestration supply implementations. */
export const noServiceProvisionRule = defineRule({
	meta: {
		type: "problem",
		docs: { description: "Keep DB Layers and dependency provisioning out of server services." },
		messages: {
			provision:
				"Yield the contextual service and let its requirements propagate. Provide dependencies in the router or transaction module.",
			dbLayer:
				"Import the DB service identifier or types instead of its concrete Layer. Provide the Layer in the router or transaction module.",
		},
	},
	createOnce(context) {
		return {
			before() {
				const file = context.filename.replaceAll("\\", "/");

				return file.includes("/src/server/") && file.endsWith(".service.ts");
			},
			MemberExpression(node) {
				const method = effectMethodTarget(context.sourceCode, node);

				if (method !== null && PROVIDERS.has(method))
					context.report({ node, messageId: "provision" });
				const imported = importedTarget(context.sourceCode, node);

				if (
					imported !== null &&
					/\.db(?:\.ts)?$/u.test(imported.source) &&
					DB_LAYER_EXPORT.test(imported.name)
				) {
					context.report({ node, messageId: "dbLayer" });
				}
			},
			ImportSpecifier(node) {
				if (node.parent.type !== "ImportDeclaration") return;

				if (node.importKind === "type" || node.parent.importKind === "type") return;
				const method = effectMethodTarget(context.sourceCode, node.local);

				if (method !== null && PROVIDERS.has(method))
					context.report({ node, messageId: "provision" });
				const imported = importedTarget(context.sourceCode, node.local);

				if (
					imported !== null &&
					/\.db(?:\.ts)?$/u.test(imported.source) &&
					DB_LAYER_EXPORT.test(imported.name)
				) {
					context.report({ node, messageId: "dbLayer" });
				}
			},
		};
	},
});
