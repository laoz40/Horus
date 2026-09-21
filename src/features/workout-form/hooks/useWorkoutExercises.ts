import { useFieldArray } from "react-hook-form";
import type { Control, UseFieldArrayReturn } from "react-hook-form";

import { createDefaultExercise } from "@/features/workout-form/lib/WorkoutFormDefaults";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";

interface UseWorkoutExercisesProps {
	control: Control<Workout>;
}

interface UseWorkoutExercisesReturn extends Pick<
	UseFieldArrayReturn<Workout, "exercises">,
	"fields" | "remove"
> {
	handleAddExercise: () => void;
}

// Manages the dynamic list of exercises in the workout form, including the "add exercise" action.
// New workouts get one exercise from createDefaultWorkoutValues() defaultValues.
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

	return { fields: exercises, remove, handleAddExercise };
};
