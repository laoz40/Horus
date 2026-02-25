"use client";

import { useEffect, useState } from "react";
import WorkoutCard from "./WorkoutCard";
import { WorkoutWithPrData } from "@/features/workout-history/lib/types";

export default function HistoryList({
	workouts,
}: {
	workouts: WorkoutWithPrData[];
}) {
	const [localWorkouts, setLocalWorkouts] = useState(workouts);

	useEffect(() => {
		setLocalWorkouts(workouts);
	}, [workouts]);

	const deleteLocalWorkout = (deleteId: string) => {
		setLocalWorkouts((prev) =>
			prev.filter((workout) => workout.id !== deleteId),
		);
	};


	return (
		<>
			{localWorkouts.map((workout) => (
				<WorkoutCard
					key={workout.id}
					workout={workout}
					deleteLocalWorkout={deleteLocalWorkout}
				/>
			))}
		</>
	);
}
