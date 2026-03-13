import { fetchQuery } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { redirect } from "next/navigation";
import { getToken } from "@/lib/auth-server";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import WorkoutForm from "@/features/workout-form/components/WorkoutForm";
import type { WorkoutFormData } from "@/features/workout-form/lib/types";

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
	const [{ id }, token] = await Promise.all([params, getToken()]);
	const workoutId = id as Id<"workouts">;

	if (token === null) {
		redirect("/login");
	}

	try {
		const workout = await fetchQuery(api.workouts.getWorkoutById, {
			workoutId,
		}, { token });

		const formData: WorkoutFormData = {
			name: workout.name,
			durationSeconds: workout.durationSeconds,
			exercises: workout.exercises.map((exercise) => ({
				id: exercise.id,
				global: {
					name: exercise.global.name,
					muscleGroups: exercise.global.muscleGroups,
				},
				difficulty: exercise.difficulty,
				notes: exercise.notes,
				sets: exercise.sets,
			})),
		};

		return (
			<>
				<WorkoutForm
					initialData={formData}
					workoutId={id}
					missingGlobalExercisesCount={workout.missingGlobalExercisesCount}
				/>
			</>
		);
	} catch (error) {
		if (error instanceof ConvexError && error.data?.code === "NO_WORKOUT_FOUND") {
			redirect("/workouts?toast=edit_not_found");
		}

		if (error instanceof ConvexError && error.data?.code === "DB_QUERY_FAILED") {
			redirect("/workouts?toast=edit_db_failed");
		}

		if (error instanceof ConvexError && error.data?.code === "UNAUTHORIZED") {
			redirect("/login");
		}

		console.error("Unexpected error loading workout for edit page:", error);
		redirect("/workouts?toast=edit_unexpected");
	}
}
