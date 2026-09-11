export default function WorkoutViewSkeleton() {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="ios-safe-area-top relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-b bg-sidebar dark:bg-sidebar">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
					<div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
					<div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
				</div>
			</div>

			<div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
				<div className="flex flex-col gap-2">
					<div className="h-8 w-48 animate-pulse rounded bg-muted" />
					<div className="h-4 w-20 animate-pulse rounded bg-muted" />
					<div className="mt-2 h-10 w-full animate-pulse rounded bg-muted" />
				</div>

				<div className="flex flex-col gap-4">
					<div className="h-32 animate-pulse rounded-md bg-muted" />
					<div className="h-32 animate-pulse rounded-md bg-muted" />
				</div>
			</div>
		</div>
	);
}
