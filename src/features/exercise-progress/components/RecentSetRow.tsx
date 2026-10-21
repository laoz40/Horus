import type { ReactElement } from "react";

import { setPrLabels, type SetPrType } from "@/features/personal-records/lib/setPr";
import { getRelativeTime } from "@/lib/date";
import { cn } from "@/lib/utils";

interface RecentSetRowProps {
	set: {
		id: string;
		weight: number;
		reps: number;
		completedAtMs: number;
		isPr: boolean;
		prTypes: SetPrType[];
	};
}

export default function RecentSetRow({ set }: RecentSetRowProps): ReactElement {
	const primaryPrType = set.prTypes[0];
	const time = getRelativeTime(new Date(set.completedAtMs));

	return (
		<div className="exercise-set-grid-row">
			<span className={cn(set.isPr && "font-semibold")}>{set.weight}</span>
			<span className={cn(set.isPr && "font-semibold")}>{set.reps}</span>
			<span>
				{primaryPrType !== undefined && (
					<span className="rounded-md border bg-muted px-1.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground">
						{setPrLabels[primaryPrType]}
					</span>
				)}
			</span>
			<span
				className={cn("min-w-0 truncate text-right", set.isPr && "font-semibold")}
				title={time}>
				{time}
			</span>
		</div>
	);
}
