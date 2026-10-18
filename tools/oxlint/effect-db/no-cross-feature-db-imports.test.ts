import { RuleTester } from "oxlint/plugins-dev";

import { noCrossFeatureDbImportsRule } from "./no-cross-feature-db-imports.ts";

new RuleTester().run("no-cross-feature-db-imports", noCrossFeatureDbImportsRule, {
	valid: [
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'import { getWorkout } from "@/features/workouts/server/workout.db";',
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'import type { HistoryEntry } from "@/features/history/server/history.db.ts";',
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'import { type HistoryEntry } from "@/features/history/server/history.db";',
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'export type { HistoryEntry } from "@/features/history/server/history.db.ts";',
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'import { toDate } from "@/lib/date";',
		},
		{
			filename: "src/features/workouts/server/service.ts",
			code: 'import { getHistory } from "@/features/history/server/history.db";',
		},
		{
			filename: "src/server/workout.db.ts",
			code: 'import { getHistory } from "@/features/history/server/history.db";',
		},
	],
	invalid: [
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'import { getHistory } from "@/features/history/server/history.db";',
			errors: [{ messageId: "crossFeatureDb" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'import * as historyDb from "@/features/history/server/history.db.ts";',
			errors: [{ messageId: "crossFeatureDb" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'import "@/features/history/server/history.db";',
			errors: [{ messageId: "crossFeatureDb" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'export { getHistory } from "@/features/history/server/history.db";',
			errors: [{ messageId: "crossFeatureDb" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: 'export * from "@/features/history/server/history.db.ts";',
			errors: [{ messageId: "crossFeatureDb" }],
		},
	],
});
