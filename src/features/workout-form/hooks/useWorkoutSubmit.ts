import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { animateCreateWorkoutExit } from "@/features/workout-form/lib/animateCreateWorkoutExit";
import type { WorkoutFormData } from "@/features/workout-form/lib/types";
import { parseWorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { setCreateWorkoutDraft } from "@/features/workout-form/stores/workoutFormUiStore";
import {
	buildOptimisticHistoryFields,
	patchWorkoutInHistoryCache,
	type WorkoutHistoryInfiniteData,
} from "@/features/workout-history/lib/optimisticHistoryItem";
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
	const historyListQueryKey = orpc.workouts.list.key({ type: "infinite" });

	const createWorkout = useMutation(
		orpc.workouts.create.mutationOptions({
			onSuccess: async (result) => {
				await queryClient.invalidateQueries({
					queryKey: orpc.workouts.list.key({ type: "infinite" }),
				});

				setCreateWorkoutDraft(null);
				showWorkoutSavedToast(result.workout.name);
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					showErrorToast("Failed to save workout.");
					console.error(error);
					router.push("/workouts/new");
					return;
				}

				switch (error.code) {
					case "INVALID_INPUT":
						showErrorToast("Invalid workout data.");
						router.push("/workouts/new");
						return;
					case "DATABASE_ERROR":
						showErrorToast("Couldn't access the database. Please try again.");
						router.push("/workouts/new");
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
			onMutate: async (variables) => {
				await queryClient.cancelQueries({ queryKey: historyListQueryKey });

				const previousHistory =
					queryClient.getQueryData<WorkoutHistoryInfiniteData>(historyListQueryKey);
				const optimisticFields = buildOptimisticHistoryFields(variables.workout);

				queryClient.setQueryData<WorkoutHistoryInfiniteData>(historyListQueryKey, (current) =>
					patchWorkoutInHistoryCache(current, variables.workoutId, optimisticFields),
				);

				return { previousHistory };
			},
			onSuccess: async (result) => {
				// Keep the history pending state until refreshed list data (incl. PRs) lands.
				await queryClient.invalidateQueries({
					queryKey: orpc.workouts.list.key({ type: "infinite" }),
				});

				// Refresh cached views in the background after navigating to history.
				void queryClient.invalidateQueries({
					queryKey: orpc.workouts.getById.key({
						type: "query",
						input: { id: result.workoutId },
					}),
				});

				showWorkoutSavedToast(result.workout.name);
			},
			onError: (error, _variables, context) => {
				if (context?.previousHistory !== undefined) {
					queryClient.setQueryData(historyListQueryKey, context.previousHistory);
				}

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
				setCreateWorkoutDraft(workoutResult.data);
				createWorkout.mutate({ workout: workoutResult.data });
				// TODO: The history feed has no optimistic UI yet, so this redirect can
				// briefly land on a stale list until the invalidation refetch lands.
				router.push("/workouts");
				return;
			case "update":
				updateWorkout.mutate({
					workoutId: mode.workoutId,
					workout: workoutResult.data,
				});
				animateCreateWorkoutExit(() => {
					router.push("/workouts");
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
