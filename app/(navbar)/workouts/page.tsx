import HistoryList from "@/features/workout-history/components/HistoryList";
import HistoryPagination from "@/features/workout-history/components/HistoryPagination";
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

	return (
		<>
			<div className="p-4">
				<h1>Workout History</h1>
			</div>

			<HistoryList workouts={workouts} />
		</>
	);
}
