import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateWorkout } from "../features/workout-form/lib/validateWorkout";
import type { WorkoutFormData } from "../features/workout-form/lib/types";
import { parseWorkout } from "../lib/workout/parseWorkout";
import { mapExercisesWithGlobalExerciseIds } from "../lib/workout/globalExerciseLookup";
import { calculateWorkoutVolume } from "../lib/workout/calculateStatVolume";
import { calculateTotalPrSets } from "../lib/workout/calculateStatPr";
import { paginationOptsValidator } from "convex/server";
import { getWorkoutMuscleGroups } from "../lib/workout/getWorkoutMuscleGroups";
import { fromZodError } from "zod-validation-error";

export const createWorkout = mutation({
	args: {
		workout: v.object({
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
		}),
	},
	handler: async (ctx, args) => {
		const parsedWorkout = parseWorkout(args.workout as WorkoutFormData);

		const validationResult = validateWorkout(parsedWorkout);
		if (!validationResult.success) {
			return {
				success: false,
				errors: fromZodError(validationResult.error),
			};
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

		return {
			success: true,
			workout: validationResult.data,
		};
	},
});

export const deleteWorkout = mutation({
	args: {
		workoutId: v.id("workouts"),
	},
	handler: async (ctx, args) => {
		const workout = await ctx.db.get(args.workoutId);
		if (!workout) throw new Error("Workout not found");

		await ctx.db.delete(args.workoutId);

		return {
			success: true,
			deletedWorkoutId: args.workoutId,
			deletedWorkoutName: workout.name,
		};
	},
});

export const listWorkouts = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
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
	},
});
