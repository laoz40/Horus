import type { InfiniteData } from "@tanstack/react-query";

import type { WorkoutForSave } from "@/features/workout-form/lib/types";
import type { WorkoutHistoryItem } from "@/features/workout-history/lib/types";

export type WorkoutHistoryPage = {
	items: WorkoutHistoryItem[];
	nextOffset: number | null;
};

export type WorkoutHistoryInfiniteData = InfiniteData<WorkoutHistoryPage, number>;

type OptimisticHistoryFields = Pick<
	WorkoutHistoryItem,
	"name" | "durationSeconds" | "totalVolume" | "exerciseCount" | "muscleGroups"
>;

export function buildOptimisticHistoryFields(workout: WorkoutForSave): OptimisticHistoryFields {
	const totalVolume = workout.exercises.reduce(
		(workoutTotal, exercise) =>
			workoutTotal +
			exercise.sets.reduce(
				(exerciseTotal, set) =>
					set.completed ? exerciseTotal + set.weight * set.reps : exerciseTotal,
				0,
			),
		0,
	);

	const muscleGroups = [
		...new Set(
			workout.exercises.flatMap((exercise) =>
				(exercise.global.muscleGroups ?? [])
					.map((muscleGroup) => muscleGroup.trim())
					.filter((muscleGroup) => muscleGroup.length > 0),
			),
		),
	].toSorted((left, right) => left.localeCompare(right));

	return {
		name: workout.name,
		durationSeconds: workout.durationSeconds,
		totalVolume,
		exerciseCount: workout.exercises.length,
		muscleGroups,
	};
}

export function patchWorkoutInHistoryCache(
	data: WorkoutHistoryInfiniteData | undefined,
	workoutId: string,
	fields: OptimisticHistoryFields,
): WorkoutHistoryInfiniteData | undefined {
	if (!data) {
		return data;
	}

	return {
		...data,
		pages: data.pages.map((page) => ({
			...page,
			items: page.items.map((item) => (item.id === workoutId ? { ...item, ...fields } : item)),
		})),
	};
}
