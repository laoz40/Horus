"use client";

import { useState } from "react";
import WorkoutCard from "./WorkoutCard";
import { WorkoutWithPrData } from "@/features/workout-history/lib/types";

export default function HistoryList({
	workouts,
}: {
	workouts: WorkoutWithPrData[];
}) {
	const [deletedWorkoutIds, setDeletedWorkoutIds] = useState<Set<string>>(
		new Set(),
	);

	const visibleWorkouts = workouts.filter(
		(workout) => !deletedWorkoutIds.has(workout.id),
	);

	const deleteLocalWorkout = (deleteId: string) => {
		setDeletedWorkoutIds((prev) => new Set(prev).add(deleteId));
	};

	return (
		<div className="space-y-4 md:space-y-5">
			{visibleWorkouts.length === 0 ? (
				<div className="rounded-xl border border-dashed border-border/80 bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground">
					No workouts found for this page.
				</div>
			) : (
				visibleWorkouts.map((workout) => (
					<WorkoutCard
						key={workout.id}
						workout={workout}
						deleteLocalWorkout={deleteLocalWorkout}
					/>
				))
			)}
		</div>
	);
}
