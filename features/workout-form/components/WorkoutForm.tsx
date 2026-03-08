"use client";

import { WorkoutFormData } from "@/features/workout-form/lib/types";
import { Workout, WorkoutSchema } from "@/features/workout-form/lib/validateWorkout";
import {
	createDefaultExercise,
	createDefaultWorkoutValues,
} from "@/features/workout-form/lib/WorkoutFormDefaults";
import { useWorkoutTimer } from "@/features/workout-form/hooks/useWorkoutTimer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, type ReactElement } from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { showErrorToast, showExerciseDeletedToast } from "@/lib/toastMessages";
import ExerciseForm from "./ExerciseForm";
import WorkoutFormTopBar from "./WorkoutFormTopBar";
import WorkoutFormBottomBar from "./WorkoutFormBottomBar";
import { useExerciseNavigation } from "@/features/workout-form/hooks/useExerciseNavigation";
import { useExerciseSelection } from "@/features/workout-form/hooks/useExerciseSelection";
import { useWorkoutSubmit } from "@/features/workout-form/hooks/useWorkoutSubmit";

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
	const methods = useForm<Workout>({
		resolver: zodResolver(WorkoutSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: createDefaultWorkoutValues(),
	});

	const {
		control,
		handleSubmit,
		formState: { isSubmitting },
		reset,
	} = methods;

	const { fields: exercises, append, remove } = useFieldArray({ name: "exercises", control });

	useEffect(() => {
		if (!initialData) return;
		reset(initialData);
	}, [initialData, reset]);

	useEffect(() => {
		if (missingGlobalExercisesCount <= 0) return;

		const s = missingGlobalExercisesCount === 1 ? "" : "s";
		showErrorToast(
			`Some exercises in this workout no longer exist. Skipped ${missingGlobalExercisesCount} exercise${s}.`,
		);
	}, [missingGlobalExercisesCount]);

	const { durationSeconds } = useWorkoutTimer({
		initialSeconds: initialData?.durationSeconds ?? 0,
	});

	const handleAddExercise = useCallback(() => {
		append(
			createDefaultExercise(),
			// prevent insta scrolling
			{ shouldFocus: false },
		);
	}, [append]);

	useEffect(() => {
		if (exercises.length === 0) handleAddExercise();
	}, [exercises.length, handleAddExercise]);

	const handleDeleteExercise = useCallback((exerciseIndex: number) => {
		remove(exerciseIndex);
		showExerciseDeletedToast();
	}, [remove]);

	const { submitWorkout } = useWorkoutSubmit({ durationSeconds, workoutId });

	const exerciseIds = exercises.map((exercise) => exercise.id);
	const { selectedExerciseId, setSelectedExerciseId, selectedExerciseIndex } =
		useExerciseSelection({ exerciseIds });
	const selectedExerciseIndexForWatch = selectedExerciseIndex >= 0 ? selectedExerciseIndex : 0;

	const selectedExerciseName = useWatch({
		control,
		name: `exercises.${selectedExerciseIndexForWatch}.global.name` as const,
	}) as string | undefined;

	const { exerciseListRef, registerExerciseRef, setScrollTargetId } = useExerciseNavigation({
		exerciseIds,
		setSelectedExerciseId,
	});

	const showBottomActions = (selectedExerciseName?.trim().length ?? 0) > 0 || exercises.length > 1;

	return (
		<div className="flex flex-col h-svh">
			<FormProvider {...methods}>
				<WorkoutFormTopBar
					workoutId={workoutId}
					durationSeconds={durationSeconds}
					isSubmitting={isSubmitting}
				/>

				<form
					className="flex flex-col h-full overflow-y-auto"
					id="workout-form"
					onSubmit={handleSubmit(submitWorkout)}>
					{/* Exercise Form */}
					<section
						ref={exerciseListRef}
						className="flex flex-col flex-1 overflow-y-auto snap-y snap-mandatory">
						{exercises.map((exercise, exerciseIndex) => (
							<ExerciseForm
								key={exercise.id}
								exerciseIndex={exerciseIndex}
								ref={(exerciseFormElement) => {
									registerExerciseRef(exercise.id, exerciseFormElement);
								}}
								className="snap-start min-h-full h-full"
								onDeleteExercise={handleDeleteExercise}
							/>
						))}
					</section>
				</form>

				<WorkoutFormBottomBar
					show={showBottomActions}
					exercises={exercises}
					selectedExerciseId={selectedExerciseId}
					onSelectExercise={(value) => {
						setSelectedExerciseId(value);
						setScrollTargetId(value);
					}}
					onAddExercise={handleAddExercise}
				/>
			</FormProvider>
		</div>
	);
}
