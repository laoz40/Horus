"use client";

import { useEffect } from "react";

import type { WorkoutHistoryItem } from "@/features/workout-history/lib/types";
import {
	clearDeletedWorkoutIds,
	selectDeletedWorkoutIds,
	useHistoryUiStore,
} from "@/features/workout-history/stores/historyUiStore";

import WorkoutCard from "./WorkoutCard";
import { WorkoutCardSkeletonList } from "./HistoryWorkoutCardSkeleton";

export default function HistoryList({
	workouts,
	isLoading,
	WORKOUTS_PER_PAGE,
}: {
	workouts: WorkoutHistoryItem[];
	isLoading: boolean;
	WORKOUTS_PER_PAGE: number;
}) {
	const deletedWorkoutIds = useHistoryUiStore(selectDeletedWorkoutIds);

	useEffect(() => {
		clearDeletedWorkoutIds();

		return () => {
			clearDeletedWorkoutIds();
		};
	}, []);

	const visibleWorkouts = workouts.filter((workout) => !deletedWorkoutIds.has(workout._id));

	if (visibleWorkouts.length === 0) {
		if (isLoading) {
			return <WorkoutCardSkeletonList count={WORKOUTS_PER_PAGE} />;
		}

		return (
			<div className="space-y-4 md:space-y-5">
				<div className="border border-border/80 bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground">
					No saved workouts. Try creating one!
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-5">
			{visibleWorkouts.map((workout) => (
				<WorkoutCard
					key={workout._id}
					workout={workout}
				/>
			))}
		</div>
	);
}
