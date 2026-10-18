import { defineRule, type ESTree } from "@oxlint/plugins";

import { effectMethodTarget, importedTarget } from "../effect-boundaries/lib.ts";
import { unwrapArrayExpression } from "../anti-slop/shared/array-method.ts";
import { isServerImplementationFile } from "../shared/server-path.ts";

function isRuntimeImport(node: ESTree.ImportDeclaration): boolean {
	return (
		node.importKind !== "type" &&
		(node.specifiers.length === 0 ||
			node.specifiers.some(
				(specifier) => specifier.type !== "ImportSpecifier" || specifier.importKind !== "type",
			))
	);
}

function hasRuntimeReExport(node: ESTree.ExportNamedDeclaration): boolean {
	return (
		node.exportKind !== "type" &&
		node.specifiers.some((specifier) => specifier.exportKind !== "type")
	);
}

function isFeatureService(source: string): boolean {
	return /^@\/features\/[^/]+\/server\/[^/]*\.service(?:\.ts)?$/u.test(source);
}

function isDatabaseErrorConstructor(
	sourceCode: Parameters<typeof importedTarget>[0],
	node: ESTree.Node,
): boolean {
	const target = importedTarget(sourceCode, node);

	return target?.source === "@/lib/db/database" && target.name === "DatabaseError";
}

function isAllowedDatabaseError(
	sourceCode: Parameters<typeof importedTarget>[0],
	node: ESTree.Node,
): boolean {
	node = unwrapArrayExpression(node);

	return node.type === "NewExpression" && isDatabaseErrorConstructor(sourceCode, node.callee);
}

/** Keep workflow failures and service calls out of database modules. */
export const noWorkflowFailuresInDbRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description: "Keep workflow failures and feature service calls out of database modules.",
		},
		messages: {
			failure:
				"Return a missing query result from the database module and raise workflow failures in the service function. Only Effect.fail(new DatabaseError(...)) is allowed here.",
			service:
				"Call feature service workflows from a service or router module, not a database module.",
		},
	},
	createOnce(context) {
		return {
			before() {
				const file = context.filename.replaceAll("\\", "/");

				return isServerImplementationFile(file) && file.endsWith(".db.ts");
			},
			CallExpression(node) {
				if (effectMethodTarget(context.sourceCode, node.callee) !== "fail") return;
				const error = node.arguments[0];

				if (
					error === undefined ||
					error.type === "SpreadElement" ||
					!isAllowedDatabaseError(context.sourceCode, error)
				)
					context.report({ node, messageId: "failure" });
			},
			ImportDeclaration(node) {
				if (isFeatureService(node.source.value) && isRuntimeImport(node))
					context.report({ node, messageId: "service" });
			},
			ExportNamedDeclaration(node) {
				if (node.source !== null && isFeatureService(node.source.value) && hasRuntimeReExport(node))
					context.report({ node, messageId: "service" });
			},
			ExportAllDeclaration(node) {
				if (node.exportKind !== "type" && isFeatureService(node.source.value))
					context.report({ node, messageId: "service" });
			},
		};
	},
});
