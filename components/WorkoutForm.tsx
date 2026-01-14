"use client";

import Link from "next/link";
import {
	FormEvent,
	useEffect,
	useRef,
	useState,
	type ReactElement,
} from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Workout, WorkoutSchema } from "@/lib/validateWorkout"
import ExerciseForm from "./ExerciseForm";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { WorkoutFormData } from "@/lib/types";
import { useRouter } from "next/navigation";
import { formatDurationFull } from "@/lib/time";
import { currentDay } from "@/lib/date";

interface WorkoutFormProps {
	initialData?: WorkoutFormData;
	workoutId?: string;
}

export default function WorkoutForm({
	initialData,
	workoutId,
}: WorkoutFormProps): ReactElement {
	const [workoutData, setWorkoutData] = useState<WorkoutFormData>();

	const methods = useForm<Workout>({
		resolver: zodResolver(WorkoutSchema),
		mode: "onSubmit",
		defaultValues: {
			durationSeconds: 0,
			exercises: [
				{
					id: crypto.randomUUID(),
					global: {
						name: "",
					},
					notes: null,
					difficulty: null,
					sets: [{ id: crypto.randomUUID(), weight: null, reps: null }],
				}
			]
		}
	});
	const { register, control, handleSubmit, formState: { errors } } = methods;

	//console.log(errors)
	const { fields, append } = useFieldArray({
		name: "exercises",
		control
	});

	// -----

	// TODO: this should probably save when clicking back button, but idk
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
		append({
			id: crypto.randomUUID(),
			global: {
				name: "",
			},
			notes: null,
			difficulty: null,
			sets: [{ id: crypto.randomUUID(), weight: null, reps: null }],
		});

		// setScrollTargetId(newExerciseObject.id);
	};

	// -----

	const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
	// attach each exercise form div to the exercise id
	const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		if (scrollTargetId == null) return;

		const scrollTargetElement = exerciseRefs.current[scrollTargetId];
		scrollTargetElement?.scrollIntoView({ behavior: "smooth", block: "end" });

	}, [scrollTargetId]);

	// -----

	const [submitting, setSubmitting] = useState(false);
	const router = useRouter();

	const submitWorkout = async ( data: any ) => {
		const finalData = { ...data, durationSeconds };
		console.log(finalData)

		try {
			const saveMethod = workoutId ? "PATCH" : "POST";
			const apiUrl = workoutId ? `/api/workouts/${workoutId}` : "/api/workouts";

			const saveWorkout = await fetch(apiUrl, {
				method: saveMethod,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(finalData),
			});

			const result = await saveWorkout.json();
			if (result.success) {
				router.push("/workouts");
				console.log(result);
			} else {
				console.log(result);
			}
		} catch (error) {
			console.log("Failed to submit workout", error);
		}
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
					<section
						className="flex flex-col flex-1 overflow-y-auto snap-y snap-mandatory">
						{fields.map((exercise, exerciseIndex) => (
							<ExerciseForm
								key={exercise.id}
								exerciseIndex={exerciseIndex}
								ref={(ExerciseForm) => {
									exerciseRefs.current[exercise.id] = ExerciseForm;
								}}
								className="snap-start min-h-full h-full"
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
