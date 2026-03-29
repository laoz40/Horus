import { v } from "convex/values";
import { errorHandlerWrapper, requireIdentity } from "./lib/server";
import { getRelativeTime } from "../lib/date";
import { normalizeName } from "../lib/normalizeName";
import { query } from "./_generated/server";

export const searchGlobalExercises = query({
	args: {
		query: v.string(),
	},
	handler: async (ctx, args) => {
		const query = normalizeName(args.query);
		if (query.length === 0) return [];

		const exercises = await ctx.db.query("globalExercises").collect();

		return exercises
			.filter((exercise) => exercise.normalizedName.includes(query))
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 10)
			.map((exercise) => ({
				id: exercise._id,
				name: exercise.name,
				normalizedName: exercise.normalizedName,
				...(exercise.muscleGroups !== undefined ? { muscleGroups: exercise.muscleGroups } : {}),
			}));
	},
});

export const getRecentCompletedSetsByExerciseName = query({
	args: {
		exerciseName: v.string(),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);

			const exerciseName = normalizeName(args.exerciseName);
			const globalExercise = await ctx.db
				.query("globalExercises")
				.withIndex("by_normalizedName", (query) => query.eq("normalizedName", exerciseName))
				.first();
			if (!globalExercise) return [];

			const recentCompletedSets = await ctx.db
				.query("workoutSets")
				.withIndex("by_userId_globalExerciseId_completed_workoutCreationTime_order", (query) =>
					query
						.eq("userId", identity.subject)
						.eq("globalExerciseId", globalExercise._id)
						.eq("completed", true),
				)
				.order("desc")
				.take(6);

			return recentCompletedSets
				.filter((set) => set.workoutCreationTime !== undefined)
				.map((set) => ({
					weight: set.weight,
					reps: set.reps,
					time: getRelativeTime(new Date(set.workoutCreationTime as number)),
				}));
		}),
});
