"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";

import { WorkoutFormData } from "@/features/workout-form/lib/types";
import { Workout, WorkoutSchema } from "@/features/workout-form/lib/validateWorkout";
import {
	createDefaultExercise,
	createDefaultWorkoutValues,
} from "@/features/workout-form/lib/WorkoutFormDefaults";
import { useWorkoutTimer } from "@/features/workout-form/hooks/useWorkoutTimer";
import { showErrorToast, showExerciseDeletedToast } from "@/lib/toastMessages";

import ExerciseForm from "./ExerciseForm";
import WorkoutFormBottomBar from "./WorkoutFormBottomBar";
import { useExerciseNavigation } from "@/features/workout-form/hooks/useExerciseNavigation";
import { useExerciseSelection } from "@/features/workout-form/hooks/useExerciseSelection";
import { useWorkoutSubmit } from "@/features/workout-form/hooks/useWorkoutSubmit";
import WorkoutFormTopBar from "./WorkoutFormTopBar";

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
	const [isEditingSelectedExercise, setIsEditingSelectedExercise] = useState<boolean>(false);

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

	const { submitWorkout } = useWorkoutSubmit({ durationSeconds, workoutId });

	const exerciseIds = exercises.map((exercise) => exercise.id);
	const { selectedExerciseId, setSelectedExerciseId, selectedExerciseIndex } = useExerciseSelection(
		{ exerciseIds },
	);

	const handleDeleteExercise = useCallback(() => {
		if (selectedExerciseIndex < 0) return;

		remove(selectedExerciseIndex);
		showExerciseDeletedToast();
	}, [remove, selectedExerciseIndex]);

	const handleToggleEdit = useCallback(() => {
		if (!selectedExerciseId) return;

		setIsEditingSelectedExercise(
			(currentIsEditingSelectedExercise) => !currentIsEditingSelectedExercise,
		);
	}, [selectedExerciseId]);

	const { exerciseListRef, registerExerciseRef, setScrollTargetId } = useExerciseNavigation({
		exerciseIds,
		setSelectedExerciseId,
	});

	return (
		<div className="flex flex-col h-dvh">
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
								isEditing={isEditingSelectedExercise && selectedExerciseId === exercise.id}
							/>
						))}
					</section>
				</form>

				<WorkoutFormBottomBar
					show={exercises.length > 0}
					exercises={exercises}
					selectedExerciseId={selectedExerciseId}
					isEditingSelectedExercise={isEditingSelectedExercise}
					onSelectExercise={(value) => {
						setSelectedExerciseId(value);
						setScrollTargetId(value);
					}}
					onAddExercise={handleAddExercise}
					onDeleteExercise={handleDeleteExercise}
					onToggleEdit={handleToggleEdit}
				/>
			</FormProvider>
		</div>
	);
}
