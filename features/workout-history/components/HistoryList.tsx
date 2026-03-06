"use client";

import { useState } from "react";
import WorkoutCard from "./WorkoutCard";
import type { WorkoutHistoryItem } from "@/features/workout-history/lib/types";

export default function HistoryList({
	workouts,
	isLoading,
}: {
	workouts: WorkoutHistoryItem[];
	isLoading: boolean;
}) {
	const [deletedWorkoutIds, setDeletedWorkoutIds] = useState<Set<string>>(
		new Set(),
	);

	const visibleWorkouts = workouts.filter(
		(workout) => !deletedWorkoutIds.has(workout._id),
	);

	const deleteLocalWorkout = (deleteId: string) => {
		setDeletedWorkoutIds((prev) => new Set(prev).add(deleteId));
	};

	if (visibleWorkouts.length === 0) {
		return (
			<div className="space-y-4 md:space-y-5">
				<div className="border border-border/80 bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground">
					{isLoading
						? "Loading workouts..."
						: "No saved workouts. Try creating one!"}
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
