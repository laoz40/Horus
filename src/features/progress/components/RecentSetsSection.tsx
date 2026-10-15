"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import ExerciseSetRowsSkeleton from "@/features/progress/components/ExerciseSetRowsSkeleton";
import { orpcQueryErrorMessage } from "@/features/progress/lib/orpcQueryErrorMessage";
import { setPrLabels } from "@/features/workout-form/lib/setPr";
import { getRelativeTime } from "@/lib/date";
import { orpc } from "@/lib/orpc/client";
import { cn } from "@/lib/utils";

interface RecentSetsSectionProps {
	exerciseName: string;
}

function RecentSetsContent({ exerciseName }: RecentSetsSectionProps): ReactElement {
	const recentSetsQuery = useQuery(
		orpc.exercises.recentSets.queryOptions({
			input: { exerciseName },
			enabled: exerciseName.length > 0,
			staleTime: Number.POSITIVE_INFINITY,
		}),
	);

	const queryError = recentSetsQuery.error instanceof Error ? recentSetsQuery.error : null;

	const errorMessage = orpcQueryErrorMessage(
		recentSetsQuery.isError,
		queryError,
		"Couldn't load recent sets.",
	);

	if (recentSetsQuery.isLoading) {
		return <ExerciseSetRowsSkeleton />;
	}

	if (errorMessage) {
		return <p className="pb-3 text-sm text-destructive">{errorMessage}</p>;
	}

	const recentSets = (recentSetsQuery.data ?? []).map(({ completedAtMs, ...set }) => ({
		...set,
		time: getRelativeTime(new Date(completedAtMs)),
	}));

	if (recentSets.length === 0) {
		return <p className="pb-3 text-sm text-muted-foreground">No recent completed sets found.</p>;
	}

	return (
		<>
			<div className="exercise-set-grid-header">
				<span>Weight</span>
				<span>Reps</span>
				<span />
				<span className="truncate text-right">Completed</span>
			</div>
			<div className="flex flex-col">
				{recentSets.map((set) => {
					const primaryPrType = set.prTypes[0];

					return (
						<div
							key={set.id}
							className="exercise-set-grid-row">
							<span className={cn(set.isPr && "font-semibold")}>{set.weight}</span>
							<span className={cn(set.isPr && "font-semibold")}>{set.reps}</span>
							<span>
								{primaryPrType ? (
									<span className="rounded-md border bg-muted px-1.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground">
										{setPrLabels[primaryPrType]}
									</span>
								) : null}
							</span>
							<span
								className={cn("min-w-0 truncate text-right", set.isPr && "font-semibold")}
								title={set.time}>
								{set.time}
							</span>
						</div>
					);
				})}
			</div>
		</>
	);
}

export default function RecentSetsSection({ exerciseName }: RecentSetsSectionProps): ReactElement {
	return (
		<Accordion
			type="single"
			collapsible
			className="mb-6">
			<AccordionItem
				value="recent-sets"
				className="rounded-md border bg-card last:border-b">
				<AccordionTrigger className="p-3 text-base font-normal text-foreground">
					Recent sets
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3">
					<RecentSetsContent exerciseName={exerciseName} />
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
