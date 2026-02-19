"use client";

import { useState } from "react";
import WorkoutCard from "@/components/WorkoutCard";
import { WorkoutWithPrData } from "@/lib/types";

export default function HistoryList({
	workouts,
}: {
	workouts: WorkoutWithPrData[];
}) {
	const [localWorkouts, setLocalWorkouts] = useState(workouts);

	const deleteLocalWorkout = (deleteId: string) => {
		setLocalWorkouts((prev) =>
			prev.filter((workout) => workout.id !== deleteId),
		);
	};

	const sortNewest = [...localWorkouts].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	return (
		<>
			{sortNewest.map((workout) => (
				<WorkoutCard
					key={workout.id}
					workout={workout}
					deleteLocalWorkout={deleteLocalWorkout}
				/>
			))}
		</>
	);
}
