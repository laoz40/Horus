import type { MutationCtx } from "../../convex/_generated/server";
import { countTotalPrSetsInWorkout } from "../calculateWorkoutStats";
import { normalizeExerciseName } from "./normalizeExerciseName";

interface WorkoutForPrCalculation {
	exercises: {
		global: {
			name: string;
		};
		sets: {
			weight: number;
			reps: number;
			completed: boolean;
		}[];
	}[];
}

export const calculateTotalPrSets = async (
	ctx: MutationCtx,
	workout: WorkoutForPrCalculation,
): Promise<number> => {
	const previousWorkouts = await ctx.db.query("workouts").collect();

	const previousSets = previousWorkouts.flatMap((previousWorkout) =>
		previousWorkout.exercises.flatMap((exercise) =>
			exercise.sets
				.filter((set) => set.completed)
				.map((set) => ({
					globalExerciseId: normalizeExerciseName(exercise.global.name),
					weight: set.weight,
					reps: set.reps,
					completed: set.completed,
				})),
		),
	);

	return countTotalPrSetsInWorkout(
		{
			exercises: workout.exercises.map((exercise) => ({
				globalExerciseId: normalizeExerciseName(exercise.global.name),
				sets: exercise.sets.map((set) => ({
					weight: Number(set.weight) || 0,
					reps: Number(set.reps) || 0,
					completed: set.completed ?? false,
				})),
			})),
		},
		previousSets,
	);
};
