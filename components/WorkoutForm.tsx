"use client";

import { currentDay } from "@/lib/date";
import { formatDurationFull } from "@/lib/time";
import { WorkoutFormData } from "@/lib/types";
import { Workout, WorkoutSchema } from "@/lib/validateWorkout";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import ExerciseForm from "./ExerciseForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
		defaultValues: {
			name: "",
			durationSeconds: 0,
			exercises: [
				{
					id: crypto.randomUUID(),
					global: {
						name: "",
					},
					notes: undefined,
					difficulty: undefined,
					sets: [
						{
							id: crypto.randomUUID(),
							weight: undefined,
							reps: undefined,
							completed: false,
						},
					],
				},
			],
		},
	});

	const {
		register,
		control,
		// watch,
		handleSubmit,
		formState: {
			// errors,
			isSubmitting,
		},
		reset,
	} = methods;

	// const formValues = watch();
	//
	// useEffect(() => {
	// 	console.log("form values:", formValues);
	// }, [formValues]);

	// console.log(errors);
	const {
		fields: exercises,
		append,
		remove,
	} = useFieldArray({
		name: "exercises",
		control,
	});

	useEffect(() => {
		if (!initialData) return;
		reset(initialData);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// -----

	// NOTE: this should probably save when clicking back button, but idk
	const [durationSeconds, setDurationSeconds] = useState(
		initialData?.durationSeconds ?? 0,
	);

	useEffect(() => {
		const interval = setInterval(() => {
			setDurationSeconds((prev) => prev + 1);
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	// -----

	const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
	const [previousExercisesLength, setPreviousExercisesLength] = useState(
		exercises.length,
	);

	const handleAddExercise = useCallback(() => {
		append(
			{
				id: crypto.randomUUID(),
				global: {
					name: "",
				},
				notes: undefined,
				difficulty: undefined,
				sets: [
					{
						id: crypto.randomUUID(),
						weight: undefined,
						reps: undefined,
						completed: false,
					},
				],
			},
			// prevent insta scrolling
			{
				shouldFocus: false,
			},
		);
	}, [append]);

	useEffect(() => {
		const newExerciseAdded =
			exercises.length > previousExercisesLength && exercises.length > 0;
		if (newExerciseAdded) {
			const latestExerciseId = exercises[exercises.length - 1]?.id;
			if (latestExerciseId) {
				setScrollTargetId(latestExerciseId);
			}
		}
		setPreviousExercisesLength(exercises.length);
	}, [exercises, previousExercisesLength]);

	useEffect(() => {
		if (exercises.length === 0) {
			handleAddExercise();
		}
	}, [exercises.length, handleAddExercise]);

	const handleDeleteExercise = (exerciseIndex: number) => {
		remove(exerciseIndex);
		toast.info("Exercise deleted", {
			position: "top-center",
			action: {
				// TODO: undo delete
				label: "Undo",
				onClick: () => toast.dismiss(),
			},
			actionButtonStyle: {
				background: "var(--muted)",
				color: "var(--muted-foreground)",
			},
		});
	};

	// -----

	// attach each exercise form div to the exercise id
	const exerciseFormDivRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		if (scrollTargetId == null) return;

		const scrollTarget = exerciseFormDivRefs.current[scrollTargetId];
		scrollTarget?.scrollIntoView({
			behavior: "smooth",
			block: "end",
		});
	}, [scrollTargetId]);

	// -----

	const router = useRouter();

	const submitWorkout = async (data: any) => {
		const finalData = { ...data, durationSeconds };

		try {
			const apiUrl = workoutId ? `/api/workouts/${workoutId}` : "/api/workouts";
			const saveWorkout = await fetch(apiUrl, {
				method: workoutId ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(finalData),
			});

			const result = await saveWorkout.json();
			if (result.success) {
				router.push("/workouts");
				// TODO: use promise toast instead to show loading state
				toast.success(`Saved ${result.workout.name}`, {
					position: "top-center",
					action: {
						label: "Dismiss",
						onClick: () => toast.dismiss(),
						actionButtonStyle: {},
					},
					actionButtonStyle: {
						background: "var(--muted)",
						color: "var(--muted-foreground)",
					},
				});
			} else {
				console.log(result);
			}
		} catch (error) {
			console.log("Failed to submit workout", error);
		}
	};

	return (
		<div className="flex flex-col h-svh">
			{/* Top Actions */}
			<div className="flex flex-row justify-between items-center p-4 bg-input/50 dark:backdrop-blur-xs">
				<Button
					variant="secondary"
					asChild
					size="sm">
					<Link href={workoutId ? "/workouts" : "/"}>Back</Link>
				</Button>
				<span>{formatDurationFull(durationSeconds)}</span>
				<Button
					type="submit"
					form="workout-form"
					disabled={isSubmitting}
					size="sm">
					{isSubmitting ? "Saving" : "Done"}
				</Button>
			</div>

			<FormProvider {...methods}>
				<form
					className="flex flex-col h-full overflow-y-auto"
					id="workout-form"
					onSubmit={handleSubmit(submitWorkout)}>
					{/* Workout Name */}
					<section className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b bg-input/50 dark:backdrop-blur-xs">
						<Input
							placeholder={`${currentDay} Workout`}
							{...register("name")}
						/>
					</section>

					{/* Exercise Form */}
					<section className="flex flex-col flex-1 overflow-y-auto snap-y snap-mandatory">
						{exercises.map((exercise, exerciseIndex) => (
							<ExerciseForm
								key={exercise.id}
								exerciseIndex={exerciseIndex}
								ref={(ExerciseForm) => {
									exerciseFormDivRefs.current[exercise.id] = ExerciseForm;
								}}
								className="snap-start min-h-full h-full"
								handleDeleteExercise={() => handleDeleteExercise(exerciseIndex)}
							/>
						))}
					</section>

					{/* Add Exercise */}
					<div className="flex w-full border-t p-4 bg-input/50 dark:backdrop-blur-xs">
						<Button
							className="flex-1"
							type="button"
							onClick={handleAddExercise}>
							+ Exercise
						</Button>
					</div>
				</form>
			</FormProvider>
		</div>
	);
}
