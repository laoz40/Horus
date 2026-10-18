"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import ExerciseSetRowsSkeleton from "@/features/exercise-progress/components/ExerciseSetRowsSkeleton";
import RecentSetRow from "@/features/exercise-progress/components/RecentSetRow";
import { orpcQueryErrorMessage } from "@/lib/orpc/queryErrorMessage";
import { orpc } from "@/lib/orpc/client";

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

	const recentSets = recentSetsQuery.data ?? [];

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
					return (
						<RecentSetRow
							key={set.id}
							set={set}
						/>
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
				<AccordionTrigger className="p-3 text-base font-normal">Recent sets</AccordionTrigger>
				<AccordionContent className="px-3 pb-3">
					<RecentSetsContent exerciseName={exerciseName} />
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
