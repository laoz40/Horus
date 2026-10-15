import { isDefinedError } from "@orpc/client";
import { Match } from "effect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useWorkoutPageExit } from "@/lib/workoutPageExit";
import type { WorkoutFormData } from "@/features/workout-form/lib/types";
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
	submitWorkout: (data: WorkoutFormData) => void;
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

				Match.value(error).pipe(
					Match.when({ code: "INVALID_INPUT" }, () => router.push("/workouts/new")),
					Match.when({ code: "DATABASE_ERROR" }, () => router.push("/workouts/new")),
					Match.when({ code: "UNAUTHORIZED" }, () => router.push("/login")),
					Match.exhaustive,
				);
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

				Match.value(error).pipe(
					Match.when({ code: "INVALID_INPUT" }, () => undefined),
					Match.when({ code: "DATABASE_ERROR" }, () => undefined),
					Match.when({ code: "UNAUTHORIZED" }, () => router.push("/login")),
					Match.when({ code: "NOT_FOUND" }, () => router.push("/workouts")),
					Match.exhaustive,
				);
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

		Match.value(mode).pipe(
			Match.when({ type: "create" }, () => {
				setCreateWorkoutDraft(workoutResult.data);
				showWorkoutSaveToast(createWorkout.mutateAsync({ workout: workoutResult.data }));
				router.push("/workouts");
			}),
			Match.when({ type: "update" }, (updateMode) => {
				showWorkoutSaveToast(
					updateWorkout.mutateAsync({
						workoutId: updateMode.workoutId,
						workout: workoutResult.data,
					}),
				);
				exitWorkoutPage("/workouts");
			}),
			Match.exhaustive,
		);
	};

	return {
		isSubmitting: createWorkout.isPending || updateWorkout.isPending,
		submitWorkout,
	};
};
