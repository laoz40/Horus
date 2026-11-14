"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import { useQuery } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";
import { Match } from "effect";
import ErrorBoundary from "@/components/ErrorBoundary";
import TrainingYearSelector from "@/features/dashboard/components/TrainingYearSelector";
import { orpc } from "@/lib/orpc/client";
import { useDashboardSession } from "@/features/dashboard/hooks/useDashboardSession";

type HeatmapValue = {
	date: string;
	count: number;
};

type YearInTrainingState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; year: number; values: HeatmapValue[] };

const emptyText = "Your consistency map starts with your next session.";

type DashboardYearInTrainingSectionProps = {
	userId: string | null;
	currentYear: number;
};

export default function DashboardYearInTrainingSection(props: DashboardYearInTrainingSectionProps) {
	return (
		<ErrorBoundary>
			<DashboardYearInTraining {...props} />
		</ErrorBoundary>
	);
}

function DashboardYearInTraining({
	userId: serverUserId,
	currentYear,
}: DashboardYearInTrainingSectionProps) {
	const [year, setSelectedYear] = useState(currentYear);
	const session = useDashboardSession();

	// Render server data immediately, but follow subsequent client session changes.
	const userId = Match.value(session).pipe(
		Match.when({ kind: "authenticated" }, ({ user }) => user.id),
		Match.when({ kind: "unauthenticated" }, () => null),
		Match.orElse(() => serverUserId),
	);

	const isSignedIn = userId !== null;

	const trainingYearRangeQuery = useQuery(
		orpc.dashboard.trainingYearRange.queryOptions({
			input: { userId: userId ?? undefined },
			enabled: session.kind === "authenticated",
			staleTime: 30_000,
		}),
	);

	const {
		data: stats = [],
		isPending: isStatsPending,
		isError: isStatsError,
	} = useQuery(
		orpc.dashboard.yearInTraining.queryOptions({
			input: { year, userId: userId ?? undefined },
			enabled: session.kind === "authenticated",
			staleTime: 30_000,
		}),
	);

	const yearOptions = buildYearOptions(
		trainingYearRangeQuery.data?.firstYear ?? currentYear,
		trainingYearRangeQuery.data?.lastYear ?? currentYear,
	);

	const values: HeatmapValue[] = stats.map((row) => ({ date: row.dayKey, count: row.setCount }));
	let state: YearInTrainingState = { kind: "ready", year, values };

	if (isSignedIn && isStatsPending) {
		state = { kind: "loading" };
	} else if (isStatsError || trainingYearRangeQuery.isError) {
		state = { kind: "error" };
	}

	return (
		<YearInTrainingShell
			yearSelector={
				<TrainingYearSelector
					yearOptions={yearOptions}
					selectedYear={year}
					onYearChange={setSelectedYear}
				/>
			}>
			<YearInTrainingBody {...state} />
		</YearInTrainingShell>
	);
}

function YearInTrainingBody(state: YearInTrainingState) {
	if (state.kind === "loading") {
		return <YearInTrainingLoadingBody />;
	}

	if (state.kind === "error") {
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
			year={state.year}
			values={state.values}
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
		<div className="flex min-h-28 items-center justify-center gap-2 rounded-lg border bg-card p-3 text-muted-foreground shadow-sm md:min-h-36">
			<IconLoader2
				className="size-5 animate-spin"
				aria-hidden="true"
			/>
			<span>Loading training data</span>
		</div>
	);
}

export function DashboardYearInTrainingPlaceholder({ kind }: { kind: "loading" | "error" }) {
	return (
		<YearInTrainingShell yearSelector={null}>
			<YearInTrainingBody kind={kind} />
		</YearInTrainingShell>
	);
}

function YearInTrainingShell({
	yearSelector,
	children,
}: {
	yearSelector: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col px-4">
			<div className="flex items-center justify-between">
				<h2 className="text-muted-foreground">Year in Training</h2>
				{yearSelector}
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
