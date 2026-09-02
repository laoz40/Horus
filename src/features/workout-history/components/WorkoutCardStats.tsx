import { Clock, Dumbbell, Weight } from "lucide-react";
import { type ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDurationSummary } from "@/lib/time";

interface WorkoutCardStatsProps {
	pr: number;
	duration: number;
	workoutVolume: number;
	exerciseCount: number;
	isPrPending?: boolean;
}

export default function WorkoutCardStats({
	pr,
	duration,
	workoutVolume,
	exerciseCount,
	isPrPending = false,
}: WorkoutCardStatsProps): ReactElement {
	const displayWorkoutVolume = Math.floor(workoutVolume);

	return (
		<div className="mt-2 grid grid-cols-4 items-center gap-x-9 border-t pt-1">
			{/* Workout Duration */}
			<div className="flex items-center justify-start gap-1.5">
				<Clock className="size-4 shrink-0" />
				<span className="relative top-px whitespace-nowrap text-xs font-medium leading-none">
					{formatDurationSummary(duration)}
				</span>
			</div>

			{/* Total volume lifted */}
			<div className="flex items-center justify-center gap-1.5">
				<Weight className="size-4 shrink-0" />
				<span className="relative top-px whitespace-nowrap text-xs font-medium leading-none">
					{displayWorkoutVolume} kg
				</span>
			</div>

			{/* Number of exercises */}
			<div className="flex items-center justify-center gap-1.5">
				<Dumbbell className="size-4 shrink-0" />
				<span className="relative top-px whitespace-nowrap text-xs font-medium leading-none">
					{exerciseCount}
				</span>
			</div>

			{/* PR Indicator */}
			<div className="flex items-center justify-end gap-1.5">
				{isPrPending ? (
					<div
						aria-hidden
						className="h-5 w-12 animate-pulse bg-muted"
					/>
				) : null}
				{!isPrPending && pr > 0 ? (
					<Badge className="text-xs font-semibold text-primary-foreground">{pr} PRs</Badge>
				) : null}
			</div>
		</div>
	);
}
