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
		<div className="px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
				<SearchBar />

				<HistoryList
					key={currentPage}
					workouts={paginatedWorkouts}
				/>

				<Suspense
					fallback={
						<div className="text-center text-sm text-muted-foreground">
							Loading pages...
						</div>
					}>
					<HistoryPagination
						hasNextPage={hasNextPage}
						className="mt-1"
					/>
				</Suspense>
			</div>
		</div>
	);
}
