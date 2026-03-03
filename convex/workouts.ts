import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateWorkout } from "../features/workout-form/lib/validateWorkout";
import type { WorkoutFormData } from "../features/workout-form/lib/types";
import { parseWorkout } from "../lib/workout/parseWorkout";
import { mapExercisesWithGlobalExerciseIds } from "../lib/workout/globalExerciseLookup";
import { calculateWorkoutVolume } from "../lib/workout/calculateStatVolume";
import { calculateTotalPrSets } from "../lib/workout/calculateStatPr";

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
				errors: validationResult.error.issues,
			};
		}
		const exercisesWithGlobalExerciseIds =
			await mapExercisesWithGlobalExerciseIds(ctx, parsedWorkout.exercises);

		const totalVolume = calculateWorkoutVolume(parsedWorkout);
		const totalPrSets = await calculateTotalPrSets(
			ctx,
			exercisesWithGlobalExerciseIds,
		);

		await ctx.db.insert("workouts", {
			name: parsedWorkout.name,
			durationSeconds: parsedWorkout.durationSeconds,
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
