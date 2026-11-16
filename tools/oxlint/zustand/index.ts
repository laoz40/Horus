import { defineRule, eslintCompatPlugin, type ESTree, type SourceCode } from "@oxlint/plugins";

import {
	arrayMethodTarget,
	resolveArrayBinding,
	unwrapArrayExpression,
} from "../anti-slop/shared/array-method.ts";

type StoreFunction = ESTree.ArrowFunctionExpression | ESTree.Function;

const FACTORIES = new Set(["create", "createStore"]);

function isFunction(node: ESTree.Node): node is StoreFunction {
	return (
		node.type === "ArrowFunctionExpression" ||
		node.type === "FunctionExpression" ||
		node.type === "FunctionDeclaration"
	);
}

function nearestFunction(node: ESTree.Node) {
	let parent = node.parent;

	while (parent !== null) {
		if (isFunction(parent)) return parent;

		parent = parent.parent;
	}

	return null;
}

function outerExpression(node: ESTree.Node) {
	while (node.parent !== null && unwrapArrayExpression(node.parent) === node) node = node.parent;

	return node;
}

function factoryExportName(imported: ESTree.Node, member: ReturnType<typeof arrayMethodTarget>) {
	if (imported.type === "ImportNamespaceSpecifier") return member?.name ?? null;

	if (imported.type !== "ImportSpecifier" || member !== null) return null;

	return imported.imported.type === "Identifier" ? imported.imported.name : imported.imported.value;
}

/** Resolve factory imports by binding, including renamed and namespace imports. */
function isZustandFactory(source: SourceCode, expression: ESTree.Node) {
	const callee = unwrapArrayExpression(expression);

	if (callee.type === "CallExpression" && callee.arguments.length === 0)
		return isZustandFactory(source, callee.callee);

	const member = arrayMethodTarget(callee);
	const binding = resolveArrayBinding(source, member?.object ?? callee);
	const definition = binding?.defs.find((entry) => entry.type === "ImportBinding");

	if (definition?.parent?.type !== "ImportDeclaration") return false;

	if (!/^zustand(?:\/(?:vanilla|react))?$/u.test(definition.parent.source.value)) return false;
	const name = factoryExportName(definition.node, member);

	return name !== null && FACTORIES.has(name);
}

function initializerFunction(source: SourceCode, expression: ESTree.Node) {
	const node = unwrapArrayExpression(expression);

	if (isFunction(node)) return node;
	const binding = resolveArrayBinding(source, node);
	const definition = binding?.defs[0]?.node;

	if (definition === undefined) return null;

	if (isFunction(definition)) return definition;

	if (definition.type !== "VariableDeclarator" || definition.init === null) return null;
	const initializer = unwrapArrayExpression(definition.init);

	return isFunction(initializer) ? initializer : null;
}

function isSendProperty(property: ESTree.Node) {
	if (property.type !== "Property" || property.kind !== "init") return false;
	const key = property.key;

	return key.type === "Identifier" && !property.computed
		? key.name === "send"
		: key.type === "Literal" && key.value === "send";
}

/** Only the send property of an object returned by this initializer owns transitions. */
function isReturnedSend(node: ESTree.Node, initializer: StoreFunction) {
	const property = outerExpression(node).parent;

	if (property === null || !isSendProperty(property)) return false;
	const object = property.parent;

	if (object?.type !== "ObjectExpression") return false;
	const returned = outerExpression(object);

	return (
		returned === initializer.body ||
		(returned.parent?.type === "ReturnStatement" && nearestFunction(returned) === initializer)
	);
}

function setterViolation(source: SourceCode, node: ESTree.Node, initializer: StoreFunction) {
	const expression = outerExpression(node);
	const parent = expression.parent;

	if (parent?.type !== "CallExpression" || parent.callee !== expression) return "escapedSetter";
	const fn = nearestFunction(expression);

	return fn !== null && isSendFunction(source, fn, initializer) ? null : "outsideSend";
}

function isSendFunction(source: SourceCode, fn: StoreFunction, initializer: StoreFunction) {
	if (isReturnedSend(fn, initializer)) return true;
	const owner = outerExpression(fn).parent;
	const identifier = fn.type === "FunctionDeclaration" ? fn.id : null;
	const bindingNode = owner?.type === "VariableDeclarator" ? owner.id : identifier;

	if (bindingNode === null) return false;
	const binding = resolveArrayBinding(source, bindingNode);

	return (
		binding?.references.some((reference) => isReturnedSend(reference.identifier, initializer)) ??
		false
	);
}

const setOnlyInSend = defineRule({
	meta: {
		type: "problem",
		docs: { description: "Keep Zustand setter calls directly inside the store's send function." },
		messages: {
			outsideSend:
				"Call the Zustand setter directly inside this store's send function. Helpers must return results for send to apply.",
			escapedSetter:
				"Do not alias, reassign, expose, or pass the Zustand setter. Call it directly inside send.",
		},
	},
	createOnce(context) {
		return {
			CallExpression(node) {
				if (!isZustandFactory(context.sourceCode, node.callee)) return;
				const argument = node.arguments[0];

				if (argument === undefined) return;
				const initializer = initializerFunction(context.sourceCode, argument);
				const parameter = initializer?.params[0];

				if (initializer === null || parameter === undefined) return;
				const setter = resolveArrayBinding(context.sourceCode, parameter);

				for (const reference of setter?.references ?? []) {
					const messageId = setterViolation(context.sourceCode, reference.identifier, initializer);

					if (messageId !== null) context.report({ node: reference.identifier, messageId });
				}
			},
		};
	},
});

export default eslintCompatPlugin({
	meta: { name: "zustand" },
	rules: { "set-only-in-send": setOnlyInSend },
});
