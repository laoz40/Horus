import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { WorkoutSchema, type Workout } from "@/features/workout-form/lib/validateWorkout";
import type { WorkoutFormMode } from "@/features/workout-form/components/WorkoutForm";
import { createDefaultWorkoutValues } from "@/features/workout-form/lib/WorkoutFormDefaults";
import { stripEmptyWorkoutEntries } from "@/features/workout-form/lib/stripEmptyWorkoutEntries";
import { showErrorToast } from "@/lib/toastMessages";
import { useRestTimerStore } from "@/features/workout-form/stores/restTimerStore";
import { useExerciseSelectionStore } from "@/features/workout-form/stores/exerciseSelectionStore";

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
	const sendRestTimer = useRestTimerStore((store) => store.send);
	const sendExercise = useExerciseSelectionStore((store) => store.send);

	const startingWorkout = mode.kind === "edit" ? mode.initialData : undefined;
	const initialDurationSeconds = startingWorkout?.durationSeconds ?? 0;
	const [startedAtMs] = useState(() => Date.now() - Math.max(0, initialDurationSeconds) * 1000);

	const methods = useForm<Workout>({
		resolver: workoutResolver,
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: startingWorkout ?? createDefaultWorkoutValues(),
	});

	// Clear shared form UI state when entering or leaving a workout.
	useEffect(() => {
		sendExercise({ event: "RESET" });
		sendRestTimer({ event: "FINISH_REST_TIMER" });

		return () => {
			sendExercise({ event: "RESET" });
			sendRestTimer({ event: "FINISH_REST_TIMER" });
		};
	}, [sendExercise, sendRestTimer]);

	// Warn when a loaded workout references exercises that were deleted globally.
	useEffect(() => {
		if (missingGlobalExercisesCount <= 0) return;

		const s = missingGlobalExercisesCount === 1 ? "" : "s";
		showErrorToast(
			`Some exercises in this workout no longer exist. Skipped ${missingGlobalExercisesCount} exercise${s}.`,
		);
	}, [missingGlobalExercisesCount]);

	return { methods, initialDurationSeconds, startedAtMs };
};
