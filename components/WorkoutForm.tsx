"use client";

import Link from "next/link";
import {
	FormEvent,
	useEffect,
	useRef,
	useState,
	type ReactElement,
} from "react";
import ExerciseForm, { Exercise } from "./ExerciseForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { currentDateFull } from "@/lib/date";
import { WorkoutFormData } from "@/lib/types";
import { useRouter } from "next/navigation";

// TODO: add duration timer

const newWorkoutObject = {
	name: "",
	exercises: [
		{
			id: crypto.randomUUID(),
			name: "",
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

	const handleAddExercise = () => {
		const newExercise = {
			id: crypto.randomUUID(),
			name: "",
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

	const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
	// attach each exercise form div to the exercise id
	const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		if (scrollTargetId == null) return;

		const scrollTargetElement = exerciseRefs.current[scrollTargetId];
		scrollTargetElement?.scrollIntoView({ behavior: "smooth", block: "end" });

		setScrollTargetId(null);
	}, [scrollTargetId]);

	const [submitting, setSubmitting] = useState(false);
	const router = useRouter();
	const handleSubmit = async (form: FormEvent) => {
		form.preventDefault();
		setSubmitting(true);

		try {
			const saveMethod = workoutId ? "PATCH" : "POST";
			const apiUrl = workoutId ? `/api/workouts/${workoutId}` : "/api/workouts";

			const saveWorkout = await fetch(apiUrl, {
				method: saveMethod,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(workoutData),
			});

			const result = await saveWorkout.json();
			if (result.success) {
				// reset form
				setWorkoutData(newWorkoutObject);
				console.log("Workout saved", result.workout);
			} else {
				console.error("Unsuccessful", result);
			}
		} catch (err) {
			console.error("Failed to submit workout", err);
		} finally {
			setSubmitting(false);
			router.push("/workouts");
		}
	};

	return (
		<div className="flex flex-col h-svh">
			{/* Top Actions */}
			<div className="flex flex-row justify-between p-4 bg-input/50 dark:backdrop-blur-xs">
				<Button
					variant="secondary"
					asChild
					size="sm">
					<Link href={workoutId ? "/workouts" : "/"}>Back</Link>
				</Button>
				<Button
					type="submit"
					form="workout-form"
					disabled={submitting}
					size="sm">
					{submitting ? "Saving" : "Done"}
				</Button>
			</div>

			{/* Workout Name */}
			<section className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b bg-input/50 dark:backdrop-blur-xs">
				<Input
					autoFocus
					placeholder="Workout Name"
					value={workoutData.name}
					onChange={(input) =>
						setWorkoutData((prev) => ({ ...prev, name: input.target.value }))
					}
				/>
				<div className="flex flex-row justify-between pl-3 pr-3">
					<span className="text-muted-foreground text-sm">
						{currentDateFull}
					</span>
					<span className="text-sm">0:42</span>
				</div>
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
						setExerciseData={(updaterFn: (prev: Exercise) => Exercise) => {
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
