"use client";

import Link from "next/link";
import {
	FormEvent,
	useEffect,
	useRef,
	useState,
	type ReactElement,
} from "react";
import ExerciseForm from "./ExerciseForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ExerciseFormData, WorkoutFormData } from "@/lib/types";
import { useRouter } from "next/navigation";
import { formatDurationFull } from "@/lib/time";
import { currentDay } from "@/lib/date";

const newWorkoutObject: WorkoutFormData = {
	name: "",
	durationSeconds: 0,
	exercises: [
		{
			id: crypto.randomUUID(),
			name: "",
			difficulty: 0,
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

	// -----

	const [durationSeconds, setDurationSeconds] = useState(0);

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
		const newExercise = {
			id: crypto.randomUUID(),
			name: "",
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

		setWorkoutData((prev) => ({
			...prev,
			exercises: [...prev.exercises, newExercise],
		}));

		setScrollTargetId(newExercise.id);
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

	const handleSubmit = async (form: FormEvent) => {
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
				console.log("Success", result);
			} else {
				console.error("Unsuccessful", result);
			}
		} catch (error) {
			console.error("Failed to submit workout", error);
		} finally {
			setSubmitting(false);
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
					disabled={submitting}
					size="sm">
					{submitting ? "Saving" : "Done"}
				</Button>
			</div>

			{/* Workout Name */}
			{/* NOTE: maybe only ask for name in a modal done button is clicked */}
			<section className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b bg-input/50 dark:backdrop-blur-xs">
				<Input
					autoFocus
					placeholder={`${currentDay} Workout`}
					value={workoutData.name}
					onChange={(input) =>
						setWorkoutData((prev) => ({ ...prev, name: input.target.value }))
					}
				/>
			</section>

			{/* Exercise Form */}
			<form
				id="workout-form"
				onSubmit={handleSubmit}
				className="flex flex-col flex-1 overflow-y-auto snap-y snap-mandatory">
				{workoutData.exercises.map((exerciseData, index) => (
					<ExerciseForm
						key={exerciseData.id}
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
								exercises[index] = updaterFn(exercises[index]);
								return { ...prev, exercises: exercises };
							});
						}}
					/>
				))}
			</form>

			{/* Add Exercise */}
			<div className="flex w-full border-t p-4 bg-input/50 dark:backdrop-blur-xs">
				<Button
					className="flex-1"
					onClick={handleAddExercise}>
					+ Exercise
				</Button>
			</div>
		</div>
	);
}
