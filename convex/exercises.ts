import { query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getRelativeTime } from "../lib/date";
import { normalizeExerciseName } from "../lib/workout/normalizeExerciseName";

export const searchGlobalExercises = query({
	args: {
		query: v.string(),
	},
	handler: async (ctx, args) => {
		const query = normalizeExerciseName(args.query);

		const exercises = await ctx.db.query("globalExercises").collect();

		return exercises
			.filter((exercise) => exercise.normalizedName.includes(query))
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 10)
			.map((exercise) => ({
				id: exercise._id,
				name: exercise.name,
				normalizedName: exercise.normalizedName,
				...(exercise.muscleGroups !== undefined
					? { muscleGroups: exercise.muscleGroups }
					: {}),
			}));
	},
});

export const getRecentCompletedSetsByExerciseName = query({
	args: {
		exerciseName: v.string(),
	},
	handler: async (ctx, args) => {
		try {
			const identity = await ctx.auth.getUserIdentity();
			if (identity === null) throw new ConvexError({ code: "UNAUTHORIZED" });

			const normalizedExerciseName = normalizeExerciseName(args.exerciseName);
			const globalExercise = await ctx.db
				.query("globalExercises")
				.withIndex("by_normalizedName", (query) =>
					query.eq("normalizedName", normalizedExerciseName),
				)
				.first();

			if (!globalExercise) return [];

			const workouts = await ctx.db
				.query("workouts")
				.withIndex("by_userId", (query) => query.eq("userId", identity.subject))
				.order("desc")
				.collect();

			const recentCompletedSets: Array<{
				weight: number;
				reps: number;
				time: string;
			}> = [];

			for (const workout of workouts) {
				const matchingExercises = workout.exercises.filter(
					(exercise) => exercise.globalExerciseId === globalExercise._id,
				);

				for (const exercise of matchingExercises) {
					const completedSets = exercise.sets.filter((set) => set.completed);

					for (const set of completedSets) {
						recentCompletedSets.push({
							weight: set.weight,
							reps: set.reps,
							time: getRelativeTime(new Date(workout._creationTime)),
						});

						if (recentCompletedSets.length === 6) {
							return recentCompletedSets;
						}
					}
				}
			}

			return recentCompletedSets;
		} catch (error) {
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});
