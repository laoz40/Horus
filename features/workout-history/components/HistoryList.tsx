"use client";

import { useState } from "react";
import WorkoutCard from "./WorkoutCard";
import { WorkoutCardSkeletonList } from "./HistoryWorkoutCardSkeleton";
import type { WorkoutHistoryItem } from "@/features/workout-history/lib/types";

export default function HistoryList({
	workouts,
	isLoading,
	WORKOUTS_PER_PAGE,
}: {
	workouts: WorkoutHistoryItem[];
	isLoading: boolean;
	WORKOUTS_PER_PAGE: number;
}) {
	const [deletedWorkoutIds, setDeletedWorkoutIds] = useState<Set<string>>(new Set());

	const visibleWorkouts = workouts.filter((workout) => !deletedWorkoutIds.has(workout._id));

	const deleteLocalWorkout = (deleteId: string) => {
		setDeletedWorkoutIds((prev) => new Set(prev).add(deleteId));
	};

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
			{visibleWorkouts.map((workout, index) => (
				<WorkoutCard
					key={workout._id}
					workout={workout}
					deleteLocalWorkout={deleteLocalWorkout}
					workoutIndex={visibleWorkouts.length - index}
				/>
			))}
		</div>
	);
}
