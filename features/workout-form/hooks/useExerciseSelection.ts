import { useState } from "react";

interface UseExerciseSelectionProps {
	exerciseIds: string[];
	watchedExerciseNames: Array<string | undefined>;
}

interface UseExerciseSelectionReturn {
	selectedExerciseId?: string;
	setSelectedExerciseId: (exerciseId: string) => void;
	getExerciseLabel: (exerciseIndex: number) => string;
	currentExerciseName: string;
}

export const useExerciseSelection = ({
	exerciseIds,
	watchedExerciseNames,
}: UseExerciseSelectionProps): UseExerciseSelectionReturn => {
	const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>(
		() => exerciseIds[0] ?? "",
	);

	const getExerciseLabel = (exerciseIndex: number) => {
		const selectLabel = watchedExerciseNames[exerciseIndex]?.trim();
		return selectLabel ? selectLabel : "No exercise added";
	};

	const currentExerciseIndex = exerciseIds.findIndex(
		(exerciseId) => exerciseId === selectedExerciseId,
	);

	// if index exists, return exercise name. use "" if not found so select placeholder shows
	const currentExerciseName =
		currentExerciseIndex >= 0
			? watchedExerciseNames[currentExerciseIndex]?.trim() || ""
			: "";

	return {
		selectedExerciseId,
		setSelectedExerciseId,
		getExerciseLabel,
		currentExerciseName,
	};
};
