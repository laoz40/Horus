"use client";

import { useState } from "react";
import WorkoutCard from "./WorkoutCard";
import { WorkoutHistoryItem } from "@/features/workout-history/lib/types";

export default function HistoryList({
	workouts,
}: {
	workouts: WorkoutHistoryItem[];
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

	return (
		<div className="space-y-4 md:space-y-5">
			{visibleWorkouts.length === 0 ? (
				<div className="border border-border/80 bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground">
					No saved workouts. Try creating one!
				</div>
			) : (
				visibleWorkouts.map((workout, index) => (
					<WorkoutCard
						key={workout._id}
						workout={workout}
						deleteLocalWorkout={deleteLocalWorkout}
						workoutIndex={visibleWorkouts.length - index}
					/>
				))
			)}
		</div>
	);
}
