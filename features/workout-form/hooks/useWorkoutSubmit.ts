import { api } from "@/convex/_generated/api";
import { Workout } from "@/features/workout-form/lib/validateWorkout";
import { showWorkoutSavedToast } from "@/lib/toastMessages";
import { useMutation } from "convex/react";
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

		try {
			const workoutInput = JSON.parse(JSON.stringify(finalData));
			const result = await createWorkout({ workout: workoutInput });

			if (result.success && result.workout) {
				router.push("/workouts");
				showWorkoutSavedToast(result.workout.name);
			} else {
				console.log(result);
			}
		} catch (error) {
			console.log("Failed to submit workout", error);
		}
	};

	return { submitWorkout };
};
