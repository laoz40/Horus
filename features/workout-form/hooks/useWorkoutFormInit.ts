import { useEffect } from "react";
import type { UseFormReset } from "react-hook-form";

import type { WorkoutFormData } from "@/features/workout-form/lib/types";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import { showErrorToast } from "@/lib/toastMessages";
import {
	initializeWorkoutSession,
	resetWorkoutFormUi,
	selectCreateWorkoutDraft,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

interface UseWorkoutFormInitProps {
	reset: UseFormReset<Workout>;
	initialData?: WorkoutFormData;
	workoutId?: string;
	missingGlobalExercisesCount?: number;
}

interface UseWorkoutFormInitReturn {
	initialDurationSeconds: number;
}

export const useWorkoutFormInit = ({
	reset,
	initialData,
	workoutId,
	missingGlobalExercisesCount = 0,
}: UseWorkoutFormInitProps): UseWorkoutFormInitReturn => {
	const createWorkoutDraft = useWorkoutFormUiStore(selectCreateWorkoutDraft);

	// Editing restores the server-loaded workout; a new workout restores the local draft.
	const restoredInitialData = workoutId ? initialData : (createWorkoutDraft ?? undefined);
	const initialDurationSeconds = restoredInitialData?.durationSeconds ?? 0;

	// Restore initial data once it is available.
	useEffect(() => {
		if (!restoredInitialData) return;
		reset(restoredInitialData);
	}, [reset, restoredInitialData]);

	// Start the timer session on mount and clear form UI state on unmount.
	useEffect(() => {
		initializeWorkoutSession(initialDurationSeconds);

		return () => {
			resetWorkoutFormUi();
		};
	}, [initialDurationSeconds]);

	// Warn when a loaded workout references exercises that were deleted globally.
	useEffect(() => {
		if (missingGlobalExercisesCount <= 0) return;

		const s = missingGlobalExercisesCount === 1 ? "" : "s";
		showErrorToast(
			`Some exercises in this workout no longer exist. Skipped ${missingGlobalExercisesCount} exercise${s}.`,
		);
	}, [missingGlobalExercisesCount]);

	return { initialDurationSeconds };
};
