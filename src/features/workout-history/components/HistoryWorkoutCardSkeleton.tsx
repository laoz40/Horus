import Card from "@/components/Card";

interface WorkoutCardSkeletonListProps {
	count: number;
}

function WorkoutCardSkeleton() {
	return (
		<Card className="pointer-events-none cursor-default hover:bg-card">
			<div className="block pt-1">
				<div className="grid grid-cols-[1fr_min-content] items-start gap-x-2">
					<div className="flex min-w-0 flex-col">
						<div className="h-5 w-44 max-w-full animate-pulse rounded-sm bg-muted" />
						<div className="mt-0.5 h-4 w-16 animate-pulse rounded-sm bg-muted" />
					</div>
					<div
						aria-hidden
						className="size-8 shrink-0"
					/>
				</div>

				<div className="mt-2 flex min-h-6 flex-row flex-wrap content-start gap-2">
					<div className="h-4 w-14 animate-pulse rounded-sm bg-muted" />
					<div className="h-4 w-12 animate-pulse rounded-sm bg-muted" />
					<div className="h-4 w-20 animate-pulse rounded-sm bg-muted" />
				</div>

				<div className="mt-0 flex items-center justify-between border-t pt-1">
					<div className="h-4 w-10 animate-pulse rounded-sm bg-muted" />
					<div className="h-4 w-10 animate-pulse rounded-sm bg-muted" />
					<div className="h-4 w-10 animate-pulse rounded-sm bg-muted" />
					<div className="h-4 w-10 animate-pulse rounded-sm bg-muted" />
				</div>
			</div>
		</Card>
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
