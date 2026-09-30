"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import { useQuery } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

function DashboardYearInTraining(props: DashboardYearInTrainingSectionProps) {
	const view = useYearInTrainingView(props);

	return (
		<YearInTrainingShell
			yearOptions={view.yearOptions}
			selectedYear={view.year}
			yearSelectable={view.yearSelectable}
			onYearChange={view.setSelectedYear}>
			{view.body}
		</YearInTrainingShell>
	);
}

function useYearInTrainingView({
	isAuthPending,
	isSignedIn,
	userId,
	yearSelectable = false,
}: DashboardYearInTrainingSectionProps) {
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const year = yearSelectable ? selectedYear : currentYear;

	const trainingYearRangeQuery = useQuery(
		orpc.dashboard.trainingYearRange.queryOptions({
			input: {},
			enabled: isSignedIn && yearSelectable,
		}),
	);

	const statsQuery = useQuery(
		orpc.dashboard.yearInTraining.queryOptions({
			input: { year, userId },
			enabled: isSignedIn,
		}),
	);

	const yearOptions = buildYearOptions(
		trainingYearRangeQuery.data?.firstYear ?? currentYear,
		trainingYearRangeQuery.data?.lastYear ?? currentYear,
	);

	const body = resolveYearInTrainingBody({
		isAuthPending,
		isSignedIn,
		yearSelectable,
		year,
		statsQuery,
		trainingYearRangeQuery,
	});

	return {
		year,
		yearOptions,
		yearSelectable,
		setSelectedYear,
		body,
	};
}

type YearInTrainingStatsQuery = ReturnType<
	typeof useQuery<
		{ dayKey: string; setCount: number }[],
		Error,
		{ dayKey: string; setCount: number }[],
		readonly unknown[]
	>
>;

type TrainingYearRangeQuery = ReturnType<
	typeof useQuery<
		{ firstYear: number; lastYear: number },
		Error,
		{ firstYear: number; lastYear: number },
		readonly unknown[]
	>
>;

function resolveYearInTrainingBody({
	isAuthPending,
	isSignedIn,
	yearSelectable,
	year,
	statsQuery,
	trainingYearRangeQuery,
}: {
	isAuthPending: boolean;
	isSignedIn: boolean;
	yearSelectable: boolean;
	year: number;
	statsQuery: YearInTrainingStatsQuery;
	trainingYearRangeQuery: TrainingYearRangeQuery;
}) {
	if (isAuthPending) {
		return <YearInTrainingLoadingBody />;
	}

	if (isSignedIn && statsQuery.isPending) {
		return <YearInTrainingLoadingBody />;
	}

	if (isSignedIn && yearSelectable && trainingYearRangeQuery.isPending) {
		return <YearInTrainingLoadingBody />;
	}

	if (statsQuery.isError) {
		return (
			<div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
				<p className="py-8 text-center text-sm text-destructive">
					Failed to load year in training data.
				</p>
			</div>
		);
	}

	const values: HeatmapValue[] =
		statsQuery.data?.map((row) => ({ date: row.dayKey, count: row.setCount })) ?? [];

	return (
		<YearInTrainingHeatmapCard
			year={year}
			values={values}
		/>
	);
}

function YearInTrainingHeatmapCard({ year, values }: { year: number; values: HeatmapValue[] }) {
	return (
		<div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
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
						classForValue={heatmapClassForValue}
					/>
				</div>
			)}
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

type YearInTrainingShellProps = {
	yearOptions: number[];
	selectedYear: number;
	yearSelectable: boolean;
	onYearChange: (year: number) => void;
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
		<section className="mb-3 flex flex-col pr-4 pl-4">
			<div className="flex items-center justify-between">
				<h2 className="text-muted-foreground">Year in Training</h2>
				{yearSelectable ? (
					<Select
						value={String(selectedYear)}
						onValueChange={(value) => onYearChange(Number(value))}>
						<SelectTrigger
							size="sm"
							className="h-auto border-0 bg-transparent px-0 text-muted-foreground shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
							aria-label="Training year">
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end">
							{yearOptions.map((optionYear) => (
								<SelectItem
									key={optionYear}
									value={String(optionYear)}>
									{optionYear}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<span className="text-sm text-muted-foreground">{selectedYear}</span>
				)}
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
