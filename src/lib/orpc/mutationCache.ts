import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/client";

function refreshWorkoutDerivedData(queryClient: QueryClient) {
	void Promise.all([
		// Workout changes affect exercise usage counts, recent sets, and progress records.
		queryClient.invalidateQueries({ queryKey: orpc.exercises.key() }),
		// Completed sets determine the dashboard heatmap and available training years.
		queryClient.invalidateQueries({ queryKey: orpc.dashboard.key() }),
		// Invalidate all workout details because recalculated PR badges can affect other workouts.
		queryClient.invalidateQueries({ queryKey: orpc.workouts.getById.key() }),
	]);
}

export async function invalidateWorkoutCache(queryClient: QueryClient) {
	refreshWorkoutDerivedData(queryClient);

	// Refetch cached history lists so "Saved" waits for updated summaries and PR totals.
	await queryClient.invalidateQueries({
		queryKey: orpc.workouts.list.key({ type: "infinite" }),
		refetchType: "all",
	});
}

export async function removeDeletedWorkoutsAndInvalidateCache(
	queryClient: QueryClient,
	deleted: { kind: "one"; workoutId: string } | { kind: "all" },
) {
	let queryKey: QueryKey = orpc.workouts.getById.key();

	if (deleted.kind === "one") {
		queryKey = orpc.workouts.getById.key({ type: "query", input: { id: deleted.workoutId } });
	}

	// Cancel pending detail fetches before removing deleted workouts from the cache.
	await queryClient.cancelQueries({ queryKey });
	queryClient.removeQueries({ queryKey });
	refreshWorkoutDerivedData(queryClient);

	// Refresh history to remove deleted workouts and update remaining workouts' PR totals.
	await queryClient.invalidateQueries({
		queryKey: orpc.workouts.list.key({ type: "infinite" }),
	});
}

export function invalidateExerciseCache(
	queryClient: QueryClient,
	change: { kind: "catalog" } | { kind: "merge" },
) {
	// Refresh exercise lists, search, and progress to reflect catalog changes or merged sets.
	void queryClient.invalidateQueries({ queryKey: orpc.exercises.key() });
	// Invalidate workout details so renamed exercises and changed muscle groups appear.
	void queryClient.invalidateQueries({ queryKey: orpc.workouts.getById.key() });

	if (change.kind === "merge") {
		// Merging exercises recalculates the PR totals displayed in history.
		void queryClient.invalidateQueries({ queryKey: orpc.workouts.list.key() });
	}
}
