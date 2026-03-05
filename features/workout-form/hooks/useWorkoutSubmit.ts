import { api } from "@/convex/_generated/api";
import { Workout } from "@/features/workout-form/lib/validateWorkout";
import { showErrorToast, showWorkoutSavedToast } from "@/lib/toastMessages";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";

interface UseWorkoutSubmitProps {
	durationSeconds: number;
}

interface UseWorkoutSubmitReturn {
	submitWorkout: (data: Workout) => Promise<void>;
}

export const useWorkoutSubmit = ({
	durationSeconds,
}: UseWorkoutSubmitProps): UseWorkoutSubmitReturn => {
	const router = useRouter();
	const createWorkout = useMutation(api.workouts.createWorkout);

	const submitWorkout = async (data: Workout) => {
		const finalData = { ...data, durationSeconds };
		const workoutInput = JSON.parse(JSON.stringify(finalData));

		try {
			const result = await createWorkout({ workout: workoutInput });

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
