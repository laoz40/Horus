"use client";

import { useEffect, useMemo, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";

import { WorkoutFormData } from "@/features/workout-form/lib/types";
import { Workout, WorkoutSchema } from "@/features/workout-form/lib/validateWorkout";
import {
	createDefaultExercise,
	createDefaultWorkoutValues,
} from "@/features/workout-form/lib/WorkoutFormDefaults";
import { showErrorToast, showExerciseDeletedToast } from "@/lib/toastMessages";
import {
	useWorkoutFormUiStore,
	selectIsRecentSetsDialogOpen,
	selectRecentSetsExerciseName,
	selectIsRecentSetsLoading,
	selectRecentSetsError,
	selectRecentCompletedSets,
} from "@/features/workout-form/stores/workoutFormUiStore";

import ExerciseForm from "./ExerciseForm";
import WorkoutFormBottomBar from "./WorkoutFormBottomBar";
import { useExerciseNavigation } from "@/features/workout-form/hooks/useExerciseNavigation";
import { useExerciseSelection } from "@/features/workout-form/hooks/useExerciseSelection";
import { useWorkoutSubmit } from "@/features/workout-form/hooks/useWorkoutSubmit";
import WorkoutFormTopBar from "./WorkoutFormTopBar";
import RecentCompletedSetsDialog from "./RecentCompletedSetsDialog";

interface WorkoutFormProps {
	initialData?: WorkoutFormData;
	workoutId?: string;
	missingGlobalExercisesCount?: number;
}

export default function WorkoutForm({
	initialData,
	workoutId,
	missingGlobalExercisesCount = 0,
}: WorkoutFormProps): ReactElement {
	const initializeWorkoutSession = useWorkoutFormUiStore((state) => state.initializeWorkoutSession);
	const resetWorkoutFormUi = useWorkoutFormUiStore((state) => state.resetWorkoutFormUi);
	const isEditing = useWorkoutFormUiStore((state) => state.isEditing);
	const startedAtMs = useWorkoutFormUiStore((state) => state.startedAtMs);
	const isRecentSetsDialogOpen = useWorkoutFormUiStore(selectIsRecentSetsDialogOpen);
	const recentSetsExerciseName = useWorkoutFormUiStore(selectRecentSetsExerciseName);
	const isRecentSetsLoading = useWorkoutFormUiStore(selectIsRecentSetsLoading);
	const recentSetsError = useWorkoutFormUiStore(selectRecentSetsError);
	const recentCompletedSets = useWorkoutFormUiStore(selectRecentCompletedSets);
	const setRecentSetsDialogOpen = useWorkoutFormUiStore(
		(state) => state.setRecentSetsDialogOpen,
	);

	const methods = useForm<Workout>({
		resolver: zodResolver(WorkoutSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: createDefaultWorkoutValues(),
	});

	const {
		handleSubmit,
		formState: { isSubmitting },
		reset,
	} = methods;

	const {
		fields: exercises,
		append,
		remove,
	} = useFieldArray({
		name: "exercises",
		control: methods.control,
	});
	const initialDurationSeconds = initialData?.durationSeconds ?? 0;

	useEffect(() => {
		if (!initialData) return;
		reset(initialData);
	}, [initialData, reset]);

	useEffect(() => {
		initializeWorkoutSession(initialDurationSeconds);

		return () => {
			resetWorkoutFormUi();
		};
	}, [initialDurationSeconds, initializeWorkoutSession, resetWorkoutFormUi]);

	useEffect(() => {
		if (missingGlobalExercisesCount <= 0) return;

		const s = missingGlobalExercisesCount === 1 ? "" : "s";
		showErrorToast(
			`Some exercises in this workout no longer exist. Skipped ${missingGlobalExercisesCount} exercise${s}.`,
		);
	}, [missingGlobalExercisesCount]);

	const handleAddExercise = () => {
		append(
			createDefaultExercise(),
			// prevent insta scrolling
			{ shouldFocus: false },
		);
	};

	useEffect(() => {
		if (exercises.length > 0) return;

		append(
			createDefaultExercise(),
			// prevent insta scrolling
			{ shouldFocus: false },
		);
	}, [append, exercises.length]);

	const { submitWorkout } = useWorkoutSubmit({ startedAtMs, workoutId });

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
					onSubmit={handleSubmit(submitWorkout)}>
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
				<RecentCompletedSetsDialog
					open={isRecentSetsDialogOpen}
					onOpenChange={setRecentSetsDialogOpen}
					exerciseName={recentSetsExerciseName}
					isLoading={isRecentSetsLoading}
					error={recentSetsError}
					sets={recentCompletedSets}
				/>
			</FormProvider>
		</div>
	);
}
