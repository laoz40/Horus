import SearchBar from "@/features/workout-history/components/SearchBar";
import HistoryFeedErrorBoundary from "@/features/workout-history/components/HistoryFeedErrorBoundary";
import WorkoutRedirectToast from "@/features/workout-history/components/WorkoutRedirectToast";

const WORKOUTS_PER_PAGE = 7;

interface HistoryPageProps {
	searchParams: Promise<{ toast?: string | string[] }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
	const resolvedSearchParams = await searchParams;
	const rawToast = resolvedSearchParams.toast;
	const toast = Array.isArray(rawToast) ? rawToast[0] : rawToast;

	return (
		<div className="px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
			<WorkoutRedirectToast toast={toast} />
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
				<SearchBar />
				<HistoryFeedErrorBoundary WORKOUTS_PER_PAGE={WORKOUTS_PER_PAGE} />
			</div>
		</div>
	);
}
