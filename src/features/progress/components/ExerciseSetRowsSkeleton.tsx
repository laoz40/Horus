import type { ReactElement } from "react";

export default function ExerciseSetRowsSkeleton(): ReactElement {
	return (
		<div className="flex flex-col">
			{Array.from({ length: 4 }, (_, index) => (
				<div
					key={index}
					className="exercise-set-grid-row">
					<div className="h-4 w-8 animate-pulse rounded-sm bg-muted" />
					<div className="h-4 w-8 animate-pulse rounded-sm bg-muted" />
					<div />
					<div className="ml-auto h-4 w-24 animate-pulse rounded-sm bg-muted" />
				</div>
			))}
		</div>
	);
}
