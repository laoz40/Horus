"use client";

import { useMemo, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type FieldErrors, type Resolver } from "react-hook-form";

import type { WorkoutFormData } from "@/features/workout-form/lib/types";
import { getFirstInvalidExerciseIndex } from "@/features/workout-form/lib/checkInvalidExercise";
import { WorkoutSchema, type Workout } from "@/features/workout-form/lib/validateWorkout";
import { createDefaultWorkoutValues } from "@/features/workout-form/lib/WorkoutFormDefaults";
import { stripEmptyWorkoutEntries } from "@/features/workout-form/lib/stripEmptyWorkoutEntries";
import { showExerciseDeletedToast } from "@/lib/toastMessages";
import {
	selectIsRecentSetsDialogOpen,
	selectRecentSetsExerciseName,
	setRecentSetsDialogOpen,
	setScrollTarget,
	useWorkoutFormUiStore,
} from "@/features/workout-form/stores/workoutFormUiStore";
import { useExerciseNavigation } from "@/features/workout-form/hooks/useExerciseNavigation";
import { useExerciseSelection } from "@/features/workout-form/hooks/useExerciseSelection";
import { useWorkoutSubmit } from "@/features/workout-form/hooks/useWorkoutSubmit";
import { useWorkoutExercises } from "@/features/workout-form/hooks/useWorkoutExercises";
import { useWorkoutFormInit } from "@/features/workout-form/hooks/useWorkoutFormInit";

import ExerciseForm from "./ExerciseForm";
import WorkoutFormBottomBar from "./WorkoutFormBottomBar";
import WorkoutFormTopBar from "./WorkoutFormTopBar";
import RecentSetsDialog from "./RecentSetsDialog";

interface WorkoutFormProps {
	initialData?: WorkoutFormData;
	workoutId?: string;
	missingGlobalExercisesCount?: number;
}

// Strip fully empty sets/exercises before RHF validation so blank rows don't block submit.
const baseResolver = zodResolver(WorkoutSchema);
const workoutResolver: Resolver<Workout> = (values, context, options) =>
	baseResolver(stripEmptyWorkoutEntries(values), context, options);

export default function WorkoutForm({
	initialData,
	workoutId,
	missingGlobalExercisesCount,
}: WorkoutFormProps): ReactElement {
	const isEditing = useWorkoutFormUiStore((state) => state.isEditing);
	const startedAtMs = useWorkoutFormUiStore((state) => state.startedAtMs);
	const isRecentSetsDialogOpen = useWorkoutFormUiStore(selectIsRecentSetsDialogOpen);
	const recentSetsExerciseName = useWorkoutFormUiStore(selectRecentSetsExerciseName);

	const methods = useForm<Workout>({
		resolver: workoutResolver,
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: createDefaultWorkoutValues(),
	});

	const { handleSubmit, reset } = methods;

	const { initialDurationSeconds } = useWorkoutFormInit({
		reset,
		initialData,
		workoutId,
		missingGlobalExercisesCount,
	});

	const {
		fields: exercises,
		remove,
		handleAddExercise,
	} = useWorkoutExercises({ control: methods.control });

	const { isSubmitting, submitWorkout } = useWorkoutSubmit({
		startedAtMs,
		mode: workoutId ? { type: "update", workoutId } : { type: "create" },
	});

	const handleInvalidSubmit = (errors: FieldErrors<Workout>) => {
		// find the first invalid exercise
		const firstInvalidExerciseIndex = getFirstInvalidExerciseIndex(errors);
		if (firstInvalidExerciseIndex === null) return;

		// get the first invalid exercise id and scroll to it
		const firstInvalidExerciseId = exercises[firstInvalidExerciseIndex]?.id;
		if (!firstInvalidExerciseId) return;
		setScrollTarget(firstInvalidExerciseId);
	};

	// exercise ids to pass to the exercise selector
	const exerciseIds = useMemo(() => exercises.map((exercise) => exercise.id), [exercises]);
	const { selectedExerciseId, selectedExerciseIndex } = useExerciseSelection({ exerciseIds });

	const handleDeleteExercise = () => {
		if (selectedExerciseIndex < 0) return;

		remove(selectedExerciseIndex);
		showExerciseDeletedToast();
	};

	const { exerciseListRef, registerExerciseRef } = useExerciseNavigation({ exerciseIds });

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<FormProvider {...methods}>
				<WorkoutFormTopBar
					initialDurationSeconds={initialDurationSeconds}
					workoutId={workoutId}
					isSubmitting={isSubmitting}
				/>

				<form
					className="flex min-h-0 flex-1 flex-col overflow-hidden"
					id="workout-form"
					onSubmit={handleSubmit(submitWorkout, handleInvalidSubmit)}>
					{/* Exercise Form */}
					<section
						ref={exerciseListRef}
						className="flex min-h-0 flex-1 flex-col overflow-y-auto snap-y snap-mandatory">
						{exercises.map((exercise, exerciseIndex) => (
							<ExerciseForm
								key={exercise.id}
								exerciseIndex={exerciseIndex}
								ref={(exerciseFormElement) => {
									registerExerciseRef(exercise.id, exerciseFormElement);
								}}
								className="snap-start min-h-full"
								isEditing={isEditing && selectedExerciseId === exercise.id}
							/>
						))}
					</section>
				</form>

				<WorkoutFormBottomBar
					exerciseIds={exerciseIds}
					onAddExercise={handleAddExercise}
					onDeleteExercise={handleDeleteExercise}
				/>
				<RecentSetsDialog
					open={isRecentSetsDialogOpen}
					onOpenChange={setRecentSetsDialogOpen}
					exerciseName={recentSetsExerciseName}
				/>
			</FormProvider>
		</div>
	);
}
