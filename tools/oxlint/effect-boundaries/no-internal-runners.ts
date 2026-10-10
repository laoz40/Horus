import { defineRule } from "@oxlint/plugins";

import { effectMethodTarget } from "./lib.ts";

const RUNNERS = new Set([
	"runCallback",
	"runCallbackWith",
	"runFork",
	"runForkWith",
	"runPromise",
	"runPromiseExit",
	"runPromiseExitWith",
	"runPromiseWith",
	"runSync",
	"runSyncExit",
	"runSyncExitWith",
	"runSyncWith",
]);

/** Keep Effect execution at server composition boundaries. */
export const noInternalRunnersRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description:
				"Restrict Effect runners in server modules to routers and transaction orchestration.",
		},
		messages: {
			internalRunner:
				"Keep Effect execution at the router or transaction boundary; do not run Effects inside this server module.",
		},
	},
	createOnce(context) {
		let transactionBridge = false;

		return {
			before() {
				const file = context.filename.replaceAll("\\", "/");
				transactionBridge = file.endsWith("/src/server/transactions.ts");

				return file.includes("/src/server/") && !file.endsWith(".router.ts");
			},
			MemberExpression(node) {
				const method = effectMethodTarget(context.sourceCode, node);

				if (
					method === null ||
					!RUNNERS.has(method) ||
					(transactionBridge && method === "runPromiseExit")
				)
					return;

				context.report({ node, messageId: "internalRunner" });
			},
			ImportSpecifier(node) {
				if (node.parent.type !== "ImportDeclaration") return;

				if (node.importKind === "type" || node.parent.importKind === "type") return;

				const method = effectMethodTarget(context.sourceCode, node.local);

				if (
					method === null ||
					!RUNNERS.has(method) ||
					(transactionBridge && method === "runPromiseExit")
				)
					return;

				context.report({ node, messageId: "internalRunner" });
			},
		};
	},
});
