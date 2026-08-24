import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { deleteDailySetStatsForUser } from "./lib/dailySetStats";
import { deleteWorkoutChildren, getWorkout } from "./lib/workoutActions";
import { errorHandlerWrapper, requireIdentity } from "./lib/server";
import { mutation, query } from "./_generated/server";

export const deleteAllWorkouts = mutation({
	args: {},
	handler: async (ctx) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);

			const workouts = await ctx.db
				.query("workouts")
				.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
				.collect();
			if (workouts.length === 0) throw new ConvexError({ code: "NO_WORKOUTS" });

			await deleteDailySetStatsForUser(ctx, identity.subject);
			const exercisePrs = await ctx.db
				.query("exercisePrs")
				.withIndex("by_userId", (query) => query.eq("userId", identity.subject))
				.collect();

			const DELETE_BATCH_SIZE = 25;
			for (let index = 0; index < workouts.length; index += DELETE_BATCH_SIZE) {
				const batch = workouts.slice(index, index + DELETE_BATCH_SIZE);
				for (const workout of batch) {
					await deleteWorkoutChildren(ctx, workout._id);
					await ctx.db.delete(workout._id);
				}
			}
			for (let index = 0; index < exercisePrs.length; index += DELETE_BATCH_SIZE) {
				const batch = exercisePrs.slice(index, index + DELETE_BATCH_SIZE);
				await Promise.all(batch.map((exercisePr) => ctx.db.delete(exercisePr._id)));
			}

			return { success: true, deletedCount: workouts.length };
		}),
});

export const canEditWorkout = query({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);
			await getWorkout(ctx, args.workoutId, identity.subject);

			return { ok: true };
		}),
});

export const listWorkouts = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);

			let results;
			try {
				results = await ctx.db
					.query("workouts")
					.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
					.order("desc")
					.paginate(args.paginationOpts);
			} catch (error) {
				if (error instanceof Error && error.message.includes("ArgumentValidationError")) {
					throw new ConvexError({ code: "INVALID_PAGINATION_OPTS" });
				}
				throw error;
			}

			return {
				...results,
				page: results.page.map((workout) => ({
					_id: workout._id,
					_creationTime: workout._creationTime,
					name: workout.name,
					durationSeconds: workout.durationSeconds,
					totalVolume: workout.totalVolume,
					totalPrSets: workout.totalPrSets,
					exerciseCount: workout.exerciseCount ?? 0,
					muscleGroups: workout.muscleGroups ?? [],
				})),
			};
		}),
});
