"use client";

import { useFormContext } from "react-hook-form";

import { MuscleGroupExerciseBrowser } from "@/features/workout-form/components/MuscleGroupExerciseBrowser";
import { applyPickedExercise } from "@/features/workout-form/lib/selectExercise";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";

export function MuscleGroupExercisePicker({ exerciseIndex }: { exerciseIndex: number }) {
	const { setValue, setFocus } = useFormContext<Workout>();

	return (
		<MuscleGroupExerciseBrowser
			onSelectExercise={(exercise) => {
				applyPickedExercise({
					exerciseIndex,
					setName: (name) => setValue(`exercises.${exerciseIndex}.global.name`, name),
					setValue,
					setFocus,
					exercise,
				});
			}}
		/>
	);
}
