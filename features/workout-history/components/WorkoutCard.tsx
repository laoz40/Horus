import Card from "@/components/Card";
import { getRelativeTime } from "@/lib/date";
import { ShineBorder } from "@/components/ui/shine-border";
import WorkoutCardStats from "./WorkoutCardStats";
import WorkoutCardOptions from "./WorkoutCardOptions";
import { Badge } from "@/components/ui/badge";
import { showWorkoutDeletedToast } from "@/lib/toastMessages";
import { WorkoutWithPrData } from "@/features/workout-history/lib/types";
import { toTitleCase } from "@/features/workout-form/lib/convertWorkoutData";

interface WorkoutCardProps {
	workout: WorkoutWithPrData;
	deleteLocalWorkout: (deleteId: string) => void;
}

export default function WorkoutCard({
	workout,
	deleteLocalWorkout,
}: WorkoutCardProps) {
	const handleDelete = async () => {
		deleteLocalWorkout(workout.id);

		try {
			const response = await fetch(`/api/workouts/${workout.id}`, {
				method: "DELETE",
			});

			showWorkoutDeletedToast();

			const workoutData = await response.json();
			if (!workoutData.success) {
				console.log("Failed to delete workout:", workoutData.error);
			}
		} catch (err) {
			console.log("Delete failed", err);
		}
	};

	const mapMuscleGroups = workout.exercises
		.slice(0, 3)
		.map((exercise) => {
			const muscleGroups = exercise.globalExercise?.muscleGroups;
			if (!Array.isArray(muscleGroups)) return null;
			const firstMusleGroup = muscleGroups[0];
			if (
				typeof firstMusleGroup !== "string" ||
				firstMusleGroup.trim().length === 0
			)
				return null;
			return toTitleCase(firstMusleGroup);
		})
		// filter out nulls
		.filter((muscleGroup) => muscleGroup != null)
		.reverse();

	return (
		<>
			<Card>
				{workout.totalPrSets > 0 && (
					<ShineBorder
						shineColor="#34e1c9"
						duration={20}
					/>
				)}
			<div className="grid grid-cols-[1fr_min-content] items-start gap-x-2">
				<div className="flex min-w-0 flex-col">
						<span className="w-fit whitespace-nowrap text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted-foreground/90">
							{getRelativeTime(workout.createdAt)}
						</span>
					<h2 className="mt-0.5 max-w-full truncate text-base font-semibold leading-tight">
						{workout.name}
					</h2>
					</div>
					<WorkoutCardOptions
						handleDelete={handleDelete}
						workout={workout}
					/>
				</div>

				<div className="mt-2 grid grid-cols-[1fr_min-content]">
					<div className="flex flex-row flex-wrap justify-start gap-2">
						{mapMuscleGroups.map((label) => (
							<Badge
								key={label}
								variant="secondary"
								className="rounded-sm border border-border/70 bg-secondary/70 px-1.5 py-0 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-secondary-foreground/95">
								{label}
							</Badge>
						))}
					</div>
				</div>

				<WorkoutCardStats
					pr={workout.totalPrSets}
					duration={workout.durationSeconds ?? 0}
					workoutVolume={workout.totalVolume}
					exerciseCount={workout.exercises.length}
				/>
			</Card>
		</>
	);
}
