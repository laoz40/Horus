import HistoryList from "@/components/HistoryList";
import { calculateWorkoutPrs } from "@/lib/calculateWorkoutStats";
import { db } from "@/lib/prisma";

export default async function HistoryPage() {
	const workouts = await db.workout.findMany({
		include: {
			exercises: {
				include: {
					sets: true,
					globalExercise: true,
				},
			},
		},
	});

	const workoutsWithPrs = calculateWorkoutPrs(workouts);

	return (
		<>
			<div className="p-4">
				<h1>Workout History</h1>
			</div>

			<HistoryList workouts={workoutsWithPrs} />
		</>
	);
}
