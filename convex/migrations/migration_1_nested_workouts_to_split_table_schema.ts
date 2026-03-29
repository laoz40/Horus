import { ConvexError, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

interface LegacyWorkoutSet {
	id: string;
	weight: number;
	reps: number;
	completed: boolean;
}

interface LegacyWorkoutExercise {
	id: string;
	globalExerciseId: Id<"globalExercises">;
	difficulty?: number;
	notes?: string;
	sets: LegacyWorkoutSet[];
}

// clamp batch size for safe migration runs
const normalizeLimit = (value: number | undefined, defaultValue = 100): number => {
	if (value === undefined) return defaultValue;

	return Math.max(1, Math.min(1000, Math.floor(value)));
};

// count remaining legacy nested records
const getNotMigratedCounts = (
	workouts: Array<{
		exercises?: LegacyWorkoutExercise[];
	}>,
) => {
	let workoutsCount = 0;
	let exercisesCount = 0;
	let setsCount = 0;

	for (const workout of workouts) {
		const legacyExercises = Array.isArray(workout.exercises) ? workout.exercises : [];
		if (legacyExercises.length === 0) continue;

		workoutsCount += 1;
		exercisesCount += legacyExercises.length;
		setsCount += legacyExercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
	}

	return {
		workouts: workoutsCount,
		exercises: exercisesCount,
		sets: setsCount,
	};
};

// move legacy nested exercises and sets into split tables
export const migrateLegacyWorkouts = mutation({
	args: {
		limit: v.optional(v.float64()),
	},
	handler: async (ctx, args) => {
		try {
			// load a bounded batch of workouts
			const limit = normalizeLimit(args.limit);
			const workouts = await ctx.db.query("workouts").order("asc").take(limit);

			// track how many records were changed
			let migratedWorkouts = 0;
			let migratedExercises = 0;
			let migratedSets = 0;
			let cleanedLegacyWorkouts = 0;

			for (const workout of workouts) {
				// read legacy nested exercises if present
				const legacyWorkout = workout as typeof workout & {
					exercises?: LegacyWorkoutExercise[];
				};
				const legacyExercises = Array.isArray(legacyWorkout.exercises)
					? legacyWorkout.exercises
					: [];

				const existingChildren = await ctx.db
					.query("workoutExercises")
					.withIndex("by_workoutId", (q) => q.eq("workoutId", workout._id))
					.take(1);
				// if workout already has rows in workoutExercises:
				//   if old nested exercises field still exists, remove it
				//   skip inserting to avoid duplicate child rows
				if (existingChildren.length > 0) {
					if (legacyWorkout.exercises !== undefined) {
						await ctx.db.patch(workout._id, { exercises: undefined });
						cleanedLegacyWorkouts += 1;
					}
					continue;
				}

				// if there are no legacy nested exercises to migrate:
				//   if old nested field exists, remove it for cleanup
				//   continue to next workout
				if (legacyExercises.length === 0) {
					if (legacyWorkout.exercises !== undefined) {
						await ctx.db.patch(workout._id, { exercises: undefined });
						cleanedLegacyWorkouts += 1;
					}
					continue;
				}

				// insert one workout exercise row per legacy exercise
				for (const [exerciseIndex, legacyExercise] of legacyExercises.entries()) {
					const workoutExerciseId = await ctx.db.insert("workoutExercises", {
						workoutId: workout._id,
						userId: workout.userId,
						order: exerciseIndex,
						clientExerciseId: legacyExercise.id,
						globalExerciseId: legacyExercise.globalExerciseId,
						...(legacyExercise.difficulty !== undefined
							? { difficulty: legacyExercise.difficulty }
							: {}),
						...(legacyExercise.notes !== undefined ? { notes: legacyExercise.notes } : {}),
					});
					migratedExercises += 1;

					// insert one workout set row per legacy set
					for (const [setIndex, legacySet] of legacyExercise.sets.entries()) {
						await ctx.db.insert("workoutSets", {
							workoutId: workout._id,
							workoutExerciseId,
							order: setIndex,
							clientSetId: legacySet.id,
							weight: legacySet.weight,
							reps: legacySet.reps,
							completed: legacySet.completed,
						});
						migratedSets += 1;
					}
				}

				// remove legacy nested field after successful insert
				await ctx.db.patch(workout._id, { exercises: undefined });
				cleanedLegacyWorkouts += 1;
				migratedWorkouts += 1;
			}

			// compute remaining legacy counts after this run
			const allWorkouts = (await ctx.db.query("workouts").collect()) as Array<{
				exercises?: LegacyWorkoutExercise[];
			}>;
			const notMigrated = getNotMigratedCounts(allWorkouts);

			return {
				success: true,
				scanned: workouts.length,
				migrated: {
					workouts: migratedWorkouts,
					exercises: migratedExercises,
					sets: migratedSets,
				},
				notMigrated,
				cleanedLegacyWorkouts,
			};
		} catch (error) {
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

// report migrated row counts and remaining legacy nested counts
export const getMigrationCounts = query({
	args: {},
	handler: async (ctx) => {
		try {
			// gather current totals from split tables
			const workouts = await ctx.db.query("workouts").collect();
			const workoutExercises = await ctx.db.query("workoutExercises").collect();
			const workoutSets = await ctx.db.query("workoutSets").collect();
			const migratedWorkoutIds = new Set(workoutExercises.map((exercise) => exercise.workoutId));

			// gather remaining legacy nested totals
			const notMigrated = getNotMigratedCounts(
				workouts as Array<{
					exercises?: LegacyWorkoutExercise[];
				}>,
			);

			return {
				migrated: {
					workouts: migratedWorkoutIds.size,
					exercises: workoutExercises.length,
					sets: workoutSets.length,
				},
				notMigrated,
			};
		} catch (error) {
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});
