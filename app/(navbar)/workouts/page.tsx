import { Suspense } from "react";
import HistoryList from "@/features/workout-history/components/HistoryList";
import HistoryPagination from "@/features/workout-history/components/HistoryPagination";
import SearchBar from "@/features/workout-history/components/SearchBar";
import { fetchWorkouts } from "@/features/workout-history/lib/fetchWorkouts";

const workoutsPerPage = 10;

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
			<div className="flex flex-col p-4 gap-1">
				<h1 className="font-semibold">Workout History</h1>
				<SearchBar />
			</div>

			<HistoryList
				key={currentPage}
				workouts={paginatedWorkouts}
			/>

			<Suspense fallback={<div>Loading...</div>}>
				<HistoryPagination
					hasNextPage={hasNextPage}
					className="my-4"
				/>
			</Suspense>
		</>
	);
}
