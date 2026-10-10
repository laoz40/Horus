import type { ESTree, SourceCode } from "@oxlint/plugins";

import { arrayMethodTarget, resolveArrayBinding } from "../anti-slop/shared/array-method.ts";

/** Identify a named import or namespace member by its original module and export name. */
export function importedTarget(sourceCode: SourceCode, node: ESTree.Node) {
	const member = arrayMethodTarget(node);
	const binding = resolveArrayBinding(sourceCode, member?.object ?? node);
	const definition = binding?.defs.find((entry) => entry.type === "ImportBinding");

	if (definition?.parent?.type !== "ImportDeclaration") return null;
	const imported = definition.node;
	const source = definition.parent.source.value;

	if (imported.type === "ImportNamespaceSpecifier")
		return { source, name: member === null ? "*" : member.name };

	if (member !== null || imported.type !== "ImportSpecifier") return null;

	const name =
		imported.imported.type === "Identifier" ? imported.imported.name : imported.imported.value;

	return { source, name };
}

/** Resolve Effect methods by their imports, including aliases and namespace imports. */
export function effectMethodTarget(sourceCode: SourceCode, node: ESTree.Node): string | null {
	const method = arrayMethodTarget(node);
	const imported = importedTarget(sourceCode, method?.object ?? node);

	if (imported === null) return null;

	if (method === null) return imported.source === "effect/Effect" ? imported.name : null;

	if (imported.source === "effect" && imported.name === "Effect") return method.name;

	if (imported.source === "effect/Effect" && imported.name === "*") return method.name;

	return null;
}
