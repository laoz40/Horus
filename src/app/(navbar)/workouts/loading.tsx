import { WorkoutCardSkeletonList } from "@/features/workout-history/components/HistoryWorkoutCardSkeleton";

const WORKOUTS_PER_PAGE = 7;

export default function HistoryLoading() {
	return (
		<div className="px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
			<div className="mx-auto flex w-full flex-col gap-6 md:gap-8">
				<div className="h-11 w-full animate-pulse rounded-md bg-muted" />
				<WorkoutCardSkeletonList count={WORKOUTS_PER_PAGE} />
			</div>
		</div>
	);
}
