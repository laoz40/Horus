import { useState } from "react";
import { Workout } from "@/features/workout-form/lib/validateWorkout";

interface UseExerciseSelectionProps {
	exerciseIds: string[];
	watchedExercises: Workout["exercises"] | undefined;
}

interface UseExerciseSelectionReturn {
	selectedExerciseId?: string;
	setSelectedExerciseId: (exerciseId: string) => void;
	getExerciseLabel: (exerciseIndex: number) => string;
	currentExerciseName: string;
}

export const useExerciseSelection = ({
	exerciseIds,
	watchedExercises,
}: UseExerciseSelectionProps): UseExerciseSelectionReturn => {
	const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>(
		() => exerciseIds[0] ?? "",
	);

	const getExerciseLabel = (exerciseIndex: number) => {
		const selectLabel = watchedExercises?.[exerciseIndex]?.global?.name?.trim();
		return selectLabel ? selectLabel : "No exercise added";
	};

	const currentExerciseIndex = exerciseIds.findIndex(
		(exerciseId) => exerciseId === selectedExerciseId,
	);

	// if index exists, return exercise name. use "" if not found so select placeholder shows
	const currentExerciseName =
		currentExerciseIndex >= 0
			? watchedExercises?.[currentExerciseIndex]?.global?.name?.trim() || ""
			: "";

	return {
		selectedExerciseId,
		setSelectedExerciseId,
		getExerciseLabel,
		currentExerciseName,
	};
};
