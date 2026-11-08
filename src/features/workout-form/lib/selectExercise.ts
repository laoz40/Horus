import type { UseFormSetValue } from "react-hook-form";

import type { Workout } from "@/features/workout-form/lib/validateWorkout";

export function applyPickedExercise({
	exerciseIndex,
	setName,
	setValue,
	exercise,
}: {
	exerciseIndex: number;
	setName: (name: string) => void;
	setValue: UseFormSetValue<Workout>;
	exercise: { name: string; muscleGroups?: string[] };
}) {
	setName(exercise.name);
	setValue(`exercises.${exerciseIndex}.exerciseId`, undefined);
	setValue(`exercises.${exerciseIndex}.global.muscleGroups`, exercise.muscleGroups ?? []);
}
