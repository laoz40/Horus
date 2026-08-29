"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { orpc } from "@/lib/orpc/client";

type HeatmapValue = {
	date: string;
	count: number;
};

const emptyText = "Your consistency map starts with your next session.";

type DashboardYearInTrainingSectionProps = {
	isAuthPending: boolean;
	isSignedIn: boolean;
	userId?: string;
};

export default function DashboardYearInTrainingSection(props: DashboardYearInTrainingSectionProps) {
	return (
		<ErrorBoundary>
			<DashboardYearInTraining {...props} />
		</ErrorBoundary>
	);
}

function DashboardYearInTraining({
	isAuthPending,
	isSignedIn,
	userId,
}: DashboardYearInTrainingSectionProps) {
	const year = new Date().getFullYear();
	const statsQuery = useQuery(
		orpc.dashboard.yearInTraining.queryOptions({
			input: { year, userId },
			enabled: isSignedIn,
		}),
	);

	if (isAuthPending || (isSignedIn && statsQuery.isPending)) {
		return <YearInTrainingLoading year={year} />;
	}

	if (statsQuery.isError) {
		return (
			<YearInTrainingShell year={year}>
				<div className="border bg-card p-3 text-card-foreground shadow-sm">
					<p className="py-8 text-center text-sm text-destructive">
						Failed to load year in training data.
					</p>
				</div>
			</YearInTrainingShell>
		);
	}

	const values: HeatmapValue[] =
		statsQuery.data?.map((row) => ({ date: row.dayKey, count: row.setCount })) ?? [];

	return (
		<YearInTrainingShell year={year}>
			<div className="border bg-card p-3 text-card-foreground shadow-sm">
				{values.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
				) : (
					<div className="overflow-x-auto pb-1">
						<CalendarHeatmap
							gutterSize={2}
							startDate={`${year}-01-01`}
							endDate={`${year}-12-31`}
							values={values}
							showWeekdayLabels={false}
							showMonthLabels
							classForValue={(value) => {
								const count = value?.count ?? 0;
								if (count <= 0) return "color-empty";
								if (count <= 3) return "color-scale-1";
								if (count <= 6) return "color-scale-2";
								if (count <= 10) return "color-scale-3";
								if (count <= 15) return "color-scale-4";
								return "color-scale-5";
							}}
						/>
					</div>
				)}
			</div>
		</YearInTrainingShell>
	);
}

function YearInTrainingShell({ year, children }: { year: number; children: React.ReactNode }) {
	return (
		<section className="mb-3 flex flex-col pr-4 pl-4">
			<div className="flex items-center justify-between">
				<h2 className="text-muted-foreground">Year in Training</h2>
				<span className="text-sm text-muted-foreground">{year}</span>
			</div>
			{children}
		</section>
	);
}

function YearInTrainingLoading({ year }: { year: number }) {
	return (
		<YearInTrainingShell year={year}>
			<div className="flex min-h-28 items-center justify-center border bg-card p-3 text-muted-foreground shadow-sm md:min-h-36">
				<Loader2
					className="size-5 animate-spin"
					aria-label="Loading year in training"
				/>
			</div>
		</YearInTrainingShell>
	);
}
