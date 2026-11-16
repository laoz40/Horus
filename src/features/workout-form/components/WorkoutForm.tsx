"use client";

import type { ReactElement } from "react";
import { FormProvider, type FieldErrors } from "react-hook-form";

import { getFirstInvalidExerciseIndex } from "@/features/workout-form/lib/checkInvalidExercise";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import { showExerciseDeletedToast } from "@/lib/toastMessages";
import {
	selectSelectedExerciseId,
	useExerciseSelectionStore,
} from "@/features/workout-form/stores/exerciseSelectionStore";
import { useWorkoutTimerStore } from "@/features/workout-form/stores/workoutTimerStore";
import { useExerciseNavigation } from "@/features/workout-form/hooks/useExerciseNavigation";
import { useWorkoutSubmit } from "@/features/workout-form/hooks/useWorkoutSubmit";
import { useWorkoutExercises } from "@/features/workout-form/hooks/useWorkoutExercises";
import { useWorkoutFormInit } from "@/features/workout-form/hooks/useWorkoutFormInit";

import ExerciseForm from "@/features/workout-form/components/ExerciseForm";
import WorkoutFormBottomBar from "@/features/workout-form/components/WorkoutFormBottomBar";
import WorkoutFormTopBar from "@/features/workout-form/components/WorkoutFormTopBar";
import RecentSetsDialog from "@/features/workout-form/components/RecentSetsDialog";

export type WorkoutFormMode =
	| { kind: "create" }
	| { kind: "edit"; workoutId: string; initialData: Workout };

interface WorkoutFormProps {
	mode: WorkoutFormMode;
	missingGlobalExercisesCount?: number;
}

export default function WorkoutForm({
	mode,
	missingGlobalExercisesCount,
}: WorkoutFormProps): ReactElement {
	const isEditing = useExerciseSelectionStore(
		(store) => store.exerciseSelection.state === "editing",
	);

	const exerciseActions = useExerciseSelectionStore((store) => store.actions);
	const startedAtMs = useWorkoutTimerStore((store) => store.startedAtMs);

	const { methods, initialDurationSeconds } = useWorkoutFormInit({
		mode,
		missingGlobalExercisesCount,
	});

	const { handleSubmit } = methods;

	const {
		fields: exercises,
		remove,
		handleAddExercise,
	} = useWorkoutExercises({ control: methods.control });

	const { isSubmitting, submitWorkout } = useWorkoutSubmit({ startedAtMs, mode });

	const { exerciseListRef, registerExerciseRef, scrollToExercise, scrollToExerciseOnMount } =
		useExerciseNavigation();

	const handleInvalidSubmit = (errors: FieldErrors<Workout>) => {
		// find the first invalid exercise
		const firstInvalidExerciseIndex = getFirstInvalidExerciseIndex(errors);

		if (firstInvalidExerciseIndex === null) return;

		// get the first invalid exercise id and scroll to it
		const firstInvalidExerciseId = exercises[firstInvalidExerciseIndex]?.id;

		if (!firstInvalidExerciseId) return;
		scrollToExercise(firstInvalidExerciseId);
	};

	// exercise ids to pass to the exercise selector
	const exerciseIds = exercises.map((exercise) => exercise.id);

	const selectedExerciseId = useExerciseSelectionStore((state) =>
		selectSelectedExerciseId(state, exerciseIds),
	);

	const handleDeleteExercise = () => {
		const selectedExerciseIndex = exerciseIds.findIndex((id) => id === selectedExerciseId);

		if (selectedExerciseIndex < 0) return;

		remove(selectedExerciseIndex);

		const nextExerciseId =
			exerciseIds[selectedExerciseIndex + 1] ?? exerciseIds[selectedExerciseIndex - 1] ?? null;

		exerciseActions.selectExerciseAfterDeletion(nextExerciseId);
		showExerciseDeletedToast();
	};

	const handleAddAndScroll = () => {
		scrollToExerciseOnMount(exercises.length);
		handleAddExercise();
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<FormProvider {...methods}>
				<WorkoutFormTopBar
					initialDurationSeconds={initialDurationSeconds}
					mode={mode.kind}
					isSubmitting={isSubmitting}
					onInvalidSubmit={handleInvalidSubmit}
				/>

				<form
					className="flex min-h-0 flex-1 flex-col overflow-hidden"
					id="workout-form"
					onSubmit={handleSubmit(submitWorkout, handleInvalidSubmit)}>
					{/* Exercise Form */}
					<section
						ref={exerciseListRef}
						className="flex min-h-0 flex-1 snap-y snap-mandatory flex-col overflow-y-auto">
						{exercises.map((exercise, exerciseIndex) => (
							<ExerciseForm
								key={exercise.id}
								exerciseIndex={exerciseIndex}
								ref={(exerciseFormElement) => {
									registerExerciseRef(exercise.id, exerciseIndex, exerciseFormElement);
								}}
								className="min-h-full snap-start"
								isEditing={isEditing && selectedExerciseId === exercise.id}
							/>
						))}
					</section>
				</form>

				<WorkoutFormBottomBar
					exerciseIds={exerciseIds}
					onAddExercise={handleAddAndScroll}
					onDeleteExercise={handleDeleteExercise}
					onScrollToExercise={scrollToExercise}
				/>
				<RecentSetsDialog />
			</FormProvider>
		</div>
	);
}
