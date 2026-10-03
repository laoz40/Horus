"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import ExerciseSetRowsSkeleton from "@/features/progress/components/ExerciseSetRowsSkeleton";
import ProgressExerciseDetailCard from "@/features/progress/components/ProgressExerciseDetailCard";
import { orpcQueryErrorMessage } from "@/features/progress/lib/orpcQueryErrorMessage";
import { setPrLabels } from "@/features/workout-form/lib/setPr";
import { getRelativeTime } from "@/lib/date";
import { orpc } from "@/lib/orpc/client";

interface ProgressExercisePersonalRecordsSectionProps {
	exerciseName: string;
}

function PersonalRecordsContent({
	exerciseName,
}: ProgressExercisePersonalRecordsSectionProps): ReactElement {
	const personalRecordsQuery = useQuery(
		orpc.exercises.personalRecords.queryOptions({
			input: { exerciseName },
			enabled: exerciseName.length > 0,
			staleTime: Number.POSITIVE_INFINITY,
		}),
	);

	const errorMessage = orpcQueryErrorMessage(
		personalRecordsQuery.isError,
		personalRecordsQuery.error,
		"Couldn't load personal records.",
	);

	if (personalRecordsQuery.isLoading) {
		return <ExerciseSetRowsSkeleton />;
	}

	if (errorMessage) {
		return <p className="pb-3 text-sm text-destructive">{errorMessage}</p>;
	}

	const personalRecords = (personalRecordsQuery.data?.records ?? []).map((record) => ({
		...record,
		time: getRelativeTime(new Date(record.completedAtMs)),
	}));

	if (personalRecords.length === 0) {
		return (
			<p className="pb-3 text-sm text-muted-foreground">No completed sets logged yet.</p>
		);
	}

	return (
		<>
			<div className="exercise-set-grid-header">
				<span>Weight</span>
				<span>Reps</span>
				<span />
				<span className="truncate text-right">Achieved</span>
			</div>
			<div className="flex flex-col">
				{personalRecords.map((record) => (
					<div
						key={record.type}
						className="exercise-set-grid-row">
						<span className="font-semibold">{record.weight}</span>
						<span className="font-semibold">{record.reps}</span>
						<span>
							<span className="rounded-md border bg-muted px-1.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground">
								{setPrLabels[record.type]}
							</span>
						</span>
						<span
							className="min-w-0 truncate text-right font-semibold"
							title={record.time}>
							{record.time}
						</span>
					</div>
				))}
			</div>
		</>
	);
}

export default function ProgressExercisePersonalRecordsSection({
	exerciseName,
}: ProgressExercisePersonalRecordsSectionProps): ReactElement {
	return (
		<ProgressExerciseDetailCard title="Personal records">
			<PersonalRecordsContent exerciseName={exerciseName} />
		</ProgressExerciseDetailCard>
	);
}
