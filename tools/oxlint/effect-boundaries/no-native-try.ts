import { relative } from "node:path";

import { defineRule } from "@oxlint/plugins";

export const noNativeTryRule = defineRule({
	meta: {
		type: "problem",
		docs: {
			description: "Use Effect instead of native try/catch or try/finally in application code.",
		},
		messages: {
			nativeTry:
				"Use Effect.try or Effect.tryPromise for fallible operations and Effect finalizers for cleanup instead of native try/catch or try/finally.",
		},
	},
	createOnce(context) {
		let allowedFunction: string | null = null;

		return {
			before() {
				const file = relative(context.cwd, context.filename).replaceAll("\\", "/");
				allowedFunction = null;

				// Invoke the permission prompt synchronously within the browser's user gesture.
				if (file === "src/features/settings/lib/restTimerNotifications.ts")
					allowedFunction = "requestRestTimerNotificationPermission";

				// Serialized into an inline pre-hydration script without module imports.
				if (file === "src/features/auth/lib/profileCookie.ts")
					allowedFunction = "paintSavedProfileFromCookie";
			},
			TryStatement(node) {
				const body = node.parent;
				const fn = body.parent;

				if (
					allowedFunction !== null &&
					body.type === "BlockStatement" &&
					fn?.type === "FunctionDeclaration" &&
					fn.body === body &&
					fn.id?.name === allowedFunction &&
					(fn.parent.type === "Program" ||
						(fn.parent.type === "ExportNamedDeclaration" && fn.parent.parent.type === "Program"))
				)
					return;

				context.report({ node, messageId: "nativeTry" });
			},
		};
	},
});
