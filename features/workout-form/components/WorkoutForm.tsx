"use client";

import { formatDurationFull } from "@/lib/time";
import { WorkoutFormData } from "@/features/workout-form/lib/types";
import {
	Workout,
	WorkoutSchema,
} from "@/features/workout-form/lib/validateWorkout";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactElement,
} from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import {
	showExerciseDeletedToast,
	showWorkoutSavedToast,
} from "@/lib/toastMessages";
import ExerciseForm from "./ExerciseForm";
import { Button } from "@/components/ui/button";
import { WorkoutNameDialog } from "./WorkoutNameDialog";
import { PlusIcon } from "lucide-react";
import ExerciseSelector from "./ExerciseSelector";

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
						muscleGroups: [],
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
		control,
		watch,
		handleSubmit,
		formState: {
			// errors,
			isSubmitting,
		},
		reset,
	} = methods;

	// console.log("form values:", watch());
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
	}, [initialData, reset]);

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
					muscleGroups: [],
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
		showExerciseDeletedToast();
	};

	// -----

	// attach each exercise form div to the exercise id
	const exerciseFormRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const selectedFormRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (scrollTargetId == null) return;

		const scrollTarget = exerciseFormRefs.current[scrollTargetId];
		scrollTarget?.scrollIntoView({
			behavior: "smooth",
			block: "end",
		});
	}, [scrollTargetId]);

	const watchedExercises = watch("exercises");
	const [selectedExerciseId, setSelectedExerciseId] = useState<
		string | undefined
	>(() => exercises[0]?.id ?? "");

	const setExerciseLabel = (exerciseIndex: number) => {
		const selectLabel = watchedExercises?.[exerciseIndex]?.global?.name?.trim();
		return selectLabel ? selectLabel : "No exercise added";
	};

	useEffect(() => {
		const scrollContainer = selectedFormRef.current;
		if (!scrollContainer) return;

		const observer = new IntersectionObserver(
			(forms) => {
				const visible = forms.filter((form) => form.isIntersecting);
				if (visible.length === 0) return;
				// Sort visible forms by how much is on screen (most visible first), then pick the first one
				const mostVisible = visible.sort(
					(a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
				)[0];
				const id = (mostVisible.target as HTMLElement).dataset.exerciseId;
				if (id) setSelectedExerciseId(id);
			},
			{
				root: scrollContainer,
				rootMargin: "-45% 0px -45% 0px",
				threshold: [0, 0.5, 1],
			},
		);
		Object.values(exerciseFormRefs.current).forEach((form) => {
			if (form) observer.observe(form);
		});
		return () => observer.disconnect();
	}, [exercises.length]);

	const currentExerciseIndex = exercises.findIndex(
		(exercise) => exercise.id === selectedExerciseId,
	);

	const currentExerciseName =
		currentExerciseIndex >= 0
			? watchedExercises?.[currentExerciseIndex]?.global?.name?.trim()
			: "";

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
				showWorkoutSavedToast(result.workout.name);
			} else {
				console.log(result);
			}
		} catch (error) {
			console.log("Failed to submit workout", error);
		}
	};

	return (
		<div className="flex flex-col h-svh">
			<FormProvider {...methods}>
				{/* Top Actions */}
				<div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-input/50 dark:backdrop-blur-xs border-b">
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
						ref={selectedFormRef}
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
					<div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t bg-input/50 dark:backdrop-blur-xs">
						<div className="max-w-5xl mx-auto px-4 flex flex-row w-full gap-4 py-4">
							<div className="flex grow items-center justify-start">
								<ExerciseSelector
									exercises={exercises}
									selectedExerciseId={selectedExerciseId}
									getExerciseLabel={setExerciseLabel}
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
