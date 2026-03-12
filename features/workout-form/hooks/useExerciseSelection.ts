import { useEffect, useState } from "react";

interface UseExerciseSelectionProps {
	exerciseIds: string[];
}

interface UseExerciseSelectionReturn {
	selectedExerciseId?: string;
	setSelectedExerciseId: (exerciseId: string) => void;
	selectedExerciseIndex: number;
}

export const useExerciseSelection = ({
	exerciseIds,
}: UseExerciseSelectionProps): UseExerciseSelectionReturn => {
	const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>(
		() => exerciseIds[0],
	);

	useEffect(() => {
		if (selectedExerciseId && exerciseIds.includes(selectedExerciseId)) return;
		setSelectedExerciseId(exerciseIds[0]);
	}, [exerciseIds, selectedExerciseId]);

	const selectedExerciseIndex = exerciseIds.findIndex(
		(exerciseId) => exerciseId === selectedExerciseId,
	);

	return {
		selectedExerciseId,
		setSelectedExerciseId,
		selectedExerciseIndex,
	};
};
