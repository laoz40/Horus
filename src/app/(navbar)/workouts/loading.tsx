import PageLoadingSpinner from "@/components/PageLoadingSpinner";

export default function HistoryLoading() {
	return (
		<div className="px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
			<div className="mx-auto flex w-full flex-col gap-6 md:gap-8">
				<PageLoadingSpinner
					label="Loading workouts"
					className="min-h-48"
				/>
			</div>
		</div>
	);
}
