"use client"

import { useEffect, useState } from "react";
import { WorkoutWithRelations } from "@/lib/types";
import WorkoutCard from "@/components/WorkoutCard";

export default function HistoryPage() {
	const [workouts, setWorkouts] = useState<WorkoutWithRelations[]>([]);

	useEffect(() => {
		const fetchWorkouts = async () => {
			const response = await fetch("/api/workouts");
			const result = await response.json();

			if (result.success) {
				setWorkouts(result.getWorkouts as WorkoutWithRelations[])
			}
		};
		fetchWorkouts()
	}, []);

	// TODO: make components for stats and muscle group tags
	return (
		<>
			<div className="p-4">
				<h1>Workout History</h1>
			</div>

			{/* sorts by newest first */}
			{[...workouts].
				sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).
				map((workout) => (
					<WorkoutCard key={workout.id} {...workout}/>
			))}
		</>
	)

}
