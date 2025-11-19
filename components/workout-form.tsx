"use client";

import Link from "next/link";
import { FormEvent, useState, type ReactElement } from "react";
import ExerciseForm from "./exercise-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function WorkoutForm(): ReactElement {
	const [exerciseData, setExerciseData] = useState({
		name: "",
		sets: [
			{
				weight: "",
				reps: "",
			},
		],
		//		difficulty: 0,
		//		notes: "",
	});

	const handleSubmit = (form: FormEvent) => {
		form.preventDefault();
		console.log("Workout submitted", exerciseData);
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
				className="flex flex-row grow h-full">
				<ExerciseForm
					exerciseData={exerciseData}
					setExerciseData={setExerciseData}
				/>
			</form>

			{/* Add Exercise */}
			<div className="flex w-full border-t p-4 bg-input/50 dark:backdrop-blur-xs">
				<Button className="flex-1">+ Exercise</Button>
			</div>
		</>
	);
}
