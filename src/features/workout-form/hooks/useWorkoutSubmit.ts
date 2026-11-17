import { useRef, useState } from "react";
import { isDefinedError } from "@orpc/client";
import { useQueryClient } from "@tanstack/react-query";
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

type WorkoutSubmissionState = { state: "idle" } | { state: "creating" } | { state: "updating" };

type WorkoutSubmissionEvent = { event: "SUBMIT"; workout: Workout };

export const useWorkoutSubmit = ({ startedAtMs, mode }: UseWorkoutSubmitProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const historyListQueryKey = orpc.workouts.list.key({ type: "infinite" });

	const [state, setState] = useState<WorkoutSubmissionState>({ state: "idle" });
	// Block duplicate saves immediately, before React renders the pending state.
	const saveInProgress = useRef(false);

	const send = (event: WorkoutSubmissionEvent) => {
		if (saveInProgress.current) return;

		const workoutResult = parseWorkoutForSave(
			event.workout,
			Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
		);

		if (!workoutResult.success) {
			const [firstIssue] = workoutResult.error.issues;
			showErrorToast(firstIssue?.message ?? "Invalid workout data.");

			return;
		}

		const workout = workoutResult.data;

		saveInProgress.current = true;
		setState({ state: mode.kind === "create" ? "creating" : "updating" });

		async function create() {
			const result = await orpc.workouts.create.call({ workout });
			router.refresh();
			await invalidateWorkoutCache(queryClient);
			router.push("/workouts");

			return result;
		}

		async function update(workoutId: string) {
			let previousHistory: WorkoutHistoryInfiniteData | undefined;

			return queryClient
				.cancelQueries({ queryKey: historyListQueryKey })
				.then(async () => {
					previousHistory =
						queryClient.getQueryData<WorkoutHistoryInfiniteData>(historyListQueryKey);
					const optimisticFields = buildOptimisticHistoryFields(workout);

					queryClient.setQueryData<WorkoutHistoryInfiniteData>(historyListQueryKey, (current) =>
						patchWorkoutInHistoryCache(current, workoutId, optimisticFields),
					);

					const result = await orpc.workouts.update.call({ workoutId, workout });
					router.refresh();
					await invalidateWorkoutCache(queryClient);

					return result;
				})
				.catch((error) => {
					if (previousHistory !== undefined) {
						queryClient.setQueryData(historyListQueryKey, previousHistory);
					}

					if (!isDefinedError(error)) console.error(error);
					else if (error.code === "UNAUTHORIZED") router.push("/login");
					else if (error.code === "NOT_FOUND") router.push("/workouts");

					throw error;
				});
		}

		let request;

		if (mode.kind === "create") request = create();
		else request = update(mode.workoutId);

		showWorkoutSaveToast(
			request.finally(() => {
				saveInProgress.current = false;
				setState({ state: "idle" });
			}),
		);

		if (mode.kind === "edit") router.push("/workouts");
	};

	return { isSubmitting: state.state !== "idle", send };
};
