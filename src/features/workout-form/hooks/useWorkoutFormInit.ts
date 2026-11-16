import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { WorkoutSchema, type Workout } from "@/features/workout-form/lib/validateWorkout";
import type { WorkoutFormMode } from "@/features/workout-form/components/WorkoutForm";
import { createDefaultWorkoutValues } from "@/features/workout-form/lib/WorkoutFormDefaults";
import { stripEmptyWorkoutEntries } from "@/features/workout-form/lib/stripEmptyWorkoutEntries";
import { showErrorToast } from "@/lib/toastMessages";
import { useRestTimerStore } from "@/features/workout-form/stores/restTimerStore";
import { useWorkoutDraftStore } from "@/features/workout-form/stores/workoutDraftStore";
import { useWorkoutTimerStore } from "@/features/workout-form/stores/workoutTimerStore";
import { useExerciseSelectionStore } from "@/features/workout-form/stores/exerciseSelectionStore";
import { useRecentSetsStore } from "@/features/workout-form/stores/recentSetsStore";

interface UseWorkoutFormInitProps {
	mode: WorkoutFormMode;
	missingGlobalExercisesCount?: number;
}

// Strip fully empty sets/exercises before RHF validation so blank rows don't block submit.
const baseResolver = zodResolver(WorkoutSchema);

const workoutResolver: Resolver<Workout> = (values, context, options) =>
	baseResolver(stripEmptyWorkoutEntries(values), context, options);

export const useWorkoutFormInit = ({
	mode,
	missingGlobalExercisesCount = 0,
}: UseWorkoutFormInitProps) => {
	const restTimerActions = useRestTimerStore((store) => store.actions);
	const workoutTimerActions = useWorkoutTimerStore((store) => store.actions);
	const exerciseActions = useExerciseSelectionStore((store) => store.actions);
	const recentSetsActions = useRecentSetsStore((store) => store.actions);

	// Editing restores the server-loaded workout; a new workout restores the local draft.
	const [startingWorkout] = useState(() => {
		if (mode.kind === "edit") return mode.initialData;

		return useWorkoutDraftStore.getState().draft ?? undefined;
	});

	const initialDurationSeconds = startingWorkout?.durationSeconds ?? 0;

	const methods = useForm<Workout>({
		resolver: workoutResolver,
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: startingWorkout ?? createDefaultWorkoutValues(),
	});

	// Start the timer session on mount and clear form UI state on unmount.
	useEffect(() => {
		workoutTimerActions.start(initialDurationSeconds);
		exerciseActions.reset();
		recentSetsActions.reset();
		restTimerActions.finishRestTimer();

		return () => {
			workoutTimerActions.start();
			exerciseActions.reset();
			recentSetsActions.reset();
			restTimerActions.finishRestTimer();
		};
	}, [
		initialDurationSeconds,
		workoutTimerActions,
		exerciseActions,
		recentSetsActions,
		restTimerActions,
	]);

	// Warn when a loaded workout references exercises that were deleted globally.
	useEffect(() => {
		if (missingGlobalExercisesCount <= 0) return;

		const s = missingGlobalExercisesCount === 1 ? "" : "s";
		showErrorToast(
			`Some exercises in this workout no longer exist. Skipped ${missingGlobalExercisesCount} exercise${s}.`,
		);
	}, [missingGlobalExercisesCount]);

	return { methods, initialDurationSeconds };
};
