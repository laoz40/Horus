"use client";

import Link from "next/link";
import { FormEvent, useState, type ReactElement } from "react";
import ExerciseForm, { Exercise } from "./ExerciseForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function WorkoutForm(): ReactElement {
	const [workoutData, setWorkoutData] = useState({
		name: "",
		// TODO: date, duration
		exercises: [
			{
				name: "",
				sets: [
					{
						weight: "",
						reps: "",
						id: crypto.randomUUID(),
					},
				],
				id: crypto.randomUUID(),
			},
		],
	});

	const handleAddExercise = () => {
		setWorkoutData((prev) => {
			const newExercise = [
				...prev.exercises,
				{
					name: "",
					sets: [
						{
							weight: "",
							reps: "",
							id: crypto.randomUUID(),
						},
					],
					id: crypto.randomUUID(),
				},
			];
			return { ...prev, exercises: newExercise };
		});
		console.log("exercise added");
	};

	const handleSubmit = (form: FormEvent) => {
		form.preventDefault();
		console.log("Workout submitted", workoutData);
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
					size="sm">
					Done
				</Button>
			</div>

			{/* Workout Name */}
			<div className="flex flex-col gap-1 pl-4 pr-4 pb-4 border-b bg-input/50 dark:backdrop-blur-xs">
				<Input
					autoFocus
					placeholder="Workout Name"
					onChange={(input) =>
						setWorkoutData((prev) => ({ ...prev, name: input.target.value }))
					}
				/>
				<div className="flex flex-row justify-between pl-3 pr-3">
					<span className="text-muted-foreground text-sm">14. Nov 2025</span>
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
