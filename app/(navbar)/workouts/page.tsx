import HistoryList from "@/components/HistoryList";
import { db } from "@/lib/prisma";

export default async function HistoryPage() {
	const getWorkouts = await db.workout.findMany({
		include: {
			exercises: {
				include: {
					sets: true,
					globalExercise: true,
				},
			},
		},
	});

	return (
		<>
			<div className="p-4">
				<h1>Workout History</h1>
			</div>

			<HistoryList workouts={getWorkouts} />
		</>
	);
}
