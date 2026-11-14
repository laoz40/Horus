import { useQuery } from "@tanstack/react-query";
import { useFormContext, useWatch } from "react-hook-form";
import type { Workout } from "@/features/workout-form/lib/validateWorkout";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc/client";

export function useWeightPlaceholder(exerciseIndex: number, exerciseName: string) {
	const { control } = useFormContext<Workout>();
	const { data: session } = authClient.useSession();
	const currentSets = useWatch({ control, name: `exercises.${exerciseIndex}.sets` });

	const recentSetsQuery = useQuery(
		orpc.exercises.recentSets.queryOptions({
			input: { exerciseName: exerciseName.trim() },
			enabled: Boolean(exerciseName.trim()) && Boolean(session?.user),
			staleTime: Number.POSITIVE_INFINITY,
		}),
	);

	const [latestSavedSet] = recentSetsQuery.data ?? [];
	const latestCurrentWeight = currentSets?.findLast((set) => set.weight !== undefined)?.weight;

	return String(latestCurrentWeight ?? latestSavedSet?.weight ?? "kg");
}
