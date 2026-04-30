import { useEffect, useRef } from "react";

import {
	selectSelectedExerciseId,
	selectExercise,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

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
	const selectedExerciseId = useWorkoutFormUiStore(selectSelectedExerciseId);
	const lastKnownSelectedIndexRef = useRef<number>(0);

	const selectedExerciseIndex = selectedExerciseId
		? exerciseIds.findIndex((exerciseId) => exerciseId === selectedExerciseId)
		: -1;

	useEffect(() => {
		if (selectedExerciseIndex < 0) return;
		lastKnownSelectedIndexRef.current = selectedExerciseIndex;
	}, [selectedExerciseIndex]);

	useEffect(() => {
		if (selectedExerciseId && exerciseIds.includes(selectedExerciseId)) return;
		if (exerciseIds.length === 0) {
			selectExercise(null);
			return;
		}

		const nextIndex = Math.min(lastKnownSelectedIndexRef.current, exerciseIds.length - 1);
		selectExercise(exerciseIds[nextIndex] ?? null);
	}, [exerciseIds, selectedExerciseId]);

	return {
		selectedExerciseId: selectedExerciseId ?? undefined,
		setSelectedExerciseId: (exerciseId) => {
			selectExercise(exerciseId);
		},
		selectedExerciseIndex,
	};
};
