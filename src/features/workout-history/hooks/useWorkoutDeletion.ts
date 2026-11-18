"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/lib/orpc/client";
import { removeDeletedWorkoutsAndInvalidateCache } from "@/lib/orpc/mutationCache";
import type { WorkoutHistoryInfiniteData } from "@/features/workout-history/lib/optimisticHistoryItem";
import { showErrorToast, showWorkoutDeletedToast } from "@/lib/toastMessages";

import {
	useWorkoutDeletionMachine,
	reportDeletionError,
} from "@/features/workout-history/lib/workoutDeletion";

function reportFailure(cause: unknown) {
	showErrorToast("Failed to delete workout.");
	console.error(cause);
}

export function useWorkoutDeletion(workoutId: string) {
	const queryClient = useQueryClient();
	const router = useRouter();

	const machine = useWorkoutDeletionMachine({ remove: () => deletion.mutate({ workoutId }) });

	const deletion = useMutation(
		orpc.workouts.delete.mutationOptions({
			onSettled: () => machine.send({ event: "SETTLED" }),
			onError: (error) => reportDeletionError(error, reportFailure),
			onSuccess: async (data) => {
				router.refresh();
				const queryKey = orpc.workouts.list.key({ type: "infinite" });
				await queryClient.cancelQueries({ queryKey });
				queryClient.setQueriesData<WorkoutHistoryInfiniteData>({ queryKey }, (history) => {
					if (!history) return history;

					return {
						...history,
						pages: history.pages.map((page) => ({
							...page,
							items: page.items.filter((workout) => workout.id !== data.deletedWorkoutId),
						})),
					};
				});
				showWorkoutDeletedToast(data.deletedWorkoutName);
				await removeDeletedWorkoutsAndInvalidateCache(queryClient, {
					kind: "one",
					workoutId: data.deletedWorkoutId,
				});
			},
		}),
	);

	return machine;
}
