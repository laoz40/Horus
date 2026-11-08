"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import { useQuery } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import TrainingYearSelector, {
	type TrainingYearSelectorProps,
} from "@/features/dashboard/components/TrainingYearSelector";
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
	yearSelectable?: boolean;
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
	yearSelectable = false,
}: DashboardYearInTrainingSectionProps) {
	const [currentYear] = useState(() => new Date().getFullYear());
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const year = yearSelectable ? selectedYear : currentYear;

	const trainingYearRangeQuery = useQuery(
		orpc.dashboard.trainingYearRange.queryOptions({
			input: {},
			enabled: isSignedIn && yearSelectable,
		}),
	);

	const {
		data: stats = [],
		isPending: isStatsPending,
		isError: isStatsError,
	} = useQuery(
		orpc.dashboard.yearInTraining.queryOptions({
			input: { year, userId },
			enabled: isSignedIn,
		}),
	);

	const yearOptions = buildYearOptions(
		trainingYearRangeQuery.data?.firstYear ?? currentYear,
		trainingYearRangeQuery.data?.lastYear ?? currentYear,
	);

	const values: HeatmapValue[] = stats.map((row) => ({ date: row.dayKey, count: row.setCount }));

	return (
		<YearInTrainingShell
			yearOptions={yearOptions}
			selectedYear={year}
			yearSelectable={yearSelectable}
			onYearChange={setSelectedYear}>
			<YearInTrainingBody
				isAuthPending={isAuthPending}
				isStatsPending={isSignedIn && isStatsPending}
				isYearRangePending={isSignedIn && yearSelectable && trainingYearRangeQuery.isPending}
				isError={isStatsError}
				year={year}
				values={values}
			/>
		</YearInTrainingShell>
	);
}

function YearInTrainingBody({
	isAuthPending,
	isStatsPending,
	isYearRangePending,
	isError,
	year,
	values,
}: {
	isAuthPending: boolean;
	isStatsPending: boolean;
	isYearRangePending: boolean;
	isError: boolean;
	year: number;
	values: HeatmapValue[];
}) {
	if (isAuthPending || isStatsPending || isYearRangePending) {
		return <YearInTrainingLoadingBody />;
	}

	if (isError) {
		return (
			<div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
				<p className="py-8 text-center text-sm text-destructive">
					Failed to load year in training data.
				</p>
			</div>
		);
	}

	return (
		<YearInTrainingHeatmapCard
			year={year}
			values={values}
		/>
	);
}

function YearInTrainingHeatmapCard({ year, values }: { year: number; values: HeatmapValue[] }) {
	if (values.length === 0) {
		return (
			<div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
				<p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
			<div className="overflow-x-auto pb-1">
				<CalendarHeatmap
					gutterSize={2}
					startDate={`${year}-01-01`}
					endDate={`${year}-12-31`}
					values={values}
					showWeekdayLabels={false}
					showMonthLabels
					classForValue={heatmapClassForValue}
				/>
			</div>
		</div>
	);
}

function heatmapClassForValue(value: { count?: number } | undefined) {
	const count = value?.count ?? 0;

	if (count <= 0) return "color-empty";

	if (count <= 3) return "color-scale-1";

	if (count <= 6) return "color-scale-2";

	if (count <= 10) return "color-scale-3";

	if (count <= 15) return "color-scale-4";

	return "color-scale-5";
}

function YearInTrainingLoadingBody() {
	return (
		<div className="flex min-h-28 items-center justify-center rounded-lg border bg-card p-3 text-muted-foreground shadow-sm md:min-h-36">
			<IconLoader2
				className="size-5 animate-spin"
				aria-label="Loading year in training"
			/>
		</div>
	);
}

type YearInTrainingShellProps = TrainingYearSelectorProps & {
	children: React.ReactNode;
};

function YearInTrainingShell({
	yearOptions,
	selectedYear,
	yearSelectable,
	onYearChange,
	children,
}: YearInTrainingShellProps) {
	return (
		<section className="flex flex-col px-4">
			<div className="flex items-center justify-between">
				<h2 className="text-muted-foreground">Year in Training</h2>
				<TrainingYearSelector
					yearOptions={yearOptions}
					selectedYear={selectedYear}
					yearSelectable={yearSelectable}
					onYearChange={onYearChange}
				/>
			</div>
			{children}
		</section>
	);
}

function buildYearOptions(firstYear: number, lastYear: number): number[] {
	const years: number[] = [];

	for (let optionYear = lastYear; optionYear >= firstYear; optionYear--) {
		years.push(optionYear);
	}

	return years;
}
