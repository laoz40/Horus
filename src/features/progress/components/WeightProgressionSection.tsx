"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import WeightProgressionChart from "@/features/progress/components/WeightProgressionChart";
import {
	EXERCISE_WEIGHT_PROGRESSION_MIN_REPS,
	exerciseWeightProgressionRangeLabels,
	exerciseWeightProgressionRanges,
	type ExerciseWeightProgressionRange,
} from "@/features/progress/lib/exerciseWeightProgression";
import { orpcQueryErrorMessage } from "@/features/progress/lib/orpcQueryErrorMessage";
import { orpc } from "@/lib/orpc/client";

interface WeightProgressionSectionProps {
	exerciseName: string;
}

function ProgressionChartContent({
	exerciseName,
	range,
}: {
	exerciseName: string;
	range: ExerciseWeightProgressionRange;
}): ReactElement {
	const progressionQuery = useQuery(
		orpc.exercises.weeklyWeightProgression.queryOptions({
			input: { exerciseName, range },
			enabled: exerciseName.length > 0,
		}),
	);

	const queryError =
		progressionQuery.error instanceof Error ? progressionQuery.error : null;

	const errorMessage = orpcQueryErrorMessage(
		progressionQuery.isError,
		queryError,
		"Couldn't load weight progression.",
	);

	if (progressionQuery.isLoading) {
		return <Skeleton className="mb-3 h-48 w-full rounded-md" />;
	}

	if (errorMessage) {
		return <p className="pb-3 text-sm text-destructive">{errorMessage}</p>;
	}

	const points = progressionQuery.data ?? [];

	if (points.length === 0) {
		return (
			<p className="pb-3 text-sm text-muted-foreground">
				No completed sets with {EXERCISE_WEIGHT_PROGRESSION_MIN_REPS}+ reps in this period.
			</p>
		);
	}

	return <WeightProgressionChart points={points} />;
}

export default function WeightProgressionSection({
	exerciseName,
}: WeightProgressionSectionProps): ReactElement {
	const [range, setRange] = useState<ExerciseWeightProgressionRange>("6m");

	return (
		<section className="mb-6 flex flex-col">
			<div className="mb-1 flex items-center justify-between gap-2">
				<h2 className="text-muted-foreground">Weight progression</h2>
				<Select
					value={range}
					onValueChange={(value) => {
						const nextRange = exerciseWeightProgressionRanges.find((option) => option === value);

						if (nextRange !== undefined) {
							setRange(nextRange);
						}
					}}>
					<SelectTrigger
						size="sm"
						className="h-8 w-28 shrink-0"
						aria-label="Progression time range">
						<SelectValue />
					</SelectTrigger>
					<SelectContent align="end">
						<SelectGroup>
							{exerciseWeightProgressionRanges.map((option) => (
								<SelectItem
									key={option}
									value={option}>
									{exerciseWeightProgressionRangeLabels[option]}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
			<div className="rounded-md border bg-card px-3 pt-3 pb-0">
				<ProgressionChartContent
					exerciseName={exerciseName}
					range={range}
				/>
			</div>
		</section>
	);
}
