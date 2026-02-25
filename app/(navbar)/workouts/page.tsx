import HistoryList from "@/features/workout-history/components/HistoryList";
import HistoryPagination from "@/features/workout-history/components/HistoryPagination";
import { fetchWorkouts } from "@/features/workout-history/lib/fetchWorkouts";

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

	const workouts = await fetchWorkouts({
		workoutsPerPage: workoutsPerPage + 1,
		offset,
	});

	const hasNextPage = workouts.length > workoutsPerPage;
	const paginatedWorkouts = workouts.slice(0, workoutsPerPage);

	return (
		<>
			<div className="p-4">
				<h1>Workout History</h1>
			</div>

			<HistoryList workouts={paginatedWorkouts} />

			<HistoryPagination hasNextPage={hasNextPage} />
		</>
	);
}
