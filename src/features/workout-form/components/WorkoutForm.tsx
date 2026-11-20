"use client";

import { useStore } from "zustand";

import { useState, type ReactElement } from "react";
import { FormProvider, type FieldErrors } from "react-hook-form";

import { getFirstInvalidExerciseIndex } from "@/features/workout-form/lib/checkInvalidExercise";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import { showExerciseDeletedToast } from "@/lib/toastMessages";
import {
	selectSelectedExerciseId,
	createExerciseSelectionStore,
} from "@/features/workout-form/stores/exerciseSelectionStore";
import { createRestTimerStore } from "@/features/workout-form/stores/restTimerStore";
import { useExerciseNavigation } from "@/features/workout-form/hooks/useExerciseNavigation";
import { useWorkoutSubmit } from "@/features/workout-form/hooks/useWorkoutSubmit";
import { useWorkoutExercises } from "@/features/workout-form/hooks/useWorkoutExercises";
import { useWorkoutFormInit } from "@/features/workout-form/hooks/useWorkoutFormInit";

import ExerciseForm from "@/features/workout-form/components/ExerciseForm";
import WorkoutFormBottomBar from "@/features/workout-form/components/WorkoutFormBottomBar";
import WorkoutFormTopBar from "@/features/workout-form/components/WorkoutFormTopBar";
import RecentSetsDialog from "@/features/workout-form/components/RecentSetsDialog";
import RestTimerButton from "@/features/workout-form/components/RestTimerButton";

export type WorkoutFormMode =
	| { kind: "create" }
	| { kind: "edit"; workoutId: string; initialData: Workout };

interface WorkoutFormProps {
	mode: WorkoutFormMode;
}

export default function WorkoutForm({ mode }: WorkoutFormProps): ReactElement {
	const [exerciseSelectionStore] = useState(createExerciseSelectionStore);
	const [restTimerStore] = useState(createRestTimerStore);

	const [recentSetsDialog, setRecentSetsDialog] = useState<{
		state: "closed" | "open";
		exerciseName: string;
	}>({ state: "closed", exerciseName: "" });

	const isEditing = useStore(exerciseSelectionStore, (store) => store.state.type === "editing");

	// Leaving the form stops reminders as well as discarding its store.
	const [formRef] = useState(() => (element: HTMLDivElement | null) => {
		if (element) return () => restTimerStore.getState().send({ event: "FINISH_REST_TIMER" });
	});

	const { methods, initialDurationSeconds, startedAtMs } = useWorkoutFormInit({
		mode,
	});

	const {
		fields: exercises,
		remove,
		handleAddExercise,
	} = useWorkoutExercises({ control: methods.control });

	const { isSubmitting, send } = useWorkoutSubmit({ startedAtMs, mode });

	const { exerciseListRef, registerExerciseRef, scrollToExercise, scrollToExerciseOnMount } =
		useExerciseNavigation({ exerciseSelectionStore });

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

	const selectedExerciseId = useStore(exerciseSelectionStore, (state) =>
		selectSelectedExerciseId(state, exerciseIds),
	);

	const handleDeleteExercise = () => {
		const selectedExerciseIndex = exerciseIds.findIndex((id) => id === selectedExerciseId);

		if (selectedExerciseIndex < 0) return;

		remove(selectedExerciseIndex);

		const nextExerciseId =
			exerciseIds[selectedExerciseIndex + 1] ?? exerciseIds[selectedExerciseIndex - 1] ?? null;

		exerciseSelectionStore.getState().send({
			event: "SELECT_EXERCISE_AFTER_DELETION",
			exerciseId: nextExerciseId,
		});
		showExerciseDeletedToast();
	};

	const handleAddAndScroll = () => {
		scrollToExerciseOnMount(exercises.length);
		handleAddExercise();
	};

	return (
		<div
			ref={formRef}
			className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<RestTimerButton restTimerStore={restTimerStore} />
			<FormProvider {...methods}>
				<WorkoutFormTopBar
					initialDurationSeconds={initialDurationSeconds}
					startedAtMs={startedAtMs}
					mode={mode.kind}
					isSubmitting={isSubmitting}
					onInvalidSubmit={handleInvalidSubmit}
				/>

				<form
					className="flex min-h-0 flex-1 flex-col overflow-hidden"
					id="workout-form"
					onSubmit={methods.handleSubmit(
						(workout) => send({ event: "SUBMIT", workout }),
						handleInvalidSubmit,
					)}>
					{/* Exercise Form */}
					<section
						ref={exerciseListRef}
						className="flex min-h-0 flex-1 snap-y snap-mandatory flex-col overflow-y-auto">
						{exercises.map((exercise, exerciseIndex) => (
							<ExerciseForm
								restTimerStore={restTimerStore}
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
					exerciseSelectionStore={exerciseSelectionStore}
					exerciseIds={exerciseIds}
					onAddExercise={handleAddAndScroll}
					onDeleteExercise={handleDeleteExercise}
					onScrollToExercise={scrollToExercise}
					onShowRecentSets={(exerciseName) => setRecentSetsDialog({ state: "open", exerciseName })}
				/>
				<RecentSetsDialog
					open={recentSetsDialog.state === "open"}
					exerciseName={recentSetsDialog.exerciseName}
					onOpenChange={(open) =>
						setRecentSetsDialog((dialog) => ({
							...dialog,
							state: open ? "open" : "closed",
						}))
					}
				/>
			</FormProvider>
		</div>
	);
}
