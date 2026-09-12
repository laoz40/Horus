import PageLoadingSpinner from "@/components/PageLoadingSpinner";

export default function EditWorkoutLoading() {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<PageLoadingSpinner label="Loading workout" />
		</div>
	);
}
