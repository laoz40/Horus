import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { animateCreateWorkoutExit } from "@/features/workout-form/lib/animateCreateWorkoutExit";
import type { WorkoutFormData } from "@/features/workout-form/lib/types";
import { parseWorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showWorkoutSavedToast } from "@/lib/toastMessages";

export type WorkoutSubmitMode =
	| { type: "create" }
	| {
			type: "update";
			workoutId: string;
	  };

interface UseWorkoutSubmitProps {
	startedAtMs: number;
	mode: WorkoutSubmitMode;
}

interface UseWorkoutSubmitReturn {
	isSubmitting: boolean;
	submitWorkout: (data: WorkoutFormData) => void;
}

export const useWorkoutSubmit = ({
	startedAtMs,
	mode,
}: UseWorkoutSubmitProps): UseWorkoutSubmitReturn => {
	const router = useRouter();
	const queryClient = useQueryClient();

	const finishWorkoutSave = (workoutName: string) => {
		animateCreateWorkoutExit(() => {
			router.push("/workouts");
		});
		showWorkoutSavedToast(workoutName);
	};

	const createWorkout = useMutation(
		orpc.workouts.create.mutationOptions({
			onSuccess: async (result) => {
				await queryClient.invalidateQueries({
					queryKey: orpc.workouts.list.key({ type: "infinite" }),
				});

				finishWorkoutSave(result.workout.name);
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to save workout.");
					console.error(error);
					return;
				}

				switch (error.code) {
					case "INVALID_INPUT":
						showErrorToast("Invalid workout data.");
						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");
						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to save workouts.");
						router.push("/login");
						return;
					default: {
						const exhaustiveError: never = error;
						return exhaustiveError;
					}
				}
			},
		}),
	);

	const updateWorkout = useMutation(
		orpc.workouts.update.mutationOptions({
			onSuccess: async (result) => {
				// Refresh both cached views so revisiting the edit page or history shows the saved data.
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: orpc.workouts.getById.key({
							type: "query",
							input: { id: result.workoutId },
						}),
					}),
					queryClient.invalidateQueries({
						queryKey: orpc.workouts.list.key({ type: "infinite" }),
					}),
				]);

				finishWorkoutSave(result.workout.name);
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to save workout.");
					console.error(error);
					return;
				}

				switch (error.code) {
					case "INVALID_INPUT":
						showErrorToast("Invalid workout data.");
						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");
						return;
					case "UNAUTHORIZED":
						showErrorToast("You must be signed in to save workouts.");
						router.push("/login");
						return;
					case "NOT_FOUND":
						showErrorToast("Couldn't find workout in the database.");
						router.push("/workouts");
						return;
					default: {
						const exhaustiveError: never = error;
						return exhaustiveError;
					}
				}
			},
		}),
	);

	const submitWorkout = (data: WorkoutFormData) => {
		const durationSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
		const workoutResult = parseWorkoutForSave(data, durationSeconds);

		if (!workoutResult.success) {
			const [firstIssue] = workoutResult.error.issues;
			showErrorToast(firstIssue?.message ?? "Invalid workout data.");
			return;
		}

		switch (mode.type) {
			case "create":
				createWorkout.mutate({ workout: workoutResult.data });
				return;
			case "update":
				updateWorkout.mutate({
					workoutId: mode.workoutId,
					workout: workoutResult.data,
				});
				return;
			default: {
				const exhaustiveMode: never = mode;
				return exhaustiveMode;
			}
		}
	};

	return {
		isSubmitting: createWorkout.isPending || updateWorkout.isPending,
		submitWorkout,
	};
};
