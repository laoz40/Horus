import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { validateWorkout } from "../features/workout-form/lib/validateWorkout";
import type { WorkoutFormData } from "../features/workout-form/lib/types";
import { parseWorkout } from "../lib/workout/parseWorkout";
import { mapExercisesWithGlobalExerciseIds } from "../lib/workout/globalExerciseLookup";
import { calculateWorkoutVolume } from "../lib/workout/calculateStatVolume";
import { calculateTotalPrSets } from "../lib/workout/calculateStatPr";
import { paginationOptsValidator } from "convex/server";
import { getWorkoutMuscleGroups } from "../lib/workout/getWorkoutMuscleGroups";

const workoutObject = v.object({
	durationSeconds: v.union(v.float64(), v.null()),
	exercises: v.array(
		v.object({
			global: v.object({
				muscleGroups: v.optional(v.array(v.string())),
				name: v.string(),
			}),
			difficulty: v.optional(v.float64()),
			id: v.string(),
			notes: v.optional(v.string()),
			sets: v.array(
				v.object({
					completed: v.boolean(),
					id: v.string(),
					reps: v.float64(),
					weight: v.float64(),
				}),
			),
		}),
	),
	name: v.string(),
});

export const createWorkout = mutation({
	args: {
		workout: workoutObject,
	},
	handler: async (ctx, args) => {
		try {
			const parsedWorkout = parseWorkout(args.workout as WorkoutFormData);

			const validationResult = validateWorkout(parsedWorkout);

			if (!validationResult.success) {
				throw new ConvexError({
					code: "INVALID_WORKOUT_DATA",
					issues: validationResult.error.issues.map((issue) => ({
						message: issue.message,
					})),
				});
			}

			const exercisesWithGlobalExerciseIds = await mapExercisesWithGlobalExerciseIds(
				ctx,
				parsedWorkout.exercises,
			);
			const totalPrSets = await calculateTotalPrSets(ctx, exercisesWithGlobalExerciseIds);
			const muscleGroups = getWorkoutMuscleGroups(parsedWorkout);
			const totalVolume = calculateWorkoutVolume(parsedWorkout);

			await ctx.db.insert("workouts", {
				name: parsedWorkout.name,
				durationSeconds: parsedWorkout.durationSeconds,
				muscleGroups,
				exercises: exercisesWithGlobalExerciseIds,
				totalPrSets,
				totalVolume,
			});

			return { workout: validationResult.data };
		} catch (error) {
			// passes INVALID_WORKOUT_DATA error if that throws
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const updateWorkout = mutation({
	args: {
		workoutId: v.id("workouts"),
		workout: workoutObject,
	},
	handler: async (ctx, args) => {
		try {
			const workout = await ctx.db.get(args.workoutId);
			if (!workout) {
				throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId: args.workoutId });
			}

			const parsedWorkout = parseWorkout(args.workout as WorkoutFormData);
			const validationResult = validateWorkout(parsedWorkout);

			if (!validationResult.success) {
				throw new ConvexError({
					code: "INVALID_WORKOUT_DATA",
					issues: validationResult.error.issues.map((issue) => ({
						message: issue.message,
					})),
				});
			}

			const exercisesWithGlobalExerciseIds = await mapExercisesWithGlobalExerciseIds(
				ctx,
				parsedWorkout.exercises,
			);
			const totalPrSets = await calculateTotalPrSets(ctx, exercisesWithGlobalExerciseIds);
			const muscleGroups = getWorkoutMuscleGroups(parsedWorkout);
			const totalVolume = calculateWorkoutVolume(parsedWorkout);

			await ctx.db.patch(args.workoutId, {
				name: parsedWorkout.name,
				durationSeconds: parsedWorkout.durationSeconds,
				muscleGroups,
				exercises: exercisesWithGlobalExerciseIds,
				totalPrSets,
				totalVolume,
			});

			return { workout: validationResult.data, workoutId: args.workoutId };
		} catch (error) {
			// passes NO_WORKOUT_FOUND and INVALID_WORKOUT_DATA error if those throw
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const deleteWorkout = mutation({
	args: {
		workoutId: v.id("workouts"),
	},
		handler: async (ctx, args) => {
			try {
				const workout = await ctx.db.get(args.workoutId);
			if (!workout) {
				throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId: args.workoutId });
			}

			await ctx.db.delete(args.workoutId);

			return {
				success: true,
				deletedWorkoutId: args.workoutId,
				deletedWorkoutName: workout.name,
			};
		} catch (error) {
			// passes NO_WORKOUT_FOUND error if that throws
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const deleteAllWorkouts = mutation({
	args: {},
	handler: async (ctx) => {
		try {
			const workouts = await ctx.db.query("workouts").collect();
			if (workouts.length === 0) throw new ConvexError({ code: "NO_WORKOUTS" });

			for (const workout of workouts) await ctx.db.delete(workout._id);

			return { success: true, deletedCount: workouts.length };
		} catch (error) {
			// passes NO_WORKOUTS error if that throws
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const getWorkoutById = query({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) => {
		try {
			const workout = await ctx.db.get(args.workoutId);

			if (!workout) {
				throw new ConvexError({ code: "NO_WORKOUT_FOUND", workoutId: args.workoutId });
			}

			const exercisesWithId = [];
			let missingGlobalExercises = 0;

			for (const exercise of workout.exercises) {
				const globalExercise = await ctx.db.get(exercise.globalExerciseId);

				if (!globalExercise) {
					missingGlobalExercises += 1;
					continue;
				}

				exercisesWithId.push({
					id: exercise.id,
					global: {
						name: globalExercise.name,
						...(globalExercise.muscleGroups !== undefined
							? { muscleGroups: globalExercise.muscleGroups }
							: {}),
					},
					...(exercise.difficulty !== undefined ? { difficulty: exercise.difficulty } : {}),
					...(exercise.notes !== undefined ? { notes: exercise.notes } : {}),
					sets: exercise.sets,
				});
			}

			return {
				_id: workout._id,
				_creationTime: workout._creationTime,
				name: workout.name,
				durationSeconds: workout.durationSeconds,
				exercises: exercisesWithId,
				missingGlobalExercisesCount: missingGlobalExercises,
			};
		} catch (error) {
			// passes NO_WORKOUT_FOUND error if that throws
			if (error instanceof ConvexError) throw error;

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});

export const listWorkouts = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		try {
			const results = await ctx.db
				.query("workouts")
				.withIndex("by_creation_time")
				.order("desc")
				.paginate(args.paginationOpts);

			return {
				...results,
				page: results.page.map((workout) => ({
					_id: workout._id,
					_creationTime: workout._creationTime,
					name: workout.name,
					durationSeconds: workout.durationSeconds,
					totalVolume: workout.totalVolume,
					totalPrSets: workout.totalPrSets,
					exerciseCount: workout.exercises.length,
					muscleGroups: workout.muscleGroups ?? [],
				})),
			};
		} catch (error) {
			if (error instanceof Error && error.message.includes("ArgumentValidationError")) {
				throw new ConvexError({ code: "INVALID_PAGINATION_OPTS" });
			}

			throw new ConvexError({ code: "DB_QUERY_FAILED" });
		}
	},
});
