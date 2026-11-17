"use client";

import { safe } from "@orpc/client";
import { useQueryClient } from "@tanstack/react-query";
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

	async function remove() {
		const result = await safe(orpc.workouts.deleteAll.call({}));

		if (result.error) {
			reportDeletionError(result.error, reportFailure);

			return;
		}

		const data = result.data;

		router.refresh();
		showWorkoutsDeletedToast(data.deletedCount);
		await removeDeletedWorkoutsAndInvalidateCache(queryClient, { kind: "all" });
	}

	return useWorkoutDeletionMachine({ remove, onError: reportFailure });
}
