import { v } from "convex/values";
import { calculateSetPrResult, getWorkoutSetPrResults } from "./lib/calculateStatPr";
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

			const completedSets = await ctx.db
				.query("workoutSets")
				.withIndex("by_userId_globalExerciseId_completed_workoutCreationTime_order", (query) =>
					query
						.eq("userId", identity.subject)
						.eq("globalExerciseId", globalExercise._id)
						.eq("completed", true),
				)
				.order("asc")
				.collect();

			const setPrResults = getWorkoutSetPrResults(
				[],
				globalExercise._id,
				completedSets.map((set) => ({
					weight: set.weight,
					reps: set.reps,
					completed: set.completed,
				})),
			);

			return completedSets
				.slice(-6)
				.reverse()
				.map((set, index) => {
					const prResult = setPrResults[completedSets.length - 1 - index];

					return {
						weight: set.weight,
						reps: set.reps,
						time: getRelativeTime(new Date(set.workoutCreationTime as number)),
						isPr: prResult?.isPr ?? false,
						prType: prResult?.prType ?? null,
					};
				});
		}),
});

export const checkCompletedSetPrByExerciseName = query({
	args: {
		exerciseName: v.string(),
		sets: v.array(
			v.object({
				completed: v.boolean(),
				reps: v.optional(v.float64()),
				weight: v.optional(v.float64()),
			}),
		),
		setIndex: v.number(),
	},
	handler: async (ctx, args) =>
		errorHandlerWrapper(async () => {
			const identity = await requireIdentity(ctx);

			const exerciseName = normalizeName(args.exerciseName);
			const globalExercise = await ctx.db
				.query("globalExercises")
				.withIndex("by_normalizedName", (query) => query.eq("normalizedName", exerciseName))
				.first();

			if (!globalExercise) return { isPr: false, prType: null };

			const previousSets = (
				await ctx.db
					.query("workoutSets")
					.withIndex("by_userId_globalExerciseId_completed_workoutCreationTime_order", (query) =>
						query
							.eq("userId", identity.subject)
							.eq("globalExerciseId", globalExercise._id)
							.eq("completed", true),
					)
					.collect()
			).map((set) => ({
				globalExerciseId: globalExercise._id,
				weight: set.weight,
				reps: set.reps,
				completed: set.completed,
			}));

			return calculateSetPrResult(
				previousSets,
				globalExercise._id,
				args.sets.map((set) => ({
					completed: set.completed,
					reps: Number(set.reps) || 0,
					weight: Number(set.weight) || 0,
				})),
				args.setIndex,
			);
		}),
});
