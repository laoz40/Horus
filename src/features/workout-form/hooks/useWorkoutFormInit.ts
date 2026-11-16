import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { WorkoutSchema, type Workout } from "@/features/workout-form/lib/validateWorkout";
import type { WorkoutFormMode } from "@/features/workout-form/components/WorkoutForm";
import { createDefaultWorkoutValues } from "@/features/workout-form/lib/WorkoutFormDefaults";
import { stripEmptyWorkoutEntries } from "@/features/workout-form/lib/stripEmptyWorkoutEntries";

interface UseWorkoutFormInitProps {
	mode: WorkoutFormMode;
}

// Strip fully empty sets/exercises before RHF validation so blank rows don't block submit.
const baseResolver = zodResolver(WorkoutSchema);

const workoutResolver: Resolver<Workout> = (values, context, options) =>
	baseResolver(stripEmptyWorkoutEntries(values), context, options);

export const useWorkoutFormInit = ({ mode }: UseWorkoutFormInitProps) => {
	const startingWorkout = mode.kind === "edit" ? mode.initialData : undefined;
	const initialDurationSeconds = startingWorkout?.durationSeconds ?? 0;
	const [startedAtMs] = useState(() => Date.now() - Math.max(0, initialDurationSeconds) * 1000);

	const methods = useForm<Workout>({
		resolver: workoutResolver,
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: startingWorkout ?? createDefaultWorkoutValues(),
	});

	return { methods, initialDurationSeconds, startedAtMs };
};
