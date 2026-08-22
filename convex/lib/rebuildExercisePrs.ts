import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internalAction, internalMutation } from "../_generated/server";
import {
	emptyExercisePrSummary,
	getPrPatchFields,
	getSetPrResult,
	normalizePrSet,
	updateExercisePrSummary,
	type ExercisePrSummary,
} from "./calculateStatPr";
import { markCurrentPrFlags, upsertExercisePrSummary } from "./exercisePrs";

// Rebuild PRs in small chunks so one transaction does not load too much data.
const REBUILD_BATCH_SIZE = 100;
// Recompute workout totals in smaller chunks because each workout can have many sets.
const WORKOUT_TOTAL_BATCH_SIZE = 50;

const exercisePrSummaryValidator = v.object({
	weightPr: v.number(),
	weightPrSetId: v.union(v.id("workoutSets"), v.null()),
	volumePr: v.number(),
	volumePrSetId: v.union(v.id("workoutSets"), v.null()),
	bodyweightRepsPr: v.number(),
	bodyweightRepsPrSetId: v.union(v.id("workoutSets"), v.null()),
});

export async function rebuildExercisePrsForUser(
	ctx: MutationCtx,
	args: {
		userId: string;
		globalExerciseIds: Id<"globalExercises">[];
	},
): Promise<void> {
	// Starts a background rebuild for the user's exercise PRs.
	await ctx.scheduler.runAfter(
		0,
		internal.lib.rebuildExercisePrs.rebuildExercisePrsForUserAction,
		args,
	);
}

// Rebuilds PRs for each exercise from the user's workout history.
export const rebuildExercisePrsForUserAction = internalAction({
	args: {
		userId: v.string(),
		globalExerciseIds: v.array(v.id("globalExercises")),
	},
	handler: async (ctx, args): Promise<void> => {
		const uniqueGlobalExerciseIds = [...new Set(args.globalExerciseIds)];
		const touchedWorkoutIds = new Set<Id<"workouts">>();

		for (const globalExerciseId of uniqueGlobalExerciseIds) {
			let summary: ExercisePrSummary = emptyExercisePrSummary();
			let hasHistory = false;
			let cursor: string | null = null;
			let isDone = false;

			// Process one page of sets at a time, then continue from the returned cursor.
			while (!isDone) {
				const result: {
					summary: ExercisePrSummary;
					hasHistory: boolean;
					cursor: string | null;
					isDone: boolean;
					touchedWorkoutIds: Id<"workouts">[];
				} = await ctx.runMutation(internal.lib.rebuildExercisePrs.processExercisePrRebuildBatch, {
					userId: args.userId,
					globalExerciseId,
					cursor,
					summary,
					hasHistory,
				});

				summary = result.summary;
				hasHistory = result.hasHistory;
				cursor = result.cursor;
				isDone = result.isDone;
				for (const workoutId of result.touchedWorkoutIds) touchedWorkoutIds.add(workoutId);
			}

			// After all sets are processed, save the final PRs for this exercise.
			await ctx.runMutation(internal.lib.rebuildExercisePrs.finalizeExercisePrRebuild, {
				userId: args.userId,
				globalExerciseId,
				summary,
			});
		}

		// PR flags changed, so update the PR count on each affected workout in batches.
		const workoutIds = [...touchedWorkoutIds];
		for (let index = 0; index < workoutIds.length; index += WORKOUT_TOTAL_BATCH_SIZE) {
			await ctx.runMutation(internal.lib.rebuildExercisePrs.recomputeWorkoutTotalPrSetsBatch, {
				workoutIds: workoutIds.slice(index, index + WORKOUT_TOTAL_BATCH_SIZE),
			});
		}
	},
});

// Rebuilds one small batch of sets for one exercise.
export const processExercisePrRebuildBatch = internalMutation({
	args: {
		userId: v.string(),
		globalExerciseId: v.id("globalExercises"),
		cursor: v.union(v.string(), v.null()),
		summary: exercisePrSummaryValidator,
		hasHistory: v.boolean(),
	},
	handler: async (ctx, args) => {
		// Use pagination so we do not load every completed set at once.
		const completedSets = await ctx.db
			.query("workoutSets")
			.withIndex("by_userId_globalExerciseId_completed_workoutCreationTime_order", (query) =>
				query
					.eq("userId", args.userId)
					.eq("globalExerciseId", args.globalExerciseId)
					.eq("completed", true),
			)
			.order("asc")
			.paginate({ numItems: REBUILD_BATCH_SIZE, cursor: args.cursor });

		let summary = args.summary;
		let hasHistory = args.hasHistory;
		const touchedWorkoutIds = new Set<Id<"workouts">>();

		// Check sets from oldest to newest and update the running PR summary.
		for (const set of completedSets.page) {
			const normalizedSet = normalizePrSet(set);
			const result = hasHistory
				? getSetPrResult(normalizedSet, summary)
				: { isPr: false, prType: null };

			await ctx.db.patch(set._id, getPrPatchFields(result));
			touchedWorkoutIds.add(set.workoutId);

			summary = updateExercisePrSummary(normalizedSet, set._id, summary);
			if (!hasHistory && normalizedSet.completed) hasHistory = true;
		}

		// Return what the action needs to process the next page.
		return {
			summary,
			hasHistory,
			cursor: completedSets.continueCursor,
			isDone: completedSets.isDone,
			touchedWorkoutIds: [...touchedWorkoutIds],
		};
	},
});

// Marks the final best sets as the current PRs and saves the final summary.
export const finalizeExercisePrRebuild = internalMutation({
	args: {
		userId: v.string(),
		globalExerciseId: v.id("globalExercises"),
		summary: exercisePrSummaryValidator,
	},
	handler: async (ctx, args) => {
		await markCurrentPrFlags(ctx, args.summary);
		await upsertExercisePrSummary(ctx, args.userId, args.globalExerciseId, args.summary);
	},
});

// Updates the total PR set count for a small list of workouts.
export const recomputeWorkoutTotalPrSetsBatch = internalMutation({
	args: {
		workoutIds: v.array(v.id("workouts")),
	},
	handler: async (ctx, args) => {
		for (const workoutId of args.workoutIds) {
			const workoutSets = await ctx.db
				.query("workoutSets")
				.withIndex("by_workoutId", (query) => query.eq("workoutId", workoutId))
				.collect();
			const totalPrSets = workoutSets.filter((set) => set.isPr === true).length;
			await ctx.db.patch(workoutId, { totalPrSets });
		}
	},
});
