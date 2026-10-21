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

	let selectedExerciseIndex = -1;

	if (selectedExerciseId) {
		selectedExerciseIndex = exerciseIds.findIndex(
			(exerciseId) => exerciseId === selectedExerciseId,
		);
	}

	// Remember the selected position so deleting an exercise keeps the next selection nearby.
	useEffect(() => {
		if (selectedExerciseIndex < 0) return;
		lastKnownSelectedIndexRef.current = selectedExerciseIndex;
	}, [selectedExerciseIndex]);

	// Select a nearby exercise when the current selection is no longer in the list.
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
