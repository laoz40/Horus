import Link from "next/link";
import Card from "@/components/Card";
import type { WorkoutHistoryItem } from "@/features/workout-history/lib/types";
import { toTitleCase } from "@/features/workout-form/lib/convertWorkoutData";
import { getRelativeTime } from "@/lib/date";
import { ShineBorder } from "@/components/ui/shine-border";
import WorkoutCardStats from "@/features/workout-history/components/WorkoutCardStats";
import WorkoutCardOptions from "@/features/workout-history/components/WorkoutCardOptions";
import { Badge } from "@/components/ui/badge";

interface WorkoutCardProps {
	workout: WorkoutHistoryItem;
	isPrPending?: boolean;
}

export default function WorkoutCard({ workout, isPrPending = false }: WorkoutCardProps) {
	const mapMuscleGroups = workout.muscleGroups
		.slice(0, 3)
		.map((muscleGroup) => toTitleCase(muscleGroup));

	return (
		<Card className="transition-colors hover:bg-accent/30">
			{!isPrPending && workout.totalPrSets > 2 && (
				<ShineBorder
					shineColor="#34e1c9"
					duration={12}
				/>
			)}
			<Link
				href={`/workouts/${workout.id}`}
				className="block pt-1">
				<div className="grid grid-cols-[1fr_min-content] items-start gap-x-2">
					<div className="flex min-w-0 flex-col">
						<h2 className="max-w-full truncate text-base font-semibold leading-tight">
							{workout.name}
						</h2>
						<span className="mt-0.5 w-fit whitespace-nowrap text-xs font-medium text-muted-foreground/90">
							{getRelativeTime(new Date(workout.createdAt))}
						</span>
					</div>
					<div
						aria-hidden
						className="size-8 shrink-0"
					/>
				</div>

				<div className="mt-2 grid min-h-6 grid-cols-[1fr_min-content]">
					<div className="flex min-h-6 flex-row flex-wrap content-start justify-start gap-2">
						{mapMuscleGroups.map((label) => (
							<Badge
								key={label}
								variant="secondary"
								className="rounded-sm border border-border/30 bg-secondary/70 px-1.5 py-0 text-xs font-medium text-secondary-foreground/95">
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
					isPrPending={isPrPending}
					className="mt-0"
				/>
			</Link>
			<div className="absolute top-2.5 right-3">
				<WorkoutCardOptions
					workoutId={workout.id}
					workoutName={workout.name}
				/>
			</div>
		</Card>
	);
}
