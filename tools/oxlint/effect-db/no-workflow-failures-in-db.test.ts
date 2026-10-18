import { RuleTester } from "oxlint/plugins-dev";

import { noWorkflowFailuresInDbRule } from "./no-workflow-failures-in-db.ts";

new RuleTester().run("no-workflow-failures-in-db", noWorkflowFailuresInDbRule, {
	valid: [
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `
				import { Effect } from "effect";
				import { DatabaseError as DbError } from "@/lib/db/database";
				Effect.fail(new DbError({ cause: new Error("Database invariant failed") }));
			`,
		},
		{
			filename: "src/server/workout.db.ts",
			code: `
				import * as E from "effect/Effect";
				import { DatabaseError } from "@/lib/db/database";
				E.fail(new DatabaseError({ cause: new Error("Database invariant failed") }));
			`,
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `
				import { Effect } from "effect";
				Effect.mapError((cause) => cause);
			`,
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `import type { WorkoutService } from "@/features/workouts/server/workout.service";`,
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `import { type WorkoutService } from "@/features/workouts/server/workout.service.ts";`,
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `export type { WorkoutService } from "@/features/workouts/server/workout.service";`,
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `
				function Effect() { return { fail: (error: unknown) => error }; }
				Effect().fail(new Error("Local helper, not Effect.fail"));
			`,
		},
		{
			filename: "src/features/workouts/server/service.ts",
			code: `import { Effect } from "effect"; Effect.fail(new Error("Workflow failure"));`,
		},
	],
	invalid: [
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `
				import { Effect } from "effect";
				class ExerciseNotFoundError extends Error {}
				Effect.fail(new ExerciseNotFoundError());
			`,
			errors: [{ messageId: "failure" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `
				import { Effect as E } from "effect";
				const error = new Error("Unknown failure");
				E.fail(error);
			`,
			errors: [{ messageId: "failure" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `
				import { Effect } from "effect";
				Effect.fail(new DatabaseError({ cause: new Error("Not imported" ) }));
			`,
			errors: [{ messageId: "failure" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `
				import { Effect } from "effect";
				import { DatabaseError } from "@/lib/db/database";
				const fail = Effect.fail;
				fail(new Error("Indirect calls are outside this rule"));
				Effect.fail(new Error("Workflow failure"));
			`,
			errors: [{ messageId: "failure" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `import { service } from "@/features/workouts/server/workout.service";`,
			errors: [{ messageId: "service" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `export { service } from "@/features/workouts/server/workout.service.ts";`,
			errors: [{ messageId: "service" }],
		},
		{
			filename: "src/features/workouts/server/workout.db.ts",
			code: `export * from "@/features/workouts/server/workout.service";`,
			errors: [{ messageId: "service" }],
		},
	],
});
