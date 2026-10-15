"use client";

import { useQuery } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPersonalRecord } from "@/features/progress/lib/formatPersonalRecord";
import { orpcQueryErrorMessage } from "@/features/progress/lib/orpcQueryErrorMessage";
import { setPrLabels } from "@/features/workout-form/lib/setPr";
import { orpc } from "@/lib/orpc/client";

interface PersonalRecordsSectionProps {
	exerciseName: string;
}

function PersonalRecordsContent({ exerciseName }: PersonalRecordsSectionProps): ReactElement {
	const personalRecordsQuery = useQuery(
		orpc.exercises.personalRecords.queryOptions({
			input: { exerciseName },
			enabled: exerciseName.length > 0,
			staleTime: Number.POSITIVE_INFINITY,
		}),
	);

	const queryError =
		personalRecordsQuery.error instanceof Error ? personalRecordsQuery.error : null;

	const errorMessage = orpcQueryErrorMessage(
		personalRecordsQuery.isError,
		queryError,
		"Couldn't load personal records.",
	);

	if (personalRecordsQuery.isLoading) {
		return (
			<p className="flex items-center gap-2 text-sm text-muted-foreground">
				<IconLoader2
					aria-hidden
					className="size-4 animate-spin"
				/>
				Loading records
			</p>
		);
	}

	if (errorMessage) {
		return <p className="pb-3 text-sm text-destructive">{errorMessage}</p>;
	}

	const personalRecords = personalRecordsQuery.data?.records ?? [];

	if (personalRecords.length === 0) {
		return <p className="pb-3 text-sm text-muted-foreground">No completed sets logged yet.</p>;
	}

	return (
		<div className="grid grid-cols-2 gap-3">
			{personalRecords.map((record) => {
				const display = formatPersonalRecord(record);

				return (
					<Card
						key={record.type}
						className="min-w-0 gap-3 rounded-md py-4">
						<CardHeader className="px-4">
							<h3 className="text-xs text-muted-foreground">{setPrLabels[record.type]}</h3>
						</CardHeader>
						<CardContent className="flex flex-col gap-2 px-4">
							<p className="flex flex-wrap items-baseline gap-x-1">
								<span className="min-w-0 text-5xl leading-none font-semibold break-all text-primary tabular-nums">
									{display.value}
								</span>
								<span className="text-sm text-muted-foreground">{display.unit}</span>
							</p>
							<p className="text-sm">{display.detail}</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

export default function PersonalRecordsSection({
	exerciseName,
}: PersonalRecordsSectionProps): ReactElement {
	return (
		<section className="mb-6 flex flex-col gap-2">
			<h2>Personal records</h2>
			<PersonalRecordsContent exerciseName={exerciseName} />
		</section>
	);
}
