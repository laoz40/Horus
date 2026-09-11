import { IconBarbellFilled, IconClockFilled, IconTrophyFilled } from "@tabler/icons-react";
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
				"mt-2 flex items-center justify-between",
				showBorderTop && "border-t pt-1",
			)}>
			{/* Workout Duration */}
			<div className="flex items-center gap-1.5">
				<IconClockFilled className="size-4 shrink-0" />
				<span className="relative top-px whitespace-nowrap text-xs font-medium leading-none">
					{formatDurationSummary(duration)}
				</span>
			</div>

			{/* Total volume lifted */}
			<div className="flex items-center gap-1.5">
				<IconWeightFilled className="size-4 shrink-0" />
				<span className="relative top-px whitespace-nowrap text-xs font-medium leading-none">
					{displayWorkoutVolume} kg
				</span>
			</div>

			{/* Number of exercises */}
			<div className="flex items-center gap-1.5">
				<IconBarbellFilled className="size-4 shrink-0" />
				<span className="relative top-px whitespace-nowrap text-xs font-medium leading-none">
					{exerciseCount}
				</span>
			</div>

			{/* PR Indicator — invisible placeholder keeps spacing when empty */}
			<div className="flex items-center gap-1.5">
				{isPrPending ? (
					<div
						aria-hidden
						className="h-5 w-12 animate-pulse bg-muted"
					/>
				) : (
					<div
						className={cn("flex items-center gap-1.5", pr === 0 && "invisible")}
						aria-hidden={pr === 0}>
						<IconTrophyFilled className="size-4 shrink-0 text-primary" />
						<span className="relative top-px whitespace-nowrap text-xs font-medium leading-none text-primary">
							{pr > 0 ? (
								<>
									<span className="sr-only">Personal records:</span>
									{pr}
								</>
							) : (
								0
							)}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
