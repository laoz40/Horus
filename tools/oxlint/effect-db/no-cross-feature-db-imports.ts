import { defineRule, type ESTree } from "@oxlint/plugins";

const FEATURE_DB_IMPORT = /^@\/features\/([^/]+)\/server\/[^/]+\.db(?:\.ts)?$/u;

function importedFeature(source: string): string | null {
	return FEATURE_DB_IMPORT.exec(source)?.[1] ?? null;
}

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

/** Keep feature database modules focused on their own SQL and coordinate through services. */
export const noCrossFeatureDbImportsRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description: "Disallow runtime imports and re-exports between feature database modules.",
		},
		messages: {
			crossFeatureDb:
				"Coordinate feature database services in service functions rather than forwarding SQL through another feature DB.",
		},
	},
	createOnce(context) {
		let feature: string | null = null;

		return {
			before() {
				const file = context.filename.replaceAll("\\", "/");
				const match = /\/src\/features\/([^/]+)\/server\/[^/]+\.db\.ts$/u.exec(file);
				feature = match?.[1] ?? null;

				return feature !== null;
			},
			ImportDeclaration(node) {
				const target = importedFeature(node.source.value);

				if (target === null || target === feature || !isRuntimeImport(node)) return;

				context.report({ node, messageId: "crossFeatureDb" });
			},
			ExportNamedDeclaration(node) {
				if (node.source === null || !hasRuntimeReExport(node)) return;
				const target = importedFeature(node.source.value);

				if (target === null || target === feature) return;

				context.report({ node, messageId: "crossFeatureDb" });
			},
			ExportAllDeclaration(node) {
				if (node.exportKind === "type") return;
				const target = importedFeature(node.source.value);

				if (target === null || target === feature) return;

				context.report({ node, messageId: "crossFeatureDb" });
			},
		};
	},
});
