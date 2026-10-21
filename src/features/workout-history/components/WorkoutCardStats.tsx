import WorkoutPrIndicator from "@/features/workout-history/components/WorkoutPrIndicator";
import { IconBarbellFilled, IconClockFilled } from "@tabler/icons-react";
import { IconWeightFilled } from "@/components/icons/IconWeightFilled";
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
	className?: string;
}

export default function WorkoutCardStats({
	pr,
	duration,
	workoutVolume,
	exerciseCount,
	isPrPending = false,
	showBorderTop = true,
	className,
}: WorkoutCardStatsProps): ReactElement {
	const displayWorkoutVolume = Math.floor(workoutVolume);

	return (
		<div
			className={cn(
				"mt-2 flex items-center justify-between tabular-nums",
				showBorderTop && "border-t pt-1",
				className,
			)}>
			{/* Workout Duration */}
			<div className="flex items-center gap-1">
				<IconClockFilled className="size-4 shrink-0" />
				<span className="relative top-px text-xs leading-none font-medium whitespace-nowrap">
					{formatDurationSummary(duration)}
				</span>
			</div>

			{/* Total volume lifted */}
			<div className="flex items-center gap-1">
				<IconWeightFilled className="size-4 shrink-0" />
				<span className="relative top-px text-xs leading-none font-medium whitespace-nowrap">
					{displayWorkoutVolume} kg
				</span>
			</div>

			{/* Number of exercises */}
			<div className="flex items-center gap-1">
				<IconBarbellFilled className="size-4 shrink-0" />
				<span className="relative top-px text-xs leading-none font-medium whitespace-nowrap">
					{exerciseCount}
				</span>
			</div>

			{/* PR Indicator — invisible placeholder keeps spacing when empty */}
			<div className="flex items-center gap-1">
				<WorkoutPrIndicator
					pr={pr}
					isPrPending={isPrPending}
				/>
			</div>
		</div>
	);
}
