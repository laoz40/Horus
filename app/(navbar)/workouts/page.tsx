import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import SearchBar from "@/features/workout-history/components/SearchBar";
import HistoryFeed from "@/features/workout-history/components/HistoryFeed";

const WORKOUTS_PER_PAGE = 1;

export default async function HistoryPage() {
	const preloadedWorkouts = await preloadQuery(api.workouts.listWorkouts, {
		paginationOpts: {
			cursor: null,
			numItems: WORKOUTS_PER_PAGE,
		},
	});

	return (
		<div className="px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
				<SearchBar />
				<HistoryFeed preloaded={preloadedWorkouts} WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE} />
			</div>
		</div>
	);
}
