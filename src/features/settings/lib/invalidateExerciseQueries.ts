import type { QueryClient } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc/client";

export async function invalidateExerciseQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({
			queryKey: orpc.exercises.list.key(),
		}),
		queryClient.invalidateQueries({
			queryKey: orpc.exercises.listByCategory.key(),
		}),
		queryClient.invalidateQueries({
			queryKey: orpc.exercises.search.key(),
		}),
	]);
}
