import { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import type { Control, UseFieldArrayReturn } from "react-hook-form";

import { createDefaultExercise } from "@/features/workout-form/lib/WorkoutFormDefaults";
import { Workout } from "@/features/workout-form/lib/validateWorkout";

interface UseWorkoutExercisesProps {
	control: Control<Workout>;
}

interface UseWorkoutExercisesReturn extends Pick<
	UseFieldArrayReturn<Workout, "exercises", "id">,
	"fields" | "remove"
> {
	handleAddExercise: () => void;
}

// Manages the dynamic list of exercises in the workout form, including the
// "add exercise" action and keeping at least one exercise row present.
export const useWorkoutExercises = ({
	control,
}: UseWorkoutExercisesProps): UseWorkoutExercisesReturn => {
	const {
		fields: exercises,
		append,
		remove,
	} = useFieldArray({
		name: "exercises",
		control,
	});

	const handleAddExercise = () => {
		append(
			createDefaultExercise(),
			// prevent insta scrolling
			{ shouldFocus: false },
		);
	};

	// Seed one exercise row so the form is never empty.
	useEffect(() => {
		if (exercises.length > 0) return;

		append(
			createDefaultExercise(),
			// prevent insta scrolling
			{ shouldFocus: false },
		);
	}, [append, exercises.length]);

	return { fields: exercises, remove, handleAddExercise };
};
