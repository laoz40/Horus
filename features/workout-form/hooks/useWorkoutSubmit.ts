import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Workout } from "@/features/workout-form/lib/validateWorkout";
import { showErrorToast, showWorkoutSavedToast } from "@/lib/toastMessages";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";

interface UseWorkoutSubmitProps {
	durationSeconds: number;
	workoutId?: string;
}

interface UseWorkoutSubmitReturn {
	submitWorkout: (data: Workout) => Promise<void>;
}

export const useWorkoutSubmit = ({
	durationSeconds,
	workoutId,
}: UseWorkoutSubmitProps): UseWorkoutSubmitReturn => {
	const router = useRouter();
	const createWorkout = useMutation(api.workouts.createWorkout);
	const updateWorkout = useMutation(api.workouts.updateWorkout);

	const submitWorkout = async (data: Workout) => {
		const finalData = { ...data, durationSeconds };
		const workoutInput = JSON.parse(JSON.stringify(finalData));

		try {
			const result = workoutId
				? await updateWorkout({
						workoutId: workoutId as Id<"workouts">,
						workout: workoutInput,
					})
				: await createWorkout({ workout: workoutInput });

			router.push("/workouts");
			showWorkoutSavedToast(result.workout.name);
		} catch (error) {
			// zod validation error (server)
			if (error instanceof ConvexError && error.data?.code === "INVALID_WORKOUT_DATA") {
				// get first error message
				const firstMessage = error.data.issues?.[0]?.message ?? "Invalid workout data.";
				showErrorToast(firstMessage);
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "DB_QUERY_FAILED") {
				showErrorToast("Couldn't access the database. Please try again.");
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "UNAUTHORIZED") {
				showErrorToast("You must be signed in to save workouts.");
				router.push("/sign-in");
				return;
			}

			if (error instanceof ConvexError && error.data?.code === "NO_WORKOUT_FOUND") {
				showErrorToast("Couldn't find workout in the database.");
				router.push("/workouts");
				return;
			}

			// convex schema validation error
			if (error instanceof Error && error.message.includes("ArgumentValidationError")) {
				showErrorToast("Invalid workout data.");
				return;
			}

			showErrorToast("Failed to save workout.");
			console.error(error);
		}
	};

	return { submitWorkout };
};
