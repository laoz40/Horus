import { useRef } from "react";
import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import type { WorkoutFormMode } from "@/features/workout-form/components/WorkoutForm";
import { parseWorkoutForSave } from "@/features/workout-form/lib/validateWorkout";
import { invalidateWorkoutCache } from "@/lib/orpc/mutationCache";
import {
	buildOptimisticHistoryFields,
	patchWorkoutInHistoryCache,
	type WorkoutHistoryInfiniteData,
} from "@/features/workout-history/lib/optimisticHistoryItem";
import { orpc } from "@/lib/orpc/client";
import { showErrorToast, showWorkoutSaveToast } from "@/lib/toastMessages";

interface UseWorkoutSubmitProps {
	startedAtMs: number;
	mode: WorkoutFormMode;
}

type WorkoutSubmissionEvent = { event: "SUBMIT"; workout: Workout };

export const useWorkoutSubmit = ({ startedAtMs, mode }: UseWorkoutSubmitProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const historyListQueryKey = orpc.workouts.list.key({ type: "infinite" });

	const createWorkout = useMutation(
		orpc.workouts.create.mutationOptions({
			onSuccess: async () => {
				router.refresh();
				await invalidateWorkoutCache(queryClient);
				router.push("/workouts");
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
			onSuccess: () => {
				router.refresh();

				return invalidateWorkoutCache(queryClient);
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

	const saveInProgress = useRef(false);

	const send = (event: WorkoutSubmissionEvent) => {
		if (saveInProgress.current) return;

		const durationSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
		const workoutResult = parseWorkoutForSave(event.workout, durationSeconds);

		if (!workoutResult.success) {
			const [firstIssue] = workoutResult.error.issues;
			showErrorToast(firstIssue?.message ?? "Invalid workout data.");

			return;
		}

		saveInProgress.current = true;

		let saveRequest;

		if (mode.kind === "create") {
			saveRequest = createWorkout.mutateAsync({ workout: workoutResult.data });
		} else {
			saveRequest = updateWorkout.mutateAsync({
				workoutId: mode.workoutId,
				workout: workoutResult.data,
			});
		}

		const trackedRequest = saveRequest.finally(() => {
			saveInProgress.current = false;
		});

		showWorkoutSaveToast(trackedRequest);

		if (mode.kind === "edit") router.push("/workouts");
	};

	return {
		isSubmitting: createWorkout.isPending || updateWorkout.isPending,
		send,
	};
};
