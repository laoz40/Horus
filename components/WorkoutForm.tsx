"use client";

import Link from "next/link";
import {
	FormEvent,
	useEffect,
	useRef,
	useState,
	type ReactElement,
} from "react";
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Workout, WorkoutSchema } from "@/lib/validateWorkout"
import ExerciseForm from "./ExerciseForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ExerciseFormData, WorkoutFormData } from "@/lib/types";
import { useRouter } from "next/navigation";
import { formatDurationFull } from "@/lib/time";
import { currentDay } from "@/lib/date";

const newExerciseObject = {
	id: crypto.randomUUID(),
	name: "",
	exercise: {
		exerciseId: undefined,
		newExerciseName: "",
	},
	difficulty: null,
	notes: "",
	sets: [
		{
			id: crypto.randomUUID(),
			weight: "",
			reps: "",
		},
	],
};

const newWorkoutObject: WorkoutFormData = {
	name: "",
	durationSeconds: 0,
	exercises: [
		{
			id: crypto.randomUUID(),
			name: "",
			exercise: {
				exerciseId: undefined,
				newExerciseName: "",
			},
			difficulty: null,
			notes: "",
			sets: [
				{
					id: crypto.randomUUID(),
					weight: "",
					reps: "",
				},
			],
		},
	],
};

interface WorkoutFormProps {
	initialData?: WorkoutFormData;
	workoutId?: string;
}

export default function WorkoutForm({
	initialData,
	workoutId,
}: WorkoutFormProps): ReactElement {
	const [workoutData, setWorkoutData] = useState<WorkoutFormData>(
		initialData ? initialData : newWorkoutObject,
	);

	const methods = useForm<Workout>({
	});
	const { register } = methods

	// -----

	// TODO: this should probably save when clicking back button, but idk
	const [durationSeconds, setDurationSeconds] = useState(0);

	useEffect(() => {
		setDurationSeconds(workoutData.durationSeconds ?? 0);
	}, [workoutData.durationSeconds]);

	useEffect(() => {
		const interval = setInterval(() => {
			setDurationSeconds((prev) => prev + 1);
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	// -----

	const handleAddExercise = () => {
		setWorkoutData((prev) => ({
			...prev,
			exercises: [...prev.exercises, newExerciseObject],
		}));

		setScrollTargetId(newExerciseObject.id);
	};

	// -----

	const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
	// attach each exercise form div to the exercise id
	const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		if (scrollTargetId == null) return;

		const scrollTargetElement = exerciseRefs.current[scrollTargetId];
		scrollTargetElement?.scrollIntoView({ behavior: "smooth", block: "end" });

		setScrollTargetId(null);
	}, [scrollTargetId]);

	// -----

	const [submitting, setSubmitting] = useState(false);
	const router = useRouter();

	const handleSubmitOld = async (form: FormEvent) => {
		form.preventDefault();
		setSubmitting(true);

		const payload = {
			...workoutData,
			durationSeconds,
		};

		try {
			const saveMethod = workoutId ? "PATCH" : "POST";
			const apiUrl = workoutId ? `/api/workouts/${workoutId}` : "/api/workouts";

			const saveWorkout = await fetch(apiUrl, {
				method: saveMethod,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const result = await saveWorkout.json();
			if (result.success) {
				router.push("/workouts");
				// reset form
				setWorkoutData(newWorkoutObject);
				console.log(result);
			} else {
				console.log(result);
			}
		} catch (error) {
			console.log("Failed to submit workout", error);
		} finally {
			setSubmitting(false);
		}
	};

	const onSubmit = ( data: any ) => {
		console.log(data)
	}

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
					disabled={submitting}
					size="sm">
					{submitting ? "Saving" : "Done"}
				</Button>
			</div>

			<FormProvider {...methods}>
				<form 
				id="workout-form"
				onSubmit={methods.handleSubmit(onSubmit)}>

			{/* Workout Name */}
			<section className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b bg-input/50 dark:backdrop-blur-xs">
				<Input
					placeholder={`${currentDay} Workout`}
					{...register("name")}
				/>
			</section>

			{/* Exercise Form */}
			<section
				className="flex flex-col flex-1 overflow-y-auto snap-y snap-mandatory">
				{workoutData.exercises.map((exerciseData, exerciseIndex) => (
					<ExerciseForm
						key={exerciseData.id}
						exerciseIndex={exerciseIndex}
						ref={(ExerciseForm) => {
							exerciseRefs.current[exerciseData.id] = ExerciseForm;
						}}
						className="snap-start min-h-full h-full"
						exerciseData={exerciseData}
						setExerciseData={(
							updaterFn: (prev: ExerciseFormData) => ExerciseFormData,
						) => {
							setWorkoutData((prev) => {
								const exercises = [...prev.exercises];
								exercises[exerciseIndex] = updaterFn(exercises[exerciseIndex]);
								return { ...prev, exercises: exercises };
							});
						}}
					/>
				))}
			</section>

			{/* Add Exercise */}
			<div className="flex w-full border-t p-4 bg-input/50 dark:backdrop-blur-xs">
				<Button
					className="flex-1"
					onClick={handleAddExercise}>
					+ Exercise
				</Button>
			</div>
				</form>
			</FormProvider>
		</div>
	);
}
