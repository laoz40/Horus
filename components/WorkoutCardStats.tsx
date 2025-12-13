import { Clock, Dumbbell, Weight } from "lucide-react";
import { type ReactElement } from "react";
import { Badge } from "./ui/badge";

interface WorkoutCardStatsProps {
	pr: number;
}

export default function WorkoutCardStats({
	pr,
}: WorkoutCardStatsProps): ReactElement {
	return (
		<div className="flex flex-row justify-between mt-4 pt-2 border-t">
			{/* Number of exercises */}
			<div className="flex items-center justify-center space-x-1.5 py-1">
				<Dumbbell className="size-4 shrink-0" />
				<span className="text-sm font-medium whitespace-nowrap">5</span>
			</div>

			{/* Total volume lifted */}
			<div className="flex items-center justify-center space-x-1.5 py-1">
				<Weight className="size-4 shrink-0" />
				<span className="text-sm font-medium whitespace-nowrap">1337 kg</span>
			</div>

			{/* Workout Duration */}
			<div className="flex items-center justify-center space-x-1.5 py-1">
				<Clock className="size-4 shrink-0" />
				<span className="text-sm font-medium whitespace-nowrap">67 min</span>
			</div>

			{/* PR Indicator */}
			<div className="flex items-center justify-center space-x-1.5 py-1">
				{pr > 0 && (
					<Badge className="text-primary-foreground text-sm font-semibold">
						{pr} PRs
					</Badge>
				)}
			</div>
		</div>
	);
}
