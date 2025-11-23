"use client";

import Link from "next/link";
import { FormEvent, useState, type ReactElement } from "react";
import ExerciseForm, { Exercise } from "./ExerciseForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { currentDateFull } from "@/lib/date";

// TODO: add date and time, use dayjs or some library
// TODO: add duration timer

const workoutObject = {
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
	}

export default function WorkoutForm(): ReactElement {
	const [workoutData, setWorkoutData] = useState(workoutObject);

	const handleAddExercise = () => {
		setWorkoutData((prev) => {
			const newExercise = [
				...prev.exercises,
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
			];
			return { ...prev, exercises: newExercise };
		});
	};

	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (form: FormEvent) => {
		form.preventDefault();
		setSubmitting(true);

		try {
			const postWorkout = await fetch("/api/workouts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(workoutData),
			});

			const result = await postWorkout.json();
			if (result.success) {
				// reset form
				setWorkoutData(workoutObject);
				console.log("Workout saved", result.workout);
				console.log(workoutObject)
			} else {
				console.error("Unsuccessful", result);
			}
		} catch (err) {
			console.error("Failed to submit workout", err);
		}

		setSubmitting(false);
	};

	return (
		<>
			{/* Top Actions */}
			<div className="flex flex-row justify-between p-4 bg-input/50 dark:backdrop-blur-xs">
				<Button
					variant="secondary"
					asChild
					size="sm">
					<Link href="/">Back</Link>
				</Button>
				<Button
					type="submit"
					form="workout-form"
					disabled={submitting}
					size="sm">
					Done
				</Button>
			</div>

			{/* Workout Name */}
			<div className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b bg-input/50 dark:backdrop-blur-xs">
				<Input
					autoFocus
					placeholder="Workout Name"
					value={workoutData.name}
					onChange={(input) =>
						setWorkoutData((prev) => ({ ...prev, name: input.target.value }))
					}
				/>
				<div className="flex flex-row justify-between pl-3 pr-3">
					<span className="text-muted-foreground text-sm">{currentDateFull}</span>
					<span className="text-sm">0:42</span>
				</div>
			</div>

			{/* Exercise Form */}
			<form
				id="workout-form"
				onSubmit={handleSubmit}
				className="flex flex-col grow h-full">
				{workoutData.exercises.map((exerciseData, index) => (
					<ExerciseForm
						key={exerciseData.id}
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
		</>
	);
}
