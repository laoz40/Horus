import HistoryList from "@/features/workout-history/components/HistoryList";
import HistoryPagination from "@/features/workout-history/components/HistoryPagination";
import { countWorkouts, fetchWorkouts } from "@/features/workout-history/lib/fetchWorkouts";

const workoutsPerPage = 2;

interface WorkoutHistoryPageProps {
	searchParams: Promise<{
		page?: string | undefined;
	}>;
}

export default async function HistoryPage({
	searchParams,
}: WorkoutHistoryPageProps) {
	const { page } = await searchParams;

	const currentPage = page ? parseInt(page) : 1;
	const offset = workoutsPerPage * (currentPage - 1);
	const workoutsCount = await countWorkouts();

	const workouts = await fetchWorkouts({
		pageSize: workoutsPerPage,
		offset: offset,
	});

	const pageCount = Math.ceil(workoutsCount / workoutsPerPage);

	return (
		<>
			<div className="p-4">
				<h1>Workout History</h1>
			</div>

			<HistoryList workouts={workouts} />

			<HistoryPagination pageCount={pageCount} />
		</>
	);
}
