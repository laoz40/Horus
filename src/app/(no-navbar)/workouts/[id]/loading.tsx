import PageLoadingSpinner from "@/components/PageLoadingSpinner";

export default function ViewWorkoutLoading() {
	return (
		<div className="create-workout-page page-slide-up flex min-h-0 flex-1 flex-col">
			<PageLoadingSpinner label="Loading workout" />
		</div>
	);
}
