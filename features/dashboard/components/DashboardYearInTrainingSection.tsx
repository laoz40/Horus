"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type HeatmapValue = {
	date: string;
	count: number;
};

const emptyText = "Your consistency map starts with your next session.";

type DashboardYearInTrainingSectionProps = {
	isAuthPending: boolean;
	isSignedIn: boolean;
};

export default function DashboardYearInTrainingSection({
	isAuthPending,
	isSignedIn,
}: DashboardYearInTrainingSectionProps) {
	const year = new Date().getFullYear();
	const stats = useQuery(api.dailySetStats.getYear, isSignedIn ? { year } : "skip");

	if (isAuthPending || (isSignedIn && stats === undefined)) {
		return <YearInTrainingSkeleton year={year} />;
	}

	const values: HeatmapValue[] =
		stats?.map((row) => ({ date: row.dayKey, count: row.setCount })) ?? [];

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

const skeletonMonths = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

function YearInTrainingSkeleton({ year }: { year: number }) {
	return (
		<YearInTrainingShell year={year}>
			<div className="border bg-card p-3 shadow-sm">
				<div className="overflow-x-auto pb-1">
					<div className="w-[634px] max-w-none animate-pulse overflow-hidden">
						<div className="grid grid-cols-12 text-[0.625rem] text-muted-foreground">
							{skeletonMonths.map((month) => (
								<span key={month}>{month}</span>
							))}
						</div>
						<div className="grid grid-flow-col grid-rows-7 gap-0.5">
							{Array.from({ length: 53 * 7 }).map((_, index) => (
								<div
									key={index}
									className="size-2.5 bg-muted"
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</YearInTrainingShell>
	);
}
