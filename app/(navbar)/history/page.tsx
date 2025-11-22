"use client"

import { useEffect, useState } from "react";
import { WorkoutWithRelations } from "@/lib/types";
import Card from "@/components/Card";

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

	const date = "22 Nov"

	// TODO: Style this ai slop
	// get shadcn card component
	return (
		<>
			<div className="mt-4 ml-4 mr-4">
				<h1>Workout History</h1>
			</div>

			{workouts.map((workout) => (
				<Card key={workout.id}>
					<div className="grid grid-cols-[1fr_min-content]">
						<h2 className="text-base font-bold">{workout.name}</h2>
						<span className="w-fit whitespace-nowrap accent-muted-foreground font-light">{date}</span>
					</div>

					<div className="grid grid-cols-[1fr_min-content]">
						<div className="flex flex-row justify-start gap-4">
							<span>chest</span>
							<span>back</span>
							<span>shoulders</span>
						</div>
						<span className="w-fit whitespace-nowrap">2 PRs</span>
					</div>

					<div className="grid grid-cols-3 mt-4">
						<span>stat</span>
						<span>stat</span>
						<span>stat</span>
					</div>
				</Card>
			))}
		</>
	)

}
