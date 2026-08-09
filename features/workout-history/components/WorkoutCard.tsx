import Card from "@/components/Card";
import type { WorkoutHistoryItem } from "@/features/workout-history/lib/types";
import { toTitleCase } from "@/features/workout-form/lib/convertWorkoutData";
import { getRelativeTime } from "@/lib/date";
import { ShineBorder } from "@/components/ui/shine-border";
import WorkoutCardStats from "./WorkoutCardStats";
import WorkoutCardOptions from "./WorkoutCardOptions";
import { Badge } from "@/components/ui/badge";

interface WorkoutCardProps {
	workout: WorkoutHistoryItem;
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
	const mapMuscleGroups = workout.muscleGroups
		.slice(0, 3)
		.map((muscleGroup) => toTitleCase(muscleGroup));

	return (
		<>
			<Card>
				{workout.totalPrSets > 2 && (
					<ShineBorder
						shineColor="#34e1c9"
						duration={12}
					/>
				)}
				<div className="grid grid-cols-[1fr_min-content] items-start gap-x-2">
					<div className="flex min-w-0 flex-col">
						<span className="w-fit whitespace-nowrap text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted-foreground/90">
							{getRelativeTime(new Date(workout._creationTime))}
						</span>
						<h2 className="mt-0.5 max-w-full truncate text-base font-semibold leading-tight">
							{workout.name}
						</h2>
					</div>
					<WorkoutCardOptions
						workoutId={workout._id}
						workoutName={workout.name}
					/>
				</div>

				<div className="mt-2 grid min-h-6 grid-cols-[1fr_min-content]">
					<div className="flex min-h-6 flex-row flex-wrap content-start justify-start gap-2">
						{mapMuscleGroups.map((label) => (
							<Badge
								key={label}
								variant="secondary"
								className="rounded-sm border border-border/70 bg-secondary/70 px-1.5 py-0 text-[0.62rem] font-medium uppercase tracking-wider text-secondary-foreground/95">
								{label}
							</Badge>
						))}
					</div>
				</div>

				<WorkoutCardStats
					pr={workout.totalPrSets}
					duration={workout.durationSeconds ?? 0}
					workoutVolume={workout.totalVolume}
					exerciseCount={workout.exerciseCount}
				/>
			</Card>
		</>
	);
}
