"use client";

import type { WorkoutHistoryItem } from "@/features/workout-history/lib/optimisticHistoryItem";

import WorkoutCard from "@/features/workout-history/components/WorkoutCard";
import { WorkoutCardSkeletonList } from "@/features/workout-history/components/HistoryWorkoutCardSkeleton";

export default function HistoryList({
	workouts,
	isLoading,
	WORKOUTS_PER_PAGE,
	isPrPending,
}: {
	workouts: WorkoutHistoryItem[];
	isLoading: boolean;
	WORKOUTS_PER_PAGE: number;
	isPrPending: boolean;
}) {
	if (workouts.length === 0) {
		if (isLoading) {
			return <WorkoutCardSkeletonList count={WORKOUTS_PER_PAGE} />;
		}

		return (
			<div className="space-y-4 md:space-y-5">
				<div className="border border-border/80 bg-card px-5 py-10 text-center text-sm text-muted-foreground">
					No saved workouts. Try creating one!
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-5">
			{workouts.map((workout) => (
				<WorkoutCard
					key={workout.id}
					workout={workout}
					isPrPending={isPrPending}
				/>
			))}
		</div>
	);
}
