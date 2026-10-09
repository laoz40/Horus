import {
	eslintCompatPlugin,
	defineRule,
	type ESTree,
	type SourceCode,
	type Variable,
} from "@oxlint/plugins";

import {
	arrayMethodTarget as memberTarget,
	resolveArrayBinding as resolveBinding,
	unwrapArrayExpression as unwrapExpression,
} from "../anti-slop/shared/array-method.ts";

const UNTYPED_QUERIES = new Set([
	"$queryRaw",
	"$queryRawUnsafe",
	"$executeRaw",
	"$executeRawUnsafe",
]);

const SQL_METHODS = new Set([
	"findUnique",
	"findUniqueOrThrow",
	"findFirst",
	"findFirstOrThrow",
	"findMany",
	"count",
	"aggregate",
	"groupBy",
	"delete",
	"deleteMany",
]);

function isPrismaType(
	source: SourceCode,
	node: ESTree.Node,
	visited = new Set<Variable>(),
): boolean {
	if (node.type !== "TSTypeReference") return false;
	const name = node.typeName;

	if (name.type === "TSQualifiedName") return name.right.name === "TransactionClient";

	if (name.type !== "Identifier") return false;

	if (name.name === "PrismaClient" || name.name === "DatabaseTransaction") return true;
	const binding = resolveBinding(source, name);

	if (binding === null || visited.has(binding)) return false;
	visited.add(binding);

	return binding.defs.some(
		(def) =>
			def.node.type === "TSTypeAliasDeclaration" &&
			isPrismaType(source, def.node.typeAnnotation, visited),
	);
}

function isPrismaInitializer(
	source: SourceCode,
	node: ESTree.VariableDeclarator,
	visited: Set<Variable>,
): boolean {
	if (node.init === null) return false;

	if (
		node.id.type === "ObjectPattern" &&
		node.init.type === "YieldExpression" &&
		node.init.argument?.type === "Identifier" &&
		node.init.argument.name === "Database"
	)
		return true;

	return isPrismaClient(source, node.init, visited);
}

function isPrismaImport(node: ESTree.Node, parent: ESTree.Node | null): boolean {
	return (
		parent?.type === "ImportDeclaration" &&
		parent.source.value === "@/lib/db" &&
		node.type === "ImportSpecifier" &&
		node.imported.type === "Identifier" &&
		node.imported.name === "prisma"
	);
}

function isPrismaClient(
	source: SourceCode,
	node: ESTree.Node,
	visited = new Set<Variable>(),
): boolean {
	node = unwrapExpression(node);

	if (node.type === "NewExpression")
		return node.callee.type === "Identifier" && node.callee.name === "PrismaClient";

	if (node.type === "YieldExpression") {
		return node.argument?.type === "Identifier" && node.argument.name === "DbConnection";
	}

	if (node.type !== "Identifier") return false;
	const binding = resolveBinding(source, node);

	if (binding === null || visited.has(binding)) return false;
	visited.add(binding);

	if (
		binding.identifiers.some(
			(id) => id.typeAnnotation && isPrismaType(source, id.typeAnnotation.typeAnnotation),
		)
	)
		return true;

	return binding.defs.some((def) => {
		if (def.type === "ImportBinding") return isPrismaImport(def.node, def.parent);

		if (def.type === "Variable" && def.node.type === "VariableDeclarator") {
			return isPrismaInitializer(source, def.node, visited);
		}

		if (def.type === "Parameter") {
			const parent = def.node.parent;

			return (
				parent?.type === "CallExpression" && memberTarget(parent.callee)?.name === "$transaction"
			);
		}

		return false;
	});
}

function isPrismaDelegate(
	source: SourceCode,
	node: ESTree.Node,
	visited = new Set<Variable>(),
): boolean {
	node = unwrapExpression(node);
	const member = memberTarget(node);

	if (member !== null) return isPrismaClient(source, member.object);

	if (node.type !== "Identifier") return false;
	const binding = resolveBinding(source, node);

	if (binding === null || visited.has(binding)) return false;
	visited.add(binding);

	return binding.defs.some((def) => {
		if (def.type !== "Variable" || def.node.type !== "VariableDeclarator" || def.node.init === null)
			return false;

		if (def.node.id.type === "ObjectPattern") return isPrismaClient(source, def.node.init);

		return isPrismaDelegate(source, def.node.init, visited);
	});
}

/** Require TypedSQL reads and deletes while allowing Prisma creates, updates and transactions. */
const typedSqlReadsAndDeletesRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description: "Require TypedSQL for Prisma reads and deletes and prohibit untyped raw SQL.",
		},
		messages: {
			typedSql:
				"Use a generated TypedSQL query with `$queryRawTyped` for reads and deletes. Prisma creates, updates, and transactions are allowed.",
		},
	},
	createOnce(context) {
		return {
			MemberExpression(node) {
				const member = memberTarget(node);

				if (member === null) return;

				if (
					UNTYPED_QUERIES.has(member.name) ||
					(SQL_METHODS.has(member.name) && isPrismaDelegate(context.sourceCode, member.object))
				) {
					context.report({ node, messageId: "typedSql" });
				}
			},
			VariableDeclarator(node) {
				if (
					node.id.type !== "ObjectPattern" ||
					node.init === null ||
					!isPrismaDelegate(context.sourceCode, node.init)
				)
					return;

				for (const property of node.id.properties) {
					if (property.type !== "Property") continue;
					const key = property.key;

					if (key.type === "Identifier" && !property.computed && SQL_METHODS.has(key.name))
						context.report({ node: property, messageId: "typedSql" });

					if (key.type === "Literal" && SQL_METHODS.has(String(key.value)))
						context.report({ node: property, messageId: "typedSql" });
				}
			},
		};
	},
});

export default eslintCompatPlugin({
	meta: { name: "prisma" },
	rules: { "typed-sql-reads-and-deletes": typedSqlReadsAndDeletesRule },
});
