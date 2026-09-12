import type { UseFormSetFocus, UseFormSetValue } from "react-hook-form";

import type { Workout } from "@/features/workout-form/lib/validateWorkout";

export function applyPickedExercise({
	exerciseIndex,
	setName,
	setValue,
	setFocus,
	exercise,
}: {
	exerciseIndex: number;
	setName: (name: string) => void;
	setValue: UseFormSetValue<Workout>;
	setFocus: UseFormSetFocus<Workout>;
	exercise: { name: string; muscleGroups?: string[] };
}) {
	setName(exercise.name);
	setValue(`exercises.${exerciseIndex}.exerciseId`, undefined);
	setValue(`exercises.${exerciseIndex}.global.muscleGroups`, exercise.muscleGroups ?? []);

	// Defer one tick: set rows mount after the name change, so weight input may not exist yet.
	setTimeout(() => setFocus(`exercises.${exerciseIndex}.sets.0.weight`), 0);
}
