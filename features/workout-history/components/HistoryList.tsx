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
		<>
			{visibleWorkouts.map((workout) => (
				<WorkoutCard
					key={workout.id}
					workout={workout}
					deleteLocalWorkout={deleteLocalWorkout}
				/>
			))}
		</>
	);
}
