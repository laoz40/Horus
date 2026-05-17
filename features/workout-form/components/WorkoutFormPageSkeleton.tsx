export default function WorkoutFormPageSkeleton() {
	return (
		<div className="create-workout-page page-slide-up flex flex-col h-dvh">
			<div className="ios-safe-area-top relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-sidebar dark:bg-sidebar border-b">
				<div className="max-w-5xl mx-auto px-4 flex items-center justify-between py-4">
					<div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
					<div className="h-5 w-20 animate-pulse rounded bg-muted" />
					<div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
				</div>
			</div>

			<div className="flex flex-col flex-1 overflow-hidden">
				<div className="flex flex-col flex-1 gap-5 p-4">
					<div className="flex items-center gap-2">
						<div className="h-11 flex-1 animate-pulse rounded-md bg-muted" />
						<div className="size-11 animate-pulse rounded-md bg-muted" />
					</div>

					<div className="flex flex-col gap-3">
						<div className="h-56 animate-pulse rounded-md bg-muted" />
					</div>

					<div className="mt-auto">
						<div className="h-24 animate-pulse rounded-md bg-muted" />
					</div>
				</div>
			</div>

			<div className="ios-safe-area-bottom relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t bg-sidebar dark:bg-sidebar">
				<div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4">
					<div className="h-10 w-full animate-pulse rounded-md bg-muted" />
					<div className="flex gap-3">
						<div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
						<div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
					</div>
				</div>
			</div>
		</div>
	);
}
