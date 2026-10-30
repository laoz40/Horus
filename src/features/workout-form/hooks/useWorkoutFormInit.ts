import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { WorkoutSchema, type Workout } from "@/features/workout-form/lib/validateWorkout";
import { createDefaultWorkoutValues } from "@/features/workout-form/lib/WorkoutFormDefaults";
import { stripEmptyWorkoutEntries } from "@/features/workout-form/lib/stripEmptyWorkoutEntries";
import { showErrorToast } from "@/lib/toastMessages";
import {
	initializeWorkoutSession,
	resetWorkoutFormUi,
	selectCreateWorkoutDraft,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";

interface UseWorkoutFormInitProps {
	initialData?: Workout;
	workoutId?: string;
	missingGlobalExercisesCount?: number;
}

// Strip fully empty sets/exercises before RHF validation so blank rows don't block submit.
const baseResolver = zodResolver(WorkoutSchema);

const workoutResolver: Resolver<Workout> = (values, context, options) =>
	baseResolver(stripEmptyWorkoutEntries(values), context, options);

export const useWorkoutFormInit = ({
	initialData,
	workoutId,
	missingGlobalExercisesCount = 0,
}: UseWorkoutFormInitProps) => {
	// Editing restores the server-loaded workout; a new workout restores the local draft.
	const [startingWorkout] = useState(() => {
		if (workoutId) return initialData;

		return selectCreateWorkoutDraft(useWorkoutFormUiStore.getState()) ?? undefined;
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

	return { methods, initialDurationSeconds };
};
