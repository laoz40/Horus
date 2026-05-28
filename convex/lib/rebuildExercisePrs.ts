import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
	emptyExercisePrSummary,
	getPrPatchFields,
	getSetPrResult,
	normalizePrSet,
	updateExercisePrSummary,
} from "./calculateStatPr";
import { markCurrentPrFlags, upsertExercisePrSummary } from "./exercisePrs";

export async function rebuildExercisePrsForUser(
	ctx: MutationCtx,
	args: {
		userId: string;
		globalExerciseIds: Id<"globalExercises">[];
	},
): Promise<void> {
	const uniqueGlobalExerciseIds = [...new Set(args.globalExerciseIds)];
	const touchedWorkoutIds = new Set<Id<"workouts">>();

	for (const globalExerciseId of uniqueGlobalExerciseIds) {
		const completedSets = await ctx.db
			.query("workoutSets")
			.withIndex("by_userId_globalExerciseId_completed_workoutCreationTime_order", (query) =>
				query
					.eq("userId", args.userId)
					.eq("globalExerciseId", globalExerciseId)
					.eq("completed", true),
			)
			.order("asc")
			.collect();

		let summary = emptyExercisePrSummary();
		let hasHistory = false;

		await Promise.all(
			completedSets.map((set) =>
				ctx.db.patch(set._id, {
					isCurrentWeightPr: false,
					isCurrentVolumePr: false,
					isCurrentBodyweightRepsPr: false,
				}),
			),
		);

		for (const set of completedSets) {
			const normalizedSet = normalizePrSet(set);
			const result = hasHistory
				? getSetPrResult(normalizedSet, summary)
				: { isPr: false, prType: null };

			await ctx.db.patch(set._id, getPrPatchFields(result));
			if (set.workoutId) touchedWorkoutIds.add(set.workoutId);

			summary = updateExercisePrSummary(normalizedSet, set._id, summary);
			if (!hasHistory && normalizedSet.completed) hasHistory = true;
		}

		await markCurrentPrFlags(ctx, summary);
		await upsertExercisePrSummary(ctx, args.userId, globalExerciseId, summary);
	}

	for (const workoutId of touchedWorkoutIds) {
		const workoutSets = await ctx.db
			.query("workoutSets")
			.withIndex("by_workoutId", (query) => query.eq("workoutId", workoutId))
			.collect();
		const totalPrSets = workoutSets.filter((set) => set.isPr === true).length;
		await ctx.db.patch(workoutId, { totalPrSets });
	}
}

export async function rebuildMissingExercisePrsForUser(
	ctx: MutationCtx,
	args: {
		userId: string;
		globalExerciseIds: Id<"globalExercises">[];
	},
): Promise<void> {
	const missingGlobalExerciseIds: Id<"globalExercises">[] = [];

	for (const globalExerciseId of new Set(args.globalExerciseIds)) {
		const summary = await ctx.db
			.query("exercisePrs")
			.withIndex("by_userId_globalExerciseId", (query) =>
				query.eq("userId", args.userId).eq("globalExerciseId", globalExerciseId),
			)
			.first();

		if (!summary) missingGlobalExerciseIds.push(globalExerciseId);
	}

	if (missingGlobalExerciseIds.length === 0) return;

	await rebuildExercisePrsForUser(ctx, {
		userId: args.userId,
		globalExerciseIds: missingGlobalExerciseIds,
	});
}
