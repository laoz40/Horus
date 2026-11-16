import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { WorkoutSchema, type Workout } from "@/features/workout-form/lib/validateWorkout";
import type { WorkoutFormMode } from "@/features/workout-form/components/WorkoutForm";
import { createDefaultWorkoutValues } from "@/features/workout-form/lib/WorkoutFormDefaults";
import { stripEmptyWorkoutEntries } from "@/features/workout-form/lib/stripEmptyWorkoutEntries";
import { useRestTimerStore } from "@/features/workout-form/stores/restTimerStore";
import { useExerciseSelectionStore } from "@/features/workout-form/stores/exerciseSelectionStore";

interface UseWorkoutFormInitProps {
	mode: WorkoutFormMode;
}

// Strip fully empty sets/exercises before RHF validation so blank rows don't block submit.
const baseResolver = zodResolver(WorkoutSchema);

const workoutResolver: Resolver<Workout> = (values, context, options) =>
	baseResolver(stripEmptyWorkoutEntries(values), context, options);

export const useWorkoutFormInit = ({ mode }: UseWorkoutFormInitProps) => {
	const restTimerActions = useRestTimerStore((store) => store.actions);
	const exerciseActions = useExerciseSelectionStore((store) => store.actions);

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
		exerciseActions.reset();
		restTimerActions.finishRestTimer();

		return () => {
			exerciseActions.reset();
			restTimerActions.finishRestTimer();
		};
	}, [exerciseActions, restTimerActions]);

	return { methods, initialDurationSeconds, startedAtMs };
};
