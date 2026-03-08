interface WorkoutCardSkeletonListProps {
	count: number;
}

export function WorkoutCardSkeleton() {
	return (
		<div className="relative mb-3 cursor-pointer border bg-card px-3 py-2 shadow-xs">
			<div className="grid grid-cols-[1fr_min-content] items-start gap-x-2">
				<div className="flex min-w-0 flex-col">
					<div className="h-2.5 w-20 animate-pulse bg-muted" />
					<div className="mt-2 h-5 w-44 max-w-full animate-pulse bg-muted" />
				</div>
			</div>

			<div className="mt-3 flex flex-row flex-wrap gap-2">
				<div className="h-5 w-16 animate-pulse bg-muted" />
				<div className="h-5 w-20 animate-pulse bg-muted" />
				<div className="h-5 w-14 animate-pulse bg-muted" />
			</div>

			<div className="mt-3 grid grid-cols-4 gap-6">
				<div className="h-5 animate-pulse bg-muted" />
				<div className="h-5 animate-pulse bg-muted" />
				<div className="h-5 animate-pulse bg-muted" />
				<div className="h-5 animate-pulse bg-muted" />
			</div>
		</div>
	);
}

export function WorkoutCardSkeletonList({ count }: WorkoutCardSkeletonListProps) {
	return (
		<div className="space-y-4 md:space-y-5">
			{Array.from({ length: count }, (_, index) => (
				<WorkoutCardSkeleton key={index} />
			))}
		</div>
	);
}
