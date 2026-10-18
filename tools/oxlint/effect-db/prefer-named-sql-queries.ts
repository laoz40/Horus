import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { arrayMethodTarget, unwrapArrayExpression } from "../anti-slop/shared/array-method.ts";
import { importedTarget } from "../effect-boundaries/lib.ts";

const SQL_SCHEMA_SOURCES = new Set(["effect/sql", "effect/sql/SqlSchema"]);

const QUERY_CONSTRUCTORS = new Set(["findOne", "findOneOption", "findAll", "findNonEmpty", "void"]);

function queryConstructor(name: string | null): string | null {
	return name !== null && QUERY_CONSTRUCTORS.has(name) ? name : null;
}

function importedConstructor(sourceCode: SourceCode, node: ESTree.Node): string | null {
	const target = arrayMethodTarget(node);
	const imported = importedTarget(sourceCode, target?.object ?? node);

	if (imported === null) return null;

	if (target === null)
		return imported.source === "effect/sql/SqlSchema" ? queryConstructor(imported.name) : null;

	if (imported.name === "*" && imported.source === "effect/sql/SqlSchema")
		return queryConstructor(target.name);

	if (imported.name === "SqlSchema" && SQL_SCHEMA_SOURCES.has(imported.source))
		return queryConstructor(target.name);

	return null;
}

/** Require SqlSchema query builders to be named before the returned query is executed. */
export const preferNamedSqlQueriesRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description: "Require naming SqlSchema query builders before executing them.",
		},
		messages: {
			nameQuery: "Define the SqlSchema query as a named value before executing it.",
		},
	},
	createOnce(context) {
		return {
			CallExpression(node) {
				const callee = unwrapArrayExpression(node.callee);

				if (callee.type !== "CallExpression") return;

				if (importedConstructor(context.sourceCode, callee.callee) !== null) {
					context.report({ node, messageId: "nameQuery" });
				}
			},
		};
	},
});
