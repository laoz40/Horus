"use client";

import dayjs from "dayjs";
import type { ReactElement } from "react";
import { useMemo } from "react";
import type { DotItemDotProps } from "recharts";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { z } from "zod";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const chartConfig = {
	maxWeight: {
		label: "Max weight",
		color: "var(--primary)",
	},
} satisfies ChartConfig;

const progressionChartDatumSchema = z
	.object({
		weekStartMs: z.number(),
		weekLabel: z.string(),
		maxWeight: z.number(),
		isPeriodPeak: z.boolean(),
	})
	.strict();

type ProgressionChartDatum = z.infer<typeof progressionChartDatumSchema>;

function formatWeekLabel(weekStartMs: number): string {
	return dayjs(weekStartMs).format("D MMM YY");
}

function renderProgressionDot(props: DotItemDotProps): ReactElement {
	const { cx, cy, payload: rawPayload } = props;

	const parsedPayload = progressionChartDatumSchema.safeParse(rawPayload);
	const isPeriodPeak = parsedPayload.success && parsedPayload.data.isPeriodPeak;

	if (cx === undefined || cy === undefined || !parsedPayload.success) {
		return (
			<circle
				cx={cx}
				cy={cy}
				r={3}
				className="fill-[var(--color-maxWeight)] stroke-background stroke-1"
			/>
		);
	}

	return (
		<circle
			cx={cx}
			cy={cy}
			r={isPeriodPeak ? 5 : 3}
			className={cn(
				"fill-[var(--color-maxWeight)] stroke-background",
				isPeriodPeak ? "stroke-2" : "stroke-1",
			)}
		/>
	);
}

interface WeightProgressionChartProps {
	points: Array<{
		weekStartMs: number;
		maxWeight: number;
		isPeriodPeak: boolean;
	}>;
}

export default function WeightProgressionChart({
	points,
}: WeightProgressionChartProps): ReactElement {
	const chartData: ProgressionChartDatum[] = useMemo(
		() =>
			points.map((point) => ({
				...point,
				weekLabel: formatWeekLabel(point.weekStartMs),
			})),
		[points],
	);

	const peakIndex = chartData.findIndex((point) => point.isPeriodPeak);

	return (
		<div className="pb-3">
			<ChartContainer
				config={chartConfig}
				className="aspect-auto h-48 w-full">
				<LineChart
					data={chartData}
					margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="weekLabel"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						minTickGap={24}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						width={40}
					/>
					<ChartTooltip
						content={<ChartTooltipContent />}
						defaultIndex={peakIndex >= 0 ? peakIndex : undefined}
					/>
					<Line
						type="linear"
						dataKey="maxWeight"
						stroke="var(--color-maxWeight)"
						strokeWidth={2}
						dot={renderProgressionDot}
						activeDot={{ r: 6 }}
					/>
				</LineChart>
			</ChartContainer>
		</div>
	);
}
