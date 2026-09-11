import { Clock, Dumbbell, Trophy, Weight } from "lucide-react";
import { type ReactElement } from "react";
import { formatDurationSummary } from "@/lib/time";
import { cn } from "@/lib/utils";

interface WorkoutCardStatsProps {
	pr: number;
	duration: number;
	workoutVolume: number;
	exerciseCount: number;
	isPrPending?: boolean;
	showBorderTop?: boolean;
}

export default function WorkoutCardStats({
	pr,
	duration,
	workoutVolume,
	exerciseCount,
	isPrPending = false,
	showBorderTop = true,
}: WorkoutCardStatsProps): ReactElement {
	const displayWorkoutVolume = Math.floor(workoutVolume);

	return (
		<div
			className={cn(
				"mt-2 grid grid-cols-4 items-center gap-x-9",
				showBorderTop && "border-t pt-1",
			)}>
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
					<>
						<Trophy className="size-4 shrink-0 text-primary" />
						<span className="relative top-px whitespace-nowrap text-xs font-medium leading-none text-primary">
							<span className="sr-only">Personal records:</span>
							{pr}
						</span>
					</>
				) : null}
			</div>
		</div>
	);
}
