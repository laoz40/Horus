import { Match } from "effect";

/** Keep in sync with getExerciseWeeklyWeightProgression.sql ($4). */
export const EXERCISE_WEIGHT_PROGRESSION_MIN_REPS = 4;

export const exerciseWeightProgressionRanges = ["3m", "6m", "1y", "all"] as const;

export type ExerciseWeightProgressionRange = (typeof exerciseWeightProgressionRanges)[number];

export const exerciseWeightProgressionRangeLabels = {
	"3m": "3 months",
	"6m": "6 months",
	"1y": "1 year",
	all: "All time",
} satisfies Record<ExerciseWeightProgressionRange, string>;

export function exerciseWeightProgressionSince(range: ExerciseWeightProgressionRange): Date {
	const since = new Date();

	return Match.value(range).pipe(
		Match.when("all", () => new Date(0)),
		Match.when("3m", () => {
			since.setMonth(since.getMonth() - 3);

			return since;
		}),
		Match.when("6m", () => {
			since.setMonth(since.getMonth() - 6);

			return since;
		}),
		Match.when("1y", () => {
			since.setFullYear(since.getFullYear() - 1);

			return since;
		}),
		Match.exhaustive,
	);
}

export interface ExerciseWeightProgressionPoint {
	weekStartMs: number;
	maxWeight: number;
	isPeriodPeak: boolean;
}

export function markExerciseWeightProgressionPeriodPeaks(
	points: Omit<ExerciseWeightProgressionPoint, "isPeriodPeak">[],
): ExerciseWeightProgressionPoint[] {
	if (points.length === 0) {
		return [];
	}

	const periodPeakWeight = Math.max(...points.map((point) => point.maxWeight));

	let latestPeakWeekStartMs = Number.NEGATIVE_INFINITY;

	for (const point of points) {
		if (point.maxWeight === periodPeakWeight && point.weekStartMs > latestPeakWeekStartMs) {
			latestPeakWeekStartMs = point.weekStartMs;
		}
	}

	return points.map((point) => ({
		...point,
		isPeriodPeak:
			point.maxWeight === periodPeakWeight && point.weekStartMs === latestPeakWeekStartMs,
	}));
}
