"use client";

import { formatDurationFull } from "@/lib/time";
import { WorkoutFormData } from "@/features/workout-form/lib/types";
import {
	Workout,
	WorkoutSchema,
} from "@/features/workout-form/lib/validateWorkout";
import {
	createDefaultExercise,
	createDefaultWorkoutValues,
} from "@/features/workout-form/lib/WorkoutFormDefaults";
import { useWorkoutTimer } from "@/features/workout-form/hooks/useWorkoutTimer";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
	useCallback,
	useEffect,
	type ReactElement,
} from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { showExerciseDeletedToast } from "@/lib/toastMessages";
import ExerciseForm from "./ExerciseForm";
import { Button } from "@/components/ui/button";
import { WorkoutNameDialog } from "./WorkoutNameDialog";
import { PlusIcon } from "lucide-react";
import ExerciseSelector from "./ExerciseSelector";
import { useExerciseNavigation } from "@/features/workout-form/hooks/useExerciseNavigation";
import { useExerciseSelection } from "@/features/workout-form/hooks/useExerciseSelection";
import { useWorkoutSubmit } from "@/features/workout-form/hooks/useWorkoutSubmit";

interface WorkoutFormProps {
	initialData?: WorkoutFormData;
	workoutId?: string;
}

export default function WorkoutForm({
	initialData,
	workoutId,
}: WorkoutFormProps): ReactElement {
	const methods = useForm<Workout>({
		resolver: zodResolver(WorkoutSchema),
		mode: "onSubmit",
		reValidateMode: "onChange",
		defaultValues: createDefaultWorkoutValues(),
	});

	const {
		control,
		watch,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = methods;

	// console.log("form values:", watch());
	// console.log(errors);

	const {
		fields: exercises,
		append,
		remove,
	} = useFieldArray({ name: "exercises", control });

	useEffect(() => {
		if (!initialData) return;
		reset(initialData);
	}, [initialData, reset]);

	// -----

	const { durationSeconds } = useWorkoutTimer({
		initialSeconds: initialData?.durationSeconds ?? 0,
	});

	const exerciseIds = exercises.map((exercise) => exercise.id);

	const handleAddExercise = useCallback(() => {
		append(
			createDefaultExercise(),
			// prevent insta scrolling
			{
				shouldFocus: false,
			},
		);
	}, [append]);

	useEffect(() => {
		if (exercises.length === 0) {
			handleAddExercise();
		}
	}, [exercises.length, handleAddExercise]);

	const handleDeleteExercise = (exerciseIndex: number) => {
		remove(exerciseIndex);
		showExerciseDeletedToast();
	};

	const watchedExercises = watch("exercises");
	const { selectedExerciseId, setSelectedExerciseId, getExerciseLabel, currentExerciseName } =
		useExerciseSelection({ exerciseIds, watchedExercises });

	const { exerciseListRef, registerExerciseRef, setScrollTargetId } = useExerciseNavigation({
		exerciseIds,
		setSelectedExerciseId,
	});

	// -----

	const { submitWorkout } = useWorkoutSubmit({ durationSeconds });

	return (
		<div className="flex flex-col h-svh">
			<FormProvider {...methods}>
				{/* Top Actions */}
				<div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-sidebar dark:bg-sidebar glass:backdrop-blur-xs border-b">
					<div className="max-w-5xl mx-auto px-4 flex flex-row justify-between items-center py-4">
						<Button
							variant="secondary"
							asChild
							size="sm">
							<Link href={workoutId ? "/workouts" : "/"}>Back</Link>
						</Button>
						<span>{formatDurationFull(durationSeconds)}</span>
						<WorkoutNameDialog>
							<Button
								disabled={isSubmitting}
								size="sm">
								{isSubmitting ? "Saving" : "Done"}
							</Button>
						</WorkoutNameDialog>
					</div>
				</div>

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
								ref={(ExerciseForm) => {
									exerciseFormRefs.current[exercise.id] = ExerciseForm;
									if (ExerciseForm)
										ExerciseForm.dataset.exerciseId = exercise.id;
								}}
								className="snap-start min-h-full h-full"
								handleDeleteExercise={() => handleDeleteExercise(exerciseIndex)}
							/>
						))}
					</section>
				</form>

				{/* Add Exercise button and exercise dropdown */}
				{currentExerciseName.length > 0 || exercises.length > 1 ? (
					<div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t bg-sidebar dark:bg-sidebar glass:backdrop-blur-xs">
						<div className="max-w-5xl mx-auto px-4 flex flex-row w-full gap-4 py-4">
							<div className="flex grow items-center justify-start">
								<ExerciseSelector
									exercises={exercises}
									selectedExerciseId={selectedExerciseId}
									getExerciseLabel={getExerciseLabel}
									onValueChange={(value) => {
										setSelectedExerciseId(value);
										setScrollTargetId(value);
									}}
								/>
							</div>
							<Button
								variant="default"
								type="button"
								onClick={handleAddExercise}>
								<PlusIcon />
							</Button>
						</div>
					</div>
				) : null}
			</FormProvider>
		</div>
	);
}
