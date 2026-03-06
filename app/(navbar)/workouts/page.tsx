import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import SearchBar from "@/features/workout-history/components/SearchBar";
import HistoryFeed from "@/features/workout-history/components/HistoryFeed";
import WorkoutRedirectToast from "@/features/workout-history/components/WorkoutRedirectToast";
import { ConvexError } from "convex/values";

const WORKOUTS_PER_PAGE = 10;

export default async function HistoryPage() {
	try {
		const preloadedWorkouts = await preloadQuery(api.workouts.listWorkouts, {
			paginationOpts: {
				cursor: null,
				numItems: WORKOUTS_PER_PAGE,
			},
		});

		return (
			<div className="px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
				<WorkoutRedirectToast />
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
					<SearchBar />
					<HistoryFeed
						preloaded={preloadedWorkouts}
						WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE}
					/>
				</div>
			</div>
		);
	} catch (error) {
		let message = "Unexpected error loading workouts.";

		if (error instanceof ConvexError && error.data?.code === "INVALID_PAGINATION_OPTS") {
			message = "Invalid workout pagination options.";
		}

		if (error instanceof ConvexError && error.data?.code === "DB_QUERY_FAILED") {
			message = "Couldn't load workouts right now. Please try again.";
		}

		return <p className="text-sm text-destructive">{message}</p>;
	}
}
