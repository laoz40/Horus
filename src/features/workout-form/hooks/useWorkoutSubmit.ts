import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useWorkoutPageExit } from "@/lib/workoutPageExit";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import { parseWorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { setCreateWorkoutDraft } from "@/features/workout-form/stores/workoutFormUiStore";
import { invalidateExerciseQueriesInBackground } from "@/features/settings/lib/invalidateExerciseQueries";
import {
	buildOptimisticHistoryFields,
	patchWorkoutInHistoryCache,
	type WorkoutHistoryInfiniteData,
} from "@/features/workout-history/lib/optimisticHistoryItem";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showWorkoutSaveToast } from "@/lib/toastMessages";

type WorkoutSubmitMode =
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
	submitWorkout: (data: Workout) => void;
}

export const useWorkoutSubmit = ({
	startedAtMs,
	mode,
}: UseWorkoutSubmitProps): UseWorkoutSubmitReturn => {
	const router = useRouter();
	const exitWorkoutPage = useWorkoutPageExit();
	const queryClient = useQueryClient();
	const historyListQueryKey = orpc.workouts.list.key({ type: "infinite" });

	const createWorkout = useMutation(
		orpc.workouts.create.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: historyListQueryKey,
					refetchType: "all",
				});

				invalidateExerciseQueriesInBackground(queryClient);
				setCreateWorkoutDraft(null);
			},
			onError: (error) => {
				if (!isDefinedError(error)) {
					console.error(error);
					router.push("/workouts/new");

					return;
				}

				switch (error.code) {
					case "INVALID_INPUT":
					case "DATABASE_ERROR":
						router.push("/workouts/new");

						return;
					case "UNAUTHORIZED":
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
					queryKey: historyListQueryKey,
					refetchType: "all",
				});

				// Refresh cached views in the background after navigating to history.
				void queryClient.invalidateQueries({
					queryKey: orpc.workouts.getById.key({
						type: "query",
						input: { id: result.workoutId },
					}),
				});

				invalidateExerciseQueriesInBackground(queryClient);
			},
			onError: (error, _variables, context) => {
				if (context?.previousHistory !== undefined) {
					queryClient.setQueryData(historyListQueryKey, context.previousHistory);
				}

				if (!isDefinedError(error)) {
					console.error(error);

					return;
				}

				switch (error.code) {
					case "INVALID_INPUT":
					case "DATABASE_ERROR":
						return;
					case "UNAUTHORIZED":
						router.push("/login");

						return;
					case "NOT_FOUND":
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

	const submitWorkout = (data: Workout) => {
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
				showWorkoutSaveToast(createWorkout.mutateAsync({ workout: workoutResult.data }));
				router.push("/workouts");

				return;
			case "update":
				showWorkoutSaveToast(
					updateWorkout.mutateAsync({
						workoutId: mode.workoutId,
						workout: workoutResult.data,
					}),
				);
				exitWorkoutPage("/workouts");

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
