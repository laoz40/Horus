import { Clock, Dumbbell, Weight } from "lucide-react";
import { type ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDurationSummary } from "@/lib/time";

interface WorkoutCardStatsProps {
	pr: number;
	duration: number;
	workoutVolume: number;
	exerciseCount: number;
}

export default function WorkoutCardStats({
	pr,
	duration,
	workoutVolume,
	exerciseCount,
}: WorkoutCardStatsProps): ReactElement {
	return (
		<div className="flex flex-row justify-between mt-4 pt-1 border-t">
			{/* Number of exercises */}
			<div className="flex items-center justify-center space-x-1.5">
				<Dumbbell className="size-4 shrink-0" />
				<span className="text-sm font-medium whitespace-nowrap">
					{exerciseCount}
				</span>
			</div>

			{/* Total volume lifted */}
			<div className="flex items-center justify-center space-x-1.5">
				<Weight className="size-4 shrink-0" />
				<span className="text-sm font-medium whitespace-nowrap">
					{workoutVolume} kg
				</span>
			</div>

			{/* Workout Duration */}
			<div className="flex items-center justify-center space-x-1.5">
				<Clock className="size-4 shrink-0" />
				<span className="text-sm font-medium whitespace-nowrap">
					{formatDurationSummary(duration)}
				</span>
			</div>

			{/* PR Indicator */}
			<div className="flex items-center justify-center space-x-1.5">
				<Badge
					className={`text-primary-foreground text-sm font-semibold ${pr === 0 ? "invisible" : ""}`}>
					{pr} PRs
				</Badge>
			</div>
		</div>
	);
}
