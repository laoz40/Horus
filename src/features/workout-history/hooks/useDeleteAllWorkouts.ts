"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/lib/orpc/client";
import { removeDeletedWorkoutsAndInvalidateCache } from "@/lib/orpc/mutationCache";
import { showErrorToast, showWorkoutsDeletedToast } from "@/lib/toastMessages";

import {
	useWorkoutDeletionMachine,
	reportDeletionError,
} from "@/features/workout-history/lib/workoutDeletion";

function reportFailure(cause: unknown) {
	showErrorToast("Failed to delete workouts.");
	console.error(cause);
}

export function useDeleteAllWorkouts() {
	const queryClient = useQueryClient();
	const router = useRouter();

	const machine = useWorkoutDeletionMachine({ remove: () => deletion.mutate({}) });

	const deletion = useMutation(
		orpc.workouts.deleteAll.mutationOptions({
			onSettled: () => machine.send({ event: "SETTLED" }),
			onError: (error) => reportDeletionError(error, reportFailure),
			onSuccess: async (data) => {
				router.refresh();
				showWorkoutsDeletedToast(data.deletedCount);
				await removeDeletedWorkoutsAndInvalidateCache(queryClient, { kind: "all" });
			},
		}),
	);

	return machine;
}
